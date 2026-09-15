(() => {
  "use strict";

  /* ---------- grid draw-in stagger ---------- */
  document.querySelectorAll(".gridlines").forEach((g) => {
    g.querySelectorAll("i").forEach((line, i) => {
      line.style.animationDelay = (i * 22) + "ms";
    });
  });

  /* ---------- scroll progress ----------
     scrollPct is cached here so the cursor readout can display it
     without reading layout on every mousemove. */
  const bar = document.querySelector(".scrollbar");
  let scrollPct = 0;
  function onScroll() {
    const h = document.documentElement;
    scrollPct = Math.min(1, Math.max(0, h.scrollTop / (h.scrollHeight - h.clientHeight || 1)));
    if (bar) bar.style.width = scrollPct * 100 + "%";
  }
  document.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  onScroll();

  /* ---------- reveal on scroll ----------
     Classes are added here rather than in the markup so the page still
     reads fully if this script never runs. */
  document.querySelectorAll(".work-row").forEach((row, i) => {
    row.classList.add("reveal");
    row.style.transitionDelay = (i % 6) * 55 + "ms";
  });

  const revealables = document.querySelectorAll(".reveal, .media, .section");
  if (revealables.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    revealables.forEach((el) => io.observe(el));
  }

  /* ---------- terminal write-in ----------
     Fires as each element enters the viewport, once.
     Mono metadata gets a cipher decode; monospace means the string
     width never changes, so nothing reflows while it resolves.
     Display type reveals character by character instead — scrambling
     proportional type at 200px makes the masthead visibly wobble, and
     a reveal never shows a character that isn't the real one.
     Body copy is excluded on purpose: you can't read a resolving
     paragraph, and that text is the whole point of the site. */
  (function terminal() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    /* The cipher runs on page chrome only — section labels, status strips,
       column headers. Anything that carries the actual evidence (spec
       blocks, figure and artefact captions, decision labels, outcome
       citations, the case index rows) stays readable the instant it
       enters the viewport. Legibility beats texture. */
    const CIPHER_SEL = ".mono-s, .mono-m, .mono-xs";
    const TYPE_SEL = ".t-display-xl, .t-display-m, .pager-name";
    const SKIP = [
      "[data-clock]", ".theme-toggle", ".marquee-track", ".cursor-read",
      ".kv", ".kv-row",              // spec blocks
      ".fig-caption", ".artefact .cap",   // figure and artefact captions
      ".decision-detail", ".outcome-tile", // decision labels, outcome citations
      ".record-row", ".work-row", ".todo-block",
    ].join(", ");
    const GLYPHS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&*/\\<>[]{}=+-";

    // decode timing — tune here
    const BASE = 380;      // ms floor, before per-character time
    const PER_CHAR = 18;   // ms added per character
    const MAX = 900;       // ms ceiling for long strings
    const ROLL = 55;       // ms between glyph re-rolls; lower = buzzier

    const skip = (el) =>
      el.closest(SKIP) || (el.parentElement && el.parentElement.closest(CIPHER_SEL + ", " + TYPE_SEL));

    function textNodes(root) {
      const out = [];
      const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode: (n) => (n.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
      });
      let n;
      while ((n = w.nextNode())) out.push(n);
      return out;
    }

    /* ---- cipher ---- */
    const active = new Set();
    let raf = null;

    const scrambleChar = (ch) =>
      /[A-Za-z0-9]/.test(ch) ? GLYPHS[(Math.random() * GLYPHS.length) | 0] : ch;

    /* Unresolved glyphs are held between re-rolls rather than
       re-randomised every frame, so the scramble reads as cycling
       characters instead of noise. */
    function paint(item, resolved, reroll) {
      let i = 0;
      for (const part of item.parts) {
        let s = "";
        for (let c = 0; c < part.text.length; c++, i++) {
          const ch = part.text[c];
          if (i < resolved || !/[A-Za-z0-9]/.test(ch)) {
            s += ch;
            continue;
          }
          if (reroll || item.glyphs[i] === undefined) item.glyphs[i] = scrambleChar(ch);
          s += item.glyphs[i];
        }
        part.node.nodeValue = s;
      }
    }

    function tick(now) {
      for (const item of [...active]) {
        const p = Math.min(1, (now - item.t0) / item.dur);
        const reroll = now - item.lastRoll >= ROLL;
        if (reroll) item.lastRoll = now;
        paint(item, Math.floor(p * item.total), reroll);
        if (p >= 1) {
          item.parts.forEach((pt) => (pt.node.nodeValue = pt.text));
          item.el.classList.remove("typing");
          active.delete(item);
        }
      }
      raf = active.size ? requestAnimationFrame(tick) : null;
    }

    const ciphers = [];
    document.querySelectorAll(CIPHER_SEL).forEach((el) => {
      if (skip(el)) return;
      const parts = textNodes(el).map((n) => ({ node: n, text: n.nodeValue }));
      const total = parts.reduce((a, p) => a + p.text.length, 0);
      if (!total || total > 240) return;
      const item = {
        el,
        parts,
        total,
        dur: Math.min(MAX, BASE + total * PER_CHAR),
        glyphs: [],
        lastRoll: 0,
      };
      paint(item, 0, true); // hide the answer before it scrolls into view
      ciphers.push(item);
    });

    /* ---- character reveal ---- */
    const typers = [];
    document.querySelectorAll(TYPE_SEL).forEach((el) => {
      if (skip(el)) return;
      const nodes = textNodes(el);
      if (!nodes.length) return;
      // per-character spans can make AT read the heading letter by letter.
      // <br> contributes nothing to textContent, so swap it for a space on a
      // clone first — otherwise "Kenneth<br>Jensen" announces as "KennethJensen".
      if (!el.hasAttribute("aria-label")) {
        const clone = el.cloneNode(true);
        clone.querySelectorAll("br").forEach((br) => br.replaceWith(" "));
        el.setAttribute("aria-label", clone.textContent.replace(/\s+/g, " ").trim());
      }
      let count = 0;
      nodes.forEach((node) => {
        const frag = document.createDocumentFragment();
        for (const ch of node.nodeValue) {
          const s = document.createElement("span");
          s.className = "ch";
          s.textContent = ch;
          frag.appendChild(s);
          count++;
        }
        node.parentNode.replaceChild(frag, node);
      });
      const step = Math.min(20, 620 / Math.max(count, 1));
      el.querySelectorAll(".ch").forEach((s, i) => {
        s.style.animationDelay = (i * step).toFixed(1) + "ms";
      });
      el.classList.add("tw");
      el.classList.remove("reveal", "in");
      typers.push({ el, dur: count * step + 220 });
    });

    /* ---- trigger on viewport entry ---- */
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          io.unobserve(e.target);
          const c = ciphers.find((x) => x.el === e.target);
          if (c) {
            c.t0 = performance.now();
            c.el.classList.add("typing");
            active.add(c);
            if (!raf) raf = requestAnimationFrame(tick);
            return;
          }
          const t = typers.find((x) => x.el === e.target);
          if (t) {
            t.el.classList.add("in", "typing");
            setTimeout(() => t.el.classList.remove("typing"), t.dur);
          }
        });
      },
      { threshold: 0.25, rootMargin: "0px 0px -30px 0px" }
    );
    ciphers.forEach((c) => io.observe(c.el));
    typers.forEach((t) => io.observe(t.el));
  })();

  /* ---------- mono counters, tick to true value ---------- */
  const counters = document.querySelectorAll("[data-count]");
  if (counters.length) {
    const cio = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          cio.unobserve(e.target);
          const el = e.target;
          const target = parseFloat(el.getAttribute("data-count"));
          const decimals = (el.getAttribute("data-count").split(".")[1] || "").length;
          const dur = 640;
          const t0 = performance.now();
          const fmt = (n) =>
            n.toLocaleString("en-US", {
              minimumFractionDigits: decimals,
              maximumFractionDigits: decimals,
            });
          function tick(t) {
            const p = Math.min(1, (t - t0) / dur);
            el.textContent = fmt(target * p);
            if (p < 1) requestAnimationFrame(tick);
            else el.textContent = fmt(target);
          }
          requestAnimationFrame(tick);
        });
      },
      { threshold: 0.4 }
    );
    counters.forEach((el) => cio.observe(el));
  }

  /* ---------- film grain + CRT overlays ----------
     The grain tile is an alpha mask, tiled 1:1 and painted in
     --grain-color, so the same texture works on both grounds. Stretching
     the tile instead of repeating it is what turns grain into mush. */
  (function screenLayers() {
    const SIZE = 140;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = SIZE;
    const ctx = canvas.getContext("2d");
    const img = ctx.createImageData(SIZE, SIZE);
    for (let i = 0; i < img.data.length; i += 4) {
      img.data[i] = img.data[i + 1] = img.data[i + 2] = 255;
      img.data[i + 3] = Math.pow(Math.random(), 3.1) * 255;
    }
    ctx.putImageData(img, 0, 0);
    document.documentElement.style.setProperty(
      "--grain-url",
      'url("' + canvas.toDataURL() + '")'
    );

    const crt = document.createElement("div");
    crt.className = "crt";
    const grain = document.createElement("div");
    grain.className = "noise";
    document.body.append(crt, grain);
  })();

  /* ---------- CRT display mode ---------- */
  (function crtMode() {
    const KEY = "kj-theme";
    const root = document.documentElement;
    const isOn = () => root.getAttribute("data-theme") === "crt";

    function powerOn() {
      const wrap = document.querySelector(".wrap");
      if (!wrap || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      wrap.classList.remove("power-on");
      void wrap.offsetWidth;
      wrap.classList.add("power-on");
    }

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "theme-toggle";
    btn.setAttribute("aria-label", "Toggle CRT display mode");

    function render() {
      btn.innerHTML = '<span class="led"></span>' + (isOn() ? "CRT on" : "CRT off");
      btn.setAttribute("aria-pressed", isOn() ? "true" : "false");
    }

    btn.addEventListener("click", () => {
      const turningOn = !isOn();
      if (turningOn) root.setAttribute("data-theme", "crt");
      else root.removeAttribute("data-theme");
      try {
        localStorage.setItem(KEY, turningOn ? "crt" : "light");
      } catch (e) {}
      render();
      if (turningOn) powerOn();
    });

    render();
    const navRow = document.querySelector(".nav-row");
    if (navRow) navRow.appendChild(btn);
    if (isOn()) powerOn();
  })();

  /* ---------- hero photography ----------
     If the image is missing, drop the wrapper so the turbulence plate
     underneath shows through instead of an empty rectangle. */
  document.querySelectorAll(".media-photo img").forEach((img) => {
    const fail = () => img.closest(".media-photo")?.remove();
    img.addEventListener("error", fail);

    /* "complete with zero width" is only evidence of a broken image while
       the page is VISIBLE. Browsers defer decoding in a background tab, so
       a perfectly good image reads complete/naturalWidth 0 there — judging
       it then deletes a working hero for anyone who opened the page in a
       background tab. Wait until we can actually trust the reading. */
    const verify = () => {
      if (document.visibilityState !== "visible") return;
      if (img.complete && img.naturalWidth === 0) fail();
    };
    addEventListener("load", verify);
    document.addEventListener("visibilitychange", verify);
  });

  /* ---------- fidelity lens ----------
     Reveals the untreated image under the cursor, through the page-level
     grain and scanlines as well as the image's own treatment. The button
     is the non-pointer equivalent and is what keyboard and touch get. */
  /* Keyed off .media-photo rather than any one page's container, so every
     image added through that pattern gets a lens without further wiring.
     The hover host is the framed parent: captions are siblings of
     .media-photo, and listening on the wrapper itself would fire mouseleave
     every time the pointer crossed one. */
  document.querySelectorAll(".media-photo").forEach((photo) => {
    const img = photo.querySelector("img");
    const media = photo.parentElement;
    if (!img || !media) return;

    /* --- image tags: report the file actually delivered ---
       The browser picks a srcset variant by viewport and DPR, so these are
       read from the loaded resource rather than hard-coded. Byte size comes
       from PerformanceResourceTiming; encodedBodySize survives a cache hit
       where transferSize drops to 0. Markup carries sensible fallbacks, so
       nothing ever renders blank if the timing entry is unavailable. */
    /* --- control row, built here rather than in markup ---
       It only does anything with JS, so it should not exist without it. It
       goes BELOW the frame: the lens is centred on the pointer, so a control
       inside the image is hidden by the lens exactly when you reach for it,
       and on a small frame in-image captions crowd the picture out. */
    const tools = document.createElement("div");
    tools.className = "media-tools";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "inspect-btn";
    btn.setAttribute("aria-pressed", "false");
    btn.textContent = "Show untreated";
    tools.append(btn);

    if (media.dataset.credit) {
      const credit = document.createElement("span");
      credit.className = "credit";
      credit.textContent = media.dataset.credit;
      tools.append(credit);
    }
    const treat = document.createElement("span");
    treat.className = "hint";
    treat.setAttribute("data-img", "treatment");
    tools.append(treat);

    const hint = document.createElement("span");
    hint.className = "hint lens-hint";
    hint.textContent = "Hover the image to inspect";
    tools.append(hint);
    media.insertAdjacentElement("afterend", tools);

    /* A .media inside a .row is a grid item, so a plain sibling lands in
       whatever cell comes next — bottom-left of the page, not under the
       image. Inherit the media's own column placement. */
    if (getComputedStyle(media.parentElement).display.includes("grid")) {
      tools.style.gridColumn = getComputedStyle(media).gridColumn;
    }

    const slot = (k) =>
      media.querySelector(`[data-img="${k}"]`) || tools.querySelector(`[data-img="${k}"]`);
    const fmtOf = (src) =>
      (src.split("?")[0].split(".").pop() || "").toUpperCase().replace("JPG", "JPEG");

    // The `w` descriptor next to the URL the browser actually chose.
    const srcsetWidth = (src) => {
      for (const el of media.querySelectorAll("source[srcset], img[srcset]")) {
        for (const part of (el.getAttribute("srcset") || "").split(",")) {
          const [u, d] = part.trim().split(/\s+/);
          if (!u || !d || !d.endsWith("w")) continue;
          if (new URL(u, location.href).href === src) return parseInt(d, 10);
        }
      }
      return null;
    };

    const writeMeta = () => {
      const src = img.currentSrc || img.src;
      if (!src) return;
      const name = decodeURIComponent(src.split("?")[0].split("/").pop());
      const fmt = fmtOf(src);

      const f = slot("file");
      if (f) f.textContent = name;

      /* naturalWidth reports the DECODE, which the browser is free to
         downscale — it reads 1024 for a 2800px file. The srcset `w`
         descriptor is by definition the intrinsic width, so take it from
         there and derive height from the authored aspect ratio. */
      const res = slot("res");
      if (res) {
        const w = srcsetWidth(src) || +img.getAttribute("width") || img.naturalWidth;
        /* Derive height from the SOURCE aspect when declared. The img's own
           width/height are already rounded for one variant, so deriving from
           them compounds the rounding and lands a pixel off on the others. */
        const [sw, sh] = (photo.dataset.aspect || "").split("x").map(Number);
        const aw = +img.getAttribute("width"), ah = +img.getAttribute("height");
        const ratio = sw && sh ? sh / sw
          : aw && ah ? ah / aw
          : img.naturalHeight / img.naturalWidth;
        if (w && ratio) res.textContent = `${w} × ${Math.round(w * ratio)}`;
      }

      const entry = performance.getEntriesByName(src).pop();
      const bytes = entry && (entry.encodedBodySize || entry.decodedBodySize);
      const size = slot("size");
      if (size && bytes) size.textContent = Math.round(bytes / 1024);

      const t = slot("treatment");
      if (t) {
        t.textContent = media.classList.contains("raw")
          ? `${fmt} · untreated`
          : `${fmt} · greyscale, halftone 5px`;
      }
    };

    if (img.complete) writeMeta();
    img.addEventListener("load", writeMeta);
    // naturalWidth is 0 until the tab is visible, so fill in again then
    document.addEventListener("visibilitychange", writeMeta);

    btn.addEventListener("click", () => {
      const on = media.classList.toggle("raw");
      btn.setAttribute("aria-pressed", String(on));
      btn.textContent = on ? "Show treated" : "Show untreated";
      hint.textContent = on
        ? "Showing the file as delivered"
        : "Hover the image to inspect";
      writeMeta();
      document.documentElement.classList.toggle(
        "inspect",
        !!document.querySelector(".raw")
      );
    });

    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const lens = document.createElement("div");
    const ring = document.createElement("div");
    lens.className = "lens";
    ring.className = "lens-ring";
    lens.setAttribute("aria-hidden", "true");
    ring.setAttribute("aria-hidden", "true");
    document.body.append(lens, ring);

    // Match the lens box to the media box so `cover` crops identically to
    // object-fit:cover on the img. Re-read on scroll and resize, never per
    // mousemove — that would be a layout read on every pointer event.
    let box = null;
    const measure = () => {
      const r = media.getBoundingClientRect();
      box = r;
      for (const el of [lens, ring]) {
        el.style.left = r.left + "px";
        el.style.top = r.top + "px";
        el.style.width = r.width + "px";
        el.style.height = r.height + "px";
      }
      const src = img.currentSrc || img.src;
      if (src) lens.style.backgroundImage = `url("${src}")`;
    };

    const track = (e) => {
      if (!box) measure();
      const x = e.clientX - box.left, y = e.clientY - box.top;
      for (const el of [lens, ring]) {
        el.style.setProperty("--lens-x", x + "px");
        el.style.setProperty("--lens-y", y + "px");
      }
    };

    media.addEventListener("mouseenter", (e) => {
      if (media.classList.contains("raw")) return;
      measure();
      track(e);
      lens.classList.add("on");
      ring.classList.add("on");
    });
    media.addEventListener("mousemove", track);
    media.addEventListener("mouseleave", () => {
      lens.classList.remove("on");
      ring.classList.remove("on");
      box = null;
    });

    addEventListener("scroll", () => { if (lens.classList.contains("on")) measure(); },
      { passive: true });
    addEventListener("resize", () => { box = null; }, { passive: true });
  });

  /* ---------- custom cursor + live telemetry ---------- */
  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    const cursor = document.createElement("div");
    cursor.className = "cursor";
    cursor.innerHTML =
      '<svg class="cur-default" viewBox="0 0 18 18"><path d="M9 1V6M9 12V17M1 9H6M12 9H17" stroke="currentColor" stroke-width="1.5"/></svg>' +
      '<svg class="cur-hover" viewBox="0 0 36 36"><path d="M2 11V2H11M25 2H34V11M34 25V34H25M11 34H2V25" stroke="currentColor" stroke-width="1.5" fill="none"/><circle cx="18" cy="18" r="1.6" fill="currentColor"/></svg>';
    const readout = document.createElement("div");
    readout.className = "cursor-read";
    document.body.append(cursor, readout);
    // only now is it safe for CSS to hide the native cursor
    document.documentElement.classList.add("has-cursor");

    document.addEventListener("mousemove", (e) => {
      const mx = e.clientX, my = e.clientY;
      cursor.style.transform = `translate(${mx}px, ${my}px) translate(-50%,-50%)`;
      readout.textContent =
        `X ${mx} / Y ${my} · SCROLL ${Math.round(scrollPct * 100)}%`;
      const rw = readout.offsetWidth;
      const rx = mx + 16 + rw > window.innerWidth ? mx - 16 - rw : mx + 16;
      readout.style.transform = `translate(${rx}px, ${my + 16}px)`;
    });

    document.querySelectorAll("a,button,.magnet").forEach((el) => {
      el.addEventListener("mouseenter", () => cursor.classList.add("hover"));
      el.addEventListener("mouseleave", () => cursor.classList.remove("hover"));
    });
  }

  /* ---------- magnetic hover ----------
     Offset is normalised to the element's own size and then capped in
     pixels, so a full-width pager is nudged by the same few pixels as a
     nav link rather than sliding across the page. The rect is measured
     once on enter, untransformed — measuring it mid-transform feeds the
     previous offset back in and the element drifts. */
  const MAGNET_X = 7; // px
  const MAGNET_Y = 5; // px
  document.querySelectorAll(".magnet").forEach((el) => {
    const target = el.querySelector("[data-magnet-target]") || el;
    let rect = null;
    el.addEventListener("mouseenter", () => {
      target.style.transform = "";
      rect = target.getBoundingClientRect();
    });
    el.addEventListener("mousemove", (e) => {
      if (!rect) rect = target.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const clamp = (n) => Math.max(-0.5, Math.min(0.5, n));
      const dx = clamp((e.clientX - rect.left) / rect.width - 0.5);
      const dy = clamp((e.clientY - rect.top) / rect.height - 0.5);
      target.style.transform =
        `translate(${(dx * 2 * MAGNET_X).toFixed(2)}px, ${(dy * 2 * MAGNET_Y).toFixed(2)}px)`;
    });
    el.addEventListener("mouseleave", () => {
      rect = null;
      target.style.transform = "";
    });
  });

  /* ---------- live clock, Copenhagen ---------- */
  /* Copenhagen is CEST from late March to late October, so the zone name
     is formatted rather than hardcoded. */
  const clockFmt = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Europe/Copenhagen",
    timeZoneName: "short",
  });
  document.querySelectorAll("[data-clock]").forEach((el) => {
    function update() {
      el.textContent = clockFmt.format(new Date());
    }
    update();
    setInterval(update, 1000);
  });

  /* ---------- marquee pause ----------
     WCAG 2.2.2 wants a mechanism to stop auto-moving content, and the
     CSS :hover pause is unreachable by keyboard or touch. */
  document.querySelectorAll("[data-marquee-pause]").forEach((btn) => {
    const marquee = document.querySelector(".marquee");
    if (!marquee) return;
    btn.addEventListener("click", () => {
      const paused = marquee.hasAttribute("data-paused");
      if (paused) marquee.removeAttribute("data-paused");
      else marquee.setAttribute("data-paused", "");
      btn.setAttribute("aria-pressed", paused ? "false" : "true");
      btn.textContent = paused ? "Pause" : "Play";
    });
  });

  /* ---------- work-row hover peek follows cursor ---------- */
  document.querySelectorAll(".work-row").forEach((row) => {
    const peek = row.querySelector(".peek-track");
    if (!peek) return;
    let rect = null;
    row.addEventListener("mouseenter", () => {
      rect = row.getBoundingClientRect();
    });
    row.addEventListener("mousemove", (e) => {
      if (!rect) rect = row.getBoundingClientRect();
      if (!rect.height) return;
      const p = (e.clientY - rect.top) / rect.height;
      peek.style.transform = `translateY(${((p - 0.5) * 10).toFixed(2)}%)`;
    });
    // without this the peek keeps its last offset forever, and the
    // resting and hover rules in CSS can never apply again
    row.addEventListener("mouseleave", () => {
      rect = null;
      peek.style.transform = "";
    });
  });

})();

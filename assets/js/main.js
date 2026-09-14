(() => {
  "use strict";

  /* ---------- grid draw-in stagger ---------- */
  document.querySelectorAll(".gridlines").forEach((g) => {
    g.querySelectorAll("i").forEach((line, i) => {
      line.style.animationDelay = (i * 22) + "ms";
    });
  });

  /* ---------- scroll progress ---------- */
  const bar = document.querySelector(".scrollbar");
  function onScroll() {
    if (!bar) return;
    const h = document.documentElement;
    const scrolled = h.scrollTop / (h.scrollHeight - h.clientHeight || 1);
    bar.style.width = Math.min(100, Math.max(0, scrolled * 100)) + "%";
  }
  document.addEventListener("scroll", onScroll, { passive: true });
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

    const CIPHER_SEL =
      ".mono-s, .mono-m, .mono-xs, .kv-row, .fig-caption, .artefact .cap, .decision-detail .label";
    const TYPE_SEL = ".t-display-xl, .t-display-m, .pager-name";
    const SKIP = "[data-clock], .theme-toggle, .marquee-track, .cursor-read";
    const GLYPHS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&*/\\<>[]{}=+-";

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

    function paint(item, resolved) {
      let i = 0;
      for (const part of item.parts) {
        let s = "";
        for (let c = 0; c < part.text.length; c++, i++) {
          s += i < resolved ? part.text[c] : scrambleChar(part.text[c]);
        }
        part.node.nodeValue = s;
      }
    }

    function tick(now) {
      for (const item of [...active]) {
        const p = Math.min(1, (now - item.t0) / item.dur);
        paint(item, Math.floor(p * item.total));
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
      const item = { el, parts, total, dur: Math.min(900, 240 + total * 14) };
      paint(item, 0); // hide the answer before it scrolls into view
      ciphers.push(item);
    });

    /* ---- character reveal ---- */
    const typers = [];
    document.querySelectorAll(TYPE_SEL).forEach((el) => {
      if (skip(el)) return;
      const nodes = textNodes(el);
      if (!nodes.length) return;
      // per-character spans can make AT read the heading letter by letter
      if (!el.hasAttribute("aria-label")) {
        el.setAttribute("aria-label", el.textContent.replace(/\s+/g, " ").trim());
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
          function tick(t) {
            const p = Math.min(1, (t - t0) / dur);
            const val = target * p;
            el.textContent = val.toFixed(decimals);
            if (p < 1) requestAnimationFrame(tick);
            else el.textContent = target.toFixed(decimals);
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

    let mx = 0, my = 0;
    document.addEventListener("mousemove", (e) => {
      mx = e.clientX;
      my = e.clientY;
      cursor.style.transform = `translate(${mx}px, ${my}px) translate(-50%,-50%)`;
      readout.style.transform = `translate(${mx}px, ${my}px)`;
      const pct = Math.round(
        (document.documentElement.scrollTop /
          (document.documentElement.scrollHeight - document.documentElement.clientHeight || 1)) *
          100
      );
      readout.textContent = `X ${mx} / Y ${my} · SCROLL ${pct}%`;
    });

    document.querySelectorAll("a,button,.magnet").forEach((el) => {
      el.addEventListener("mouseenter", () => cursor.classList.add("hover"));
      el.addEventListener("mouseleave", () => cursor.classList.remove("hover"));
    });
  }

  /* ---------- magnetic hover on nav / arrow links ---------- */
  document.querySelectorAll(".magnet").forEach((el) => {
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      el.style.transform = `translate(${x * 0.18}px, ${y * 0.28}px)`;
    });
    el.addEventListener("mouseleave", () => {
      el.style.transform = "translate(0,0)";
    });
  });

  /* ---------- live clock, Copenhagen ---------- */
  document.querySelectorAll("[data-clock]").forEach((el) => {
    function update() {
      const now = new Date();
      const fmt = new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZone: "Europe/Copenhagen",
      });
      el.textContent = fmt.format(now) + " CET";
    }
    update();
    setInterval(update, 1000);
  });

  /* ---------- work-row hover peek follows cursor ---------- */
  document.querySelectorAll(".work-row").forEach((row) => {
    const peek = row.querySelector(".peek-track");
    if (!peek) return;
    row.addEventListener("mousemove", (e) => {
      const r = row.getBoundingClientRect();
      const p = (e.clientY - r.top) / r.height;
      peek.style.transform = `translateY(${(p - 0.5) * 10}%)`;
    });
  });

})();

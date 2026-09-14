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

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

  /* ---------- reveal on scroll ---------- */
  const revealables = document.querySelectorAll(".reveal");
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

  /* ---------- procedural film-grain noise ---------- */
  (function noise() {
    const canvas = document.createElement("canvas");
    canvas.className = "noise";
    const size = 128;
    canvas.width = size;
    canvas.height = size;
    document.body.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    const frames = [];
    for (let f = 0; f < 4; f++) {
      const img = ctx.createImageData(size, size);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = Math.random() * 255;
        img.data[i] = v;
        img.data[i + 1] = v;
        img.data[i + 2] = v;
        img.data[i + 3] = 90;
      }
      frames.push(img);
    }
    let fi = 0;
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setInterval(() => {
        ctx.putImageData(frames[fi % frames.length], 0, 0);
        fi++;
      }, 90);
    } else {
      ctx.putImageData(frames[0], 0, 0);
    }
  })();

  /* ---------- custom cursor + live telemetry ---------- */
  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    const cursor = document.createElement("div");
    cursor.className = "cursor";
    cursor.innerHTML =
      '<svg viewBox="0 0 18 18"><path d="M9 0 V18 M0 9 H18" stroke="currentColor" stroke-width="1"/></svg>';
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

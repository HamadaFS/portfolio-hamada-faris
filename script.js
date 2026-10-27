
"use strict";

// ── Data-flow card: path-following packets + ambient particles ────────────
(function initDataFlow() {
  const canvas = document.getElementById("dfCanvas");
  if (!canvas) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const ctx = canvas.getContext("2d");

  // ── SVG viewBox is 340×280. We scale canvas coords to match. ──
  // Pipeline node positions (in viewBox units)
  const VW = 340, VH = 280;

  // Named waypoints
  const N = {
    s0:  { x: 28,  y: 140 }, // COLLECT
    s1:  { x: 100, y: 140 }, // CLEAN
    s2:  { x: 170, y: 140 }, // MODEL
    s3:  { x: 240, y: 140 }, // API
    s4:  { x: 312, y: 140 }, // DEPLOY
    t0:  { x: 100, y: 72  }, // teal branch left
    t1:  { x: 170, y: 72  }, // teal branch mid
    t2:  { x: 240, y: 72  }, // teal branch right
    b0:  { x: 100, y: 208 }, // white branch left
    b1:  { x: 170, y: 208 }, // white branch mid
    b2:  { x: 240, y: 208 }, // white branch right
  };

  // Routes: arrays of waypoints a packet travels through (loops back to start)
  const ROUTES = [
    // orange spine → left to right
    { pts: [N.s0, N.s1, N.s2, N.s3, N.s4], color: "#ffad42", r: 3.5, speed: 0.0028, glow: 8 },
    { pts: [N.s0, N.s1, N.s2, N.s3, N.s4], color: "#ffad42", r: 2.5, speed: 0.0022, glow: 6 },
    // teal upper branch: s1 → up → across → down → s3
    { pts: [N.s1, N.t0, N.t1, N.t2, N.s3], color: "#66d4bd", r: 3,   speed: 0.0024, glow: 7 },
    { pts: [N.s1, N.t0, N.t1, N.t2, N.s3], color: "#66d4bd", r: 2,   speed: 0.0018, glow: 5 },
    // white lower branch: s1 → down → across → up → s3
    { pts: [N.s1, N.b0, N.b1, N.b2, N.s3], color: "#ece9e3", r: 2,   speed: 0.002,  glow: 4 },
  ];

  // Ambient background particles
  const AMBIENT_COUNT = 22;
  let ambient = [];

  // Packet state: each packet has a route + progress [0,1] along total path length
  const packets = ROUTES.map((route, i) => ({
    route,
    // stagger start positions so they don’t all begin at the same point
    t: (i * 0.23) % 1,
  }));

  // ── Geometry helpers ──
  function segLengths(pts) {
    const lens = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const dx = pts[i + 1].x - pts[i].x;
      const dy = pts[i + 1].y - pts[i].y;
      lens.push(Math.sqrt(dx * dx + dy * dy));
    }
    return lens;
  }

  function pointAtT(pts, lens, total, t) {
    let dist = t * total;
    for (let i = 0; i < lens.length; i++) {
      if (dist <= lens[i]) {
        const frac = dist / lens[i];
        return {
          x: pts[i].x + frac * (pts[i + 1].x - pts[i].x),
          y: pts[i].y + frac * (pts[i + 1].y - pts[i].y),
        };
      }
      dist -= lens[i];
    }
    return pts[pts.length - 1];
  }

  // Pre-compute segment lengths for each route
  const routeMeta = ROUTES.map((r) => {
    const lens = segLengths(r.pts);
    return { lens, total: lens.reduce((a, b) => a + b, 0) };
  });

  // ── Canvas sizing ──
  let scaleX = 1, scaleY = 1;

  function resize() {
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    scaleX = canvas.width  / VW;
    scaleY = canvas.height / VH;
    // rebuild ambient particles on resize
    ambient = Array.from({ length: AMBIENT_COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.4 + 0.3,
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.28,
      color: ["#ffad4240", "#66d4bd30", "#ece9e318"][Math.floor(Math.random() * 3)],
    }));
  }

  // ── Draw loop ──
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Ambient drifting particles
    ambient.forEach((p) => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width)  p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    });

    // 2. Path-following data packets
    packets.forEach((pkt, i) => {
      const { route } = pkt;
      const { lens, total } = routeMeta[i];
      pkt.t = (pkt.t + route.speed) % 1;

      const pos = pointAtT(route.pts, lens, total, pkt.t);
      const cx = pos.x * scaleX;
      const cy = pos.y * scaleY;

      // outer glow
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, route.glow * scaleX);
      grad.addColorStop(0, route.color + "cc");
      grad.addColorStop(1, route.color + "00");
      ctx.beginPath();
      ctx.arc(cx, cy, route.glow * scaleX, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // solid core dot
      ctx.beginPath();
      ctx.arc(cx, cy, route.r * Math.min(scaleX, scaleY), 0, Math.PI * 2);
      ctx.fillStyle = route.color;
      ctx.fill();

      // trailing tail (3 fading dots behind)
      for (let t = 1; t <= 3; t++) {
        const tailT = ((pkt.t - route.speed * t * 6) + 1) % 1;
        const tp = pointAtT(route.pts, lens, total, tailT);
        ctx.beginPath();
        ctx.arc(tp.x * scaleX, tp.y * scaleY,
          route.r * Math.min(scaleX, scaleY) * (1 - t * 0.28), 0, Math.PI * 2);
        ctx.fillStyle = route.color + Math.floor((1 - t * 0.3) * 80).toString(16).padStart(2, "0");
        ctx.fill();
      }
    });

    requestAnimationFrame(draw);
  }

  resize();
  draw();
  window.addEventListener("resize", resize);
}());

// Année automatique dans le pied de page.
const yearElement = document.getElementById("year");

if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

// Menu mobile.
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");

if (menuToggle && navLinks) {
  menuToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");

    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute(
      "aria-label",
      isOpen ? "Fermer le menu" : "Ouvrir le menu"
    );
    menuToggle.textContent = isOpen ? "✕" : "☰";
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Ouvrir le menu");
      menuToggle.textContent = "☰";
    });
  });
}

// Apparition progressive des sections au défilement.
const revealTargets = document.querySelectorAll(
  ".about-card, .project-card, .timeline-item, " +
  ".skill-card, .education-item, .certification-item"
);

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries, currentObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          currentObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  revealTargets.forEach((element) => {
    element.classList.add("reveal");
    observer.observe(element);
  });
} else {
  revealTargets.forEach((element) => {
    element.classList.add("visible");
  });
}

// Navigation active selon la section visible.
const sections = document.querySelectorAll("main section[id]");
const navigationLinks = document.querySelectorAll(".nav-links a");

if ("IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        navigationLinks.forEach((link) => {
          const active =
            link.getAttribute("href") === `#${entry.target.id}`;

          if (active) {
            link.setAttribute("aria-current", "location");
          } else {
            link.removeAttribute("aria-current");
          }
        });
      });
    },
    { rootMargin: "-25% 0px -65% 0px" }
  );

  sections.forEach((section) => sectionObserver.observe(section));
}

// ── Theme toggle (light / dark) ──────────────────────────────────────────
const themeToggle = document.getElementById("themeToggle");
const html = document.documentElement;

// Restore saved preference
if (localStorage.getItem("theme") === "light") {
  html.setAttribute("data-theme", "light");
}

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const isLight = html.getAttribute("data-theme") === "light";
    if (isLight) {
      html.removeAttribute("data-theme");
      localStorage.removeItem("theme");
    } else {
      html.setAttribute("data-theme", "light");
      localStorage.setItem("theme", "light");
    }
  });
}

// ── Language toggle (FR / EN) ────────────────────────────────────────────
const langToggle = document.getElementById("langToggle");

if (langToggle) {
  langToggle.addEventListener("click", (e) => {
    const btn = e.target.closest(".lang-btn");
    if (!btn) return;
    const lang = btn.dataset.lang;

    // Update active button
    langToggle.querySelectorAll(".lang-btn").forEach((b) => {
      b.classList.toggle("active", b.dataset.lang === lang);
    });

    // Swap all translatable text nodes
    document.querySelectorAll("[data-lang-fr]").forEach((el) => {
      const text = el.getAttribute(`data-lang-${lang}`);
      if (text !== null) el.textContent = text;
    });
  });
}


"use strict";

// Initialise les icônes Lucide.
if (typeof lucide !== "undefined") {
  lucide.createIcons();
}

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

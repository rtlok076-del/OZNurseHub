(() => {
  "use strict";
  const toggle = document.querySelector(".elegant-toggle"),
    menu = document.getElementById("elegant-links");
  if (toggle && menu) {
    document.documentElement.classList.add("menu-ready");
    toggle.addEventListener("click", () => {
      const opened = menu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(opened));
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && menu.classList.contains("open")) {
        menu.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.focus();
      }
    });
  }
  const file = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".elegant-links a").forEach((a) => {
    if (a.getAttribute("href") === file) a.setAttribute("aria-current", "page");
  });
})();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () =>
    navigator.serviceWorker.register("/sw.js").catch(() => {}),
  );
}
// Preserve existing bookmarks and links to sections of the former homepage.
if (
  (location.pathname === "/" || location.pathname === "/index.html") &&
  /^#(study|clinical|tips|wellbeing|apa|quizzes|links)$/.test(location.hash)
) {
  location.replace("resources.html" + location.hash);
}

// Homepage-only scroll choreography. Content is visible before enhancement,
// and keyboard focus, printing and reduced-motion preferences keep it visible.
(() => {
  "use strict";
  if (
    !document.body.hasAttribute("data-scroll-reveal") ||
    !("IntersectionObserver" in window)
  )
    return;
  const preference = matchMedia("(prefers-reduced-motion: reduce)");
  const sections = [
    ...document.querySelectorAll(
      ".renovation-main > section, .renovation-main > .principles",
    ),
  ];
  let observer;
  function configure() {
    if (observer) observer.disconnect();
    sections.forEach((section) =>
      section.classList.remove("scroll-reveal", "is-visible"),
    );
    if (preference.matches) return;
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) =>
          entry.target.classList.toggle("is-visible", entry.isIntersecting),
        );
      },
      { threshold: 0, rootMargin: "-24px 0px -24px 0px" },
    );
    sections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      section.classList.toggle(
        "is-visible",
        rect.bottom > 0 && rect.top < innerHeight,
      );
      section.classList.add("scroll-reveal");
      observer.observe(section);
    });
  }
  configure();
  preference.addEventListener("change", configure);
})();

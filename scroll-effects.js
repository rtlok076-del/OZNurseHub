/* Scroll-linked fades at the viewport edges, without pinning or extra page height. */
(() => {
  "use strict";
  if (!("IntersectionObserver" in window)) return;
  const preference = matchMedia("(prefers-reduced-motion: reduce)");
  const selector = "h1,h2,h3,.path-card,.section-lead,.hero-art,.principles";
  const excluded =
    'header,nav,footer,form,dialog,[role="dialog"],[data-no-scroll-effects],.modal,canvas';
  const targets = new Set(),
    nearby = new Set();
  let frame = 0,
    scanPending = false;
  const clamp = (value) => Math.max(0, Math.min(1, value));
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (isIntersecting) nearby.add(target);
        else nearby.delete(target);
      });
      requestFrame();
    },
    { rootMargin: "100px 0px" },
  );
  function paint() {
    frame = 0;
    if (preference.matches) return;
    const height = document.documentElement.clientHeight;
    // Read layout before making style changes.
    const values = [...nearby].map((element) => {
      const rect = element.getBoundingClientRect();
      const shift =
        parseFloat(element.style.getPropertyValue("--reveal-shift")) || 0;
      const entrance = clamp(
        (height - (rect.top - shift)) / Math.min(110, height * 0.15),
      );
      const exit = clamp((rect.bottom - shift) / Math.min(80, height * 0.1));
      const visibility = Math.min(entrance, exit);
      return {
        element,
        opacity: 0.25 + 0.75 * visibility,
        shift: 12 * (1 - entrance) - 8 * (1 - exit),
      };
    });
    values.forEach(({ element, opacity, shift }) => {
      element.style.setProperty("--reveal-opacity", String(opacity));
      element.style.setProperty("--reveal-shift", shift + "px");
    });
  }
  function requestFrame() {
    if (!preference.matches && !frame) frame = requestAnimationFrame(paint);
  }
  function scan() {
    scanPending = false;
    // Remove detached nodes from sets when quizzes or tools rebuild their contents.
    targets.forEach((element) => {
      if (!element.isConnected) {
        observer.unobserve(element);
        targets.delete(element);
        nearby.delete(element);
      }
    });
    if (preference.matches) return;
    document.querySelectorAll(selector).forEach((element) => {
      if (targets.has(element) || element.closest(excluded)) return;
      // Animate the outer card/group once, not both its wrapper and heading.
      if (element.parentElement.closest(selector)) return;
      targets.add(element);
      element.classList.add("motion-reveal");
      observer.observe(element);
    });
    requestFrame();
  }
  function configure() {
    observer.disconnect();
    nearby.clear();
    targets.forEach((element) => {
      element.classList.remove("motion-reveal");
      element.style.removeProperty("--reveal-opacity");
      element.style.removeProperty("--reveal-shift");
    });
    targets.clear();
    scan();
  }
  new MutationObserver(() => {
    if (!scanPending) {
      scanPending = true;
      requestAnimationFrame(scan);
    }
  }).observe(document.body, { childList: true, subtree: true });
  window.addEventListener("scroll", requestFrame, { passive: true });
  window.addEventListener("resize", requestFrame, { passive: true });
  preference.addEventListener("change", configure);
  configure();
})();

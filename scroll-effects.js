/* Scroll-linked fades at the viewport edges, without pinning or extra page height. */
(() => {
  "use strict";
  if (!("IntersectionObserver" in window)) return;
  const preference = matchMedia("(prefers-reduced-motion: reduce)");
  const selector = [
    ".home-intro",
    ".app-welcome",
    ".page-header",
    ".page-hero",
    ".st-hero",
    ".md-hero",
    ".landing-hero",
    "h1",
    "h2",
    "h3",
    ".path-card",
    ".section-lead",
    ".hero-art",
    ".principles",
  ].join(",");
  const excluded =
    'header,nav,footer,form,dialog,[role="dialog"],[data-no-scroll-effects],.modal,canvas';
  const targets = new Set(),
    nearby = new Set();
  let frame = 0,
    scanPending = false;
  const clamp = (value) => Math.max(0, Math.min(1, value));
  const ease = (value) => {
    const t = clamp(value);
    return t * t * (3 - 2 * t);
  };
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
      // Use the actual rendered translation: hover and keyboard focus may override it.
      const transform = getComputedStyle(element).transform;
      const shift =
        transform === "none" ? 0 : new DOMMatrixReadOnly(transform).m42;
      const entrance = ease((height - (rect.top - shift)) / (height * 0.3));
      // Start fading while a meaningful part of the item is still on screen.
      const exitRange = Math.min(Math.max(rect.height, 160), height * 0.4);
      const exit = ease((rect.bottom - shift) / exitRange);
      const visibility = Math.min(entrance, exit);
      return {
        element,
        opacity: visibility,
        shift: 20 * (1 - entrance) - 12 * (1 - exit),
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

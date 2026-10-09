/* Native scroll drives every frame. No scroll interception or timed autoplay. */
(() => {
  "use strict";
  const story = document.querySelector(".scroll-story");
  if (!story) return;
  const stage = story.querySelector(".story-stage");
  const image = story.querySelector(".story-image");
  const panels = [...story.querySelectorAll(".story-panel")];
  const controls = story.querySelector(".story-controls");
  const chapters = [...story.querySelectorAll("[data-chapter]")];
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const shortScreen = matchMedia("(max-height: 550px)");
  let enabled = false,
    pending = false,
    active = -1;
  const clamp = (value) => Math.min(1, Math.max(0, value));
  function smooth(from, to, value) {
    const t = clamp((value - from) / (to - from));
    return t * t * (3 - 2 * t);
  }
  function update() {
    pending = false;
    if (!enabled) return;
    const rect = story.getBoundingClientRect();
    const p = clamp(
      -rect.top / Math.max(1, story.offsetHeight - stage.offsetHeight),
    );
    const opacity = [
      1 - smooth(0.16, 0.29, p),
      smooth(0.23, 0.36, p) * (1 - smooth(0.64, 0.77, p)),
      smooth(0.71, 0.84, p),
    ];
    const next = opacity.indexOf(Math.max(...opacity));
    // Move focus to a stable chapter control if scrolling dismisses its focused link.
    if (
      next !== active &&
      active >= 0 &&
      panels[active].contains(document.activeElement)
    )
      chapters[next].focus({ preventScroll: true });
    active = next;
    panels.forEach((panel, index) => {
      panel.style.opacity = opacity[index];
      const centre = [0, 0.5, 1][index];
      panel.style.transform = `translateY(${Math.max(-36, Math.min(36, (centre - p) * 110))}px)`;
      panel.inert = index !== active;
      panel.setAttribute("aria-hidden", String(index !== active));
      chapters[index].setAttribute("aria-pressed", String(index === active));
    });
    image.style.transform = `scale(${1.03 + p * 0.19})`;
  }
  function requestFrame() {
    if (enabled && !pending) {
      pending = true;
      requestAnimationFrame(update);
    }
  }
  function configure() {
    enabled = !motion.matches && !shortScreen.matches;
    story.classList.toggle("story-ready", enabled);
    controls.hidden = !enabled;
    if (enabled) {
      // At high text zoom, use the readable static layout rather than clipping text.
      const longest = Math.max(...panels.map((panel) => panel.scrollHeight));
      if (longest + 160 > stage.offsetHeight) {
        enabled = false;
        story.classList.remove("story-ready");
        controls.hidden = true;
      }
    }
    if (!enabled) {
      panels.forEach((panel) => {
        panel.style.opacity = "";
        panel.style.transform = "";
        panel.inert = false;
        panel.removeAttribute("aria-hidden");
      });
      image.style.transform = "";
      active = -1;
    } else update();
  }
  chapters.forEach((button, index) =>
    button.addEventListener("click", () => {
      const top =
        scrollY +
        story.getBoundingClientRect().top +
        (story.offsetHeight - stage.offsetHeight) * [0, 0.5, 1][index];
      window.scrollTo({ top, behavior: "instant" });
      update();
    }),
  );
  window.addEventListener("scroll", requestFrame, { passive: true });
  window.addEventListener("resize", configure, { passive: true });
  motion.addEventListener("change", configure);
  shortScreen.addEventListener("change", configure);
  configure();
  if (document.fonts) document.fonts.ready.then(configure);
})();

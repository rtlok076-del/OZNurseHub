/* Apply the saved/system preference before the page paints. */
(() => {
  "use strict";
  const key = "oznurse_theme";
  const system = matchMedia("(prefers-color-scheme: dark)");
  let printing = false;
  let preference = "system";
  try {
    const saved = localStorage.getItem(key);
    if (["light", "dark", "system"].includes(saved)) preference = saved;
  } catch {
    /* Restricted storage still permits an in-memory choice. */
  }
  function apply() {
    const dark =
      !printing &&
      (preference === "dark" || (preference === "system" && system.matches));
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    document.querySelectorAll("[data-theme-picker]").forEach((el) => {
      el.value = preference;
    });
    document.querySelectorAll('meta[name="theme-color"]').forEach((el) => {
      el.content = dark ? "#111c19" : "#155e53";
    });
  }
  addEventListener("beforeprint", () => {
    printing = true;
    apply();
  });
  addEventListener("afterprint", () => {
    printing = false;
    apply();
  });
  apply();
  system.addEventListener("change", apply);
  addEventListener("storage", (event) => {
    if (event.key !== key && event.key !== null) return;
    preference = ["light", "dark"].includes(event.newValue)
      ? event.newValue
      : "system";
    apply();
  });
  // Calendar date in the visitor's timezone, shared across pages in this browser.
  function showAppearanceTip(select) {
    const tipKey = "oznurse_appearance_tip_day";
    const now = new Date();
    const today = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
    let storage;
    try {
      storage = localStorage;
      if (storage.getItem(tipKey) === today) return;
      storage.setItem(tipKey, today);
    } catch {
      try {
        storage = sessionStorage;
        if (storage.getItem(tipKey) === today) return;
        storage.setItem(tipKey, today);
      } catch {
        return; // Avoid repeating the tip on every page when storage is unavailable.
      }
    }
    const header = document.querySelector(".elegant-header");
    if (!header) return;
    const tip = document.createElement("aside");
    tip.className = "appearance-tip";
    tip.setAttribute("aria-label", "Appearance tip");
    const message = document.createElement("p");
    message.textContent =
      "Make yourself comfortable. Choose Light, Dark or System in Appearance. On mobile, open Menu to find it.";
    const actions = document.createElement("div");
    const show = document.createElement("button");
    show.type = "button";
    show.textContent = "Show me";
    const dismiss = document.createElement("button");
    dismiss.type = "button";
    dismiss.textContent = "Got it";
    function target() {
      const toggle = document.querySelector(".elegant-toggle");
      return toggle && getComputedStyle(toggle).display !== "none"
        ? toggle
        : select;
    }
    dismiss.addEventListener("click", () => {
      tip.remove();
      target().focus();
    });
    show.addEventListener("click", () => {
      const toggle = document.querySelector(".elegant-toggle");
      const menu = document.querySelector(".elegant-links");
      if (
        toggle &&
        getComputedStyle(toggle).display !== "none" &&
        !menu.classList.contains("open")
      )
        toggle.click();
      tip.remove();
      select.focus();
    });
    tip.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        tip.remove();
        target().focus();
      }
    });
    actions.append(show, dismiss);
    tip.append(message, actions);
    header.append(tip);
  }
  document.addEventListener("DOMContentLoaded", () => {
    const menu = document.querySelector(".elegant-links");
    if (menu) {
      const label = document.createElement("label");
      label.className = "theme-picker";
      label.textContent = "Appearance";
      const select = document.createElement("select");
      select.dataset.themePicker = "";
      [
        ["system", "System"],
        ["light", "Light"],
        ["dark", "Dark"],
      ].forEach(([value, text]) => {
        select.add(new Option(text, value));
      });
      select.addEventListener("change", () => {
        preference = select.value;
        try {
          localStorage.setItem(key, preference);
        } catch {
          /* Retain this tab's choice. */
        }
        apply();
      });
      label.append(select);
      menu.append(label);
      showAppearanceTip(select);
    }
    apply();
  });
})();

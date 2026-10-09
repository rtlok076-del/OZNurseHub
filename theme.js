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
    }
    apply();
  });
})();

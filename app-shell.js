/* Shared install entry point and navigation for the installed web app. */
(() => {
  "use strict";
  let installPrompt = null;
  const install = document.getElementById("install-app");
  const status = document.getElementById("install-status");
  const standalone =
    matchMedia("(display-mode: standalone)").matches ||
    navigator.standalone === true;
  document.body.classList.toggle("app-mode", standalone);
  const menu = document.querySelector(".elegant-links");
  if (menu && !menu.querySelector(".app-link")) {
    const link = document.createElement("a");
    link.className = "app-link";
    link.href = "app.html";
    link.textContent = standalone ? "App home" : "Get the app";
    menu.append(link);
  }
  const nav = document.createElement("nav");
  nav.className = "app-bottom-nav";
  nav.setAttribute("aria-label", "App navigation");
  [
    ["app.html", "⌂", "Home"],
    ["resources.html", "▤", "Resources"],
    ["clinical-skills-logbook.html", "✓", "Skills"],
    ["learning-lab.html", "◇", "Learn"],
  ].forEach(([href, icon, label]) => {
    const a = document.createElement("a");
    a.href = href;
    const symbol = document.createElement("span");
    symbol.textContent = icon;
    symbol.setAttribute("aria-hidden", "true");
    a.append(symbol, document.createTextNode(label));
    if (location.pathname.split("/").pop() === href)
      a.setAttribute("aria-current", "page");
    nav.append(a);
  });
  document.body.append(nav);
  const offline = document.createElement("p");
  offline.className = "app-offline";
  offline.setAttribute("role", "status");
  offline.textContent =
    "You are offline. Saved pages are available; external links and online features need an internet connection.";
  document.querySelector(".elegant-header")?.after(offline);
  function connectivity() {
    offline.hidden = navigator.onLine;
  }
  addEventListener("online", connectivity);
  addEventListener("offline", connectivity);
  connectivity();
  if (standalone && status)
    status.textContent = "You are using the installed OzNurseHub app.";
  addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPrompt = event;
    if (install && !standalone) install.hidden = false;
  });
  if (install)
    install.addEventListener("click", async () => {
      if (!installPrompt) return;
      install.disabled = true;
      try {
        await installPrompt.prompt();
        const choice = await installPrompt.userChoice;
        if (status)
          status.textContent =
            choice.outcome === "accepted"
              ? "Installation requested. Follow your browser’s instructions."
              : "Installation cancelled. You can still use everything in your browser.";
      } catch {
        if (status)
          status.textContent =
            "Use your browser menu to install, or follow the steps below.";
      } finally {
        installPrompt = null;
        install.hidden = true;
        install.disabled = false;
      }
    });
  addEventListener("appinstalled", () => {
    installPrompt = null;
    if (install) install.hidden = true;
    if (status)
      status.textContent =
        "OzNurseHub has been installed. Open it from your home screen or apps list.";
  });
})();

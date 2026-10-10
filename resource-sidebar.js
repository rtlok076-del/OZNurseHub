/* Shared resource navigation, preserving each page's existing links and handlers. */
(() => {
  const nav = document.querySelector('nav.sidebar');
  const main = document.querySelector('main.main, main.page-main');
  if (!nav || !main) return;
  const layout = document.createElement('div');
  layout.className = 'resource-layout';
  const panel = document.createElement('details');
  panel.className = 'resource-sidebar';
  const summary = document.createElement('summary');
  summary.textContent = 'Browse resources';
  nav.setAttribute('aria-label', 'Resource navigation');
  nav.before(layout);
  panel.append(summary, nav);
  layout.append(panel, main);
  const desktop = matchMedia('(min-width: 1001px)');
  const resize = () => { panel.open = desktop.matches; };
  resize();
  desktop.addEventListener('change', resize);
  panel.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !desktop.matches) {
      panel.open = false;
      summary.focus();
    }
  });
  nav.addEventListener('click', event => {
    if (!desktop.matches && event.target.closest('a')) {
      panel.open = false;
      summary.focus();
    }
  });
})();

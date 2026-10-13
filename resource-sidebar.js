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
  panel.open = false;
  const floatingResources = document.body.classList.contains('resources-page');
  if (floatingResources) {
    // Keep a stable marker in the document when the same disclosure becomes fixed.
    const slot = document.createElement('div');
    slot.className = 'resource-browse-slot';
    document.querySelector('.hero-banner, .hero').before(slot);
    slot.append(panel);
    panel.classList.add('resource-browse');
    summary.innerHTML = '<span class="resource-browse-label">Browse resources</span><span class="resource-browse-arrow" aria-hidden="true">▼</span>';
    summary.setAttribute('aria-label', 'Browse resources');
    summary.setAttribute('aria-controls', nav.id || (nav.id = 'resource-navigation'));
    const update = () => {
      const header = document.querySelector('.elegant-header');
      const bottom = header ? header.getBoundingClientRect().bottom : 0;
      panel.classList.toggle('is-floating', slot.getBoundingClientRect().bottom <= bottom + 12);
    };
    let frame = 0;
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(() => { frame = 0; update(); });
    };
    addEventListener('scroll', schedule, { passive: true });
    addEventListener('resize', schedule);
    new ResizeObserver(schedule).observe(document.querySelector('.elegant-header') || slot);
    panel.addEventListener('toggle', () => summary.setAttribute('aria-expanded', String(panel.open)));
    summary.setAttribute('aria-expanded', 'false');
    document.addEventListener('pointerdown', event => {
      if (panel.open && !panel.contains(event.target)) panel.open = false;
    });
    document.addEventListener('focusin', event => {
      if (panel.open && !panel.contains(event.target)) panel.open = false;
    });
    update();
  }
  panel.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      panel.open = false;
      summary.focus({ preventScroll: true });
    }
  });
  nav.addEventListener('click', event => {
    if ((floatingResources || !desktop.matches) && event.target.closest('a, button')) {
      panel.open = false;
      summary.focus({ preventScroll: true });
    }
  });
})();

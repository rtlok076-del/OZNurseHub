/* Shared resource navigation, preserving each page's existing links and handlers. */
(() => {
  const standalone = document.body.matches('.clinical-tips-page, .fable-page');
  let nav = document.querySelector('nav.sidebar');
  const main = document.querySelector('main');
  if (standalone && !nav) {
    nav = document.createElement('nav');
    nav.className = 'sidebar';
    const links = [
      ['Clinical Tips', 'clinical-tips.html'], ['Fable Story', 'fables.html'],
      ['Home', 'index.html'], ['All resources', 'resources.html'],
      ['Med Squad Survivors', 'med-survivor/'],
      ['Study Skills', 'resources.html#study'], ['Clinical', 'resources.html#clinical'],
      ['Year Tips', 'resources.html#tips'], ['Wellbeing', 'resources.html#wellbeing'],
      ['Quick Ref', 'quickref.html'], ['Bloods', 'bloods.html'],
      ['Palliative', 'palliative.html'], ['Cognitive', 'cognitive.html'],
      ['ANTT', 'antt.html'], ['Medications', 'medications.html'],
      ['About', 'about.html'], ['Progress Note', 'progressnote.html'],
      ['APA 7th', 'resources.html#apa'], ['Quizzes', 'resources.html#quizzes'],
      ['AU Resources', 'resources.html#links'], ['Feedback', 'feedback.html'],
    ];
    links.forEach(([label, href]) => {
      const link = document.createElement('a');
      link.className = 'sidebar-item';
      link.href = href;
      link.textContent = label;
      nav.append(link);
    });
  }
  if (!nav || !main) return;
  const panel = document.createElement('details');
  panel.className = 'resource-sidebar';
  const summary = document.createElement('summary');
  summary.textContent = 'Browse resources';
  nav.setAttribute('aria-label', 'Resource navigation');
  if (!standalone) {
    const layout = document.createElement('div');
    layout.className = 'resource-layout';
    nav.before(layout);
    layout.append(panel, main);
  }
  panel.append(summary, nav);
  const desktop = matchMedia('(min-width: 1001px)');
  panel.open = false;
  const floatingResources = standalone || document.body.classList.contains('resources-page');
  if (floatingResources) {
    // Keep a stable marker in the document when the same disclosure becomes fixed.
    const slot = document.createElement('div');
    slot.className = 'resource-browse-slot';
    (standalone ? main : document.querySelector('.hero-banner, .hero')).before(slot);
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

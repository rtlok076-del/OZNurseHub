(() => {
  'use strict';
  // Keep links shared before the library redesign pointing to their full stories.
  const legacy = { '#mira':'fable-mira-marsh-map.html', '#mara':'fable-mara-two-lanterns.html' };
  function followLegacyLink() {
    if (!legacy[location.hash]) return false;
    location.replace(legacy[location.hash]);
    return true;
  }
  if (followLegacyLink()) return;
  window.addEventListener('hashchange', followLegacyLink);
  const track = document.querySelector('.book-track');
  if (!track) return;
  const cards = [...track.querySelectorAll('.book-card')];
  const previous = document.querySelector('[data-book-prev]');
  const next = document.querySelector('[data-book-next]');
  const status = document.querySelector('.book-position');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let active = 0, frame = 0;
  function centres() {
    // Offset geometry is unaffected by the animated cover transforms.
    const centre = track.scrollLeft + track.clientWidth / 2;
    return cards.map(card => card.offsetLeft + card.offsetWidth / 2 - centre);
  }
  function paint() {
    frame = 0;
    const distances = centres();
    active = distances.reduce((best, d, i) => Math.abs(d) < Math.abs(distances[best]) ? i : best, 0);
    cards.forEach((card, i) => {
      const amount = Math.max(-1, Math.min(1, distances[i] / (card.offsetWidth + 48)));
      card.style.setProperty('--book-opacity', motion.matches ? '1' : String(1 - Math.abs(amount) * .42));
      card.style.setProperty('--book-scale', motion.matches ? '1' : String(1 - Math.abs(amount) * .07));
      card.style.setProperty('--book-tilt', motion.matches ? '0deg' : `${amount * -10}deg`);
    });
    previous.disabled = active === 0;
    next.disabled = active === cards.length - 1;
    const label = `${active + 1} / ${cards.length}`;
    if (status.textContent !== label) status.textContent = label;
  }
  function requestPaint() { if (!frame) frame = requestAnimationFrame(paint); }
  function go(index) {
    index = Math.max(0, Math.min(cards.length - 1, index));
    const card = cards[index];
    active = index;
    track.scrollTo({ left:card.offsetLeft + card.offsetWidth / 2 - track.clientWidth / 2, behavior:motion.matches ? 'instant' : 'smooth' });
  }
  previous.addEventListener('click', () => go(active - 1));
  next.addEventListener('click', () => go(active + 1));
  track.addEventListener('keydown', event => {
    const target = { ArrowLeft:active - 1, ArrowRight:active + 1, Home:0, End:cards.length - 1 }[event.key];
    if (target === undefined || event.altKey || event.ctrlKey || event.metaKey) return;
    event.preventDefault();
    const index = Math.max(0, Math.min(cards.length - 1, target));
    if (event.target.closest('.book-card')) cards[index].focus({preventScroll:true});
    go(index);
  });
  cards.forEach((card, i) => card.addEventListener('focus', () => { if (card.matches(':focus-visible')) go(i); }));
  track.addEventListener('scroll', requestPaint, {passive:true});
  motion.addEventListener('change', requestPaint);
  let lastWidth = track.clientWidth;
  window.addEventListener('resize', () => {
    if (lastWidth !== track.clientWidth) { lastWidth = track.clientWidth; go(active); requestPaint(); }
  });
  track.classList.add('is-ready');
  document.querySelector('.book-controls').hidden = false;
  paint();
})();

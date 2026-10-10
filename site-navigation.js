/* Persistent navigation uses the actual header height, including the mobile menu. */
(() => {
  const header = document.querySelector('.elegant-header');
  if (!header) return;
  const measure = () => document.documentElement.style.setProperty('--site-header-height', `${header.getBoundingClientRect().height}px`);
  measure();
  new ResizeObserver(measure).observe(header);
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'back-to-top';
  button.textContent = '↑ Back to top';
  button.hidden = true;
  document.body.append(button);
  function update() { button.hidden = window.scrollY < 300; }
  addEventListener('scroll', update, {passive:true});
  update();
  button.addEventListener('click', () => {
    window.scrollTo({top:0, behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
    header.querySelector('.elegant-brand')?.focus({preventScroll:true});
  });
})();

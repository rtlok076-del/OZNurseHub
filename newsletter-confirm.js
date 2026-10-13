/* Shows a "check your email" message after Kit redirects back with ?subscribed=1.
   Stores nothing; cleans the URL so a refresh does not show it again. */
(function () {
  var params = new URLSearchParams(window.location.search);
  if (params.get('subscribed') !== '1') return;
  params.delete('subscribed');
  var qs = params.toString();
  if (window.history && history.replaceState) {
    history.replaceState(null, '', window.location.pathname + (qs ? '?' + qs : '') + window.location.hash);
  }
  function show() {
    var signup = document.querySelector('.newsletter-signup');
    var box = document.createElement('div');
    box.className = 'newsletter-confirm';
    box.setAttribute('role', 'status');
    box.setAttribute('tabindex', '-1');
    var p = document.createElement('p');
    p.innerHTML = '<strong>Almost done!</strong> Check your email (and your spam folder) and tap the confirm link to finish subscribing.';
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'newsletter-confirm-close';
    btn.setAttribute('aria-label', 'Dismiss message');
    btn.textContent = '\u00d7';
    btn.addEventListener('click', function () { box.remove(); });
    box.appendChild(p);
    box.appendChild(btn);
    if (signup) signup.parentNode.insertBefore(box, signup);
    else (document.querySelector('main') || document.body).prepend(box);
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    box.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    box.focus({ preventScroll: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', show);
  else show();
})();

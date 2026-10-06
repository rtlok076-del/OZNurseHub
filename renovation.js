(()=>{'use strict';const toggle=document.querySelector('.elegant-toggle'),menu=document.getElementById('elegant-links');if(toggle&&menu){document.documentElement.classList.add('menu-ready');toggle.addEventListener('click',()=>{const opened=menu.classList.toggle('open');toggle.setAttribute('aria-expanded',String(opened));});document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu.classList.contains('open')){menu.classList.remove('open');toggle.setAttribute('aria-expanded','false');toggle.focus();}});}const file=location.pathname.split('/').pop()||'index.html';document.querySelectorAll('.elegant-links a').forEach(a=>{if(a.getAttribute('href')===file)a.setAttribute('aria-current','page');});})();

if ("serviceWorker" in navigator) { window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {})); }
// Preserve existing bookmarks and links to sections of the former homepage.
if ((location.pathname === '/' || location.pathname === '/index.html') && /^#(study|clinical|tips|wellbeing|apa|quizzes|links)$/.test(location.hash)) {
  location.replace('resources.html' + location.hash);
}


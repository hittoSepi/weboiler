'use strict';

const isPreview = document.body.dataset.preview === 'true';
document.querySelectorAll('.carousel').forEach(carousel => {
  const slides = [...carousel.querySelectorAll('.carousel-slide')];
  if (slides.length < 2) return;
  let selected = 0;
  let paused = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pause = carousel.querySelector('[data-pause]');
  const updatePause = () => { pause.textContent = paused ? 'Jatka' : 'Pysäytä'; pause.setAttribute('aria-pressed', String(paused)); };
  function show(index) {
    selected = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => { slide.classList.toggle('is-active', i === selected); slide.setAttribute('aria-hidden', String(i !== selected)); slide.inert = i !== selected; });
  }
  carousel.querySelectorAll('[data-slide]').forEach(button => button.addEventListener('click', () => { paused = true; updatePause(); show(selected + Number(button.dataset.slide)); }));
  pause.addEventListener('click', () => { paused = !paused; updatePause(); });
  updatePause();
  show(0);
  setInterval(() => { if (!paused && !document.hidden && !carousel.matches(':hover') && !carousel.contains(document.activeElement)) show(selected + 1); }, Math.max(3, Number(carousel.dataset.interval) || 5) * 1000);
});
const menu = document.querySelector('.menu');
const navigation = document.querySelector('header nav');
menu?.setAttribute('aria-expanded', 'false');
menu?.addEventListener('click', () => {
  const open = navigation.classList.toggle('open');
  menu.setAttribute('aria-expanded', String(open));
});
navigation?.addEventListener('click', () => {
  navigation.classList.remove('open');
  menu?.setAttribute('aria-expanded', 'false');
});

document.querySelectorAll('.contact form').forEach(form => {
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const status = form.querySelector('.form-status');
    if (isPreview) { status.textContent = 'Esikatselu: viestiä ei lähetetä.'; return; }
    const button = form.querySelector('button');
    button.disabled = true;
    try {
      const response = await fetch('/api/contact', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(Object.fromEntries(new FormData(form)))
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      form.reset();
      status.textContent = 'Kiitos! Viesti vastaanotettiin.';
    } catch (error) { status.textContent = error.message || 'Lähetys epäonnistui. Yritä uudelleen.'; }
    finally { button.disabled = false; }
  });
});

// Only visible, focused time is counted. Preview never creates analytics events.
if (!isPreview) (() => {
  const makeId = () => crypto.randomUUID();
  const read = (storageName, key) => { try { return window[storageName].getItem(key); } catch { return null; } };
  const write = (storageName, key, value) => { try { window[storageName].setItem(key, value); } catch {} };
  const id = (storageName, key) => {
    const value = read(storageName, key) || makeId();
    write(storageName, key, value);
    return value;
  };
  const visitorId = id('localStorage', 'wb_visitor');
  const lastVisit = Number(read('sessionStorage', 'wb_lastVisit')) || 0;
  if (Date.now() - lastVisit > 30 * 60 * 1000) {
    write('sessionStorage', 'wb_session', makeId());
    write('sessionStorage', 'wb_duration', '0');
  }
  const sessionId = id('sessionStorage', 'wb_session');
  let duration = Number(read('sessionStorage', 'wb_duration')) || 0;
  let since = performance.now();
  let active = !document.hidden && document.hasFocus();
  function accrue() {
    const now = performance.now();
    if (active) duration += now - since;
    since = now;
  }
  function send(event, beacon = false) {
    accrue();
    write('sessionStorage', 'wb_duration', String(duration));
    write('sessionStorage', 'wb_lastVisit', String(Date.now()));
    const body = JSON.stringify({ visitorId, sessionId, durationMs: Math.round(duration), event });
    if (beacon && navigator.sendBeacon?.('/api/analytics/visit', new Blob([body], {type:'application/json'}))) return;
    fetch('/api/analytics/visit', { method:'POST', headers:{'Content-Type':'application/json'}, body, keepalive:true }).catch(() => {});
  }
  function changeActivity() {
    accrue();
    active = !document.hidden && document.hasFocus();
    send('heartbeat', !active);
  }
  document.addEventListener('visibilitychange', changeActivity);
  addEventListener('focus', changeActivity);
  addEventListener('blur', changeActivity);
  addEventListener('pagehide', () => { send('heartbeat', true); active = false; });
  send('view');
  setInterval(() => { if (active) send('heartbeat'); }, 30000);
})();

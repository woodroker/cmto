import { prefs } from './prefs.js';
const root = document.documentElement;
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

const io = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  e.target.classList.add('in');
  if (e.target.dataset.count !== undefined) count(e.target);
  io.unobserve(e.target);
}), { threshold: .15 });
// .reveal: muncul saat masuk layar. [data-draw]: garis yang "digambar" melebar.
export const reveal = (r = document) => r.querySelectorAll('.reveal:not(.in), .imgreveal:not(.in), [data-draw]:not(.in)').forEach(el => io.observe(el));

function count(el) {
  const out = el.querySelector('.n'), to = +el.dataset.count, s = performance.now();
  if (still) { out.textContent = to; return; }
  const f = t => { const p = Math.min((t - s) / 1400, 1); out.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(f); };
  requestAnimationFrame(f);
}

// Percakapan: pesan muncul satu per satu dengan indikator "mengetik".
export function chat() {
  document.querySelectorAll('[data-chat]:not([data-run])').forEach(box => {
    box.dataset.run = '1';
    const msgs = [...box.querySelectorAll('.msg')];
    const typing = box.querySelector('.typing');
    const play = () => {
      if (still) { msgs.forEach(m => m.classList.add('show')); typing.hidden = true; return; }
      let i = 0;
      const next = () => {
        if (i >= msgs.length) { typing.hidden = true; return; }
        typing.hidden = false;
        setTimeout(() => {
          typing.hidden = true;
          msgs[i++].classList.add('show');
          setTimeout(next, 450);
        }, 900);
      };
      next();
    };
    const watch = new IntersectionObserver(es => {
      if (es[0].isIntersecting) { watch.disconnect(); play(); }
    }, { threshold: .35 });
    watch.observe(box);
  });
}

// Latar hero bergerak lebih lambat dari scroll (efek parallax).
export function parallax() {
  if (still) return;
  let ticking = false;
  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const bg = document.getElementById('heroBg');
      if (bg) {
        const y = Math.min(scrollY, innerHeight);
        bg.style.transform = `translate3d(0, ${y * 0.25}px, 0) scale(1.1)`;
      }
      ticking = false;
    });
  }, { passive: true });
}

export function boot() {
  const t = prefs.get().theme; if (t) root.dataset.theme = t;
  const loader = document.getElementById('loader');
  const done = () => { loader.classList.add('done'); root.classList.add('ready'); setTimeout(() => loader.remove(), 1000); };
  still ? done() : setTimeout(done, 1100);
}
export function toggleTheme() {
  const n = root.dataset.theme === 'light' ? 'dark' : 'light';
  root.dataset.theme = n; prefs.set({ theme: n });
}
export function toggleMenu(force) {
  const m = document.getElementById('menu'), b = document.getElementById('menubtn');
  const open = force ?? !m.classList.contains('open');
  m.classList.toggle('open', open); b.setAttribute('aria-label', open ? 'Tutup menu' : 'Buka menu');
  b.setAttribute('aria-expanded', open); document.body.style.overflow = open ? 'hidden' : '';
}
export function peek() {
  const img = document.getElementById('peek');
  if (!matchMedia('(hover:hover)').matches) return;
  addEventListener('pointermove', e => {
    const row = e.target.closest && e.target.closest('.row');
    if (!row) { img.classList.remove('on'); return; }
    if (img.dataset.src !== row.dataset.img) { img.src = row.dataset.img; img.dataset.src = row.dataset.img; }
    img.style.left = e.clientX + 'px'; img.style.top = e.clientY + 'px'; img.classList.add('on');
  });
}

// Navigasi jadi kaca saat di-scroll; footer jadi kaca saat masuk layar.
export function glass() {
  const nav = document.querySelector('.nav');
  const onScroll = () => nav && nav.classList.toggle('scrolled', scrollY > 40);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  const foot = document.querySelector('.gfoot');
  if (!foot) return;
  if (still) { foot.classList.add('glass-on'); return; }
  new IntersectionObserver(es => es.forEach(e => foot.classList.toggle('glass-on', e.isIntersecting)),
    { threshold: .25 }).observe(foot);
}

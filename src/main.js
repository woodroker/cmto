import { loadJSON } from './store.js';
import { prefs } from './prefs.js';
import * as ui from './ui.js';
import { boot, reveal, chat, parallax, glass, toggleTheme, toggleMenu, peek } from './fx.js';

const app = document.getElementById('app');
let products = [], cat = prefs.get().cat || 'Semua', mode = '';

const homeHTML = () => ui.hero() + ui.intro() + ui.featuredShell() + ui.catalogShell() + ui.duo() + ui.stats() + ui.contact();

function renderList() {
  const list = document.getElementById('list');
  if (!list) return;
  const items = cat === 'Semua' ? products : products.filter(p => p.category === cat);
  list.innerHTML = items.length ? items.map(ui.row).join('') : ui.empty();
  document.getElementById('filters').innerHTML = ui.filters([...new Set(products.map(p => p.category))], cat);
  document.getElementById('nprod').dataset.count = products.length;
  const feat = document.getElementById('featured');
  if (feat) { feat.innerHTML = products.slice(0, 4).map(ui.feature).join(''); reveal(feat); }
  reveal(list);
}

function route() {
  const view = document.getElementById('view');
  const m = location.hash.match(/^#\/produk\/(.+)$/);
  if (m) {
    mode = 'detail';
    const i = products.findIndex(p => p.id === decodeURIComponent(m[1]));
    view.innerHTML = ui.detail(products[i], products[i + 1] || products[0]);
    scrollTo(0, 0); reveal(view); return;
  }
  if (mode !== 'home') {
    mode = 'home';
    view.innerHTML = homeHTML(); renderList(); reveal(view); chat();
    const t = location.hash.length > 1 ? document.querySelector(location.hash) : null;
    t ? t.scrollIntoView() : scrollTo(0, 0);
  }
}

app.innerHTML = ui.loader() + ui.nav() + ui.menu()
  + '<img id="peek" alt="" src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==">'
  + '<div id="view"></div>' + ui.footer();

app.addEventListener('click', e => {
  const t = e.target;
  if (t.closest('#theme')) return toggleTheme();
  if (t.closest('#menubtn')) return toggleMenu();
  if (t.closest('[data-close]')) toggleMenu(false);
  const b = t.closest('[data-cat]');
  if (b) { cat = b.dataset.cat; prefs.set({ cat }); return renderList(); }
  const r = t.closest('.row');
  if (r && !t.closest('a')) location.hash = '#/produk/' + r.dataset.id;
});
addEventListener('hashchange', () => { toggleMenu(false); route(); });

boot(); peek(); parallax(); glass(); route();
(async () => {
  try {
    const onData = d => { products = d.items; mode === 'detail' ? route() : renderList(); };
    onData(await loadJSON('data/products.json', onData));
    loadJSON('data/instagram.json')
      .then(d => {
        const g = document.getElementById('igGrid');
        if (!g) return;
        if (!d.items?.length) { g.closest('.ig-strip').hidden = true; return; }
        g.innerHTML = d.items.slice(0, 4).map(ui.igTile).join('');
        reveal(g);
      })
      .catch(() => {});
  } catch {
    const list = document.getElementById('list');
    if (list) list.innerHTML = '<li class="py-10">Katalog gagal dimuat. Coba muat ulang atau hubungi kami di WhatsApp 0878 47 644244.</li>';
  }
})();

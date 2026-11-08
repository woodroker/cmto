import { CONFIG } from './config.js';
import { buyLink } from './buy.js';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rp = n => 'Rp ' + n.toLocaleString('id-ID');
const mute = 'text-[color:var(--mute)]';

export const loader = () => `<div id="loader"><div><b class="disp block">CMTO</b><i></i></div></div>`;
export const nav = () => `
<div class="nav flex items-center justify-between px-5 py-3 text-sm">
  <a href="#" class="disp text-xl font-extrabold">CMTO</a>
  <div class="flex items-center gap-1">
    <button id="theme" class="ico" aria-label="Ganti tema terang atau gelap">
      <svg viewBox="0 0 24 24" class="i-sun"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/></svg>
      <svg viewBox="0 0 24 24" class="i-moon"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>
    </button>
    <button id="menubtn" class="ico" aria-label="Buka menu" aria-expanded="false">
      <svg viewBox="0 0 24 24"><path class="l1" d="M4 9h16"/><path class="l2" d="M4 15h16"/></svg>
    </button>
  </div>
</div>`;
export const menu = () => `
<nav id="menu" aria-label="Menu utama">
  ${[['#karya', 'Karya'], ['#tentang', 'Tentang'], ['#kontak', 'Kontak']].map(([h, t]) => `<a href="${h}" data-close class="big disp block py-2 text-6xl font-extrabold transition-colors">${t}</a>`).join('')}
  <a href="https://wa.me/${CONFIG.wa}" class="pill mt-8 w-fit">WhatsApp ↗</a>
</nav>`;

export const hero = () => `
<header id="hero" class="relative isolate flex min-h-[100svh] flex-col justify-between overflow-hidden px-5 pb-6 pt-28">
  <div id="heroBg" class="absolute inset-0 -z-10 overflow-hidden will-change-transform" style="transform:scale(1.1)">
    <iframe class="pointer-events-none absolute left-1/2 top-1/2 border-0" style="width:max(100vw,177.78svh);height:max(56.25vw,100svh);transform:translate(-50%,-50%)" src="https://www.youtube-nocookie.com/embed/${CONFIG.heroVideo}?autoplay=1&mute=1&loop=1&playlist=${CONFIG.heroVideo}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1" allow="autoplay; encrypted-media" tabindex="-1" aria-hidden="true" title="Latar video"></iframe>
  </div>
  <div class="absolute inset-0 -z-10" style="background:linear-gradient(color-mix(in srgb, var(--bg) 35%, transparent), var(--bg))"></div>
  <div>
    <p class="reveal mb-6 text-sm ${mute}">Karanganyar, Jawa Tengah · Sejak 1995</p>
    <h1 class="disp text-[clamp(3.2rem,13vw,12rem)] font-extrabold leading-[.92]">
      <span class="mask"><span>Jati solid,</span></span><span class="mask"><span>dikerjakan</span></span><span class="mask"><span class="text-[color:var(--acc)]">dengan tangan.</span></span>
    </h1>
    <div class="mt-10 flex flex-wrap items-center justify-between gap-6">
      <p class="reveal max-w-md text-lg ${mute}">Pintu, kusen, furniture, dan papan menu. Pesan custom, kirim ke seluruh Indonesia.</p>
      <a href="#karya" class="pill">Lihat karya ↓</a>
    </div>
  </div>
  <div class="ig-strip mt-12">
    <div class="mb-3 flex items-center justify-between gap-4 text-sm ${mute}"><span>Dari Instagram</span><a href="https://instagram.com/udcmto" target="_blank" rel="noopener" class="pill">@udcmto ↗</a></div>
    <ul id="igGrid" class="grid grid-cols-4 gap-2"></ul>
  </div>
</header>
<div class="overflow-hidden border-y py-5" style="border-color:var(--line)">
  <div class="marquee disp text-5xl font-extrabold uppercase">${[0, 1].map(() => ['Pintu', 'Kusen', 'Furniture', 'Papan menu', 'Jati', 'Mahoni'].map(w => `<span class="px-6">${w}<span class="text-[color:var(--acc)]"> ✦</span></span>`).join('')).join('')}</div>
</div>`;

// Intro dua kolom, gaya "Our Studio"
export const intro = () => `
<section class="grid gap-12 px-5 py-28 md:grid-cols-2 md:items-center">
  <div>
    <p class="mb-6 text-sm ${mute}">Tentang kami</p>
    <p class="disp reveal text-4xl font-bold leading-tight md:text-6xl">Usaha kayu keluarga sejak 1995. Kusen, pintu, jendela, furniture, papan menu, dan tent card dari jati dan mahoni.</p>
    <p class="reveal mt-8 max-w-lg ${mute}">Dikerjakan dengan tangan di Karanganyar, dan dikirim ke seluruh Indonesia, Malaysia, dan Singapura.</p>
  </div>
  <div class="imgreveal overflow-hidden rounded-3xl">
    <img loading="lazy" src="https://woodroker.github.io/cmto/img/about.webp" alt="Workshop CMTO" class="aspect-[4/5] w-full object-cover">
  </div>
</section>`;

// Cara kerja + Tanya langsung: sejajar di desktop, satu kolom di HP
export const duo = () => `
<section class="grid gap-16 px-5 py-28 md:grid-cols-2 md:items-start">
  ${steps()}
  ${chat()}
</section>`;

// Pilihan: 4 karya teratas, diisi dari katalog (gaya "Featured Works")
export const featuredShell = () => `
<section class="px-5 pb-28">
  <div class="mb-12 flex flex-wrap items-end justify-between gap-6"><h2 class="disp reveal text-5xl font-extrabold md:text-7xl">Pilihan</h2><a href="#karya" class="pill">Semua karya →</a></div>
  <ul id="featured" class="grid gap-10 md:grid-cols-2"></ul>
</section>`;
export const feature = (p, i) => `
<li class="reveal" style="--d:${(i % 2) * 0.15}s">
  <a href="#/produk/${esc(p.id)}" class="group block">
    <div class="imgreveal overflow-hidden rounded-2xl"><img loading="lazy" src="${esc(p.image)}" alt="${esc(p.name)}" class="aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-105"></div>
    <div class="mt-5 flex items-baseline gap-4"><span class="tabular-nums ${mute}">${String(i + 1).padStart(2, '0')}</span><span class="disp text-2xl font-bold">${esc(p.name)}</span></div>
    <p class="mt-1 pl-10 text-sm ${mute}">${esc(p.category)}</p>
  </a>
</li>`;

export const steps = () => `
<div>
  <h2 class="disp reveal mb-16 text-5xl font-extrabold md:text-7xl">Cara kerja</h2>
  <div class="grid gap-10 sm:grid-cols-2">
    ${[['Konsultasi','Ceritakan ukuran dan kebutuhan Anda lewat WhatsApp.'],['Desain','Kami kirim gambar dan rincian kayu untuk Anda setujui.'],['Produksi','Jati atau mahoni dikerjakan dengan tangan di Karanganyar.'],['Kirim','Dikemas dan dikirim ke seluruh Indonesia, Malaysia, dan Singapura.']].map(([t, d], i) => `
    <div class="reveal relative" style="--d:${i * 0.15}s">
      <span class="disp block text-sm ${mute}">0${i + 1} / 04</span>
      <h3 class="disp mt-3 text-3xl font-bold">${t}</h3>
      <p class="mt-2 ${mute}">${d}</p>
    </div>`).join('')}
  </div>
</div>`;

export const chat = () => `
<div>
  <h2 class="disp reveal mb-10 text-5xl font-extrabold md:text-7xl">Tanya langsung</h2>
  <div data-chat class="reveal flex flex-col gap-3 rounded-3xl border p-5" style="border-color:var(--line)">
    <div class="msg" data-who="them">Pak, bisa buat pintu jati tinggi 235 cm?</div>
    <div class="msg" data-who="us">Bisa. Kirim ukuran rumah dan foto pintu lama, nanti kami buatkan gambarnya.</div>
    <div class="msg" data-who="them">Berapa lama pengerjaannya?</div>
    <div class="msg" data-who="us">Tergantung ukuran dan finishing. Jadwal dan harga kami konfirmasi di WhatsApp.</div>
    <div class="msg" data-who="cta"><a href="https://wa.me/${CONFIG.wa}" class="pill">Balas di WhatsApp ↗</a></div>
    <div class="typing" hidden><i></i><i></i><i></i></div>
  </div>
</div>`;

export const igTile = (p, i) => `
<li class="imgreveal relative aspect-square overflow-hidden rounded-xl" style="--d:${(i % 4) * 0.12}s">
  <a href="${esc(p.permalink)}" target="_blank" rel="noopener" class="group block h-full w-full">
    <img loading="lazy" src="${esc(p.image)}" alt="${esc(p.caption)}" class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105">
    <span class="absolute bottom-2 left-2 rounded-full bg-black/50 px-2 py-1 text-xs text-white backdrop-blur">${esc(p.category || '')}</span>
  </a>
</li>`;

export const catalogShell = () => `
<section id="karya" class="px-5 py-24">
  <div class="mb-10 flex flex-wrap items-end justify-between gap-6"><h2 class="disp reveal text-5xl font-extrabold md:text-7xl">Karya</h2><div id="filters"></div></div>
  <ul id="list"></ul>
</section>`;
export const filters = (cats, active) => ['Semua', ...cats].map(c => `<button data-cat="${esc(c)}" aria-pressed="${c === active}" class="pill mb-2 mr-2 ${c === active ? 'is-on' : ''}">${esc(c)}</button>`).join('');

export const row = (p, i) => `
<li class="row reveal" data-id="${esc(p.id)}" data-img="${esc(p.image)}">
  <span class="tabular-nums ${mute}">${String(i + 1).padStart(2, '0')}</span>
  <span class="flex items-center gap-4">
    <img loading="lazy" src="${esc(p.image)}" alt="${esc(p.name)}" class="h-16 w-16 shrink-0 rounded-lg object-cover md:hidden">
    <span><span class="t disp block">${esc(p.name)}</span><span class="mt-1 block text-sm ${mute}">${esc(p.category)} · ${p.price ? rp(p.price) : 'Tanya harga'}</span></span>
  </span>
  ${p.buy ? `<a href="${buyLink(p)}" target="_blank" rel="noopener" class="pill">Buy</a>` : '<span class="text-xl">↗</span>'}
</li>`;
export const empty = () => `<li class="py-10">Belum ada karya di kategori ini. Hubungi kami lewat WhatsApp untuk pesanan custom.</li>`;

export const stats = () => `
<section class="grid gap-10 border-y px-5 py-20 md:grid-cols-3" style="border-color:var(--line)">
  <div class="reveal"><div class="disp text-7xl font-extrabold md:text-8xl">1995</div><p class="mt-2 ${mute}">Mulai berkarya</p></div>
  <div class="reveal" data-count="3"><div class="disp text-7xl font-extrabold md:text-8xl"><span class="n">0</span></div><p class="mt-2 ${mute}">Negara tujuan kirim: Indonesia, Malaysia, Singapura</p></div>
  <div class="reveal" id="nprod" data-count="0"><div class="disp text-7xl font-extrabold md:text-8xl"><span class="n">0</span></div><p class="mt-2 ${mute}">Karya di katalog</p></div>
</section>`;

export const about = () => `
<section id="tentang" class="px-5 py-28">
  <p class="disp reveal max-w-5xl text-3xl font-bold leading-tight md:text-6xl">Usaha kayu keluarga sejak 1995. Kusen, pintu, jendela, furniture, papan menu, dan tent card dari jati dan mahoni, dikerjakan di Karanganyar.</p>
</section>`;
export const contact = () => `
<section id="kontak" class="px-5 pb-28 pt-10">
  <a href="https://wa.me/${CONFIG.wa}" class="disp group block text-[clamp(2.6rem,9vw,8rem)] font-extrabold leading-[.95]">
    <span class="reveal block">Punya proyek kayu?</span>
    <span class="reveal block transition-colors ${mute} group-hover:text-[color:var(--acc)]">Ngobrol di WhatsApp ↗</span>
  </a>
</section>`;
export const footer = () => `
<footer class="gfoot isolate relative mx-3 mb-4 rounded-3xl border px-6 py-10 text-sm ${mute}">
  <div class="flex flex-wrap justify-between gap-4">
    <p>© Sejak 1995 ${CONFIG.brand}. Jl. Mojo km.09, Sawahan, Jaten, Karanganyar.</p>
    <p class="flex gap-4"><a href="https://instagram.com/udcmto">Instagram</a><a href="https://shopee.co.id/ud.cmto">Shopee</a><a href="https://youtube.com/pintujatisolo">YouTube</a></p>
  </div>
</footer>`;

export const detail = (p, next) => !p ? `<section class="px-5 pb-20 pt-32"><p>Karya tidak ditemukan.</p><a class="pill mt-6" href="#karya">← Karya</a></section>` : `
<article class="px-5 pb-20 pt-28">
  <a href="#karya" class="pill">← Karya</a>
  <h1 class="disp mt-8 text-[clamp(2.6rem,9vw,8rem)] font-extrabold leading-[.95]">${esc(p.name)}</h1>
  <img src="${esc(p.image)}" alt="${esc(p.name)}" class="reveal mx-auto mt-10 block h-auto w-full max-w-2xl max-h-[60svh] rounded-2xl object-contain">
  <div class="mt-12 grid gap-10 md:grid-cols-[1fr_2fr]">
    <dl class="reveal space-y-4 text-sm"><div><dt class="${mute}">Kategori</dt><dd class="text-lg">${esc(p.category)}</dd></div><div><dt class="${mute}">Harga</dt><dd class="text-lg">${p.price ? rp(p.price) : 'Tanya harga'}</dd></div></dl>
    <div class="reveal">
      <p class="text-2xl leading-snug md:text-3xl">${esc(p.desc)}</p>
      ${p.specs ? `<ul class="mt-6 space-y-2 ${mute}">${p.specs.map(x => `<li class="border-t pt-2" style="border-color:var(--line)">${esc(x)}</li>`).join('')}</ul>` : ''}
      <div class="mt-8 flex flex-wrap gap-3">
        ${p.buy ? `<a href="${buyLink(p)}" target="_blank" rel="noopener" class="pill is-on">Buy lewat WhatsApp ↗</a>` : ''}
        ${p.link ? `<a href="${esc(p.link)}" target="_blank" rel="noopener" class="pill">Lihat di marketplace ↗</a>` : ''}
      </div>
    </div>
  </div>
  ${next ? `<a href="#/produk/${esc(next.id)}" class="disp reveal mt-20 block border-t py-8 text-4xl font-extrabold transition-colors hover:text-[color:var(--acc)] md:text-6xl" style="border-color:var(--line)">Berikutnya → ${esc(next.name)}</a>` : ''}
</article>`;

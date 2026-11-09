// CMTO admin worker: API dashboard + webhook Telegram.
// Membaca & menulis data/products.json di GitHub, lalu purge cache jsDelivr.
const REPO = 'woodroker/cmto';
const BRANCH = 'main';
const FILE = 'data/products.json';
const GH = `https://api.github.com/repos/${REPO}/contents/${FILE}`;

const ALIAS = {
  nama: 'name', name: 'name', kategori: 'category', category: 'category',
  deskripsi: 'desc', desc: 'desc', harga: 'price', price: 'price',
  beli: 'buy', buy: 'buy', gambar: 'image', image: 'image',
  tautan: 'link', link: 'link', spesifikasi: 'specs', specs: 'specs',
};

const HELP = `?? Bot Katalog CMTO

/daftar — lihat semua karya
/lihat <id> — detail satu karya
/ubah <id> <field> <nilai> — ubah isi karya
  field: nama, kategori, deskripsi, harga, beli (ya/tidak), gambar, tautan, spesifikasi (pisah dengan ;)
  contoh: /ubah pintu-jati harga 2500000
  kosongkan tautan dengan: /ubah <id> tautan -
/tambah <id> | nama | kategori | deskripsi | harga | link gambar
  contoh: /tambah kursi-jati | Kursi jati | Furniture | Kursi jati solid | 850000 | https://...
  harga kosong atau "tanya" = tampil "Tanya harga"
/hapus <id> ya — hapus karya

Perubahan tayang di situs dalam beberapa menit.`;

const json = (o, s = 200) =>
  new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json' } });

export default {
  // Cron: cek postingan IG baru (lihat wrangler.toml [triggers]).
  scheduled(event, env, ctx) {
    ctx.waitUntil(syncInstagram(env).catch(e => notifyAdmins(env, '?? Sync Instagram gagal: ' + e.message)));
  },

  async fetch(req, env) {
    const url = new URL(req.url);
    try {
      if (url.pathname === '/telegram' && req.method === 'POST') return await telegram(req, env);
      if (url.pathname === '/api/products') return await api(req, env);
    } catch (e) {
      return json({ error: e.message }, 500);
    }
    return env.ASSETS.fetch(req);
  },
};

// ---------- GitHub ----------
const ghHeaders = env => ({
  authorization: `Bearer ${env.GITHUB_TOKEN}`,
  accept: 'application/vnd.github+json',
  'x-github-api-version': '2022-11-28',
  'user-agent': 'cmto-admin',
});

function b64decode(s) {
  const bin = atob(s.replace(/\n/g, ''));
  return new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0)));
}
function b64encode(s) {
  let bin = '';
  for (const b of new TextEncoder().encode(s)) bin += String.fromCharCode(b);
  return btoa(bin);
}

async function readCatalog(env) {
  const r = await fetch(`${GH}?ref=${BRANCH}`, { headers: ghHeaders(env) });
  if (!r.ok) throw new Error(`Gagal membaca katalog (GitHub ${r.status})`);
  const j = await r.json();
  return { data: JSON.parse(b64decode(j.content)), sha: j.sha };
}

async function purge() {
  try { await fetch(`https://purge.jsdelivr.net/gh/${REPO}@${BRANCH}/${FILE}`); } catch {}
}

// Baca ? ubah ? validasi ? tulis. Retry jika ada konflik (409).
async function update(env, mutate, message) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const { data, sha } = await readCatalog(env);
    const result = mutate(data.items);
    data.items = data.items.map(cleanItem);
    const r = await fetch(GH, {
      method: 'PUT',
      headers: ghHeaders(env),
      body: JSON.stringify({ message, branch: BRANCH, sha, content: b64encode(JSON.stringify(data, null, 2) + '\n') }),
    });
    if (r.status === 409 && attempt < 3) continue;
    if (!r.ok) throw new Error(`Gagal menyimpan (GitHub ${r.status})`);
    await purge();
    return result;
  }
}

// ---------- Validasi ----------
const isHttps = v => { try { return new URL(v).protocol === 'https:'; } catch { return false; } };

function parsePrice(v) {
  const n = Number(String(v).replace(/rp/gi, '').replace(/[\s.]/g, ''));
  if (!Number.isInteger(n) || n < 0) throw new Error(`Harga "${v}" tidak valid. Contoh: 2500000`);
  return n;
}

function cleanItem(p) {
  const id = String(p.id ?? '').trim();
  if (!/^[a-z0-9-]+$/.test(id)) throw new Error(`ID "${id}" hanya boleh huruf kecil, angka, dan -`);
  const name = String(p.name ?? '').trim();
  if (!name) throw new Error(`Nama kosong untuk ${id}`);
  if (!isHttps(p.image)) throw new Error(`Gambar untuk ${id} harus link https`);
  const out = {
    id,
    name,
    category: String(p.category ?? '').trim() || 'Lainnya',
    desc: String(p.desc ?? '').trim(),
  };
  const specs = (Array.isArray(p.specs) ? p.specs : []).map(s => String(s).trim()).filter(Boolean);
  if (specs.length) out.specs = specs;
  out.price = p.price == null || p.price === '' ? null : parsePrice(p.price);
  out.buy = p.buy !== false;
  out.image = p.image;
  if (p.link) {
    if (!isHttps(p.link)) throw new Error(`Tautan untuk ${id} harus link https`);
    out.link = p.link;
  }
  return out;
}

function toValue(key, v) {
  if (key === 'buy') {
    if (/^(ya|true|1|on)$/i.test(v)) return true;
    if (/^(tidak|false|0|off)$/i.test(v)) return false;
    throw new Error('Nilai beli harus "ya" atau "tidak"');
  }
  if (key === 'price') return /^(|-|null|tanya)$/i.test(v.trim()) ? null : parsePrice(v);
  if (key === 'specs') return v.split(';').map(s => s.trim()).filter(Boolean);
  if (key === 'link' && v.trim() === '-') return '';
  return v.trim();
}

// ---------- Dashboard API ----------
async function api(req, env) {
  if (req.headers.get('authorization') !== `Bearer ${env.ADMIN_TOKEN}`) return json({ error: 'Token salah' }, 401);
  if (req.method === 'GET') {
    const { data } = await readCatalog(env);
    return json(data);
  }
  if (req.method === 'PUT') {
    const body = await req.json();
    if (!Array.isArray(body.items)) return json({ error: 'items harus berupa daftar' }, 400);
    let beforeItems;
    try {
      beforeItems = (await readCatalog(env)).data.items;
      await update(env, items => { items.splice(0, items.length, ...body.items); return null; },
        `dashboard: simpan ${body.items.length} karya`);
    } catch (e) {
      return json({ error: e.message }, 400);
    }
    await syncBloggerDiff(env, beforeItems);
    return json({ ok: true });
  }
  return json({ error: 'Metode tidak diizinkan' }, 405);
}

// ---------- Telegram ----------
async function telegram(req, env) {
  if (req.headers.get('x-telegram-bot-api-secret-token') !== env.WEBHOOK_SECRET) {
    return new Response('forbidden', { status: 403 });
  }
  const upd = await req.json();
  const msg = upd.message || upd.edited_message;
  if (!msg?.text) return new Response('ok');
  const chat = String(msg.chat.id);
  const allowed = String(env.ADMIN_CHAT_IDS).split(',').map(s => s.trim());
  if (!allowed.includes(chat)) {
    await send(env, chat, 'Maaf, akun Telegram ini tidak punya akses.');
    return new Response('ok');
  }
  let reply;
  try {
    reply = await handle(msg.text.trim(), env);
  } catch (e) {
    reply = '?? ' + e.message;
  }
  await send(env, chat, reply);
  return new Response('ok');
}

async function send(env, chat_id, text) {
  await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id, text: text.slice(0, 4000), disable_web_page_preview: true }),
  });
}

async function handle(text, env) {
  const [first] = text.split(/\s+/);
  const cmd = first.split('@')[0].toLowerCase();
  const rest = text.slice(first.length).trim();
  switch (cmd) {
    case '/start': case '/help': case '/bantuan': return HELP;
    case '/daftar': return list(env);
    case '/lihat': return show(env, rest);
    case '/ubah': return change(env, rest);
    case '/tambah': return add(env, rest);
    case '/hapus': return remove(env, rest);
    default: return 'Perintah tidak dikenal.\n\n' + HELP;
  }
}

const rupiah = n => 'Rp ' + Number(n).toLocaleString('id-ID');

async function list(env) {
  const { data } = await readCatalog(env);
  if (!data.items.length) return 'Katalog masih kosong.';
  return data.items.map((p, i) =>
    `${String(i + 1).padStart(2, '0')}. ${p.id} — ${p.name} [${p.category}] ${p.price == null ? 'Tanya harga' : rupiah(p.price)}`
  ).join('\n');
}

async function show(env, id) {
  if (!id) return 'Format: /lihat <id>';
  const { data } = await readCatalog(env);
  const p = data.items.find(x => x.id === id);
  if (!p) return `ID "${id}" tidak ditemukan. Cek daftarnya dengan /daftar`;
  return [
    `id: ${p.id}`,
    `nama: ${p.name}`,
    `kategori: ${p.category}`,
    `deskripsi: ${p.desc}`,
    `harga: ${p.price == null ? 'Tanya harga' : rupiah(p.price)}`,
    `beli: ${p.buy ? 'ya' : 'tidak'}`,
    `gambar: ${p.image}`,
    `tautan: ${p.link || '-'}`,
    `spesifikasi: ${(p.specs || []).join('; ') || '-'}`,
  ].join('\n');
}

async function change(env, rest) {
  const m = rest.match(/^(\S+)\s+(\S+)\s+([\s\S]+)$/);
  if (!m) return 'Format: /ubah <id> <field> <nilai>\nContoh: /ubah pintu-jati harga 2500000';
  const [, id, rawField, value] = m;
  const key = ALIAS[rawField.toLowerCase()];
  if (!key) return `Field "${rawField}" tidak dikenal. Pilih: nama, kategori, deskripsi, harga, beli, gambar, tautan, spesifikasi`;
  const msg = await update(env, items => {
    const p = items.find(x => x.id === id);
    if (!p) throw new Error(`ID "${id}" tidak ditemukan`);
    p[key] = toValue(key, value);
    return `? ${id}: ${rawField} diperbarui.`;
  }, `bot: ubah ${id}.${key}`);
  await syncBloggerSafe(env, id);
  return msg;
}

async function add(env, rest) {
  const parts = rest.split('|').map(s => s.trim());
  if (parts.length < 6) return 'Format: /tambah <id> | nama | kategori | deskripsi | harga | link gambar';
  const [id, name, category, desc, price, image] = parts;
  const msg = await update(env, items => {
    if (items.some(x => x.id === id)) throw new Error(`ID "${id}" sudah dipakai`);
    items.push({
      id, name, category, desc,
      price: /^(|tanya)$/i.test(price) ? null : parsePrice(price),
      buy: true, image,
    });
    return `? Karya "${name}" ditambahkan.`;
  }, `bot: tambah ${id}`);
  await syncBloggerSafe(env, id);
  return msg;
}

async function remove(env, rest) {
  const [id, konfirmasi] = rest.split(/\s+/);
  if (!id) return 'Format: /hapus <id> ya';
  if (konfirmasi !== 'ya') return `Untuk menghapus, ketik: /hapus ${id} ya`;
  const msg = await update(env, items => {
    const i = items.findIndex(x => x.id === id);
    if (i < 0) throw new Error(`ID "${id}" tidak ditemukan`);
    items.splice(i, 1);
    return `??? "${id}" dihapus.`;
  }, `bot: hapus ${id}`);
  try { await bloggerDelete(env, id); } catch (e) { await notifyAdmins(env, `?? Gagal hapus post Blogger "${id}": ${e.message}`); }
  return msg;
}

// ---------- Sinkron Instagram ----------
// Run pertama hanya menandai postingan lama sebagai "sudah dilihat" tanpa mengirim apa pun.
const IG_FIELDS = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp';

const allowedChats = env => String(env.ADMIN_CHAT_IDS).split(',').map(s => s.trim()).filter(Boolean);

async function notifyAdmins(env, text) {
  for (const chat of allowedChats(env)) await send(env, chat, text);
}

// Caption yang mengandung nomor WhatsApp ini dianggap "siap jual" dan
// otomatis masuk katalog (tombol Buy memakai CONFIG.wa di frontend, jadi
// nomor ini hanya dipakai sebagai penanda, bukan disimpan per-item).
const WA_TRIGGER_DIGITS = '6287847644244';

function hasWaTrigger(caption) {
  if (!caption || !/whatsapp/i.test(caption)) return false;
  return caption.replace(/\D/g, '').includes(WA_TRIGGER_DIGITS);
}

async function syncInstagram(env) {
  const url = `https://graph.facebook.com/v21.0/${env.IG_USER_ID}/media?fields=${IG_FIELDS}&limit=25`;
  const r = await fetch(url, { headers: { authorization: `Bearer ${env.IG_ACCESS_TOKEN}` } });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(`Graph API ${r.status}: ${err.error?.message || 'tanpa pesan'}`);
  }
  const { data = [] } = await r.json();

  if (!(await env.SEEN.get('seeded'))) {
    for (const m of data) await env.SEEN.put('ig:' + m.id, '1');
    await env.SEEN.put('seeded', '1');
    return;
  }

  for (const m of [...data].reverse()) {   // dari yang paling lama
    if (await env.SEEN.get('ig:' + m.id)) continue;
    const photo = m.media_type === 'VIDEO' ? m.thumbnail_url : m.media_url;
    const localUrl = photo ? await saveImage(env, m.id, photo) : null;
    if (localUrl && hasWaTrigger(m.caption)) {
      await autoAddFromInstagram(env, m, localUrl);
    } else {
      await notifyNewPost(env, m, photo, localUrl);
    }
    await env.SEEN.put('ig:' + m.id, '1');
  }
}

// Caption ada "WhatsApp: +62 878 47644244" ? langsung tambah sebagai karya,
// tanpa menunggu konfirmasi /tambah manual. Kategori & harga diisi default
// ("Dari Instagram" / Tanya harga) dan bisa diperbaiki lewat /ubah.
async function autoAddFromInstagram(env, m, localUrl) {
  const productId = 'ig-' + m.id.slice(-8);
  const rawCaption = (m.caption || '').trim();
  const name = (rawCaption.split('\n')[0] || 'Karya dari Instagram').slice(0, 80).trim()
    || 'Karya dari Instagram';
  const desc = rawCaption
    .replace(/whatsapp\s*:?\s*\+?[\d\s-]{8,}/i, '')   // buang baris nomor WA dari deskripsi
    .trim()
    .slice(0, 300);

  try {
    let added = true;
    await update(env, items => {
      if (items.some(x => x.id === productId)) { added = false; return null; }
      items.push({ id: productId, name, category: 'Dari Instagram', desc, price: null, buy: true, image: localUrl });
      return null;
    }, `bot: auto-tambah dari IG ${m.id}`);
    if (!added) return;   // sudah pernah ditambahkan, jangan duplikat/notif ulang
    await syncBloggerSafe(env, productId);
    const text = `? Otomatis ditambahkan ke katalog (ada WhatsApp di caption)\n\nid: ${productId}\nnama: ${name}\n${m.permalink}\n\nLengkapi bila perlu:\n/ubah ${productId} kategori <kategori>\n/ubah ${productId} harga <harga>`;
    for (const chat of allowedChats(env)) await sendPhoto(env, chat, localUrl, text);
  } catch (e) {
    await notifyAdmins(env, `?? Gagal auto-tambah dari IG ${m.id}: ${e.message}\n${m.permalink}`);
  }
}

async function notifyNewPost(env, m, photo, localUrl) {
  const caption = (m.caption || '(tanpa caption)').slice(0, 300);
  const productId = 'ig-' + m.id.slice(-8);
  const hint = localUrl
    ? `\n\nTambah ke katalog:\n/tambah ${productId} | <nama> | <kategori> | <deskripsi> | <harga> | ${localUrl}`
    : '\n\n(gambar gagal disalin, tambahkan manual)';
  const text = `?? Postingan baru dari IG\n\n${caption}\n\n${m.permalink}${hint}`;

  for (const chat of allowedChats(env)) {
    if (photo) await sendPhoto(env, chat, photo, text);
    else await send(env, chat, text);
  }
}

// Salin foto ke repo agar tautan tidak kedaluwarsa. Mengembalikan URL publik atau null.
async function saveImage(env, mediaId, sourceUrl) {
  const r = await fetch(sourceUrl);
  if (!r.ok) return null;
  const bytes = new Uint8Array(await r.arrayBuffer());
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  const path = `img/ig/${mediaId}.jpg`;
  const put = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
    method: 'PUT',
    headers: ghHeaders(env),
    body: JSON.stringify({ message: `bot: foto IG ${mediaId}`, branch: BRANCH, content: btoa(bin) }),
  });
  if (!put.ok && put.status !== 422) return null;   // 422 = file sudah ada
  return `https://woodroker.github.io/cmto/${path}`;
}

async function sendPhoto(env, chat_id, photo, caption) {
  await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendPhoto`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id, photo, caption: caption.slice(0, 1024) }),
  });
}

// ---------- Blogger (SEO: 1 postingan per karya) ----------
// Lewat Google Apps Script (kirim email ke alamat Mail-to-Blogger).
// Butuh APPS_SCRIPT_URL + BLOG_URL di [vars], dan APPS_SCRIPT_SECRET sebagai secret.
// Kalau belum disetel, fungsi-fungsi ini diam saja (tidak error).
const escHtml = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const escAttr = s => escHtml(s).replace(/"/g, '&quot;');

function productUrl(env) {
  return `${String(env.BLOG_URL).replace(/\/$/, '')}/#karya`;
}

function productPostBody(env, p) {
  const url = productUrl(env);
  const priceText = p.price == null ? 'Tanya harga' : rupiah(p.price);
  const wa = `https://wa.me/6287847644244?text=${encodeURIComponent(`Halo CMTO, saya tertarik dengan ${p.name}. Apakah tersedia?`)}`;
  const specsHtml = (p.specs || []).length
    ? `<ul>${p.specs.map(s => `<li>${escHtml(s)}</li>`).join('')}</ul>` : '';
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    image: [p.image],
    description: p.desc || p.name,
    category: p.category,
    url,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'IDR',
      url,
      availability: p.buy ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      ...(p.price != null ? { price: p.price } : {}),
    },
  };
  return `<div class="cmto-product-post">
<img src="${escAttr(p.image)}" alt="${escAttr(p.name)}" style="max-width:100%;height:auto"/>
<p>${escHtml(p.desc || '').replace(/\n/g, '<br/>')}</p>
${specsHtml}
<p><strong>${escHtml(priceText)}</strong></p>
<p>
  <a href="${escAttr(wa)}" rel="nofollow noopener" target="_blank">Pesan via WhatsApp</a>
  &nbsp;|&nbsp;
  <a href="${escAttr(url)}">Lihat &amp; beli di katalog lengkap</a>
</p>
<script type="application/ld+json">${JSON.stringify(ld)}</script>
</div>`;
}

// Kirim 1 post Blogger untuk 1 produk. Apps Script hanya bisa menambah post,
// jadi setiap pemanggilan membuat post baru (tidak mengedit yang lama).
async function bloggerUpsert(env, p) {
  if (!env.APPS_SCRIPT_URL || !env.APPS_SCRIPT_SECRET || !env.BLOG_URL) return; // belum disetel
  const res = await fetch(env.APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'content-type': 'text/plain' },
    body: JSON.stringify({
      secret: env.APPS_SCRIPT_SECRET,
      subject: p.name,
      html: productPostBody(env, p),
    }),
  });
  const text = await res.text();
  if (!res.ok || text !== 'ok') throw new Error(`Kirim ke Blogger gagal (${res.status}): ${text.slice(0, 100)}`);
}

// Mail-to-Blogger tidak bisa menghapus post. Hapus manual di Blogger.
async function bloggerDelete(env, id) {}

// Dipanggil setelah products.json berhasil diubah. Gagal sinkron Blogger
// TIDAK membatalkan perubahan katalog — admin cuma dapat notifikasi warning.
async function syncBloggerSafe(env, productId) {
  try {
    const { data } = await readCatalog(env);
    const p = data.items.find(x => x.id === productId);
    if (!p) return;
    await bloggerUpsert(env, p);
  } catch (e) {
    await notifyAdmins(env, `?? Gagal sinkron "${productId}" ke Blogger: ${e.message}`);
  }
}

// Dipakai setelah dashboard menyimpan seluruh katalog sekaligus (PUT
// /api/products). Hanya sinkron item yang benar-benar baru/berubah/dihapus
// dibanding sebelumnya - bukan upsert semua item tiap kali save.
async function syncBloggerDiff(env, before) {
  if (!env.APPS_SCRIPT_URL || !env.APPS_SCRIPT_SECRET || !env.BLOG_URL) return; // belum disetel
  let after;
  try { ({ data: { items: after } } = await readCatalog(env)); } catch { return; }
  const beforeMap = new Map(before.map(p => [p.id, p]));
  const afterIds = new Set(after.map(p => p.id));
  const errors = [];

  for (const id of beforeMap.keys()) {
    if (afterIds.has(id)) continue;
    try { await bloggerDelete(env, id); } catch (e) { errors.push(`hapus ${id}: ${e.message}`); }
  }
  for (const p of after) {
    const old = beforeMap.get(p.id);
    if (old && JSON.stringify(old) === JSON.stringify(p)) continue; // tidak berubah
    try { await bloggerUpsert(env, p); } catch (e) { errors.push(`${p.id}: ${e.message}`); }
  }
  if (errors.length) {
    await notifyAdmins(env, `?? Sinkron Blogger dari dashboard, ${errors.length} gagal:\n` + errors.slice(0, 10).join('\n'));
  }
}
// Stale-while-revalidate: tampil instan dari IndexedDB, lalu segarkan dari jsDelivr.
import { CONFIG } from './config.js';
const S = 'kv';
const open = () => new Promise((ok, no) => {
  const r = indexedDB.open('cmto', 1);
  r.onupgradeneeded = () => r.result.createObjectStore(S);
  r.onsuccess = () => ok(r.result);
  r.onerror = () => no(r.error);
});
async function get(k) {
  try {
    const db = await open();
    return await new Promise(ok => {
      const q = db.transaction(S).objectStore(S).get(k);
      q.onsuccess = () => ok(q.result); q.onerror = () => ok(null);
    });
  } catch { return null; }
}
async function put(k, v) { try { (await open()).transaction(S, 'readwrite').objectStore(S).put(v, k); } catch {} }

export async function loadJSON(path, onFresh) {
  const url = (path.startsWith('data/') ? CONFIG.dataCdn : CONFIG.cdn) + path;
  const getJSON = u => fetch(u).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); });
  const hit = await get(path);
  // Sumber utama jsDelivr; jika gagal, pakai salinan di paket situs (path relatif).
  const fresh = getJSON(url)
    .catch(() => getJSON(path))
    .then(d => { put(path, { d, t: Date.now() }); return d; });
  if (hit) { fresh.then(d => onFresh && onFresh(d)).catch(() => {}); return hit.d; }
  return fresh;
}

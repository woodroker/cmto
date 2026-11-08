# Panduan Pemasangan CMTO

Urutan: **push ke GitHub dulu → baru Blogger & Cloudflare**, karena situs (Blogger) dan worker (Cloudflare) sama-sama membaca/menulis ke repo GitHub ini.

---

## 1. Push folder `cmto/` ke GitHub

### Kalau belum pernah punya repo-nya
1. Buka [github.com/new](https://github.com/new), buat repo dengan nama persis **`cmto`** di akun **`woodroker`** (harus sama persis — semua link `cdn.jsdelivr.net/gh/woodroker/cmto@...` di kode mengasumsikan nama ini). Pilih **Public** (wajib — dijelaskan di bawah).
2. Di komputer, buka terminal, masuk ke folder hasil extract zip (folder yang isinya `cmto/`):
   ```bash
   cd cmto-app/cmto
   git init
   git add .
   git commit -m "setup awal CMTO"
   git branch -M main
   git remote add origin https://github.com/woodroker/cmto.git
   git push -u origin main
   ```
3. Kalau diminta login, pakai GitHub Personal Access Token sebagai password (bukan password akun biasa) — bisa dibuat di GitHub → Settings → Developer settings → Personal access tokens.

### Kalau repo-nya sudah ada (update isi yang sudah di-push sebelumnya)
```bash
cd cmto-app/cmto
git add .
git commit -m "update: template Pengrajin Kayu, lottie, sinkron Blogger"
git push
```

**Kenapa harus public:** situs membaca `css`/data lewat jsDelivr (`cdn.jsdelivr.net/gh/woodroker/cmto@...`), dan jsDelivr hanya bisa menyajikan file dari repo GitHub yang public. Kalau private, situs tidak akan bisa memuat apa pun.

**Wajib ikut ter-push:** folder `lottie/` (animasi ilustrasi), `data/products.json` (katalog awal), `template/blogger-template.xml`. Tanpa ini, situs akan tampil tapi ilustrasi/katalog kosong.

---

## 2. Pasang tampilan di Blogger

1. Login ke [blogger.com](https://www.blogger.com), pilih blog kamu → menu **Tema**.
2. Titik tiga (⋮) kanan atas → **Cadangkan/Pulihkan** → **Unduh tema** (simpan sebagai cadangan, jaga-jaga).
3. Titik tiga (⋮) → **Edit HTML**.
4. Select all (Ctrl+A) isi editor → hapus → paste seluruh isi file `cmto/template/blogger-template.xml`.
5. Klik **Simpan** (ikon disket, kanan atas editor).
6. Buka blog-nya di tab baru, cek: hero + animasi lingkaran kayu harus muncul, bagian "Karya pilihan" harus menampilkan produk dari `data/products.json`.

Kalau "Karya pilihan" masih menampilkan 4 item contoh (Pintu jati ukuran besar, dst) dan bukan produk aslimu — berarti fetch ke `products.json` gagal (biasanya karena repo belum public/belum ke-push, atau jsDelivr masih nge-cache versi lama; tunggu beberapa menit atau coba `https://purge.jsdelivr.net/gh/woodroker/cmto@main/data/products.json`).

---

## 3. Deploy admin-worker (bot Telegram + dashboard + sinkron Blogger)

Kalau kamu sudah pernah jalankan ini sebelumnya, cukup `npm run deploy` lagi untuk memuat kode terbaru (tambahan sinkron Blogger). Kalau belum pernah sama sekali:

```bash
cd cmto/admin-worker
npm install
npx wrangler login

npm run kv:seen          # buat KV namespace SEEN, salin id-nya ke wrangler.toml
# edit wrangler.toml: isi ADMIN_CHAT_IDS, BLOG_URL, BLOGGER_BLOG_ID

npm run secrets          # isi ADMIN_TOKEN, GITHUB_TOKEN, TELEGRAM_BOT_TOKEN, WEBHOOK_SECRET, IG_ACCESS_TOKEN
npm run secrets:blogger  # opsional sekarang: BLOGGER_CLIENT_ID, BLOGGER_CLIENT_SECRET, BLOGGER_REFRESH_TOKEN

npm run deploy
```

Detail tiap secret & cara dapatkannya (termasuk setup Blogger API yang agak panjang) ada di `cmto/admin-worker/README.md`.

Setelah `npm run deploy`, terminal akan menampilkan URL worker, formatnya:
```
https://cmto-admin.<nama-akun-cloudflare-kamu>.workers.dev
```
**Catat URL ini** — dipakai untuk 2 hal di bawah.

### Pasang webhook Telegram (sekali saja, atau tiap ganti token/URL)
Buka URL ini di browser (ganti bagian `<...>`):
```
https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=<URL_WORKER>/telegram&secret_token=<WEBHOOK_SECRET>
```
Harus muncul `{"ok":true,"result":true,...}`.

---

## 4. Akses dashboard admin (web)

1. Buka URL worker kamu langsung di browser (bagian depan, tanpa `/telegram` dll):
   ```
   https://cmto-admin.<nama-akun-cloudflare-kamu>.workers.dev/
   ```
2. Akan muncul form login dengan field **"Token admin"**.
3. Masukkan nilai `ADMIN_TOKEN` yang kamu isi waktu `npm run secrets` dulu (password bebas yang kamu buat sendiri — bukan dari Telegram/GitHub). Kalau lupa nilainya, tidak bisa dilihat ulang dari Cloudflare; harus di-set ulang: `npx wrangler secret put ADMIN_TOKEN` lalu `npm run deploy`.
4. Dari dashboard ini kamu bisa lihat/edit/hapus/tambah produk langsung lewat UI (alternatif selain perintah Telegram), dan perubahannya otomatis ikut sinkron ke Blogger (kalau secret Blogger sudah disetel).

---

## 5. Ganti token Telegram

Dua skenario:

### A. Bot-nya tetap sama, token-nya dibuat ulang (misal karena token lama bocor)
1. Chat **@BotFather** di Telegram → `/mybots` → pilih bot kamu → **API Token** → **Revoke current token** (token lama langsung mati).
2. BotFather kasih token baru.
3. Di terminal, folder `admin-worker`:
   ```bash
   npx wrangler secret put TELEGRAM_BOT_TOKEN
   ```
   Paste token baru saat diminta.
4. `npm run deploy` (supaya worker pakai secret terbaru — biasanya secret langsung aktif tanpa deploy ulang, tapi aman untuk deploy ulang jaga-jaga).
5. **Pasang ulang webhook** dengan token baru (lihat perintah di bagian 3 di atas) — ini **wajib**, kalau tidak bot tidak akan terima pesan sama sekali walau token sudah diganti.

### B. Pindah ke bot Telegram yang sama sekali baru
Sama seperti A, tapi token didapat dari bot baru yang kamu buat lewat `/newbot` ke @BotFather, bukan dari bot lama. Langkah 3–5 sama persis.

### Cek token sedang aktif
Tidak ada cara melihat isi secret dari Cloudflare (memang didesain begitu untuk keamanan). Untuk tes apakah token & webhook sudah benar:
```
https://api.telegram.org/bot<TOKEN>/getWebhookInfo
```
Field `"url"` harus menunjuk ke `<URL_WORKER>/telegram` milikmu.

---

## Referensi cepat semua secret

| Secret | Didapat dari | Dipakai untuk |
|---|---|---|
| `ADMIN_TOKEN` | Buat sendiri (password bebas) | Login dashboard web |
| `GITHUB_TOKEN` | GitHub → fine-grained token, akses repo `woodroker/cmto`, Contents: Read & write | Worker commit `products.json` |
| `TELEGRAM_BOT_TOKEN` | @BotFather di Telegram | Bot Telegram |
| `WEBHOOK_SECRET` | Buat sendiri (string acak) | Verifikasi webhook Telegram |
| `IG_ACCESS_TOKEN` | Meta for Developers (Graph API) | Auto-sync Instagram → Karya |
| `BLOGGER_CLIENT_ID` / `BLOGGER_CLIENT_SECRET` / `BLOGGER_REFRESH_TOKEN` | Google Cloud Console + OAuth Playground (lihat `admin-worker/README.md`) | Sinkron 1 postingan Blogger per karya |

Ganti isi salah satu: `npx wrangler secret put NAMA_SECRET` dari folder `admin-worker`, lalu `npm run deploy`.

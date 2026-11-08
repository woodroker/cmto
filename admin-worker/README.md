# CMTO Admin: Dashboard + Bot Telegram

Satu Cloudflare Worker yang:
- melayani dashboard edit katalog di `/`
- menyediakan API `/api/products` (dilindungi token)
- menerima perintah Telegram di `/telegram`

Setiap penyimpanan menulis `data/products.json` ke repo `woodroker/cmto` (branch `main`), lalu meminta purge cache jsDelivr. Situs membaca data dari `@main` (lihat `CONFIG.dataCdn`), jadi perubahan tampil dalam beberapa menit.

## 1. Siapkan kredensial
- **Token bot Telegram**: buat/pakai bot yang sudah ada lewat @BotFather.
- **GitHub token**: fine-grained PAT, akses hanya repo `woodroker/cmto`, izin *Contents: Read and write*.
- **Token admin**: string acak panjang untuk login dashboard.
- **Webhook secret**: string acak untuk memverifikasi pesan Telegram.
- **Chat ID Telegram** Anda: kirim pesan ke bot lalu buka `https://api.telegram.org/bot<TOKEN>/getUpdates`, ambil `chat.id`. Isi di `ADMIN_CHAT_IDS` (`wrangler.toml`, pisah koma untuk lebih dari satu).

## 2. Deploy
```bash
cd admin-worker
npm install
npx wrangler login

# Buat KV namespace SEEN, lalu isi id-nya ke wrangler.toml
npm run kv:seen

# Set semua secret (akan tanya nilai satu per satu)
npm run secrets
# atau satu per satu:
# npx wrangler secret put ADMIN_TOKEN
# npx wrangler secret put GITHUB_TOKEN
# npx wrangler secret put TELEGRAM_BOT_TOKEN
# npx wrangler secret put WEBHOOK_SECRET
# npx wrangler secret put IG_ACCESS_TOKEN

npm run deploy
```

## 3. Pasang webhook Telegram
Ganti `<URL_WORKER>`, `<TOKEN>`, dan `<WEBHOOK_SECRET>`:
```
https://api.telegram.org/bot<TOKEN>/setWebhook?url=<URL_WORKER>/telegram&secret_token=<WEBHOOK_SECRET>
```

## Perintah bot
| Perintah | Fungsi |
|---|---|
| `/daftar` | daftar semua karya |
| `/lihat <id>` | detail satu karya |
| `/ubah <id> <field> <nilai>` | field: nama, kategori, deskripsi, harga, beli, gambar, tautan, spesifikasi |
| `/tambah <id> \| nama \| kategori \| deskripsi \| harga \| link gambar` | tambah karya |
| `/hapus <id> ya` | hapus karya |

## Sinkron Instagram → Karya
Cron tiap 30 menit cek postingan baru dari akun IG Business:
- **Caption mengandung "WhatsApp: +62 878 47644244"** → otomatis ditambahkan ke katalog (kategori default "Dari Instagram", harga "Tanya harga"), lalu admin dapat notifikasi hasilnya. Lengkapi kategori/harga via `/ubah` kalau perlu.
- **Caption lain** → tetap seperti sebelumnya: admin dapat notifikasi berisi draft perintah `/tambah` untuk dikonfirmasi manual.
- Run pertama (`seeded`) hanya menandai postingan lama sebagai sudah dilihat, tidak memicu auto-tambah maupun notifikasi.

## Sinkron ke Blogger (SEO: 1 postingan per karya)
Tiap kali karya ditambah/diubah/dihapus (lewat `/tambah`, `/ubah`, `/hapus`, atau auto-tambah dari IG), worker juga bikin/update/hapus 1 postingan asli di Blogger — supaya tiap produk punya halaman HTML sendiri yang gampang diindex Google (lihat juga `template/blogger-template.xml`, bagian `pageType == "item"`).

**Opsional** — kalau 3 secret di bawah belum disetel, fitur ini otomatis dilewati (diam, tidak error), sisanya (Telegram, katalog, IG) tetap jalan normal.

### Cara setup
1. **Isi `wrangler.toml`**: ganti `BLOG_URL` (URL blog kamu, pakai domain custom kalau sudah pasang) dan `BLOGGER_BLOG_ID`.
   - Blog ID: buka dashboard Blogger → pilih blog kamu → lihat URL address bar, formatnya `blogger.com/blog/posts/<BLOG_ID>` atau ada di `blogger.com/blog/.../<BLOG_ID>/...`.
2. **Aktifkan Blogger API** di [Google Cloud Console](https://console.cloud.google.com/):
   - Buat project baru (atau pakai yang ada) → menu *APIs & Services → Library* → cari **Blogger API v3** → Enable.
3. **Buat OAuth Client ID**:
   - *APIs & Services → Credentials → Create Credentials → OAuth client ID*.
   - Jika diminta, setup dulu *OAuth consent screen* (pilih **External**, isi nama app seadanya, tambahkan akun Google kamu sendiri di bagian *Test users* — tidak perlu publish/verifikasi).
   - Application type: **Desktop app**. Setelah dibuat, catat **Client ID** dan **Client Secret**.
4. **Dapatkan Refresh Token** (sekali saja, pakai OAuth Playground):
   - Buka [Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground).
   - Klik ikon gerigi ⚙️ di kanan atas → centang **Use your own OAuth credentials** → isi Client ID & Client Secret dari langkah 3.
   - Di kolom kiri "Step 1", scroll/cari lalu isi manual: `https://www.googleapis.com/auth/blogger` → Authorize APIs.
   - Login pakai akun Google yang punya akses ke blog-nya → izinkan.
   - Di "Step 2", klik **Exchange authorization code for tokens** → catat **Refresh token** yang muncul (hanya muncul sekali, simpan baik-baik).
5. **Set secret**: `npm run secrets:blogger` (akan tanya `BLOGGER_CLIENT_ID`, `BLOGGER_CLIENT_SECRET`, `BLOGGER_REFRESH_TOKEN` satu per satu).
6. `npm run deploy` lagi supaya `BLOG_URL`/`BLOGGER_BLOG_ID` di `wrangler.toml` ikut ter-upload.
7. Tes: `/ubah <id-produk-yang-sudah-ada> harga <angka>` lewat Telegram → cek apakah muncul postingan baru/ter-update di dashboard Blogger.

Sinkron ini jalan dari semua jalur: Telegram (`/tambah`, `/ubah`, `/hapus`), auto-tambah IG, **dan** simpan dari dashboard web (hanya item yang berubah/baru/dihapus yang disinkron, bukan semua item tiap kali save).

### Keterbatasan saat ini
- Kategori/label produk dipakai sebagai label Blogger post juga.
- Kalau post-nya dihapus manual langsung dari Blogger, worker akan otomatis bikin post baru lagi saat produk itu di-`/ubah` berikutnya (mapping lama tidak dipakai ulang).

## Catatan
- Gambar harus link `https`. Untuk Dropbox pakai link share dengan `?raw=1`.
- Hanya field yang dikenal yang disimpan. Field lain di `products.json` akan terbuang saat data ditulis ulang.
- Dashboard menyimpan token di `sessionStorage` (hilang saat tab ditutup).
- Untuk mengganti domain dashboard, pasang custom domain di Cloudflare untuk worker ini.

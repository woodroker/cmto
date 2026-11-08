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

## Catatan
- Gambar harus link `https`. Untuk Dropbox pakai link share dengan `?raw=1`.
- Hanya field yang dikenal yang disimpan. Field lain di `products.json` akan terbuang saat data ditulis ulang.
- Dashboard menyimpan token di `sessionStorage` (hilang saat tab ditutup).
- Untuk mengganti domain dashboard, pasang custom domain di Cloudflare untuk worker ini.

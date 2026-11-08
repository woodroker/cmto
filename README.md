# CMTO Hybrid Modular App
Blogger (tampilan) + GitHub (kode & data) + jsDelivr (CDN).

## Tampilan: "Pengrajin Kayu" (template/blogger-template.xml)
Homepage sekarang pakai template "Pengrajin Kayu" — 1 file XML mandiri (CSS & JS inline, tidak lagi bergantung `css/app.css`/Tailwind/`main.js`). Bagian "Karya pilihan" di homepage mengambil data langsung dari `data/products.json` lewat jsDelivr, jadi otomatis ikut ter-update tiap kali bot Telegram atau auto-sync IG mengubah katalog.

Ilustrasi hero (lingkaran tahun kayu) & ilustrasi Tentang (gambar kerja pintu) pakai animasi Lottie, filenya di `lottie/rings.json` dan `lottie/door.json` — bisa diganti kapan saja (desain ulang di After Effects + plugin Bodymovin, atau cari di lottiefiles.com) tanpa perlu sentuh XML-nya sama sekali, asal nama file & lokasinya tetap sama.

Halaman 1 produk (hasil auto-post bot ke Blogger, lihat `admin-worker/README.md` bagian "Sinkron ke Blogger") pakai HTML asli Blogger (bukan JS) — bagus untuk SEO.

`main.js`/`css/app.css`/Tailwind (folder `src/`, `styles/`) sekarang **tidak dipakai** oleh template ini — itu peninggalan versi SPA sebelumnya. Boleh dibiarkan kalau suatu saat mau dibuatkan halaman katalog lengkap terpisah (grid semua produk + filter), atau dihapus kalau tidak akan dipakai.

## Pasang
1. Buat repo `woodroker/cmto`, upload semua isi folder ini (termasuk `.github`), branch `main`.
2. Blogger > Tema > Edit HTML (cadangkan tema lama dulu), ganti isi dengan `template/blogger-template.xml`.
3. Pastikan `lottie/rings.json` dan `lottie/door.json` ada di repo (branch `main`) — kalau belum ter-push, ilustrasi tidak akan muncul (tapi situs tetap jalan normal, cuma tanpa animasi).

## Update produk
Edit `data/products.json` (id, name, category, desc, price, buy, image, specs, link) — langsung tampil di homepage lewat `@main` (tidak perlu rilis tag).
Purge cache manual kalau perlu: `https://purge.jsdelivr.net/gh/woodroker/cmto@main/data/products.json`.

## Data Dropbox
- Gambar: pakai link share Dropbox dengan `?raw=1` di tag img.
- JSON: fetch langsung dari Dropbox sering terblokir CORS. Salin file ke `data/` di GitHub (bisa otomatis lewat GitHub Action).

## Dashboard & bot Telegram
Lihat `admin-worker/README.md`. Bot dan dashboard mengedit `data/products.json` langsung, sehingga tidak perlu rilis tag baru.

## Tahap berikut
Tambah `data/products.xml`, GitHub Action untuk sinkron Dropbox, dan rilis otomatis.

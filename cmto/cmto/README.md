# CMTO Hybrid Modular App
Blogger (tampilan) + GitHub (kode & data) + jsDelivr (CDN) + ES Modules.

## Pasang
1. Buat repo `woodroker/cmto`, upload semua isi folder ini (termasuk `.github`), branch `main`.
2. Tunggu GitHub Action `build-css` selesai (tab Actions). Ia membuat `css/app.css` dari Tailwind dan commit otomatis.
3. Buat Release/tag `v1.0.0` setelah langkah 2.
4. Blogger > Tema > Edit HTML (cadangkan tema lama), ganti isi dengan `template/blogger-template.xml`.

## Update produk
Edit `data/products.json` (id, name, category, desc, price, buy, image, specs, link), rilis tag baru, ganti `@v1.0.0` di template.
Untuk @main, purge: `https://purge.jsdelivr.net/gh/woodroker/cmto@main/data/products.json`.
Halaman detail produk ada di `#/produk/<id>`.

## Data Dropbox
- Gambar: pakai link share Dropbox dengan `?raw=1` di tag img.
- JSON: fetch langsung dari Dropbox sering terblokir CORS. Salin file ke `data/` di GitHub (bisa otomatis lewat GitHub Action).

## Dashboard & bot Telegram
Lihat `admin-worker/README.md`. Bot dan dashboard mengedit `data/products.json` langsung, sehingga tidak perlu rilis tag baru.

## Tahap berikut
Tambah `data/products.xml`, GitHub Action untuk sinkron Dropbox, dan rilis otomatis.

# Catatan keputusan

Format: tanggal · keputusan · alasan · alternatif yang ditolak. Terbaru di atas.

## 2026-11-04 · Rilis otomatis setelah PR di-merge

- **Keputusan:** workflow `release.yml` menaikkan versi dari versi terakhir, memperbarui changelog, lalu membuat tag dan GitHub Release setelah merge. Bawaannya patch, label PR `minor` atau `major` mengubahnya. Kalau `[Unreleased]` kosong, nggak ada rilis. Push ke `main` memakai deploy key yang diberi bypass di ruleset.
- **Alasan:** `GITHUB_TOKEN` nggak bisa melewati aturan `main`. Deploy key cukup untuk satu repo, nggak perlu token akun.
- **Ditolak:** bump di dalam PR sebelum merge (push dari `GITHUB_TOKEN` nggak memicu CI, jadi check wajib nggak pernah jalan di commit barunya); PR rilis otomatis seperti release-please (rilis jadi butuh merge kedua).
- **Risiko:** deploy key bisa melewati aturan `main`, jadi private key-nya cuma boleh ada di secret GitHub.

## 2026-11-04 · Hosting statis di Cloudflare Pages, fase non-komersial

- **Keputusan:** fase ini non-komersial dan di-deploy sebagai file statis (`output: "export"`) ke Cloudflare Pages. Merge ke `main` jadi production, tiap PR dapat URL preview. Fitur server (M7 dan M8) dan versi komersial akan memakai hosting dan arsitektur yang ditinjau ulang.
- **Alasan:** kuota request akun Vercel pemilik sudah banyak terpakai untuk proyek lain, dan melewati batasnya bisa menghentikan semua proyek di akun itu. Halaman batasan Cloudflare Pages nggak menyebut batas request file statis, dan alamat `pages.dev` nggak butuh `basePath`.
- **Ditolak:** Vercel Hobby (berbagi kuota dengan proyek lain); Netlify Free (300 kredit per bulan, tiap deploy production 15 kredit); GitHub Pages (perlu `basePath`, nggak ada preview bawaan).
- **Catatan:** E2E di CI menyajikan `out/` dengan `python3 -m http.server`, karena `next start` nggak jalan dengan `output: "export"`. `cacheComponents` dan `partialPrefetching` dihapus karena memakai PPR, yang ditolak Next di mode ekspor statis. Proyek ini nggak memakai `"use cache"`.

## 2026-11-04 · Script rilis sendiri, terinspirasi Cider

- **Keputusan:** `npm run log` dan `npm run bump` lewat `scripts/release.mjs`, tanpa dependency. Script cuma mengubah file, sedangkan commit dan tag tetap manual karena `main` harus lewat PR. Bisa dipindah jadi paket npm kalau sudah terbukti berguna.
- **Alasan:** cuma butuh dua perintah. Script nggak memakai `child_process` atau `eval`, nama file-nya tetap, dan teks catatan ditulis sebagai teks biasa.
- **Ditolak:** `release-it` (nggak punya perintah `log`, menambah dependency); `npm version` saja (nggak mengubah changelog).

## 2026-11-04 · CI lewat GitHub Actions, `main` cuma lewat PR

- **Keputusan:** dua job wajib lolos sebelum merge: lint, types, unit, build, dan E2E terhadap build production. Aturan `main` disimpan di `.github/rulesets/main.json`. PR nggak wajib di-approve orang lain.
- **Alasan:** E2E di production lebih dekat dengan yang dipakai pengunjung daripada `next dev`. Aturan disimpan sebagai file biar bisa ditinjau dan dipasang ulang. GitHub nggak mengizinkan penulis PR meng-approve PR sendiri, jadi approval wajib akan memblokir pengembang tunggal.
- **Ditolak:** satu job untuk semua (gagal cepat lebih susah dibaca, E2E butuh browser yang berat).
- **Tambahan:** check `Version` memastikan versi di `package.json`, lockfile, dan changelog sama, dan nggak lebih rendah dari `main`. Versi nggak wajib naik di tiap PR, karena nggak semua PR adalah rilis.

## 2026-11-03 · Efek suara dengan Web Audio

- **Keputusan:** bunyi countdown, jepret, dan hasil dibuat dengan oscillator Web Audio. Nada disimpan sebagai data murni di `lib/sound/notes.ts`, pemutarnya di `lib/sound/player.ts`, dan pilihan bisu disimpan di localStorage.
- **Alasan:** tanpa file audio dan dependency, jadi nggak ada urusan lisensi dan booth tetap jalan offline. Browser cuma mengizinkan audio setelah klik, jadi audio dibuka di handler tombol.
- **Ditolak:** file MP3 (perlu aset berlisensi dan bikin halaman lebih berat).

## 2026-11-03 · Berbagi dan email tanpa server

- **Keputusan:** tombol Bagikan pakai Web Share dengan file, cadangannya unduh. Tombol Kirim email pakai share sheet di HP; di desktop fotonya diunduh lalu `mailto:` dibuka dan pengguna melampirkan sendiri.
- **Alasan:** foto tetap nggak keluar dari perangkat kecuali atas aksi pengguna, dan belum butuh backend. `mailto:` memang nggak bisa membawa lampiran.
- **Ditolak:** kirim email otomatis ke alamat yang diisi pengunjung (butuh upload foto ke server dan layanan email berbayar, jadi menunggu M7).

## 2026-11-03 · Bentuk foto, motif, dan kategori acara

- **Keputusan:** `Template` punya `pattern`, `photo.shape`, dan `photo.outline`, semuanya punya default di schema. Bentuk ditelusuri `traceShape` di `lib/render/shapes.ts`. Slot boleh 2 foto (layout Duo). Kategori `acara` ditambahkan untuk frame tema. Font print di-resolve lewat `input.fonts` karena `next/font` mengganti nama font.
- **Alasan:** default menjaga frame custom lama di localStorage tetap valid. `traceShape` dipakai clip, garis tepi, motif, dan contoh di editor, jadi bentuknya nggak mungkin beda antar tampilan.
- **Ditolak:** gambar PNG mask per bentuk (butuh muat aset dan repot di export); bentuk per slot (belum dibutuhkan, bisa ditambah nanti).

## 2026-11-03 · Editor frame di halaman booth, sumber foto per slot

- **Keputusan:** editor frame dan karakter dibuka dari halaman booth, bukan `/admin` seperti di PRD. Tiap slot bisa diisi kamera atau gambar dari device, jadi fallback saat kamera ditolak pakai jalur yang sama dan event `UPLOADED` serta `fillSlots` dihapus. `Layer` punya field `aspect` tambahan.
- **Alasan:** permintaan pemilik produk. `aspect` disimpan supaya hit test tetap fungsi murni tanpa perlu memuat gambar.
- **Ditolak:** `/admin` terpisah (pengunjung nggak bisa bikin frame sendiri); pilihan sumber per sesi (nggak bisa campur).
- **Risiko:** siapa pun yang membuka booth bisa mengubah frame custom di perangkat itu. Perlu dibatasi sebelum mode kiosk (M7). Frame tersimpan di localStorage, jadi nggak pindah antar perangkat.

## 2026-11-03 · Tiap pose dijepret dengan klik

- **Keputusan:** sesi kamera punya fase `ready`: preview kamera tampil, pengunjung klik Jepret, countdown 3 detik, foto masuk ke slot, lalu nunggu klik lagi. `renderPrint` nggak lagi mengisi slot kosong dengan foto terakhir; pengisian itu pindah ke `fillSlots` khusus upload.
- **Alasan:** pengunjung bisa mengatur pose sambil melihat kamera dan melihat frame terisi satu per satu.
- **Ditolak:** countdown otomatis antar pose (pengunjung nggak punya waktu atur pose).

## 2026-11-03 · Binding `rolldown` dicantumkan eksplisit

- **Keputusan:** kelima belas `@rolldown/binding-*` dan `fsevents` masuk `optionalDependencies`, versinya dikunci sama dengan yang dibutuhkan `rolldown` dan `vite`. Awalnya cuma Windows dan Linux x64, tapi `npm ci` di CI menolak lockfile yang nggak punya binding lainnya.
- **Alasan:** selama `@playwright/test` ada di `package.json`, instal bersih menghilangkan binding ini dari lockfile dan Vitest gagal start. Mekanisme pastinya di dalam npm belum diketahui.
- **Ditolak:** membuat ulang lockfile (sudah dicoba, binding tetap hilang); `npm install --no-save` (hilang lagi setelah instal ulang).
- **Catatan:** kalau `rolldown` naik versi, semua binding ini harus ikut dinaikkan, lalu cek dengan `npm ci --dry-run`.

## 2026-11-03 · Struktur folder tanpa `src/`

- **Keputusan:** `app/`, `components/`, dan `lib/` tetap di root proyek.
- **Alasan:** kode yang sudah ada tidak perlu dipindah.
- **Ditolak:** memindahkan semuanya ke `src/`.

## 2026-11-03 · Template sebagai JSON + satu renderer

- **Keputusan:** semua tampilan print berasal dari `Template` (JSON, koordinat 0..1) yang digambar oleh satu fungsi murni `renderPrint`.
- **Alasan:** preview, thumbnail, editor, dan export dijamin sama; renderer bisa dites di Node dengan mock context; template bisa disimpan di localStorage/DB tanpa kode.
- **Ditolak:** menggambar langsung di komponen (sulit dites, gampang beda antar tampilan); state Konva sebagai sumber data (mengikat format data ke library).

## 2026-11-03 · Alur booth sebagai reducer

- **Keputusan:** fase booth (idle, countdown, capturing, review) diatur `boothReducer` murni; timer dan kamera tinggal di komponen.
- **Alasan:** semua transisi bisa dites tanpa browser; event di fase yang salah otomatis diabaikan.
- **Ditolak:** beberapa `useState` boolean (rawan kombinasi state yang mustahil); XState (terlalu berat untuk 4 fase).

## 2026-11-03 · Remove background pakai MediaPipe di browser

- **Keputusan:** `@mediapipe/tasks-vision` ImageSegmenter, model selfie multiclass, di-host sendiri, jalan di Web Worker.
- **Alasan:** gratis, Apache 2.0 (aman komersial), foto tidak keluar dari perangkat.
- **Ditolak:** @imgly/background-removal (AGPL), remove.bg (berbayar setelah kuota), rembg (butuh server Python).

## 2026-11-03 · Next.js (App Router)

- **Keputusan:** Next.js + TypeScript strict, Vitest, Playwright.
- **Alasan:** ekosistem React (react-konva, contoh MediaPipe), API route untuk upload/QR/webhook nanti.
- **Ditolak:** Nuxt (setara, tapi ekosistem editor canvas lebih kecil).

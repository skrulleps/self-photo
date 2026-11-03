# Catatan keputusan

Format: tanggal · keputusan · alasan · alternatif yang ditolak. Terbaru di atas.

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

---
name: canvas-render
description: Gunakan saat mengubah renderPrint, geometry.ts, layer, watermark, overlay, atau apa pun yang memengaruhi cara print digambar ke canvas.
---

# Aturan mengubah renderer

`renderPrint(ctx, input)` adalah satu-satunya fungsi yang menggambar print. Preview, thumbnail, editor, dan export bergantung padanya, jadi perubahan di sini berdampak ke semua tempat.

## Prinsip

- **Deterministik:** input sama → pixel sama. Tanpa `Date.now()`, `Math.random()`, atau state global di dalam render.
- **Hanya pakai `Ctx2D`:** tipe sempit di `render.ts`. Kalau butuh method context baru, tambahkan ke tipe `Ctx2D` dan ke mock di `tests/unit/render.test.ts`.
- **Gambar tidak pernah di-load di dalam render.** Gambar datang lewat `input.images(src)`. Kalau belum siap, kembalikan `undefined` dan render melewatinya. Komponen yang memanggil render ulang saat gambar selesai dimuat.
- **Urutan lapisan tetap:** background → foto latar + tint → motif → foto di slot → teks → layer → watermark → overlay PNG. Jangan mengubah urutan tanpa catatan di `docs/decisions.md`.
- **Selalu `save()`/`restore()`** di sekitar perubahan `globalAlpha`, `filter`, transform, atau clip.
- **Elemen khusus editor** (outline seleksi, handle) hanya digambar kalau `selectedLayer` diberikan. Export tidak pernah mengirim `selectedLayer`.

## Geometri

- Semua perhitungan posisi ada di `geometry.ts` sebagai fungsi murni dengan test.
- Foto ke slot: `coverCrop()` (crop tengah, tanpa distorsi).
- Pointer ke canvas: `clientToCanvas()`. Hitung dari content box (kurangi border).
- Hit test layer: `hitTestLayers()`, dari atas ke bawah, sadar rotasi.
- Ukuran font: `fitFontSize()`.

## Jebakan yang sudah diketahui

- Font belum dimuat → canvas memakai fallback diam-diam. Panggil `document.fonts.load()` atau render ulang setelah `document.fonts.ready`.
- `ctx.filter` tidak bisa diandalkan di Safari. Fitur yang bergantung padanya butuh fallback manipulasi pixel.
- Gambar dari domain lain tanpa CORS membuat canvas "tainted" dan `toBlob` gagal. Aset harus dari origin sendiri, `data:`, atau `blob:`.
- `roundRect` belum ada di browser lama: render sudah fallback ke `rect`, jangan dihapus.

## Wajib setelah mengubah

1. Tambah atau perbarui test di `tests/unit/render.test.ts` atau `geometry.test.ts`.
2. `npx tsc --noEmit && npm test`.
3. Cek visual di `npm run dev` untuk setiap layout (strip, grid, 1 foto).

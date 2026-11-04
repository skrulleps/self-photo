# Studio Jepret

Web photo booth komersial. Pengunjung pilih frame, jepret 1–4 foto, simpan/share hasilnya. Pemilik bikin template sendiri (warna, foto latar, karakter, overlay PNG). Detail produk dan milestone: lihat `docs/PRD.md`.

Aturan Next.js versi ini: @AGENTS.md

## Perintah

```bash
npm run dev        # http://localhost:3000, tambah ?fast=1 buat countdown cepat
npm test           # vitest run (unit)
npm run test:e2e   # playwright (kamera palsu Chromium)
npx tsc --noEmit   # typecheck
npm run log added "isi catatan"   # tambah catatan ke [Unreleased] di CHANGELOG.md
npm run bump minor                # naikkan versi: major, minor, atau patch
```

Sebelum bilang tugas selesai: `npx tsc --noEmit` dan `npm test` harus bersih. Kalau menyentuh alur pengunjung, jalankan juga e2e.

## Arsitektur (wajib dipatuhi)

- **Satu sumber kebenaran:** tampilan print = `Template` (JSON) → `renderPrint()`. Preview, thumbnail, editor, dan export memanggil fungsi yang sama. Jangan pernah menggambar print di tempat lain atau menduplikasi logika gambar.
- **Koordinat ternormalisasi 0..1** di semua data template (slot, textArea, layer). Konversi ke pixel hanya lewat `toPx()` di saat render.
- **Pemisahan lapisan:**
  - `app/` → routing saja, tipis.
  - `components/` → UI (`"use client"`), tanpa matematika geometri.
  - `lib/template|render|booth`, `lib/segment/mask.ts` → **murni**: tanpa React, tanpa DOM, tanpa `window`. Wajib ada unit test.
  - `lib/camera|export`, `lib/segment/segmenter.ts` → akses browser, setipis mungkin.
  - `app/api/` → server (upload, QR, webhook, render tanpa watermark).
- **Alur booth = reducer** (`lib/booth/machine.ts`). Timer dan kamera di komponen, keputusan "langkah berikutnya" di reducer. Jangan pakai banyak `useState` boolean untuk fase.
- Data template dari luar (editor, localStorage, DB, impor) selalu lewat `parseTemplate()` / `safeParseTemplate()`.

## Konvensi kode

- TypeScript strict. Tanpa `any` di `lib/`. Pakai `unknown` + validasi.
- Fungsi murni menerima data, mengembalikan data. Tidak membaca state global.
- Nama file: `camelCase.ts` untuk lib, `PascalCase.tsx` untuk komponen.
- Import pakai alias `@/`.
- Komponen yang menyentuh `navigator`, `window`, canvas, atau `<video>` harus `"use client"` dan mengaksesnya hanya di effect atau handler.
- `<video>` kamera: selalu `playsInline muted`. Jangan unmount saat kamera nyala (pakai `hidden`), supaya ref tidak hilang.
- Kamera selalu dimatikan (`track.stop()`) setelah sesi dan saat unmount.
- Teks UI dalam Bahasa Indonesia santai, singkat, tanpa emoji. Pesan error menyebut apa yang salah dan apa yang harus dilakukan.

## Hal yang tidak boleh

- Jangan menambah dependency tanpa alasan jelas. Cek lisensi: aman komersial (MIT, Apache 2.0, BSD). Hindari AGPL/GPL.
- Jangan memakai karakter, logo, atau aset berhak cipta pihak lain sebagai aset bawaan.
- Jangan mengunggah foto pengguna ke server mana pun kecuali di fitur yang memang untuk itu (M7) dan atas aksi pengguna.
- Jangan memuat model AI atau WASM dari CDN pihak ketiga di produksi. Self-host di `public/`.
- Jangan menaruh logika watermark/pembayaran yang bisa di-bypass di client. Versi tanpa watermark hanya dirender di server.
- Jangan mengubah bentuk `Template` tanpa memperbarui `types.ts`, `schema.ts`, preset, dan test sekaligus.

## Testing

- Unit test di `tests/unit/`, satu file per modul `lib/`. Pakai mock context untuk `renderPrint` (lihat `tests/unit/render.test.ts`).
- E2E di `tests/e2e/`, pakai `?fast=1`.
- Bug yang diperbaiki → tambahkan test yang mereproduksinya dulu.
- Angka desimal → `toBeCloseTo`, bukan `toBe`.

## Skill yang tersedia

- `add-template`: menambah atau mengubah preset template.
- `canvas-render`: aturan saat mengubah `renderPrint` atau geometri.
- `write-tests`: pola test unit dan e2e proyek ini.
- `milestone`: alur mengerjakan satu milestone dari PRD sampai selesai.

## Catatan keputusan

Keputusan arsitektur dicatat di `docs/decisions.md` (format singkat: tanggal, keputusan, alasan, alternatif yang ditolak). Baca sebelum mengusulkan perubahan besar.

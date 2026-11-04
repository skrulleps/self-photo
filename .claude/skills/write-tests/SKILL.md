---
name: write-tests
description: Gunakan saat menulis atau memperbaiki unit test (Vitest) atau e2e test (Playwright) di Studio Jepret, termasuk saat memperbaiki bug.
---

# Pola testing proyek ini

## Apa dites di mana

| Kode | Jenis test | Lokasi |
| --- | --- | --- |
| `lib/template`, `render`, `booth`, `segment/mask.ts` | Unit (Node) | `tests/unit/<modul>.test.ts` |
| Komponen, kamera, simpan/share, alur lengkap | E2E | `tests/e2e/*.spec.ts` |
| Tampilan print per template | Visual regression | `toHaveScreenshot()` di e2e |

Jangan menulis unit test untuk komponen React yang hanya menyusun UI. Uji perilakunya lewat e2e.

## Unit test

- Satu `describe` per fungsi, nama test berupa kalimat perilaku: `"motong kiri-kanan foto landscape ke slot kotak"`.
- Angka desimal: `toBeCloseTo`.
- Reducer: susun event dengan helper `run(events)` lalu cek state akhir. Uji juga event yang datang di fase yang salah.
- Renderer: pakai mock context yang mencatat panggilan (`mockCtx()` di `render.test.ts`). Cek argumen `drawImage`/`fillText`, bukan pixel.
- Tiap test berdiri sendiri. Tanpa urutan, tanpa state bersama.
- Bug: tulis test yang gagal dulu, baru perbaiki.

## E2E

- Selalu buka halaman dengan `?fast=1` agar countdown cepat.
- Kamera palsu sudah diatur di `playwright.config.ts` (`--use-fake-device-for-media-stream`).
- Cari elemen dengan role atau label (`getByRole`, `getByLabel`), `data-testid` hanya untuk canvas atau elemen tanpa role.
- Jangan pakai `waitForTimeout`. Tunggu kondisi: `expect(...).toBeVisible({ timeout })`.
- Cek canvas tidak kosong dengan membaca beberapa pixel lewat `evaluate`.
- Skenario wajib per fitur: jalur sukses, izin/aksi ditolak, dan ulangi/reset.

## Sebelum selesai

```bash
npx tsc --noEmit && npm test
npm run test:e2e   # kalau menyentuh UI atau alur
```

Kalau ada test yang di-skip atau dilemahkan, tulis alasannya di komentar dan sebutkan ke user.

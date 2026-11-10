---
name: milestone
description: Gunakan saat user minta mengerjakan satu milestone atau fitur besar dari PRD Studio Jepret (misal "kerjain M4" atau "lanjut editor template").
---

# Mengerjakan satu milestone

User adalah software engineer yang ingin belajar sambil membangun. Jelaskan alasan di balik keputusan, bukan hanya kodenya.

## 1. Pahami dulu

- Baca bagian milestone itu di PRD: user story, checklist, dan kriteria "Selesai kalau".
- Baca `CLAUDE.md` dan `docs/decisions.md`.
- Lihat kode yang sudah ada di area yang akan disentuh.
- Kalau ada hal yang ambigu dan mahal kalau salah (bentuk data baru, dependency baru, perubahan arsitektur), tanyakan dulu.

## 2. Rencanakan

Tulis rencana singkat ke user sebelum menulis kode:
- File yang akan dibuat atau diubah.
- Perubahan bentuk data (kalau ada), termasuk dampaknya ke `types.ts`, `schema.ts`, dan preset.
- Test yang akan ditambahkan.
- Urutan kerja dalam langkah kecil yang masing-masing bisa dijalankan.

## 3. Kerjakan bertahap

- Mulai dari bagian murni di `lib/` beserta test-nya.
- Lalu sambungkan ke komponen.
- Setiap langkah harus meninggalkan proyek dalam keadaan jalan (`tsc` dan test hijau).
- Ikuti skill terkait: `canvas-render`, `add-template`, `write-tests`.

## 4. Verifikasi

- `npx tsc --noEmit && npm test`, plus `npm run test:e2e` kalau menyentuh UI.
- Cocokkan dengan setiap poin "Selesai kalau" di PRD. Sebutkan poin yang belum bisa diverifikasi (misal butuh iPhone asli).

## 5. Tutup

- Catat keputusan penting di `docs/decisions.md`.
- Ringkas ke user: apa yang jalan, apa yang belum, dan satu PR kecil yang bisa dia kerjakan sendiri untuk latihan.

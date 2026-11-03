---
name: add-template
description: Gunakan saat menambah atau mengubah preset template frame (layout, warna, motif, font, layer bawaan) di Studio Jepret.
---

# Menambah atau mengubah template

## Langkah

1. Baca `lib/template/types.ts` dan `schema.ts` untuk bentuk data terbaru.
2. Tentukan ukuran print:
   - Strip 3 foto: 600×1800 (2×6 inci @300 dpi)
   - Grid 2×2 dan 1 foto: 1200×1500
3. Tulis slot dalam pixel dulu, lalu konversi dengan helper `px()`/`norm()` di `presets.ts`. Jangan menulis angka desimal manual.
4. Aturan tata letak:
   - Margin luar minimal 40 px (strip) atau 50 px (grid).
   - Jarak antar slot sama di semua sisi.
   - Slot tidak boleh tumpang tindih dan tidak keluar area print.
   - `textArea` di bawah slot terakhir, tidak menimpa slot.
5. Warna format `#RRGGBB`. Pastikan warna teks kontras dengan background (target 4.5:1).
6. Font hanya dari daftar yang sudah dimuat di `layout.tsx`. Kalau butuh font baru, tambahkan di sana juga.
7. `id` template unik, huruf kecil, tanpa spasi. `category`: `romantis` atau `umum`.
8. Layer bawaan hanya boleh memakai aset orisinal di `public/characters/`.

## Verifikasi

- `npm test`: test schema otomatis memvalidasi semua preset dan mengecek slot tidak tumpang tindih.
- Buka `npm run dev`, pilih template baru, jepret, cek hasil export.
- Kalau ada visual regression test, perbarui snapshot hanya setelah melihat hasilnya benar: `npx playwright test --update-snapshots`.

## Contoh

```ts
{
  id: "langit",
  name: "Langit Sore",
  category: "romantis",
  size: STRIP,
  slots: [[40, 40, 520, 390], [40, 450, 520, 390], [40, 860, 520, 390]].map((r) => norm(STRIP, r)),
  textArea: norm(STRIP, [40, 1270, 520, 440]),
  background: { color: "#ffd9c2" },
  pattern: "none",
  photo: { radius: 20, filter: "none" },
  text: { font: "Fredoka", color: "#7a2e3b", title: "golden hour", subtitle: "" },
  layers: [],
}
```

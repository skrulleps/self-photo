# PRD Studio Jepret

Nov 3, 2026 · @Fadhlan

## Ringkasan

Studio Jepret adalah web photo booth komersial: pengunjung pilih frame (Romantis atau Umum), jepret 1–4 foto, dan dapat hasil cetak digital dengan watermark usaha. Pemilik bisa bikin dan ubah template sendiri, termasuk foto latar, karakter pemanis, dan frame PNG.

**Status per 3 Nov 2026:** milestone 1 dan 2 selesai di Next.js. Model template + `renderPrint`, kamera, countdown, jepret ke slot, dan test reducer sudah jalan.

**Tujuan versi 1.0**

- Pengunjung selesai dari buka web sampai simpan foto dalam kurang dari 90 detik.
- Pemilik bisa bikin template baru tanpa nyentuh kode.
- Siap dipakai di acara atau dijual tanpa bergantung layanan berbayar untuk fitur inti.

**Di luar lingkup 1.0:** cetak fisik ke printer, video/boomerang/GIF, filter AR wajah, aplikasi native.

## Pengguna & model bisnis

| Peran | Siapa | Butuhnya |
| --- | --- | --- |
| Pengunjung | Pasangan, teman, keluarga; umumnya pakai HP | Cepat, lucu, hasil bagus, gampang simpan atau share ke IG/WA |
| Pemilik (admin) | Lo dan staf booth | Bikin/ubah template, branding sendiri, lihat hasil, terima pembayaran |

**Keputusan terbuka: mode jualan.** Dua mode ini nentuin arsitektur fase 2 ke atas, jadi harus diputuskan sebelum milestone 6.

|  | Booth fisik (kiosk) | Web di HP pengunjung |
| --- | --- | --- |
| Perangkat | 1 tablet/laptop di lokasi | HP masing-masing pengunjung |
| Ambil hasil | QR di layar → unduh dari HP | Langsung simpan/share dari HP |
| Backend | Wajib (upload hasil + QR) | Opsional di awal |
| Monetisasi | Sewa per acara atau bayar per sesi di lokasi | Per download, template premium, atau hapus watermark |
| Mode khusus | Layar penuh, reset otomatis setelah idle | Tidak perlu |

Rekomendasi: bangun inti yang sama untuk dua-duanya (sudah begitu sekarang), lalu pilih satu mode untuk dirilis pertama.

## Lingkup fitur per milestone

Milestone 1–2 (kamera, jepret, render dasar) sudah selesai. Tiap milestone di bawah bisa dirilis sendiri dan punya kriteria selesai yang bisa dites.

### M3 · Alur pengunjung lengkap

*Sebagai pengunjung, saya mau pilih frame, isi teks, jepret, lalu simpan hasilnya.*

- [ ] Pemilih template: grid thumbnail dari `renderPrint` + foto contoh, filter Romantis/Umum
- [ ] Teks utama (maks 32 karakter) dan teks kecil (default tanggal hari ini), ukuran font menyesuaikan lebar
- [ ] Flash putih, label "Pose 1 dari 3", tombol Ulangi
- [ ] Simpan: Web Share dengan file di HP, unduh PNG di desktop
- [ ] Upload foto dari galeri sebagai cadangan kalau kamera ditolak

Selesai kalau: alur penuh tanpa reload di Chrome Android dan Safari iOS; hasil PNG 600×1800 atau 1200×1500; izin kamera ditolak menampilkan pesan dan opsi upload.

### M4 · Editor template (admin)

*Sebagai pemilik, saya mau bikin dan ubah template tanpa ngoding.*

- [ ] Halaman `/admin`: daftar template, duplikat, hapus, urutkan
- [ ] Ubah layout (strip 3, grid 2×2, 1 foto), warna, motif, font, radius sudut, filter, teks default
- [ ] Foto latar + slider tint; frame PNG overlay
- [ ] Nama usaha + logo sebagai watermark
- [ ] Preview langsung; semua perubahan divalidasi `templateSchema` sebelum disimpan
- [ ] Simpan di localStorage dulu, ekspor/impor JSON

Selesai kalau: template baru bisa dibuat, disimpan, dimuat ulang, dan dipakai pengunjung; JSON tidak valid ditolak dengan pesan jelas.

### M5 · Karakter & layer

*Sebagai pemilik, saya mau naruh karakter atau stiker di samping foto sebagai pemanis.*

- [ ] Karakter bawaan (orisinal) + upload PNG
- [ ] Geser, ubah ukuran, putar, balik arah, hapus, urutan atas-bawah
- [ ] Hit test sadar rotasi; outline seleksi tidak ikut ke hasil akhir
- [ ] Maksimal 12 layer per template

Selesai kalau: layer bisa diatur dengan mouse dan sentuhan; posisi tersimpan ternormalisasi dan tampil sama di semua resolusi.

### M6 · Foto pasangan otomatis terpotong

*Sebagai pengunjung, saya mau upload foto berdua dan langsung jadi stiker di frame.*

- [ ] MediaPipe `ImageSegmenter` (model selfie multiclass), WASM + model di-host sendiri
- [ ] Mask → alpha dengan feather, crop ke orangnya
- [ ] Jalan di Web Worker; indikator proses
- [ ] Hasil masuk sebagai layer yang bisa digeser

Selesai kalau: foto 12 MP diproses di bawah 3 detik di HP kelas menengah tanpa UI macet; foto tanpa orang menampilkan pesan, bukan error.

### M7 · Backend, galeri & QR

*Sebagai pengunjung booth fisik, saya mau scan QR buat ambil foto saya.*

- [ ] Supabase: tabel `templates`, `sessions`, storage untuk aset dan hasil
- [ ] Login admin; template pindah dari localStorage ke DB
- [ ] Upload hasil → URL unik → QR di layar
- [ ] Halaman unduh publik dengan masa berlaku (misal 7 hari)
- [ ] Mode kiosk: layar penuh, reset otomatis setelah 60 detik idle

Selesai kalau: QR bisa dibuka dari HP lain dan mengunduh file asli; link kedaluwarsa menampilkan pesan.

### M8 · Pembayaran

*Sebagai pemilik, saya mau dibayar per sesi atau per download.*

- [ ] Midtrans atau Xendit (QRIS)
- [ ] Versi tanpa watermark dirender di server setelah pembayaran terverifikasi lewat webhook
- [ ] Riwayat transaksi di admin

Selesai kalau: hasil tanpa watermark tidak bisa didapat tanpa pembayaran sukses, termasuk lewat DevTools.

## Model data & arsitektur

Satu aturan pegangan: **semua tampilan print berasal dari satu JSON template lewat satu fungsi, `renderPrint`.** Preview, thumbnail, editor, dan export memanggil fungsi yang sama, jadi hasilnya selalu konsisten.

```ts
interface Template {
  id: string; name: string; category: "romantis" | "umum" | "acara";
  size: { width: number; height: number }; // px, mis. 600x1800
  slots: Rect[];                            // ternormalisasi 0..1
  textArea: Rect;
  background: { color: string; image?: string; tint?: number };
  pattern: "none" | "dots" | "hearts" | "stars" | "stripes";
  photo: { radius: number; shape: "rounded" | "circle" | "heart" | "star" | "flower" | "arch" | "cloud"; outline: string; filter: string };
  text: { font: string; color: string; title: string; subtitle: string };
  layers: Layer[];                          // karakter, stiker, potongan foto
  overlay?: string;                         // PNG frame di paling atas
  brand?: { name: string; logo?: string };
}
interface Layer { id: string; src: string; x: number; y: number; scale: number; rot: number; flip: boolean; aspect: number }
```

Urutan gambar di `renderPrint`: background → foto latar + tint → motif → foto di slot → teks → layer → watermark → overlay PNG.

| Lapisan | Folder | Aturan |
| --- | --- | --- |
| Routing | `app/` | Tipis, cuma menyusun komponen |
| Tampilan | `components/` | `"use client"`, state UI, tanpa perhitungan geometri |
| Logika murni | `lib/template`, `render`, `booth`, `segment/mask.ts` | Tanpa React/DOM, wajib punya unit test |
| Akses browser | `lib/camera`, `export`, `segment/segmenter.ts` | Setipis mungkin, dites lewat e2e |
| Server | `app/api/` (M7+) | Upload, QR, webhook pembayaran, render tanpa watermark |
| Aset statis | `public/` | Karakter bawaan, WASM MediaPipe, model `.tflite` |

Aset yang diunggah (foto latar, logo, karakter, overlay) disimpan sebagai URL. Di M4 berupa data URL di localStorage, di M7 pindah ke storage Supabase.

## Kebutuhan non-fungsional

| Area | Target |
| --- | --- |
| Performa | Halaman booth interaktif < 2 detik di 4G; render export < 300 ms; segmentasi < 3 detik di HP kelas menengah |
| Perangkat | Chrome Android 2 versi terakhir, Safari iOS 17+, Chrome/Edge desktop; layout jalan dari lebar 360 px |
| Kamera | HTTPS wajib; `playsinline` + `muted` untuk iOS; kamera dimatikan setelah sesi atau saat pindah halaman |
| Privasi | Foto diproses di browser; tidak ada upload tanpa aksi pengguna; hasil di server (M7) punya masa berlaku dan bisa dihapus |
| Hukum | Karakter bawaan orisinal; karakter upload harus milik sendiri atau berlisensi komersial; library pakai lisensi yang aman komersial (MediaPipe Apache 2.0, hindari AGPL) |
| Aksesibilitas | Semua kontrol bisa dipakai keyboard, fokus terlihat, kontras teks UI minimal 4.5:1, countdown juga diumumkan lewat `aria-live` |
| Ketahanan | Booth tetap jalan tanpa internet setelah dimuat (aset di-host sendiri, PWA opsional); error kamera dan upload punya pesan yang bisa ditindaklanjuti |
| Kualitas kode | TypeScript strict, tanpa `any` di `lib/`, unit test hijau dan `tsc` bersih sebelum merge |

## Strategi testing

Logika yang bisa salah dites di Node dalam milidetik; browser dites lewat sedikit e2e yang menyentuh alur penting. Semua milestone baru dianggap selesai kalau test-nya ikut masuk.

| Milestone | Unit (Vitest) | E2E (Playwright, kamera palsu Chromium) | Manual |
| --- | --- | --- | --- |
| M3 Alur pengunjung | `fitFontSize`, urutan teks tamu vs template, reducer retake | Alur penuh 3 foto → simpan; izin ditolak → upload | iPhone asli: `playsinline`, Web Share |
| M4 Editor | Schema menolak JSON rusak; impor/ekspor bolak-balik sama | Bikin template → reload → masih ada → dipakai pengunjung | Coba semua kombinasi layout × font |
| M5 Layer | `hitTestLayers` dengan rotasi dan tumpukan; seleksi tidak ikut export | Geser layer dengan mouse dan sentuhan | Tablet layar sentuh |
| M6 Potong foto | `applyMaskAlpha`, `maskBounds`, foto tanpa orang | Upload foto contoh → layer muncul, rasio transparan masuk akal | 5 foto beragam: rambut panjang, latar ramai, cahaya redup |
| M7 Backend | Pembuat URL & masa berlaku | Upload → QR → buka dari konteks lain → unduh | Scan QR dari HP lain |
| M8 Pembayaran | Verifikasi signature webhook | Sandbox Midtrans/Xendit: bayar sukses dan gagal | Coba ambil versi tanpa watermark lewat DevTools |

**Visual regression:** `toHaveScreenshot()` untuk tiap preset dengan foto contoh tetap, supaya perubahan renderer yang tidak disengaja langsung ketahuan.

**CI:** GitHub Actions menjalankan `tsc`, `vitest run`, dan Playwright di setiap PR.

## Roadmap, metrik & risiko

&#91;embedded content: roadmap · 3 fase, 3 gerbang\]

Fase 1 bisa didemokan tanpa server sama sekali. Mode jualan (kiosk atau HP) wajib diputuskan sebelum Fase 3, karena backend dan alur QR bergantung padanya.

**Metrik keberhasilan 1.0**

- Median waktu sesi (buka → simpan) < 90 detik
- ≥ 70% sesi yang mulai jepret berakhir dengan simpan/share
- Template baru dibuat pemilik dalam < 5 menit tanpa bantuan
- 0 laporan foto bocor atau hasil tanpa watermark tanpa bayar

| Risiko | Dampak | Penanganan |
| --- | --- | --- |
| Kamera iOS Safari bertingkah | Pengunjung iPhone gagal jepret | Uji di perangkat asli tiap rilis; fallback upload foto |
| Segmentasi lambat di HP murah | UI macet, pengunjung kabur | Web Worker, perkecil gambar ke ±1280 px sebelum diproses |
| localStorage penuh oleh foto latar/karakter | Template gagal tersimpan | Kompres saat upload; pindah ke storage di M7 |
| Karakter berhak cipta diunggah | Masalah hukum saat komersial | Aturan di halaman admin; karakter bawaan orisinal |
| Watermark bisa di-bypass | Pendapatan hilang | Versi bersih hanya dirender server setelah webhook bayar |

**Pertanyaan terbuka**

- [ ] Mode jualan pertama: kiosk atau web HP?
- [ ] Harga: per sesi, per download, atau sewa per acara?
- [ ] Perlu cetak fisik di versi berikutnya?
- [ ] Nama dan branding final produk

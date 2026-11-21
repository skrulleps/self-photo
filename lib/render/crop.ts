import type { Template } from "@/lib/template/types";
import { coverCrop, toPx } from "./geometry";
import { shapeBounds } from "./shapes";

// posisi gambar dari device di dalam slot: zoom 1 = seukuran slot (cover), cx/cy = titik tengah 0..1 di gambar asli
export interface CropView { zoom: number; cx: number; cy: number }

export const ZOOM_MIN = 1;
export const ZOOM_MAX = 4;
export const CENTERED: CropView = { zoom: 1, cx: 0.5, cy: 0.5 };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const finite = (v: number, fallback: number) => (Number.isFinite(v) ? v : fallback);

// bagian gambar asli yang masuk ke slot, selalu di dalam gambar biar nggak ada area kosong
export function cropRect(srcW: number, srcH: number, aspect: number, v: CropView) {
  const zoom = clamp(finite(v.zoom, ZOOM_MIN), ZOOM_MIN, ZOOM_MAX);
  const base = coverCrop(srcW, srcH, aspect, 1);
  const sw = base.sw / zoom, sh = base.sh / zoom;
  const sx = clamp(finite(v.cx, 0.5) * srcW - sw / 2, 0, srcW - sw);
  const sy = clamp(finite(v.cy, 0.5) * srcH - sh / 2, 0, srcH - sh);
  return { sx, sy, sw, sh };
}

// view yang sudah dirapikan: zoom di batasnya, titik tengah nggak bisa bikin crop keluar gambar
export function clampView(srcW: number, srcH: number, aspect: number, v: CropView): CropView {
  const zoom = clamp(finite(v.zoom, ZOOM_MIN), ZOOM_MIN, ZOOM_MAX);
  const { sx, sy, sw, sh } = cropRect(srcW, srcH, aspect, { ...v, zoom });
  return { zoom, cx: (sx + sw / 2) / srcW, cy: (sy + sh / 2) / srcH };
}

// dx/dy = jarak geser jari dibagi lebar/tinggi kotak preview. Gambar ikut jari, jadi crop-nya bergerak berlawanan.
export function panView(srcW: number, srcH: number, aspect: number, v: CropView, dx: number, dy: number): CropView {
  const { sw, sh } = cropRect(srcW, srcH, aspect, v);
  return clampView(srcW, srcH, aspect, { ...v, cx: v.cx - (dx * sw) / srcW, cy: v.cy - (dy * sh) / srcH });
}

export function zoomView(srcW: number, srcH: number, aspect: number, v: CropView, zoom: number): CropView {
  return clampView(srcW, srcH, aspect, { ...v, zoom });
}

// area foto di slot ke-i: perbandingan lebar:tinggi dan radius sudut relatif ke lebarnya.
// Dipakai preview kamera dan pengatur gambar, biar yang kelihatan sama dengan yang dirender.
export function photoArea(t: Template, index: number) {
  const slot = t.slots[Math.min(Math.max(0, index), t.slots.length - 1)];
  const b = shapeBounds(t.photo.shape, toPx(slot, t.size));
  return { aspect: b.width / b.height, radiusRatio: t.photo.radius / b.width };
}

import type { Layer, Rect } from "@/lib/template/types";

type Size = { width: number; height: number };

export const layerSize = (l: Layer, printWidth: number) =>
  ({ width: l.scale * printWidth, height: l.scale * printWidth * l.aspect });

export function clientToCanvas(clientX: number, clientY: number, box: { left: number; top: number; width: number; height: number }, size: Size) {
  return { x: ((clientX - box.left) / box.width) * size.width, y: ((clientY - box.top) / box.height) * size.height };
}

// dari atas ke bawah: layer terakhir digambar paling atas, jadi dicek duluan
export function hitTestLayers(layers: Layer[], size: Size, px: number, py: number): Layer | undefined {
  return [...layers].reverse().find((l) => {
    const { width, height } = layerSize(l, size.width);
    const dx = px - l.x * size.width, dy = py - l.y * size.height;
    const rad = (-l.rot * Math.PI) / 180;
    const lx = dx * Math.cos(rad) - dy * Math.sin(rad);
    const ly = dx * Math.sin(rad) + dy * Math.cos(rad);
    return Math.abs(lx) <= width / 2 && Math.abs(ly) <= height / 2;
  });
}

export const toPx = (r: Rect, s: { width: number; height: number }) =>
  ({ x: r.x * s.width, y: r.y * s.height, width: r.width * s.width, height: r.height * s.height });

export function coverCrop(srcW: number, srcH: number, dstW: number, dstH: number) {
  const scale = Math.max(dstW / srcW, dstH / srcH);
  const sw = dstW / scale, sh = dstH / scale;
  return { sx: (srcW - sw) / 2, sy: (srcH - sh) / 2, sw, sh };
}

// lebar teks sebanding dengan ukuran font, jadi cukup diukur sekali di ukuran maksimal
export function fitFontSize(widthAtMax: number, maxWidth: number, maxSize: number, minSize = 16) {
  if (widthAtMax <= maxWidth) return maxSize;
  return Math.max(minSize, Math.floor((maxSize * maxWidth) / widthAtMax));
}

export function fitWithin(width: number, height: number, maxEdge: number) {
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

export function rectsOverlap(a: Rect, b: Rect, eps = 1e-9) {
  return a.x + a.width > b.x + eps && b.x + b.width > a.x + eps
    && a.y + a.height > b.y + eps && b.y + b.height > a.y + eps;
}

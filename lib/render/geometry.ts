import type { Rect } from "@/lib/template/types";

export const toPx = (r: Rect, s: { width: number; height: number }) =>
  ({ x: r.x * s.width, y: r.y * s.height, width: r.width * s.width, height: r.height * s.height });

export function coverCrop(srcW: number, srcH: number, dstW: number, dstH: number) {
  const scale = Math.max(dstW / srcW, dstH / srcH);
  const sw = dstW / scale, sh = dstH / scale;
  return { sx: (srcW - sw) / 2, sy: (srcH - sh) / 2, sw, sh };
}
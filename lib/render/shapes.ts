import type { PhotoShape, Rect } from "@/lib/template/types";

export type ShapeCtx = Pick<CanvasRenderingContext2D, "rect" | "moveTo" | "lineTo" | "bezierCurveTo" | "arc" | "closePath">
  & { roundRect?: CanvasRenderingContext2D["roundRect"] };

const FULL = Math.PI * 2;

function circle(ctx: ShapeCtx, cx: number, cy: number, r: number) {
  ctx.moveTo(cx + r, cy);
  ctx.arc(cx, cy, r, 0, FULL);
  ctx.closePath();
}

function heart(ctx: ShapeCtx, x: number, y: number, s: number) {
  const p = (px: number, py: number) => [x + px * s, y + py * s] as const;
  ctx.moveTo(...p(0.5, 0.92));
  ctx.bezierCurveTo(...p(0.12, 0.66), ...p(0, 0.46), ...p(0, 0.28));
  ctx.bezierCurveTo(...p(0, 0.12), ...p(0.12, 0.02), ...p(0.27, 0.02));
  ctx.bezierCurveTo(...p(0.38, 0.02), ...p(0.46, 0.08), ...p(0.5, 0.18));
  ctx.bezierCurveTo(...p(0.54, 0.08), ...p(0.62, 0.02), ...p(0.73, 0.02));
  ctx.bezierCurveTo(...p(0.88, 0.02), ...p(1, 0.12), ...p(1, 0.28));
  ctx.bezierCurveTo(...p(1, 0.46), ...p(0.88, 0.66), ...p(0.5, 0.92));
  ctx.closePath();
}

function star(ctx: ShapeCtx, cx: number, cy: number, r: number) {
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const d = i % 2 ? r * 0.52 : r;
    const [px, py] = [cx + d * Math.cos(a), cy + d * Math.sin(a)];
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

// satu garis luar, bukan lingkaran bertumpuk, biar outline-nya nggak nyoret bagian dalam foto
function flower(ctx: ShapeCtx, cx: number, cy: number, s: number) {
  const dist = s / 3, r = s / 6, petals = 6;
  for (let i = 0; i < petals; i++) {
    const a = (i * FULL) / petals;
    ctx.arc(cx + dist * Math.cos(a), cy + dist * Math.sin(a), r, a - Math.PI / 2, a + Math.PI / 2);
  }
  ctx.closePath();
}

function arch(ctx: ShapeCtx, { x, y, width: w, height: h }: Rect) {
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + h * 0.45);
  ctx.bezierCurveTo(x, y, x + w, y, x + w, y + h * 0.45);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
}

function cloud(ctx: ShapeCtx, { x, y, width: w, height: h }: Rect) {
  const p = (px: number, py: number) => [x + px * w, y + py * h] as const;
  ctx.moveTo(...p(0.18, 0.92));
  ctx.bezierCurveTo(...p(0, 0.92), ...p(0, 0.55), ...p(0.16, 0.52));
  ctx.bezierCurveTo(...p(0.12, 0.22), ...p(0.38, 0.12), ...p(0.46, 0.3));
  ctx.bezierCurveTo(...p(0.5, 0), ...p(0.84, 0.02), ...p(0.82, 0.36));
  ctx.bezierCurveTo(...p(1, 0.36), ...p(1, 0.92), ...p(0.82, 0.92));
  ctx.closePath();
}

// cuma menelusuri path: beginPath, clip, fill, atau stroke urusan pemanggil
export function traceShape(ctx: ShapeCtx, shape: PhotoShape, r: Rect, radius = 0) {
  const s = Math.min(r.width, r.height);
  const cx = r.x + r.width / 2, cy = r.y + r.height / 2;
  switch (shape) {
    case "rounded":
      if (ctx.roundRect) ctx.roundRect(r.x, r.y, r.width, r.height, radius);
      else ctx.rect(r.x, r.y, r.width, r.height);
      return;
    case "circle": return circle(ctx, cx, cy, s / 2);
    case "heart": return heart(ctx, cx - s / 2, cy - s / 2, s);
    case "star": return star(ctx, cx, cy, s / 2);
    case "flower": return flower(ctx, cx, cy, s);
    case "arch": return arch(ctx, r);
    case "cloud": return cloud(ctx, r);
  }
}

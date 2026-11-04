import type { Template } from "@/lib/template/types";
import { coverCrop, fitFontSize, layerSize, toPx } from "./geometry";
import { traceShape, type ShapeCtx } from "./shapes";

export type Photo = CanvasImageSource & { width: number; height: number };

export type Ctx2D = ShapeCtx & Pick<CanvasRenderingContext2D,
  "fillStyle" | "strokeStyle" | "lineWidth" | "globalAlpha" | "font" | "textAlign" | "textBaseline" | "save" | "restore" | "beginPath" | "clip"
  | "fill" | "stroke" | "fillRect" | "strokeRect" | "fillText" | "measureText" | "drawImage" | "translate" | "rotate" | "scale"
>;

export interface GuestText { title?: string; subtitle?: string }

export interface RenderInput {
  template: Template;
  photos?: Photo[];
  text?: GuestText;
  // gambar nggak pernah di-load di sini: kalau belum siap, layer-nya dilewati
  images?: (src: string) => Photo | undefined;
  // nama font di template ke nama font yang dikenali canvas (next/font memberi nama acak)
  fonts?: (name: string) => string;
  // khusus editor, export nggak pernah mengirim ini
  selectedLayer?: string | null;
}

// teks tamu menang, kalau kosong pakai teks template
export function resolveText(t: Template, guest: GuestText = {}) {
  return {
    title: guest.title?.trim() || t.text.title,
    subtitle: guest.subtitle?.trim() || t.text.subtitle,
  };
}

function fontAt(ctx: Ctx2D, weight: number, font: string, text: string, maxWidth: number, maxSize: number) {
  ctx.font = `${weight} ${maxSize}px ${font}`;
  const size = fitFontSize(ctx.measureText(text).width, maxWidth, maxSize);
  ctx.font = `${weight} ${size}px ${font}`;
  return size;
}

function drawPattern(ctx: Ctx2D, t: Template) {
  if (t.pattern === "none") return;
  const { width: W, height: H } = t.size;
  const cell = W * 0.1;
  ctx.save();
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = t.text.color;
  if (t.pattern === "stripes") {
    for (let x = 0; x < W; x += cell * 1.2) ctx.fillRect(x, 0, cell * 0.6, H);
  } else {
    ctx.beginPath();
    for (let row = 0; row * cell < H; row++) {
      // baris ganjil digeser setengah biar motifnya selang-seling
      for (let x = row % 2 ? cell / 2 : 0; x < W; x += cell) {
        const mark = { x: x + cell * 0.25, y: row * cell + cell * 0.25, width: cell * 0.5, height: cell * 0.5 };
        if (t.pattern === "dots") traceShape(ctx, "circle", { ...mark, x: mark.x + mark.width * 0.3, y: mark.y + mark.height * 0.3, width: mark.width * 0.4, height: mark.height * 0.4 });
        else traceShape(ctx, t.pattern === "hearts" ? "heart" : "star", mark);
      }
    }
    ctx.fill();
  }
  ctx.restore();
}

export function renderPrint(ctx: Ctx2D, { template: t, photos = [], text, images, fonts, selectedLayer }: RenderInput) {
  const { width: W, height: H } = t.size;
  const font = fonts?.(t.text.font) ?? t.text.font;
  ctx.fillStyle = t.background.color;
  ctx.fillRect(0, 0, W, H);
  drawPattern(ctx, t);

  t.slots.forEach((slot, i) => {
    const r = toPx(slot, t.size);
    const img = photos[i];
    ctx.save();
    ctx.beginPath();
    traceShape(ctx, t.photo.shape, r, t.photo.radius);
    ctx.clip();
    if (img) {
      const c = coverCrop(img.width, img.height, r.width, r.height);
      ctx.drawImage(img, c.sx, c.sy, c.sw, c.sh, r.x, r.y, r.width, r.height);
    } else {
      ctx.fillStyle = "#dddddd";
      ctx.fillRect(r.x, r.y, r.width, r.height);
    }
    ctx.restore();

    // garis tepi ala stiker, digambar di luar clip biar nggak kepotong
    ctx.save();
    ctx.strokeStyle = t.photo.outline;
    ctx.lineWidth = W * 0.012;
    ctx.beginPath();
    traceShape(ctx, t.photo.shape, r, t.photo.radius);
    ctx.stroke();
    ctx.restore();
  });

  const a = toPx(t.textArea, t.size);
  const { title, subtitle } = resolveText(t, text);
  const cx = a.x + a.width / 2;
  ctx.fillStyle = t.text.color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // ukur dulu dua-duanya biar bloknya bisa ditaruh pas di tengah area
  const subSize = subtitle ? fontAt(ctx, 400, font, subtitle, a.width, W * 0.04) : 0;
  const titleSize = fontAt(ctx, 700, font, title, a.width, Math.min(a.height * 0.5, W * 0.107));
  const gap = subtitle ? subSize * 0.5 : 0;
  const top = a.y + (a.height - (titleSize + gap + subSize)) / 2;
  ctx.fillText(title, cx, top + titleSize / 2);

  if (subtitle) {
    fontAt(ctx, 400, font, subtitle, a.width, W * 0.04);
    ctx.fillText(subtitle, cx, top + titleSize + gap + subSize / 2);
  }

  t.layers.forEach((l) => {
    const img = images?.(l.src);
    const selected = l.id === selectedLayer;
    if (!img && !selected) return;
    const { width, height } = layerSize(l, W);
    ctx.save();
    ctx.translate(l.x * W, l.y * H);
    ctx.rotate((l.rot * Math.PI) / 180);
    ctx.scale(l.flip ? -1 : 1, 1);
    if (img) ctx.drawImage(img, -width / 2, -height / 2, width, height);
    if (selected) {
      ctx.strokeStyle = "#7c3aed";
      ctx.lineWidth = W * 0.005;
      ctx.strokeRect(-width / 2, -height / 2, width, height);
    }
    ctx.restore();
  });
}

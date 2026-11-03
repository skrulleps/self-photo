import type { Template } from "@/lib/template/types";
import { coverCrop, toPx } from "./geometry";

export type Photo = CanvasImageSource & { width: number; height: number };

export function renderPrint(ctx: CanvasRenderingContext2D, t: Template, photos: Photo[] = []) {
  const { width: W, height: H } = t.size;
  ctx.fillStyle = t.background.color;
  ctx.fillRect(0, 0, W, H);

  t.slots.forEach((slot, i) => {
    const r = toPx(slot, t.size);
    const img = photos[i] ?? photos.at(-1);
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(r.x, r.y, r.width, r.height, t.photo.radius);
    ctx.clip();
    if (img) {
      const c = coverCrop(img.width, img.height, r.width, r.height);
      ctx.drawImage(img, c.sx, c.sy, c.sw, c.sh, r.x, r.y, r.width, r.height);
    } else {
      ctx.fillStyle = "#dddddd";
      ctx.fillRect(r.x, r.y, r.width, r.height);
    }
    ctx.restore();
  });

  const a = toPx(t.textArea, t.size);
  ctx.fillStyle = t.text.color;
  ctx.font = `700 64px ${t.text.font}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(t.text.title, a.x + a.width / 2, a.y + a.height / 2);
}
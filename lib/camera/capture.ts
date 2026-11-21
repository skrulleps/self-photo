import { applyMatrix, type ColorMatrix } from "@/lib/render/filters";

// dicerminkan seperti preview, lalu filter yang sama dengan preview dihitung per pixel
export function captureFrame(video: HTMLVideoElement, filter: ColorMatrix | null = null): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = video.videoWidth;
  c.height = video.videoHeight;
  const ctx = c.getContext("2d")!;
  ctx.translate(c.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0);
  if (filter) {
    const img = ctx.getImageData(0, 0, c.width, c.height);
    applyMatrix(img.data, filter);
    ctx.putImageData(img, 0, 0);
  }
  return c;
}

"use client";
import { useEffect, useRef, type ComponentProps, type CSSProperties } from "react";
import { fontFamily, isFontReady, loadFont } from "@/lib/export/fonts";
import { getImage, loadImages } from "@/lib/export/imageCache";
import { renderPrint, type Photo } from "@/lib/render/render";
import type { Template } from "@/lib/template/types";

const NO_PHOTOS: Photo[] = [];

interface Props {
  template: Template;
  photos?: Photo[];
  title?: string;
  subtitle?: string;
  label?: string;
  style?: CSSProperties;
  selectedLayer?: string | null;
  canvasProps?: Pick<ComponentProps<"canvas">, "onPointerDown" | "onPointerMove" | "onPointerUp" | "onPointerCancel">;
}

export default function PrintPreview({ template, photos = NO_PHOTOS, title, subtitle, label, style, selectedLayer, canvasProps }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current, ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    let alive = true;
    const draw = () => {
      c.width = template.size.width;
      c.height = template.size.height;
      renderPrint(ctx, { template, photos, text: { title, subtitle }, images: getImage, fonts: fontFamily, selectedLayer });
    };
    draw();
    // gambar dan font dimuat di luar render, lalu gambar ulang kalau ada yang baru siap
    const missing = template.layers.map((l) => l.src).filter((src) => !getImage(src));
    if (missing.length || !isFontReady(template.text.font)) {
      Promise.all([loadImages(missing), loadFont(template.text.font)]).then(() => { if (alive) draw(); });
    }
    return () => { alive = false; };
  }, [template, photos, title, subtitle, selectedLayer]);
  return (
    <canvas
      ref={ref}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={{ maxHeight: "80vh", width: "auto", maxWidth: "100%", ...style }}
      {...canvasProps}
    />
  );
}

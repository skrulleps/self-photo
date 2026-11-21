"use client";
import { useEffect, useRef } from "react";
import { maskOutsideShape } from "@/lib/render/shapes";
import type { PhotoShape } from "@/lib/template/types";

const GUIDE_WIDTH = 400;
export const GUIDE_DIM = "rgb(255 255 255 / 0.55)";

interface Props {
  shape: PhotoShape;
  aspect: number;
  // radius sudut dibagi lebar slot, biar skalanya ikut ukuran kotak
  radiusRatio: number;
}

// lapisan di atas kamera: bagian yang nggak masuk ke bentuk foto dibuat pudar
export default function ShapeGuide({ shape, aspect, radiusRatio }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current, ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    c.width = GUIDE_WIDTH;
    c.height = Math.round(GUIDE_WIDTH / aspect);
    maskOutsideShape(ctx, shape, c.width, c.height, radiusRatio * c.width, GUIDE_DIM);
  }, [shape, aspect, radiusRatio]);
  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none absolute inset-0 size-full" />;
}

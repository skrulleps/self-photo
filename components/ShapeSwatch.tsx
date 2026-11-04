"use client";
import { useEffect, useRef } from "react";
import { traceShape } from "@/lib/render/shapes";
import type { PhotoShape } from "@/lib/template/types";

const SIZE = 56;

// contoh bentuk digambar dengan fungsi yang sama seperti print, jadi nggak mungkin beda
export default function ShapeSwatch({ shape }: { shape: PhotoShape }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.fillStyle = "#ff7aa8";
    ctx.beginPath();
    traceShape(ctx, shape, { x: 4, y: 4, width: SIZE - 8, height: SIZE - 8 }, 12);
    ctx.fill();
  }, [shape]);
  return <canvas ref={ref} width={SIZE} height={SIZE} aria-hidden="true" style={{ width: 36, height: 36 }} />;
}

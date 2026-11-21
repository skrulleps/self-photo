"use client";
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { CENTERED, cropRect, panView, ZOOM_MAX, ZOOM_MIN, zoomView, type CropView } from "@/lib/render/crop";
import { fitWithin } from "@/lib/render/geometry";
import { maskOutsideShape } from "@/lib/render/shapes";
import type { PhotoShape } from "@/lib/template/types";
import { GUIDE_DIM } from "./ShapeGuide";

const VIEW_WIDTH = 720;
const OUT_MAX_EDGE = 2000;
const KEY_STEP = 0.05;

interface Props {
  source: HTMLCanvasElement;
  aspect: number;
  shape: PhotoShape;
  radiusRatio: number;
  onUse: (photo: HTMLCanvasElement) => void;
  onCancel: () => void;
}

type Point = { x: number; y: number };
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

export default function PhotoAdjuster({ source, aspect, shape, radiusRatio, onUse, onCancel }: Props) {
  const [view, setView] = useState<CropView>(CENTERED);
  const ref = useRef<HTMLCanvasElement>(null);
  const pointers = useRef(new Map<number, Point>());
  const pinch = useRef<{ dist: number; zoom: number } | null>(null);
  const { width: W, height: H } = source;

  useEffect(() => {
    const c = ref.current, ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    c.width = VIEW_WIDTH;
    c.height = Math.round(VIEW_WIDTH / aspect);
    const r = cropRect(W, H, aspect, view);
    ctx.drawImage(source, r.sx, r.sy, r.sw, r.sh, 0, 0, c.width, c.height);
    maskOutsideShape(ctx, shape, c.width, c.height, radiusRatio * c.width, GUIDE_DIM);
  }, [source, W, H, aspect, shape, radiusRatio, view]);

  function down(e: PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { dist: distance(a, b), zoom: view.zoom };
    }
  }

  function move(e: PointerEvent<HTMLCanvasElement>) {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const now = { x: e.clientX, y: e.clientY };
    pointers.current.set(e.pointerId, now);
    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      const p = pinch.current;
      setView((v) => zoomView(W, H, aspect, v, (p.zoom * distance(a, b)) / p.dist));
    } else if (pointers.current.size === 1) {
      const box = e.currentTarget.getBoundingClientRect();
      setView((v) => panView(W, H, aspect, v, (now.x - prev.x) / box.width, (now.y - prev.y) / box.height));
    }
  }

  function up(e: PointerEvent<HTMLCanvasElement>) {
    pointers.current.delete(e.pointerId);
    pinch.current = null;
  }

  function key(e: KeyboardEvent<HTMLCanvasElement>) {
    const d = { ArrowLeft: [KEY_STEP, 0], ArrowRight: [-KEY_STEP, 0], ArrowUp: [0, KEY_STEP], ArrowDown: [0, -KEY_STEP] }[e.key];
    if (!d) return;
    e.preventDefault();
    setView((v) => panView(W, H, aspect, v, d[0], d[1]));
  }

  // hasilnya cuma bagian yang dipilih, jadi saat dirender crop bawaan nggak memotong apa-apa lagi
  function use() {
    const r = cropRect(W, H, aspect, view);
    const out = document.createElement("canvas");
    Object.assign(out, fitWithin(Math.max(1, Math.round(r.sw)), Math.max(1, Math.round(r.sh)), OUT_MAX_EDGE));
    out.getContext("2d")!.drawImage(source, r.sx, r.sy, r.sw, r.sh, 0, 0, out.width, out.height);
    onUse(out);
  }

  return (
    <section className="card grid justify-items-center gap-4" aria-label="Atur gambar">
      <h2 className="card-title">Atur gambarnya</h2>
      <canvas
        ref={ref}
        role="img"
        aria-label="Posisi gambar di slot"
        tabIndex={0}
        className="adjust-view"
        style={{ width: `min(100%, calc(56svh * ${aspect}))` }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onKeyDown={key}
      />
      <p className="text-center text-sm font-medium text-muted">Geser gambarnya biar pas. Cubit atau pakai slider buat zoom.</p>
      <label className="grid w-full max-w-sm gap-1 text-sm font-medium">
        Zoom
        <input
          type="range"
          min={ZOOM_MIN}
          max={ZOOM_MAX}
          step={0.01}
          value={view.zoom}
          onChange={(e) => setView((v) => zoomView(W, H, aspect, v, Number(e.target.value)))}
        />
      </label>
      <div className="actions actions-center">
        <button className="btn btn-primary" onClick={use}>Pakai gambar ini</button>
        <button className="btn btn-secondary" onClick={() => setView(CENTERED)}>Tengahkan</button>
        <button className="btn btn-secondary" onClick={onCancel}>Batal</button>
      </div>
    </section>
  );
}

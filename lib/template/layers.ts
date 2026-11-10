import type { Layer, Template } from "./types";

export const MAX_LAYERS = 12;

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export function newLayer(id: string, src: string, aspect: number): Layer {
  return { id, src, x: 0.5, y: 0.5, scale: 0.3, rot: 0, flip: false, aspect };
}

export function addLayer(t: Template, layer: Layer): Template {
  return t.layers.length >= MAX_LAYERS ? t : { ...t, layers: [...t.layers, layer] };
}

export function updateLayer(t: Template, id: string, patch: Partial<Omit<Layer, "id" | "src" | "aspect">>): Template {
  return {
    ...t,
    layers: t.layers.map((l) => {
      if (l.id !== id) return l;
      const next = { ...l, ...patch };
      return { ...next, x: clamp(next.x, 0, 1), y: clamp(next.y, 0, 1), scale: clamp(next.scale, 0.05, 1) };
    }),
  };
}

export function moveLayerTo(t: Template, id: string, px: number, py: number): Template {
  return updateLayer(t, id, { x: px / t.size.width, y: py / t.size.height });
}

export function grabOffset(l: Layer, size: Template["size"], px: number, py: number) {
  return { dx: px - l.x * size.width, dy: py - l.y * size.height };
}

export function removeLayer(t: Template, id: string): Template {
  return { ...t, layers: t.layers.filter((l) => l.id !== id) };
}

// layer di akhir array digambar paling atas
export function shiftLayer(t: Template, id: string, dir: "naik" | "turun"): Template {
  const i = t.layers.findIndex((l) => l.id === id);
  const j = dir === "naik" ? i + 1 : i - 1;
  if (i < 0 || j < 0 || j >= t.layers.length) return t;
  const layers = [...t.layers];
  [layers[i], layers[j]] = [layers[j], layers[i]];
  return { ...t, layers };
}

import type { Layer, PhotoShape, Pattern, Rect, Template } from './types';

const STRIP = { width: 600, height: 1800 };
const GRID = { width: 1200, height: 1500 };

const norm = (s: { width: number; height: number }, [x, y, width, height]: number[]): Rect =>
  ({ x: x / s.width, y: y / s.height, width: width / s.width, height: height / s.height });

export type LayoutId = "strip" | "zigzag" | "grid" | "trio" | "mosaic" | "duo" | "single";

const layout = (label: string, size: typeof STRIP, slots: number[][], textArea: number[]) =>
  ({ label, size, slots: slots.map((r) => norm(size, r)), textArea: norm(size, textArea) });

const GRID_TEXT = [50, 1180, 1100, 270];

export const LAYOUTS: Record<LayoutId, ReturnType<typeof layout>> = {
  strip: layout("Strip 3 foto", STRIP, [[40, 40, 520, 390], [40, 450, 520, 390], [40, 860, 520, 390]], [40, 1270, 520, 440]),
  zigzag: layout("Zigzag 3 foto", STRIP, [[40, 40, 380, 380], [180, 450, 380, 380], [40, 860, 380, 380]], [40, 1270, 520, 440]),
  grid: layout("Grid 4 foto", GRID, [[50, 50, 535, 535], [615, 50, 535, 535], [50, 615, 535, 535], [615, 615, 535, 535]], GRID_TEXT),
  trio: layout("Trio 3 foto", GRID, [[350, 50, 500, 500], [50, 580, 535, 535], [615, 580, 535, 535]], [50, 1145, 1100, 305]),
  mosaic: layout("Mosaik 3 foto", GRID, [[50, 50, 1100, 640], [50, 720, 535, 430], [615, 720, 535, 430]], GRID_TEXT),
  duo: layout("Duo 2 foto", GRID, [[50, 50, 1100, 535], [50, 615, 1100, 535]], GRID_TEXT),
  single: layout("1 foto", GRID, [[50, 50, 1100, 1100]], GRID_TEXT),
};

export const SHAPE_LABELS: Record<PhotoShape, string> = {
  rounded: "Kotak",
  circle: "Lingkaran",
  heart: "Hati",
  star: "Bintang",
  flower: "Bunga",
  arch: "Lengkung",
  cloud: "Awan",
};

export const PATTERN_LABELS: Record<Pattern, string> = {
  none: "Polos",
  dots: "Titik",
  hearts: "Hati",
  stars: "Bintang",
  stripes: "Garis",
};

const fields = ({ size, slots, textArea }: (typeof LAYOUTS)[LayoutId]) => ({ size, slots, textArea });

export function applyLayout(t: Template, id: LayoutId): Template {
  return { ...t, ...fields(LAYOUTS[id]) };
}

// frame nggak menyimpan id layout, jadi dikenali dari posisi slot-nya
export function layoutOf(t: Template): LayoutId | undefined {
  const slots = JSON.stringify(t.slots);
  return (Object.keys(LAYOUTS) as LayoutId[]).find((id) => JSON.stringify(LAYOUTS[id].slots) === slots);
}

export function newTemplate(id: string): Template {
  return {
    id,
    name: "Frame baru",
    category: "umum",
    ...fields(LAYOUTS.strip),
    background: { color: "#ffe3ef" },
    pattern: "hearts",
    photo: { radius: 28, shape: "rounded", outline: "#ffffff" },
    text: { font: "Fredoka", color: "#8a2152", title: "cheese!", subtitle: "" },
    layers: [],
  };
}

export const STICKERS = [
  { name: "Hati", src: "/characters/heart.svg" },
  { name: "Bintang", src: "/characters/star.svg" },
  { name: "Kucing", src: "/characters/cat.svg" },
  { name: "Kelinci", src: "/characters/bunny.svg" },
  { name: "Labu", src: "/characters/pumpkin.svg" },
  { name: "Hantu", src: "/characters/ghost.svg" },
  { name: "Kelelawar", src: "/characters/bat.svg" },
  { name: "Toga", src: "/characters/grad-cap.svg" },
  { name: "Ijazah", src: "/characters/diploma.svg" },
  { name: "Surat Cinta", src: "/characters/love-letter.svg" },
  { name: "Kembang Api", src: "/characters/firework.svg" },
  { name: "Topi Pesta", src: "/characters/party-hat.svg" },
];

const sticker = (id: string, name: string, x: number, y: number, scale: number, rot = 0): Layer =>
  ({ id, src: `/characters/${name}.svg`, x, y, scale, rot, flip: false, aspect: 1 });

const preset = (t: Omit<Template, "size" | "slots" | "textArea" | "photo" | "text"> & {
  layout: LayoutId;
  shape: PhotoShape;
  radius?: number;
  outline?: string;
  color: string;
  title: string;
}): Template => {
  const { layout: id, shape, radius = 24, outline = "#ffffff", color, title, ...rest } = t;
  return {
    ...rest,
    ...fields(LAYOUTS[id]),
    photo: { radius, shape, outline },
    text: { font: "Fredoka", color, title, subtitle: "" },
  };
};

export const PRESETS: Template[] = [
  preset({
    id: "blush", name: "Blush", category: "romantis", layout: "strip", shape: "heart",
    background: { color: "#ffd6e5" }, pattern: "hearts", color: "#ad1457", title: "you & me",
    layers: [sticker("heart-1", "heart", 0.14, 0.74, 0.16, -15), sticker("bunny-1", "bunny", 0.84, 0.91, 0.22, 8)],
  }),
  preset({
    id: "halloween", name: "Halloween", category: "acara", layout: "strip", shape: "arch", outline: "#ff9f43",
    background: { color: "#2b1b3d" }, pattern: "stars", color: "#ffb347", title: "happy halloween",
    layers: [sticker("pumpkin-1", "pumpkin", 0.15, 0.91, 0.22, -8), sticker("ghost-1", "ghost", 0.85, 0.91, 0.22, 8), sticker("bat-1", "bat", 0.5, 0.735, 0.2)],
  }),
  preset({
    id: "graduation-day", name: "Graduation Day", category: "acara", layout: "trio", shape: "circle", outline: "#ffd166",
    background: { color: "#e7ecff" }, pattern: "stars", color: "#1f2a5c", title: "graduation day",
    layers: [sticker("cap-1", "grad-cap", 0.14, 0.17, 0.2, -12), sticker("diploma-1", "diploma", 0.86, 0.17, 0.2, 6)],
  }),
  preset({
    id: "valentine", name: "Valentine", category: "acara", layout: "grid", shape: "heart", outline: "#fff5f8",
    background: { color: "#ffc9d9" }, pattern: "hearts", color: "#8f0f3c", title: "be my valentine",
    layers: [sticker("letter-1", "love-letter", 0.1, 0.89, 0.14, -8), sticker("heart-7", "heart", 0.91, 0.89, 0.1, 12)],
  }),
  preset({
    id: "happy-new-year", name: "Happy New Year", category: "acara", layout: "zigzag", shape: "circle", outline: "#ffd166",
    background: { color: "#14213d" }, pattern: "stars", color: "#ffd166", title: "happy new year",
    layers: [sticker("firework-1", "firework", 0.86, 0.12, 0.24, 8), sticker("hat-1", "party-hat", 0.15, 0.35, 0.22, -10), sticker("firework-2", "firework", 0.86, 0.58, 0.24, -8)],
  }),
  preset({
    id: "zigzag-bintang", name: "Zigzag Bintang", category: "umum", layout: "zigzag", shape: "star",
    background: { color: "#fff1c2" }, pattern: "dots", color: "#7a4a00", title: "bintang hari ini",
    layers: [sticker("star-1", "star", 0.86, 0.12, 0.22, 12), sticker("cat-1", "cat", 0.15, 0.35, 0.24, -8), sticker("star-2", "star", 0.86, 0.58, 0.22, -10)],
  }),
  preset({
    id: "awan-manis", name: "Awan Manis", category: "romantis", layout: "mosaic", shape: "cloud",
    background: { color: "#e9dcff" }, pattern: "stars", color: "#4c2a85", title: "di atas awan",
    layers: [sticker("bunny-2", "bunny", 0.1, 0.89, 0.13, -8), sticker("heart-2", "heart", 0.91, 0.89, 0.09, 12)],
  }),
  preset({
    id: "pagi-cerah", name: "Pagi Cerah", category: "umum", layout: "strip", shape: "arch",
    background: { color: "#e3f2ef" }, pattern: "dots", color: "#0f4c45", title: "hari ini seru",
    layers: [sticker("star-3", "star", 0.14, 0.74, 0.14, -10), sticker("star-4", "star", 0.86, 0.92, 0.18, 12)],
  }),
  preset({
    id: "kotak-berempat", name: "Kotak Berempat", category: "umum", layout: "grid", shape: "flower",
    background: { color: "#f5f1e8" }, pattern: "stripes", color: "#2f2a24", title: "kita berempat",
    layers: [sticker("cat-2", "cat", 0.1, 0.89, 0.13, -8), sticker("heart-3", "heart", 0.91, 0.89, 0.09, 12)],
  }),
  preset({
    id: "bertiga-imut", name: "Bertiga Imut", category: "umum", layout: "trio", shape: "circle",
    background: { color: "#d8efff" }, pattern: "stars", color: "#174a73", title: "bertiga lebih seru",
    layers: [sticker("star-5", "star", 0.14, 0.17, 0.14, -12), sticker("cat-3", "cat", 0.86, 0.17, 0.16, 8)],
  }),
  preset({
    id: "duo-sayang", name: "Duo Sayang", category: "romantis", layout: "duo", shape: "rounded", radius: 48,
    background: { color: "#ffe0cc" }, pattern: "hearts", color: "#8a3a12", title: "berdua aja",
    layers: [sticker("heart-4", "heart", 0.1, 0.89, 0.11, -12), sticker("heart-5", "heart", 0.9, 0.89, 0.11, 12)],
  }),
  preset({
    id: "satu-cinta", name: "Satu Cinta", category: "romantis", layout: "single", shape: "heart",
    background: { color: "#ffe3ef" }, pattern: "none", color: "#8a2152", title: "cuma kamu",
    layers: [sticker("bunny-3", "bunny", 0.12, 0.88, 0.15, -8), sticker("heart-6", "heart", 0.88, 0.88, 0.1, 12)],
  }),
];

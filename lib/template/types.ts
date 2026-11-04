export type Rect = { x: number; y: number; width: number; height: number };

export type Category = "romantis" | "umum" | "acara";

export const PHOTO_SHAPES = ["rounded", "circle", "heart", "star", "flower", "arch", "cloud"] as const;
export type PhotoShape = (typeof PHOTO_SHAPES)[number];

export const PATTERNS = ["none", "dots", "hearts", "stars", "stripes"] as const;
export type Pattern = (typeof PATTERNS)[number];

// x, y = titik tengah (0..1), scale = lebar relatif ke lebar print, aspect = tinggi / lebar gambar, rot = derajat
export interface Layer {
    id: string;
    src: string;
    x: number;
    y: number;
    scale: number;
    rot: number;
    flip: boolean;
    aspect: number;
}

export interface Template {
    id: string;
    name: string;
    category: Category;
    size: { width: number; height: number };
    slots: Rect[];
    textArea: Rect;
    background: {color: string};
    pattern: Pattern;
    photo: { radius: number; shape: PhotoShape; outline: string};
    text: {font: string; color: string; title: string; subtitle: string};
    layers: Layer[];
}

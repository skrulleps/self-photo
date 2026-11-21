// Filter kamera sebagai color matrix 4x5 (format SVG feColorMatrix: baris R, G, B, A; kolom R, G, B, A, offset 0..1).
// Matrix yang sama dipakai preview (SVG filter di <video>) dan hasil jepretan (dihitung per pixel),
// jadi yang dilihat di preview sama dengan yang masuk ke frame. ctx.filter nggak dipakai karena Safari belum mendukung.

export type ColorMatrix = readonly number[];

export const FILTER_IDS = ["normal", "bw", "sepia", "warm", "cool", "vivid", "fade", "pink"] as const;
export type FilterId = (typeof FILTER_IDS)[number];

export const FILTER_LABELS: Record<FilterId, string> = {
  normal: "Normal",
  bw: "Hitam putih",
  sepia: "Sepia",
  warm: "Hangat",
  cool: "Sejuk",
  vivid: "Cerah",
  fade: "Pudar",
  pink: "Pink",
};

const LUM = [0.2126, 0.7152, 0.0722] as const;

// s = 1 tetap, 0 hitam putih, di atas 1 warnanya makin kuat
export function saturate(s: number): ColorMatrix {
  const [r, g, b] = LUM;
  return [
    r + (1 - r) * s, g - g * s, b - b * s, 0, 0,
    r - r * s, g + (1 - g) * s, b - b * s, 0, 0,
    r - r * s, g - g * s, b + (1 - b) * s, 0, 0,
    0, 0, 0, 1, 0,
  ];
}

export const FILTERS: Record<FilterId, ColorMatrix | null> = {
  normal: null,
  bw: saturate(0),
  sepia: [
    0.393, 0.769, 0.189, 0, 0,
    0.349, 0.686, 0.168, 0, 0,
    0.272, 0.534, 0.131, 0, 0,
    0, 0, 0, 1, 0,
  ],
  warm: [
    1.08, 0, 0, 0, 0.03,
    0, 1.02, 0, 0, 0.01,
    0, 0, 0.86, 0, 0,
    0, 0, 0, 1, 0,
  ],
  cool: [
    0.9, 0, 0, 0, 0,
    0, 1, 0, 0, 0.01,
    0, 0, 1.1, 0, 0.04,
    0, 0, 0, 1, 0,
  ],
  vivid: saturate(1.45),
  fade: [
    0.78, 0.04, 0.04, 0, 0.1,
    0.04, 0.78, 0.04, 0, 0.1,
    0.04, 0.04, 0.78, 0, 0.12,
    0, 0, 0, 1, 0,
  ],
  pink: [
    1, 0.06, 0.04, 0, 0.07,
    0, 0.9, 0, 0, 0.04,
    0.04, 0, 0.96, 0, 0.09,
    0, 0, 0, 1, 0,
  ],
};

export const isFilterId = (v: unknown): v is FilterId => typeof v === "string" && (FILTER_IDS as readonly string[]).includes(v);

// isi atribut values buat <feColorMatrix>
export const matrixValues = (m: ColorMatrix) => m.join(" ");

// pixel RGBA diubah di tempat. Offset matrix dalam 0..1, jadi dikali 255.
export function applyMatrix(data: Uint8ClampedArray, m: ColorMatrix) {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
    data[i] = m[0] * r + m[1] * g + m[2] * b + m[3] * a + m[4] * 255;
    data[i + 1] = m[5] * r + m[6] * g + m[7] * b + m[8] * a + m[9] * 255;
    data[i + 2] = m[10] * r + m[11] * g + m[12] * b + m[13] * a + m[14] * 255;
    data[i + 3] = m[15] * r + m[16] * g + m[17] * b + m[18] * a + m[19] * 255;
  }
}

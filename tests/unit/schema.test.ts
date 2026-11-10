import { describe, expect, it } from "vitest";
import { parseTemplate, safeParseTemplate } from "@/lib/template/schema";
import { applyLayout, LAYOUTS, layoutOf, newTemplate, PRESETS, type LayoutId } from "@/lib/template/presets";
import { PHOTO_SHAPES } from "@/lib/template/types";

const base = PRESETS[0];

const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

describe("PRESETS", () => {
  it.each(PRESETS)("$id lolos schema", (t) => {
    expect(() => parseTemplate(t)).not.toThrow();
  });
  it.each(PRESETS)("$id warna teksnya kontras dengan background", (t) => {
    expect(contrast(t.text.color, t.background.color)).toBeGreaterThanOrEqual(4.5);
  });
  it("id-nya unik", () => {
    expect(new Set(PRESETS.map((t) => t.id)).size).toBe(PRESETS.length);
  });
  it("punya tiga kategori dan dua ukuran print dari PRD", () => {
    expect(new Set(PRESETS.map((t) => t.category))).toEqual(new Set(["romantis", "umum", "acara"]));
    expect(new Set(PRESETS.map((t) => `${t.size.width}x${t.size.height}`))).toEqual(new Set(["600x1800", "1200x1500"]));
  });
  it("frame tema acara tersedia", () => {
    const ids = PRESETS.filter((t) => t.category === "acara").map((t) => t.id);
    expect(ids).toEqual(expect.arrayContaining(["halloween", "graduation-day", "valentine", "happy-new-year"]));
  });
  it("semua bentuk foto dipakai minimal satu preset", () => {
    expect(new Set(PRESETS.map((t) => t.photo.shape))).toEqual(new Set(PHOTO_SHAPES));
  });
  it("karakter bawaan cuma dari aset sendiri di folder characters", () => {
    for (const l of PRESETS.flatMap((t) => t.layers)) expect(l.src).toMatch(/^\/characters\//);
  });
});

describe("LAYOUTS", () => {
  const ids = Object.keys(LAYOUTS) as LayoutId[];
  it.each(ids)("%s lolos schema: slot nggak menimpa dan nggak keluar print", (id) => {
    expect(() => parseTemplate(applyLayout(newTemplate("t"), id))).not.toThrow();
  });
  it.each(ids)("%s dikenali lagi dari posisi slot-nya", (id) => {
    expect(layoutOf(applyLayout(newTemplate("t"), id))).toBe(id);
  });
});

describe("frame lama", () => {
  it("frame tanpa motif, bentuk, dan garis tepi tetap valid dengan nilai default", () => {
    const old: Record<string, unknown> = { ...base, photo: { radius: 20 } };
    delete old.pattern;
    const parsed = parseTemplate(old);
    expect(parsed.pattern).toBe("none");
    expect(parsed.photo).toEqual({ radius: 20, shape: "rounded", outline: "#ffffff" });
  });
});

describe("safeParseTemplate", () => {
  it("menolak data yang bukan template", () => {
    expect(safeParseTemplate("rusak").success).toBe(false);
    expect(safeParseTemplate({ id: "x" }).success).toBe(false);
  });
  it("menolak warna yang bukan #RRGGBB", () => {
    expect(safeParseTemplate({ ...base, background: { color: "pink" } }).success).toBe(false);
  });
  it("menolak id dengan huruf besar atau spasi", () => {
    expect(safeParseTemplate({ ...base, id: "Blush Baru" }).success).toBe(false);
  });
  it("menolak slot yang tumpang tindih", () => {
    expect(safeParseTemplate({ ...base, slots: [base.slots[0], base.slots[0]] }).success).toBe(false);
  });
  it("menolak slot yang menimpa area teks", () => {
    expect(safeParseTemplate({ ...base, slots: [base.textArea] }).success).toBe(false);
  });
  it("menolak slot yang keluar dari print", () => {
    expect(safeParseTemplate({ ...base, slots: [{ x: 0.8, y: 0, width: 0.5, height: 0.1 }] }).success).toBe(false);
  });
  it("menolak gambar layer dari domain lain", () => {
    const l = { id: "a", src: "https://contoh.com/a.png", x: 0.5, y: 0.5, scale: 0.3, rot: 0, flip: false, aspect: 1 };
    expect(safeParseTemplate({ ...base, layers: [l] }).success).toBe(false);
  });
  it("menerima gambar layer hasil import", () => {
    const l = { id: "a", src: "data:image/png;base64,AAAA", x: 0.5, y: 0.5, scale: 0.3, rot: 0, flip: false, aspect: 1 };
    expect(safeParseTemplate({ ...base, layers: [l] }).success).toBe(true);
  });
  it("menolak lebih dari 12 layer", () => {
    const l = { id: "a", src: "/a.svg", x: 0.5, y: 0.5, scale: 0.3, rot: 0, flip: false, aspect: 1 };
    expect(safeParseTemplate({ ...base, layers: Array(13).fill(l) }).success).toBe(false);
  });
  it("menolak judul lebih dari 32 karakter", () => {
    expect(safeParseTemplate({ ...base, text: { ...base.text, title: "x".repeat(33) } }).success).toBe(false);
  });
});

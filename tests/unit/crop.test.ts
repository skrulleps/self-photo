import { describe, expect, it } from "vitest";
import { CENTERED, clampView, cropRect, panView, photoArea, zoomView } from "@/lib/render/crop";
import { coverCrop } from "@/lib/render/geometry";
import { PRESETS } from "@/lib/template/presets";

// gambar landscape 2000x1000 ke slot persegi
const W = 2000, H = 1000, SQUARE = 1;

describe("cropRect", () => {
  it("zoom 1 di tengah sama persis dengan crop bawaan render", () => {
    expect(cropRect(W, H, SQUARE, CENTERED)).toEqual(coverCrop(W, H, 1, 1));
  });
  it("zoom 2 mengambil setengah lebar dan tinggi", () => {
    const c = cropRect(W, H, SQUARE, { ...CENTERED, zoom: 2 });
    expect(c.sw).toBeCloseTo(500);
    expect(c.sh).toBeCloseTo(500);
    expect(c.sx).toBeCloseTo(750);
  });
  it("crop nggak pernah keluar dari gambar", () => {
    for (const v of [{ zoom: 1, cx: 0, cy: 0 }, { zoom: 3, cx: 1, cy: 1 }, { zoom: 9, cx: -5, cy: 7 }]) {
      const c = cropRect(W, H, SQUARE, v);
      expect(c.sx).toBeGreaterThanOrEqual(0);
      expect(c.sy).toBeGreaterThanOrEqual(0);
      expect(c.sx + c.sw).toBeLessThanOrEqual(W + 1e-9);
      expect(c.sy + c.sh).toBeLessThanOrEqual(H + 1e-9);
    }
  });
  it("crop selalu sebanding dengan slot", () => {
    const c = cropRect(W, H, 0.75, { zoom: 1.7, cx: 0.2, cy: 0.6 });
    expect(c.sw / c.sh).toBeCloseTo(0.75);
  });
  it("angka rusak balik ke tengah tanpa zoom", () => {
    expect(cropRect(W, H, SQUARE, { zoom: NaN, cx: NaN, cy: Infinity })).toEqual(cropRect(W, H, SQUARE, CENTERED));
  });
});

describe("panView", () => {
  it("geser ke kanan bikin gambar ikut ke kanan, jadi bagian kiri yang kelihatan", () => {
    const v = panView(W, H, SQUARE, CENTERED, 0.1, 0);
    expect(v.cx).toBeLessThan(0.5);
  });
  it("geser sejauh satu kotak memindahkan crop selebar crop", () => {
    const v = panView(W, H, SQUARE, CENTERED, -0.5, 0);
    // crop 1000px, geser setengah kotak = 500px ke kanan di gambar asli
    expect(v.cx * W).toBeCloseTo(1500);
  });
  it("berhenti di tepi gambar", () => {
    const v = panView(W, H, SQUARE, CENTERED, 5, 5);
    expect(cropRect(W, H, SQUARE, v).sx).toBeCloseTo(0);
    expect(v.cy).toBeCloseTo(0.5);
  });
});

describe("zoomView", () => {
  it("dibatasi 1 sampai 4", () => {
    expect(zoomView(W, H, SQUARE, CENTERED, 0.2).zoom).toBe(1);
    expect(zoomView(W, H, SQUARE, CENTERED, 10).zoom).toBe(4);
  });
  it("zoom keluar di dekat tepi menarik titik tengah balik ke dalam", () => {
    const zoomed = panView(W, H, SQUARE, { ...CENTERED, zoom: 4 }, 5, 0);
    const out = zoomView(W, H, SQUARE, zoomed, 1);
    expect(cropRect(W, H, SQUARE, out).sx).toBeGreaterThanOrEqual(0);
  });
});

describe("clampView", () => {
  it("view yang udah rapi nggak berubah", () => {
    const v = { zoom: 2, cx: 0.5, cy: 0.5 };
    expect(clampView(W, H, SQUARE, v)).toEqual(v);
  });
});

describe("photoArea", () => {
  const strip = PRESETS.find((t) => t.id === "blush")!;
  it("hati di slot strip 520x390 jadi persegi", () => {
    expect(photoArea({ ...strip, photo: { ...strip.photo, shape: "heart" } }, 0).aspect).toBeCloseTo(1);
  });
  it("kotak di slot strip ikut slotnya, dihitung dalam pixel print", () => {
    expect(photoArea({ ...strip, photo: { ...strip.photo, shape: "rounded" } }, 0).aspect).toBeCloseTo(520 / 390);
  });
  it("index di luar jumlah slot pakai slot terakhir", () => {
    expect(() => photoArea(strip, 99)).not.toThrow();
  });
});

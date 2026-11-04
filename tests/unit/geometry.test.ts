import { describe, expect, it } from "vitest";
import { clientToCanvas, coverCrop, fitFontSize, fitWithin, hitTestLayers, layerSize, rectsOverlap } from "@/lib/render/geometry";
import type { Layer } from "@/lib/template/types";

const SIZE = { width: 600, height: 1800 };
const layer = (id: string, patch: Partial<Layer> = {}): Layer =>
  ({ id, src: "/a.svg", x: 0.5, y: 0.5, scale: 0.5, rot: 0, flip: false, aspect: 0.5, ...patch });

describe("layerSize", () => {
  it("lebar relatif ke print, tinggi mengikuti rasio gambar", () => {
    expect(layerSize(layer("a"), 600)).toEqual({ width: 300, height: 150 });
  });
});

describe("clientToCanvas", () => {
  it("koordinat layar diubah ke pixel print walau canvas tampil lebih kecil", () => {
    const box = { left: 10, top: 20, width: 200, height: 600 };
    expect(clientToCanvas(110, 320, box, SIZE)).toEqual({ x: 300, y: 900 });
  });
});

describe("hitTestLayers", () => {
  it("kena layer kalau titiknya di dalam, luput kalau di luar", () => {
    const layers = [layer("a")];
    expect(hitTestLayers(layers, SIZE, 300, 900)?.id).toBe("a");
    expect(hitTestLayers(layers, SIZE, 300, 1000)).toBeUndefined();
  });
  it("layer yang menumpuk: yang paling atas yang kena", () => {
    expect(hitTestLayers([layer("bawah"), layer("atas")], SIZE, 300, 900)?.id).toBe("atas");
  });
  it("sadar rotasi: diputar 90 derajat, area kenanya ikut berputar", () => {
    const rotated = [layer("a", { rot: 90 })];
    expect(hitTestLayers(rotated, SIZE, 300, 1000)?.id).toBe("a");
    expect(hitTestLayers(rotated, SIZE, 420, 900)).toBeUndefined();
  });
});

describe("coverCrop", () => {
  it("motong kiri-kanan foto landscape ke slot kotak", () => {
    expect(coverCrop(1600, 900, 500, 500)).toEqual({ sx: 350, sy: 0, sw: 900, sh: 900 });
  });
  it("aspect ratio hasil sama dengan slot", () => {
    const c = coverCrop(1280, 960, 520, 390);
    expect(c.sw / c.sh).toBeCloseTo(520 / 390);
  });
});

describe("fitFontSize", () => {
  it("pakai ukuran maksimal kalau teksnya muat", () => {
    expect(fitFontSize(400, 500, 64)).toBe(64);
  });
  it("mengecil sebanding kalau teksnya kepanjangan", () => {
    expect(fitFontSize(1000, 500, 64)).toBe(32);
  });
  it("nggak lebih kecil dari ukuran minimal", () => {
    expect(fitFontSize(100000, 500, 64, 16)).toBe(16);
  });
});

describe("fitWithin", () => {
  it("foto kecil nggak diperbesar", () => {
    expect(fitWithin(800, 600, 2000)).toEqual({ width: 800, height: 600 });
  });
  it("foto besar dikecilkan dengan rasio tetap", () => {
    expect(fitWithin(4000, 3000, 2000)).toEqual({ width: 2000, height: 1500 });
  });
});

describe("rectsOverlap", () => {
  const a = { x: 0, y: 0, width: 0.5, height: 0.5 };
  it("mendeteksi dua area yang menimpa", () => {
    expect(rectsOverlap(a, { x: 0.25, y: 0.25, width: 0.5, height: 0.5 })).toBe(true);
  });
  it("area yang cuma bersentuhan nggak dianggap menimpa", () => {
    expect(rectsOverlap(a, { x: 0.5, y: 0, width: 0.5, height: 0.5 })).toBe(false);
  });
});

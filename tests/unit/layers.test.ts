import { describe, expect, it } from "vitest";
import { addLayer, grabOffset, MAX_LAYERS, moveLayerTo, newLayer, removeLayer, shiftLayer, updateLayer } from "@/lib/template/layers";
import { newTemplate } from "@/lib/template/presets";

const base = newTemplate("t");
const withLayers = (...ids: string[]) => ids.reduce((t, id) => addLayer(t, newLayer(id, "/a.svg", 1)), base);

describe("addLayer", () => {
  it("nambah layer ke paling atas", () => {
    expect(withLayers("a", "b").layers.map((l) => l.id)).toEqual(["a", "b"]);
  });
  it("berhenti di batas maksimal", () => {
    const ids = Array.from({ length: MAX_LAYERS + 3 }, (_, i) => `l${i}`);
    expect(withLayers(...ids).layers).toHaveLength(MAX_LAYERS);
  });
});

describe("updateLayer", () => {
  it("cuma mengubah layer yang dimaksud", () => {
    const t = updateLayer(withLayers("a", "b"), "b", { flip: true });
    expect(t.layers[0].flip).toBe(false);
    expect(t.layers[1].flip).toBe(true);
  });
  it("posisi dan ukuran dijaga tetap dalam batas", () => {
    const [l] = updateLayer(withLayers("a"), "a", { x: 2, y: -1, scale: 9 }).layers;
    expect(l).toMatchObject({ x: 1, y: 0, scale: 1 });
  });
});

describe("moveLayerTo", () => {
  it("pixel disimpan sebagai posisi ternormalisasi", () => {
    const [l] = moveLayerTo(withLayers("a"), "a", 150, 900).layers;
    expect(l.x).toBeCloseTo(150 / base.size.width);
    expect(l.y).toBeCloseTo(900 / base.size.height);
  });
});

describe("grabOffset", () => {
  it("menyimpan jarak titik pegang ke tengah layer", () => {
    const l = newLayer("a", "/a.svg", 1);
    const o = grabOffset(l, base.size, 310, 905);
    expect(o.dx).toBeCloseTo(10);
    expect(o.dy).toBeCloseTo(5);
  });
});

describe("removeLayer", () => {
  it("menghapus layer yang dimaksud", () => {
    expect(removeLayer(withLayers("a", "b"), "a").layers.map((l) => l.id)).toEqual(["b"]);
  });
});

describe("shiftLayer", () => {
  it("naik dan turun menukar urutan", () => {
    const t = withLayers("a", "b");
    expect(shiftLayer(t, "a", "naik").layers.map((l) => l.id)).toEqual(["b", "a"]);
    expect(shiftLayer(t, "b", "turun").layers.map((l) => l.id)).toEqual(["b", "a"]);
  });
  it("di ujung tumpukan nggak berubah", () => {
    const t = withLayers("a", "b");
    expect(shiftLayer(t, "b", "naik")).toBe(t);
    expect(shiftLayer(t, "a", "turun")).toBe(t);
  });
});

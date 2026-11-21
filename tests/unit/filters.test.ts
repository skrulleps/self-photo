import { describe, expect, it } from "vitest";
import { applyMatrix, FILTER_IDS, FILTER_LABELS, FILTERS, isFilterId, matrixValues, saturate } from "@/lib/render/filters";

const px = (...rgba: number[]) => new Uint8ClampedArray(rgba);
const IDENTITY = saturate(1);

describe("FILTERS", () => {
  it("tiap filter punya label dan matrix 4x5", () => {
    for (const id of FILTER_IDS) {
      expect(FILTER_LABELS[id]).toBeTruthy();
      const m = FILTERS[id];
      if (m) expect(m).toHaveLength(20);
    }
  });
  it("normal nggak mengubah apa-apa", () => {
    expect(FILTERS.normal).toBeNull();
  });
  it("nggak ada filter yang mengubah transparansi", () => {
    for (const m of Object.values(FILTERS)) if (m) expect(m.slice(15)).toEqual([0, 0, 0, 1, 0]);
  });
});

describe("applyMatrix", () => {
  it("saturate 1 sama dengan nggak difilter", () => {
    const d = px(200, 100, 50, 255);
    applyMatrix(d, IDENTITY);
    expect([...d]).toEqual([200, 100, 50, 255]);
  });
  it("hitam putih bikin R, G, B sama", () => {
    const d = px(200, 100, 50, 255, 10, 220, 90, 255);
    applyMatrix(d, FILTERS.bw!);
    expect(d[0]).toBe(d[1]);
    expect(d[1]).toBe(d[2]);
    expect(d[4]).toBe(d[6]);
  });
  it("hasil di luar 0..255 dipotong, bukan muter", () => {
    const d = px(255, 255, 255, 255);
    applyMatrix(d, FILTERS.vivid!.map((v, i) => (i === 4 ? 1 : v)));
    expect(d[0]).toBe(255);
  });
  it("hangat menaikkan merah dan menurunkan biru", () => {
    const d = px(128, 128, 128, 255);
    applyMatrix(d, FILTERS.warm!);
    expect(d[0]).toBeGreaterThan(128);
    expect(d[2]).toBeLessThan(128);
  });
  it("offset dihitung dalam 0..1, jadi dikali 255", () => {
    const lift = [1, 0, 0, 0, 0.1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0];
    const d = px(0, 0, 0, 255);
    applyMatrix(d, lift);
    expect(d[0]).toBe(26);
  });
});

describe("matrixValues", () => {
  it("dipisah spasi buat atribut values SVG", () => {
    expect(matrixValues([1, 0, 0.5])).toBe("1 0 0.5");
  });
});

describe("isFilterId", () => {
  it("cuma menerima filter yang ada", () => {
    expect(isFilterId("sepia")).toBe(true);
    expect(isFilterId("constructor")).toBe(false);
    expect(isFilterId(3)).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { coverCrop } from "@/lib/render/geometry";

describe("coverCrop", () => {
  it("motong kiri-kanan foto landscape ke slot kotak", () => {
    expect(coverCrop(1600, 900, 500, 500)).toEqual({ sx: 350, sy: 0, sw: 900, sh: 900 });
  });
  it("aspect ratio hasil sama dengan slot", () => {
    const c = coverCrop(1280, 960, 520, 390);
    expect(c.sw / c.sh).toBeCloseTo(520 / 390);
  });
});
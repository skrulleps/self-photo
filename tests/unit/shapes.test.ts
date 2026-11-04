import { describe, expect, it } from "vitest";
import { traceShape, type ShapeCtx } from "@/lib/render/shapes";
import { PHOTO_SHAPES } from "@/lib/template/types";

const BOX = { x: 100, y: 200, width: 400, height: 300 };

function recorder({ roundRect = true } = {}) {
  const points: [number, number][] = [];
  const names: string[] = [];
  const pairs = (name: string) => (...a: number[]) => {
    names.push(name);
    for (let i = 0; i + 1 < a.length; i += 2) points.push([a[i], a[i + 1]]);
  };
  const ctx = {
    moveTo: pairs("moveTo"),
    lineTo: pairs("lineTo"),
    bezierCurveTo: pairs("bezierCurveTo"),
    closePath: () => { names.push("closePath"); },
    arc: (cx: number, cy: number, r: number) => {
      names.push("arc");
      points.push([cx - r, cy - r], [cx + r, cy + r]);
    },
    rect: (x: number, y: number, w: number, h: number) => { names.push("rect"); points.push([x, y], [x + w, y + h]); },
    ...(roundRect ? {
      roundRect: (x: number, y: number, w: number, h: number) => { names.push("roundRect"); points.push([x, y], [x + w, y + h]); },
    } : {}),
  } as unknown as ShapeCtx;
  return { ctx, points, names };
}

describe("traceShape", () => {
  it.each(PHOTO_SHAPES)("%s nggak keluar dari kotak slot", (shape) => {
    const { ctx, points } = recorder();
    traceShape(ctx, shape, BOX, 20);
    expect(points.length).toBeGreaterThan(0);
    for (const [x, y] of points) {
      expect(x).toBeGreaterThanOrEqual(BOX.x - 1e-6);
      expect(x).toBeLessThanOrEqual(BOX.x + BOX.width + 1e-6);
      expect(y).toBeGreaterThanOrEqual(BOX.y - 1e-6);
      expect(y).toBeLessThanOrEqual(BOX.y + BOX.height + 1e-6);
    }
  });
  it("rounded pakai roundRect kalau browsernya punya", () => {
    const { ctx, names } = recorder();
    traceShape(ctx, "rounded", BOX, 20);
    expect(names).toEqual(["roundRect"]);
  });
  it("browser tanpa roundRect fallback ke rect", () => {
    const { ctx, names } = recorder({ roundRect: false });
    traceShape(ctx, "rounded", BOX, 20);
    expect(names).toEqual(["rect"]);
  });
  it("hati tetap proporsional walau slotnya melebar", () => {
    const { ctx, points } = recorder();
    traceShape(ctx, "heart", BOX);
    const xs = points.map(([x]) => x);
    expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(BOX.height);
  });
});

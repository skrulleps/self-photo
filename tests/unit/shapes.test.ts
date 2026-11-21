import { describe, expect, it } from "vitest";
import { maskOutsideShape, shapeBounds, traceShape, type ShapeCtx } from "@/lib/render/shapes";
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

describe("maskOutsideShape", () => {
  function maskCtx() {
    const calls: { name: string; args: unknown[] }[] = [];
    const rec = (name: string) => (...args: unknown[]) => { calls.push({ name, args }); };
    const ctx = {
      fillStyle: "", beginPath: rec("beginPath"), fill: rec("fill"), rect: rec("rect"), roundRect: rec("roundRect"),
      moveTo: rec("moveTo"), lineTo: rec("lineTo"), bezierCurveTo: rec("bezierCurveTo"), arc: rec("arc"), closePath: rec("closePath"),
    };
    return { ctx, calls };
  }
  it("kotak penuh ditambah bentuk, diisi evenodd biar bagian dalam bentuk tetap bening", () => {
    const { ctx, calls } = maskCtx();
    maskOutsideShape(ctx as never, "heart", 400, 300, 0, "#ffffff99");
    expect(calls[0].name).toBe("beginPath");
    expect(calls[1]).toEqual({ name: "rect", args: [0, 0, 400, 300] });
    expect(calls.at(-1)).toEqual({ name: "fill", args: ["evenodd"] });
    expect(ctx.fillStyle).toBe("#ffffff99");
  });
  it("sudut membulat pakai radius yang dikirim", () => {
    const { ctx, calls } = maskCtx();
    maskOutsideShape(ctx as never, "rounded", 400, 300, 24, "#fff");
    expect(calls.find((c) => c.name === "roundRect")?.args).toEqual([0, 0, 400, 300, 24]);
  });
});

describe("shapeBounds", () => {
  const wide = { x: 40, y: 40, width: 520, height: 390 };
  it.each(["circle", "heart", "star", "flower"] as const)("%s cuma menempati persegi di tengah slot", (shape) => {
    expect(shapeBounds(shape, wide)).toEqual({ x: 105, y: 40, width: 390, height: 390 });
  });
  it.each(["rounded", "arch", "cloud"] as const)("%s memenuhi seluruh slot", (shape) => {
    expect(shapeBounds(shape, wide)).toEqual(wide);
  });
  it("slot tinggi: perseginya di tengah secara vertikal", () => {
    expect(shapeBounds("circle", { x: 0, y: 0, width: 100, height: 300 })).toEqual({ x: 0, y: 100, width: 100, height: 100 });
  });
});

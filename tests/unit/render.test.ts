import { describe, expect, it } from "vitest";
import { renderPrint, resolveText, type Ctx2D, type Photo } from "@/lib/render/render";
import { coverCrop, toPx } from "@/lib/render/geometry";
import { PRESETS } from "@/lib/template/presets";

const template = PRESETS[0];
const photo = (width = 1280, height = 960) => ({ width, height }) as unknown as Photo;

function mockCtx({ roundRect = true } = {}) {
  const calls: { name: string; args: unknown[]; font: string }[] = [];
  const rec = (name: string) => (...args: unknown[]) => { calls.push({ name, args, font: ctx.font }); };
  const ctx = {
    fillStyle: "", strokeStyle: "", lineWidth: 1, font: "", textAlign: "start", textBaseline: "alphabetic",
    save: rec("save"), restore: rec("restore"), beginPath: rec("beginPath"), clip: rec("clip"),
    rect: rec("rect"), fillRect: rec("fillRect"), strokeRect: rec("strokeRect"), fillText: rec("fillText"), drawImage: rec("drawImage"),
    translate: rec("translate"), rotate: rec("rotate"), scale: rec("scale"), globalAlpha: 1,
    fill: rec("fill"), stroke: rec("stroke"), moveTo: rec("moveTo"), lineTo: rec("lineTo"),
    bezierCurveTo: rec("bezierCurveTo"), arc: rec("arc"), closePath: rec("closePath"),
    ...(roundRect ? { roundRect: rec("roundRect") } : {}),
    // lebar palsu: tiap karakter selebar setengah ukuran font
    measureText: (t: string) => ({ width: t.length * parseFloat(ctx.font.split(" ")[1]) * 0.5 }),
  } as unknown as Ctx2D;
  const named = (name: string) => calls.filter((c) => c.name === name);
  return { ctx, calls, named };
}

describe("resolveText", () => {
  it("teks tamu mengalahkan teks template", () => {
    expect(resolveText(template, { title: "budi & ani" }).title).toBe("budi & ani");
  });
  it("teks tamu kosong atau spasi balik ke teks template", () => {
    expect(resolveText(template, { title: "   " }).title).toBe(template.text.title);
    expect(resolveText(template).title).toBe(template.text.title);
  });
});

describe("renderPrint: layer", () => {
  const layered = { ...template, layers: [{ id: "a", src: "/a.svg", x: 0.5, y: 0.25, scale: 0.5, rot: 90, flip: true, aspect: 2 }] };
  const img = photo(100, 200);
  const images = () => img;

  it("gambar belum siap: layer dilewati tanpa error", () => {
    const { ctx, named } = mockCtx();
    renderPrint(ctx, { template: layered });
    expect(named("drawImage")).toHaveLength(0);
    expect(named("translate")).toHaveLength(0);
  });
  it("digambar di posisi, putaran, dan arah yang benar", () => {
    const { ctx, named } = mockCtx();
    renderPrint(ctx, { template: layered, images });
    expect(named("translate")[0].args).toEqual([300, 450]);
    expect(named("rotate")[0].args[0] as number).toBeCloseTo(Math.PI / 2);
    expect(named("scale")[0].args).toEqual([-1, 1]);
    expect(named("drawImage")[0].args).toEqual([img, -150, -300, 300, 600]);
  });
  it("layer digambar setelah teks", () => {
    const { ctx, calls } = mockCtx();
    renderPrint(ctx, { template: layered, images });
    const names = calls.map((c) => c.name);
    expect(names.lastIndexOf("fillText")).toBeLessThan(names.indexOf("drawImage"));
  });
  it("outline seleksi cuma muncul kalau selectedLayer dikirim", () => {
    const plain = mockCtx(), selected = mockCtx();
    renderPrint(plain.ctx, { template: layered, images });
    renderPrint(selected.ctx, { template: layered, images, selectedLayer: "a" });
    expect(plain.named("strokeRect")).toHaveLength(0);
    expect(selected.named("strokeRect")).toHaveLength(1);
  });
});

describe("renderPrint", () => {
  it("menggambar tiap foto ke slot-nya dengan crop tanpa distorsi", () => {
    const { ctx, named } = mockCtx();
    renderPrint(ctx, { template, photos: [photo(), photo(), photo()] });
    const draws = named("drawImage");
    expect(draws).toHaveLength(3);
    const r = toPx(template.slots[1], template.size);
    const c = coverCrop(1280, 960, r.width, r.height);
    expect(draws[1].args.slice(1)).toEqual([c.sx, c.sy, c.sw, c.sh, r.x, r.y, r.width, r.height]);
  });
  it("foto kurang dari slot: slot sisanya tetap placeholder", () => {
    const { ctx, named } = mockCtx();
    renderPrint(ctx, { template, photos: [photo()] });
    expect(named("drawImage")).toHaveLength(1);
    expect(named("fillRect")).toHaveLength(1 + template.slots.length - 1);
  });
  it("tanpa foto: nggak ada drawImage, slot tetap terisi placeholder", () => {
    const { ctx, named } = mockCtx();
    renderPrint(ctx, { template });
    expect(named("drawImage")).toHaveLength(0);
    expect(named("fillRect")).toHaveLength(1 + template.slots.length);
  });
  it("foto digambar sebelum teks", () => {
    const { ctx, calls } = mockCtx();
    renderPrint(ctx, { template, photos: [photo()] });
    const names = calls.map((c) => c.name);
    expect(names.lastIndexOf("drawImage")).toBeLessThan(names.indexOf("fillText"));
  });
  it("menulis judul lalu teks kecil dengan teks tamu", () => {
    const { ctx, named } = mockCtx();
    renderPrint(ctx, { template, text: { title: "budi", subtitle: "3 November 2026" } });
    const [t, s] = named("fillText");
    expect(t.args[0]).toBe("budi");
    expect(s.args[0]).toBe("3 November 2026");
    expect(s.args[2] as number).toBeGreaterThan(t.args[2] as number);
  });
  it("tanpa teks kecil cuma menulis judul, pas di tengah area", () => {
    const { ctx, named } = mockCtx();
    renderPrint(ctx, { template });
    const a = toPx(template.textArea, template.size);
    const writes = named("fillText");
    expect(writes).toHaveLength(1);
    expect(writes[0].args[2] as number).toBeCloseTo(a.y + a.height / 2);
  });
  it("judul 32 karakter mengecil biar muat di area teks", () => {
    const { ctx, named } = mockCtx();
    const long = "x".repeat(32);
    renderPrint(ctx, { template, text: { title: long } });
    const size = parseFloat(named("fillText")[0].font.split(" ")[1]);
    expect(long.length * size * 0.5).toBeLessThanOrEqual(toPx(template.textArea, template.size).width);
  });
  it("browser tanpa roundRect fallback ke rect, buat clip dan garis tepi", () => {
    const { ctx, named } = mockCtx({ roundRect: false });
    const rounded = { ...template, photo: { ...template.photo, shape: "rounded" as const } };
    renderPrint(ctx, { template: rounded });
    expect(named("rect")).toHaveLength(template.slots.length * 2);
  });
  it("tiap slot dapat garis tepi", () => {
    const { ctx, named } = mockCtx();
    renderPrint(ctx, { template });
    expect(named("stroke")).toHaveLength(template.slots.length);
  });
  it("motif digambar sebelum foto, polos nggak menggambar apa-apa", () => {
    const hearts = mockCtx(), plain = mockCtx();
    renderPrint(hearts.ctx, { template: { ...template, pattern: "hearts" }, photos: [photo()] });
    renderPrint(plain.ctx, { template: { ...template, pattern: "none" } });
    const names = hearts.calls.map((c) => c.name);
    expect(names.indexOf("fill")).toBeLessThan(names.indexOf("drawImage"));
    expect(plain.named("fill")).toHaveLength(0);
  });
  it("motif garis menambah fillRect tanpa menyentuh fill", () => {
    const { ctx, named } = mockCtx();
    renderPrint(ctx, { template: { ...template, pattern: "stripes" } });
    expect(named("fill")).toHaveLength(0);
    expect(named("fillRect").length).toBeGreaterThan(1 + template.slots.length);
  });
  it("nama font diterjemahkan lewat fonts kalau dikirim", () => {
    const { ctx, named } = mockCtx();
    renderPrint(ctx, { template, fonts: () => "FontAsli" });
    expect(named("fillText")[0].font).toContain("FontAsli");
  });
  it("save dan restore selalu berpasangan", () => {
    const { ctx, named } = mockCtx();
    renderPrint(ctx, { template, photos: [photo()] });
    expect(named("save").length).toBe(named("restore").length);
  });
  it("input sama menghasilkan panggilan yang sama", () => {
    const a = mockCtx(), b = mockCtx();
    const p = [photo()];
    renderPrint(a.ctx, { template, photos: p, text: { subtitle: "x" } });
    renderPrint(b.ctx, { template, photos: p, text: { subtitle: "x" } });
    expect(a.calls).toEqual(b.calls);
  });
});

import { describe, expect, it } from "vitest";
import { boothReducer, initialBooth, type BoothEvent } from "@/lib/booth/machine";

const run = (evs: BoothEvent[]) => evs.reduce(boothReducer, initialBooth);
const start3: BoothEvent = { type: "START", total: 3 };
const tick3: BoothEvent[] = [{ type: "TICK" }, { type: "TICK" }, { type: "TICK" }];
const shot: BoothEvent[] = [{ type: "SHOOT" }, ...tick3, { type: "CAPTURED" }];
const picked: BoothEvent = { type: "PICKED" };

describe("boothReducer", () => {
  it("mulai sesi nunggu di preview kamera, belum countdown", () => {
    expect(run([start3])).toMatchObject({ phase: "ready", shot: 0, total: 3 });
  });
  it("klik jepret baru mulai countdown 3", () => {
    expect(run([start3, { type: "SHOOT" }])).toMatchObject({ phase: "countdown", count: 3 });
  });
  it("countdown 3 lalu capturing", () => {
    expect(run([start3, { type: "SHOOT" }, ...tick3]).phase).toBe("capturing");
  });
  it("setelah foto tersimpan balik nunggu klik, nggak lanjut sendiri", () => {
    expect(run([start3, ...shot])).toMatchObject({ phase: "ready", shot: 1 });
  });
  it("3 foto lalu review", () => {
    expect(run([start3, ...shot, ...shot, ...shot]).phase).toBe("review");
  });
  it("gambar dari device ngisi satu slot, lalu nunggu slot berikutnya", () => {
    expect(run([start3, picked])).toMatchObject({ phase: "ready", shot: 1 });
  });
  it("kamera dan device bisa dicampur sampai penuh", () => {
    expect(run([start3, ...shot, picked, ...shot]).phase).toBe("review");
  });
  it("gambar dari device saat countdown diabaikan", () => {
    expect(run([start3, { type: "SHOOT" }, picked])).toMatchObject({ phase: "countdown", shot: 0 });
  });
  it("event yang salah fase diabaikan", () => {
    expect(run([{ type: "TICK" }, { type: "CAPTURED" }, { type: "SHOOT" }, picked])).toEqual(initialBooth);
  });
  it("tick saat nunggu klik diabaikan", () => {
    expect(run([start3, { type: "TICK" }]).phase).toBe("ready");
  });
  it("batal dari sesi balik ke awal", () => {
    expect(run([start3, ...shot, { type: "CANCEL" }])).toEqual(initialBooth);
  });
  it("batal di tengah countdown diabaikan", () => {
    expect(run([start3, { type: "SHOOT" }, { type: "CANCEL" }]).phase).toBe("countdown");
  });
  it("ulangi dari review balik ke awal", () => {
    expect(run([{ type: "START", total: 1 }, ...shot, { type: "RETAKE" }])).toEqual(initialBooth);
  });
  it("ulangi di tengah countdown diabaikan", () => {
    expect(run([start3, { type: "SHOOT" }, { type: "RETAKE" }]).phase).toBe("countdown");
  });
  it("start tanpa slot diabaikan", () => {
    expect(run([{ type: "START", total: 0 }])).toEqual(initialBooth);
  });
});

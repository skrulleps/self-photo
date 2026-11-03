import { describe, expect, it } from "vitest";
import { boothReducer, initialBooth, type BoothEvent } from "@/lib/booth/machine";

const run = (evs: BoothEvent[]) => evs.reduce(boothReducer, initialBooth);
const tick3: BoothEvent[] = [{ type: "TICK" }, { type: "TICK" }, { type: "TICK" }];

describe("boothReducer", () => {
  it("countdown 3 lalu capturing", () => {
    expect(run([{ type: "START", total: 3 }, ...tick3]).phase).toBe("capturing");
  });
  it("3 foto lalu review", () => {
    const shot = [...tick3, { type: "CAPTURED" } as BoothEvent];
    expect(run([{ type: "START", total: 3 }, ...shot, ...shot, ...shot]).phase).toBe("review");
  });
  it("event yang salah fase diabaikan", () => {
    expect(run([{ type: "TICK" }, { type: "CAPTURED" }])).toEqual(initialBooth);
  });
});

import { describe, expect, it } from "vitest";
import { mailtoLink } from "@/lib/export/savePrint";

describe("mailtoLink", () => {
  it("subjek dan isi di-encode biar spasi dan simbolnya nggak rusak", () => {
    expect(mailtoLink("Foto & kenangan", "Hai! 100%")).toBe("mailto:?subject=Foto%20%26%20kenangan&body=Hai!%20100%25");
  });
  it("penerima dikosongkan, biar pengguna yang mengisi", () => {
    expect(mailtoLink("a", "b").startsWith("mailto:?")).toBe(true);
  });
});

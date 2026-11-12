import { describe, expect, it } from "vitest";
import { IMAGE_FORMATS, mailtoLink, printFileName } from "@/lib/export/savePrint";

describe("mailtoLink", () => {
  it("subjek dan isi di-encode biar spasi dan simbolnya nggak rusak", () => {
    expect(mailtoLink("Foto & kenangan", "Hai! 100%")).toBe("mailto:?subject=Foto%20%26%20kenangan&body=Hai!%20100%25");
  });
  it("penerima dikosongkan, biar pengguna yang mengisi", () => {
    expect(mailtoLink("a", "b").startsWith("mailto:?")).toBe(true);
  });
});

describe("printFileName", () => {
  it("ekstensi ikut format yang dipilih", () => {
    expect(printFileName("blush", "png")).toBe("studio-jepret-blush.png");
    expect(printFileName("blush", "jpg")).toBe("studio-jepret-blush.jpg");
  });
  it("semua format punya nama file", () => {
    for (const f of IMAGE_FORMATS) expect(printFileName("x", f).endsWith(`.${f}`)).toBe(true);
  });
});

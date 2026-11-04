import { describe, expect, it } from "vitest";
import { loadTemplates, saveTemplates, upsertTemplate } from "@/lib/template/store";
import { newTemplate } from "@/lib/template/presets";

function memory(initial?: string) {
  let value = initial ?? null;
  return { getItem: () => value, setItem: (_: string, v: string) => { value = v; } };
}

describe("loadTemplates", () => {
  it("kosong kalau belum pernah simpan", () => {
    expect(loadTemplates(memory())).toEqual([]);
  });
  it("JSON rusak nggak bikin crash", () => {
    expect(loadTemplates(memory("{rusak"))).toEqual([]);
  });
  it("entri nggak valid dibuang, yang valid tetap kepakai", () => {
    const good = newTemplate("baik");
    expect(loadTemplates(memory(JSON.stringify([{ id: "x" }, good])))).toEqual([good]);
  });
});

describe("saveTemplates", () => {
  it("simpan lalu muat hasilnya sama", () => {
    const store = memory();
    const list = [newTemplate("a"), newTemplate("b")];
    expect(saveTemplates(store, list)).toBe(true);
    expect(loadTemplates(store)).toEqual(list);
  });
  it("mengembalikan false kalau penyimpanan penuh", () => {
    const full = { getItem: () => null, setItem: () => { throw new Error("QuotaExceededError"); } };
    expect(saveTemplates(full, [newTemplate("a")])).toBe(false);
  });
});

describe("upsertTemplate", () => {
  it("id baru ditambahkan", () => {
    expect(upsertTemplate([newTemplate("a")], newTemplate("b")).map((t) => t.id)).toEqual(["a", "b"]);
  });
  it("id lama diganti di tempatnya", () => {
    const changed = { ...newTemplate("a"), name: "Baru" };
    const out = upsertTemplate([newTemplate("a"), newTemplate("b")], changed);
    expect(out.map((t) => t.name)).toEqual(["Baru", "Frame baru"]);
  });
});

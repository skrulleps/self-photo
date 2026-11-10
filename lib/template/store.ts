import { safeParseTemplate } from "./schema";
import type { Template } from "./types";

const KEY = "studio-jepret:templates";

type Store = Pick<Storage, "getItem" | "setItem">;

// data dari localStorage bisa rusak atau versi lama: yang nggak valid dibuang, sisanya tetap kepakai
export function loadTemplates(store: Store): Template[] {
  try {
    const raw: unknown = JSON.parse(store.getItem(KEY) ?? "[]");
    if (!Array.isArray(raw)) return [];
    return raw.flatMap((item) => {
      const parsed = safeParseTemplate(item);
      return parsed.success ? [parsed.data] : [];
    });
  } catch {
    return [];
  }
}

// false kalau penyimpanan penuh
export function saveTemplates(store: Store, templates: Template[]): boolean {
  try {
    store.setItem(KEY, JSON.stringify(templates));
    return true;
  } catch {
    return false;
  }
}

export function upsertTemplate(list: Template[], t: Template): Template[] {
  return list.some((x) => x.id === t.id) ? list.map((x) => (x.id === t.id ? t : x)) : [...list, t];
}

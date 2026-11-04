import { useSyncExternalStore } from "react";
import { loadTemplates, saveTemplates } from "@/lib/template/store";
import type { Template } from "@/lib/template/types";

const EMPTY: Template[] = [];
const listeners = new Set<() => void>();
let cache: Template[] | null = null;

const read = () => (cache ??= loadTemplates(window.localStorage));

const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
};

// saat prerender localStorage belum ada, jadi mulai dari daftar kosong
export const useCustomTemplates = () => useSyncExternalStore(subscribe, read, () => EMPTY);

export function writeCustomTemplates(list: Template[]): boolean {
  if (!saveTemplates(window.localStorage, list)) return false;
  cache = list;
  listeners.forEach((fn) => fn());
  return true;
}

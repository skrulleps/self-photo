import { z } from "zod";
import { rectsOverlap } from "@/lib/render/geometry";
import { MAX_LAYERS } from "./layers";
import { PATTERNS, PHOTO_SHAPES, type Template } from "./types";

export const TITLE_MAX = 32;

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Warna harus format #RRGGBB");

const rect = z.object({
  x: z.number().min(0),
  y: z.number().min(0),
  width: z.number().positive(),
  height: z.number().positive(),
}).refine((r) => r.x + r.width <= 1 + 1e-9 && r.y + r.height <= 1 + 1e-9, "Area keluar dari print");

const layer = z.object({
  id: z.string().min(1),
  // cuma data URL atau aset sendiri: gambar dari domain lain bikin canvas tainted dan export gagal
  src: z.string().refine((s) => s.startsWith("data:image/") || s.startsWith("/"), "Gambar harus dari aset sendiri atau file yang diimpor"),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  scale: z.number().positive(),
  rot: z.number(),
  flip: z.boolean(),
  aspect: z.number().positive(),
});

export const templateSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/, "id harus huruf kecil, angka, atau strip"),
  name: z.string().min(1),
  category: z.enum(["romantis", "umum", "acara"]),
  size: z.object({ width: z.number().int().positive(), height: z.number().int().positive() }),
  slots: z.array(rect).min(1).max(4),
  textArea: rect,
  background: z.object({ color: hex }),
  // default biar frame lama di localStorage tetap kepakai, nggak ikut terbuang
  pattern: z.enum(PATTERNS).default("none"),
  photo: z.object({
    radius: z.number().min(0),
    shape: z.enum(PHOTO_SHAPES).default("rounded"),
    outline: hex.default("#ffffff"),
  }),
  text: z.object({
    font: z.string().min(1),
    color: hex,
    title: z.string().max(TITLE_MAX),
    subtitle: z.string().max(TITLE_MAX),
  }),
  layers: z.array(layer).max(MAX_LAYERS),
}).superRefine((t, ctx) => {
  const areas = [...t.slots, t.textArea];
  areas.forEach((a, i) => areas.slice(i + 1).forEach((b) => {
    if (rectsOverlap(a, b)) ctx.addIssue({ code: "custom", message: "Slot dan area teks tidak boleh tumpang tindih", path: ["slots", i] });
  }));
});

export const parseTemplate = (data: unknown): Template => templateSchema.parse(data);

export const safeParseTemplate = (data: unknown) => templateSchema.safeParse(data);

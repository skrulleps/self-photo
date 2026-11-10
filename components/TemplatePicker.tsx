"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { getImage, loadImages } from "@/lib/export/imageCache";
import type { Category, Template } from "@/lib/template/types";
import PrintPreview from "./PrintPreview";

const SAMPLES = [1, 2, 3, 4].map((n) => `/samples/sample-${n}.svg`);
const FILTERS: { value: Category | "semua"; label: string }[] = [
  { value: "semua", label: "Semua" },
  { value: "acara", label: "Acara" },
  { value: "romantis", label: "Romantis" },
  { value: "umum", label: "Umum" },
];

interface Props {
  templates: Template[];
  customIds: string[];
  selectedId: string;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onEdit: (t: Template) => void;
  onDelete: (t: Template) => void;
}

export default function TemplatePicker({ templates, customIds, selectedId, onSelect, onCreate, onEdit, onDelete }: Props) {
  const [filter, setFilter] = useState<Category | "semua">("semua");
  const [samples, setSamples] = useState<HTMLImageElement[]>([]);
  const shown = templates.filter((t) => filter === "semua" || t.category === filter);

  useEffect(() => {
    let alive = true;
    // foto contoh cuma pemanis: kalau gagal dimuat, thumbnail tetap tampil dengan slot abu-abu
    loadImages(SAMPLES).then(() => {
      if (alive) setSamples(SAMPLES.flatMap((src) => getImage(src) ?? []));
    });
    return () => { alive = false; };
  }, []);

  return (
    <section aria-label="Pilih frame" className="card grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="card-title">Pilih frame</h2>
        <div role="group" aria-label="Filter kategori" className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button key={f.value} aria-pressed={filter === f.value} onClick={() => setFilter(f.value)} className="chip">
              {f.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid max-h-[32rem] grid-cols-[repeat(auto-fill,minmax(112px,1fr))] items-start gap-4 overflow-y-auto p-2">
        {shown.map((t) => (
          <div key={t.id} className="tilt grid gap-1">
            <button aria-pressed={t.id === selectedId} onClick={() => onSelect(t.id)} className="frame-card pop">
              {t.id === selectedId && <Image src="/characters/heart.svg" alt="" width={30} height={30} unoptimized className="frame-badge" />}
              <PrintPreview template={t} photos={samples} style={{ width: "100%", height: "auto", maxHeight: "none", borderRadius: 10 }} />
              {t.name}
            </button>
            {customIds.includes(t.id) && (
              <div className="flex justify-center gap-3 text-xs font-medium">
                <button className="underline" aria-label={`Ubah ${t.name}`} onClick={() => onEdit(t)}>Ubah</button>
                <button className="underline" aria-label={`Hapus ${t.name}`} onClick={() => onDelete(t)}>Hapus</button>
              </div>
            )}
          </div>
        ))}
        <button onClick={onCreate} className="create-card pop tilt">
          <Image src="/characters/star.svg" alt="" width={44} height={44} unoptimized />
          + Bikin frame
        </button>
      </div>
    </section>
  );
}

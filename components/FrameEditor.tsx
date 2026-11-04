"use client";
import { useRef, useState, type ChangeEvent, type PointerEvent } from "react";
import Image from "next/image";
import { loadCharacter } from "@/lib/camera/upload";
import { clientToCanvas, hitTestLayers } from "@/lib/render/geometry";
import { addLayer, grabOffset, MAX_LAYERS, moveLayerTo, newLayer, removeLayer, shiftLayer, updateLayer } from "@/lib/template/layers";
import { applyLayout, LAYOUTS, layoutOf, PATTERN_LABELS, SHAPE_LABELS, STICKERS, type LayoutId } from "@/lib/template/presets";
import { safeParseTemplate, TITLE_MAX } from "@/lib/template/schema";
import { PATTERNS, PHOTO_SHAPES, type Category, type Template } from "@/lib/template/types";
import PrintPreview from "./PrintPreview";
import ShapeSwatch from "./ShapeSwatch";

const LABEL = "grid gap-1 text-sm font-medium";

function LayoutThumb({ id }: { id: LayoutId }) {
  const { size, slots } = LAYOUTS[id];
  return (
    <span className="layout-thumb" style={{ aspectRatio: `${size.width} / ${size.height}` }} aria-hidden="true">
      {slots.map((s, i) => (
        <span key={i} style={{ left: `${s.x * 100}%`, top: `${s.y * 100}%`, width: `${s.width * 100}%`, height: `${s.height * 100}%` }} />
      ))}
    </span>
  );
}

interface Props {
  initial: Template;
  onSave: (t: Template) => boolean;
  onCancel: () => void;
}

export default function FrameEditor({ initial, onSave, onCancel }: Props) {
  const [draft, setDraft] = useState(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const grab = useRef<{ id: string; dx: number; dy: number } | null>(null);
  const selected = draft.layers.find((l) => l.id === selectedId);
  const currentLayout = layoutOf(draft);

  const pointAt = (e: PointerEvent<HTMLCanvasElement>) =>
    clientToCanvas(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect(), draft.size);

  function onPointerDown(e: PointerEvent<HTMLCanvasElement>) {
    const p = pointAt(e);
    const hit = hitTestLayers(draft.layers, draft.size, p.x, p.y);
    setSelectedId(hit?.id ?? null);
    if (!hit) return;
    grab.current = { id: hit.id, ...grabOffset(hit, draft.size, p.x, p.y) };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: PointerEvent<HTMLCanvasElement>) {
    const g = grab.current;
    if (!g) return;
    const p = pointAt(e);
    setDraft((d) => moveLayerTo(d, g.id, p.x - g.dx, p.y - g.dy));
  }

  const endDrag = () => { grab.current = null; };

  function add(src: string, aspect: number) {
    if (draft.layers.length >= MAX_LAYERS) {
      setNotice(`Maksimal ${MAX_LAYERS} karakter per frame. Hapus satu dulu.`);
      return;
    }
    const layer = newLayer(crypto.randomUUID(), src, aspect);
    setDraft((d) => addLayer(d, layer));
    setSelectedId(layer.id);
    setNotice(null);
  }

  async function importCharacter(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const { src, aspect } = await loadCharacter(file);
      add(src, aspect);
    } catch {
      setNotice("Gambarnya nggak bisa dibuka. Pilih file PNG atau JPG lain.");
    }
  }

  function save() {
    const parsed = safeParseTemplate(draft);
    if (!parsed.success) {
      setNotice(`Frame belum bisa disimpan: ${parsed.error.issues[0].message}.`);
      return;
    }
    if (!onSave(draft)) setNotice("Penyimpanan browser penuh. Hapus frame lain atau pakai gambar yang lebih kecil.");
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_auto]">
      <div className="grid min-w-0 gap-5">
        <section className="card grid gap-4">
          <h2 className="card-title">Bentuk frame</h2>
          <div className="grid gap-2">
            <p className="text-sm font-medium">Susunan foto</p>
            <div role="group" aria-label="Layout" className="flex flex-wrap gap-2">
              {(Object.keys(LAYOUTS) as LayoutId[]).map((id) => (
                <button key={id} className="option pop" aria-pressed={currentLayout === id} onClick={() => setDraft(applyLayout(draft, id))}>
                  <LayoutThumb id={id} />
                  {LAYOUTS[id].label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-2">
            <p className="text-sm font-medium">Bentuk foto</p>
            <div role="group" aria-label="Bentuk foto" className="flex flex-wrap gap-2">
              {PHOTO_SHAPES.map((shape) => (
                <button key={shape} className="option pop" aria-pressed={draft.photo.shape === shape} onClick={() => setDraft({ ...draft, photo: { ...draft.photo, shape } })}>
                  <ShapeSwatch shape={shape} />
                  {SHAPE_LABELS[shape]}
                </button>
              ))}
            </div>
          </div>
          {draft.photo.shape === "rounded" && (
            <label className={LABEL}>
              Sudut foto
              <input type="range" min={0} max={80} value={draft.photo.radius} onChange={(e) => setDraft({ ...draft, photo: { ...draft.photo, radius: Number(e.target.value) } })} />
            </label>
          )}
          <div className="grid gap-2">
            <p className="text-sm font-medium">Motif latar</p>
            <div role="group" aria-label="Motif latar" className="flex flex-wrap gap-2">
              {PATTERNS.map((pattern) => (
                <button key={pattern} className="chip" aria-pressed={draft.pattern === pattern} onClick={() => setDraft({ ...draft, pattern })}>
                  {PATTERN_LABELS[pattern]}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="card grid gap-4">
          <h2 className="card-title">Warna dan teks</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={LABEL}>
              Nama frame
              <input className="field" value={draft.name} maxLength={TITLE_MAX} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </label>
            <label className={LABEL}>
              Kategori
              <select className="field" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value as Category })}>
                <option value="umum">Umum</option>
                <option value="romantis">Romantis</option>
                <option value="acara">Acara</option>
              </select>
            </label>
            <label className={LABEL}>
              Teks utama
              <input className="field" value={draft.text.title} maxLength={TITLE_MAX} onChange={(e) => setDraft({ ...draft, text: { ...draft.text, title: e.target.value } })} />
            </label>
            <div className="grid grid-cols-3 gap-3">
              <label className={LABEL}>
                Latar
                <input type="color" className="swatch" value={draft.background.color} onChange={(e) => setDraft({ ...draft, background: { color: e.target.value } })} />
              </label>
              <label className={LABEL}>
                Teks
                <input type="color" className="swatch" value={draft.text.color} onChange={(e) => setDraft({ ...draft, text: { ...draft.text, color: e.target.value } })} />
              </label>
              <label className={LABEL}>
                Tepi foto
                <input type="color" className="swatch" value={draft.photo.outline} onChange={(e) => setDraft({ ...draft, photo: { ...draft.photo, outline: e.target.value } })} />
              </label>
            </div>
          </div>
        </section>

        <section className="card grid gap-3">
          <h2 className="card-title">Karakter</h2>
          <div className="flex flex-wrap items-center gap-2">
            {STICKERS.map((s) => (
              <button key={s.src} className="sticker-btn pop" aria-label={`Tambah ${s.name}`} title={s.name} onClick={() => add(s.src, 1)}>
                <Image src={s.src} alt="" width={48} height={48} unoptimized />
              </button>
            ))}
            <label className="create-chip pop">
              Import dari device
              <input type="file" accept="image/*" className="sr-only" onChange={importCharacter} />
            </label>
          </div>
          <p className="text-xs text-muted">Pakai gambar buatan sendiri atau yang lisensinya boleh untuk usaha.</p>

          {draft.layers.length > 0 && (
            <div role="group" aria-label="Daftar karakter" className="flex flex-wrap gap-2">
              {draft.layers.map((l, i) => (
                <button key={l.id} className="chip" aria-pressed={l.id === selectedId} onClick={() => setSelectedId(l.id)}>
                  Karakter {i + 1}
                </button>
              ))}
            </div>
          )}

          {selected && (
            <div className="grid gap-3 rounded-2xl bg-background p-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className={LABEL}>
                  Ukuran
                  <input type="range" min={0.05} max={1} step={0.01} value={selected.scale} onChange={(e) => setDraft(updateLayer(draft, selected.id, { scale: Number(e.target.value) }))} />
                </label>
                <label className={LABEL}>
                  Putar
                  <input type="range" min={-180} max={180} value={selected.rot} onChange={(e) => setDraft(updateLayer(draft, selected.id, { rot: Number(e.target.value) }))} />
                </label>
                <label className={LABEL}>
                  Geser kiri-kanan
                  <input type="range" min={0} max={1} step={0.005} value={selected.x} onChange={(e) => setDraft(updateLayer(draft, selected.id, { x: Number(e.target.value) }))} />
                </label>
                <label className={LABEL}>
                  Geser atas-bawah
                  <input type="range" min={0} max={1} step={0.005} value={selected.y} onChange={(e) => setDraft(updateLayer(draft, selected.id, { y: Number(e.target.value) }))} />
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="chip" onClick={() => setDraft(updateLayer(draft, selected.id, { flip: !selected.flip }))}>Balik arah</button>
                <button className="chip" onClick={() => setDraft(shiftLayer(draft, selected.id, "naik"))}>Ke atas</button>
                <button className="chip" onClick={() => setDraft(shiftLayer(draft, selected.id, "turun"))}>Ke bawah</button>
                <button className="chip" onClick={() => { setDraft(removeLayer(draft, selected.id)); setSelectedId(null); }}>Hapus karakter</button>
              </div>
            </div>
          )}
        </section>

        <div className="flex flex-wrap gap-3">
          <button className="btn btn-primary" onClick={save}>Simpan frame</button>
          <button className="btn btn-secondary" onClick={onCancel}>Batal</button>
        </div>
        {notice && <p role="status" className="note">{notice}</p>}
      </div>

      {/* canvas di sini nggak dimiringkan: posisi pointer dihitung dari kotak yang lurus */}
      <div className="mat justify-self-center lg:sticky lg:top-4">
        <PrintPreview
          template={draft}
          label="Editor frame"
          selectedLayer={selectedId}
          style={{ maxHeight: "72vh", borderRadius: 10, touchAction: "none", cursor: "grab" }}
          canvasProps={{ onPointerDown, onPointerMove, onPointerUp: endDrag, onPointerCancel: endDrag }}
        />
        <p className="mat-caption">Geser karakternya di sini</p>
      </div>
    </div>
  );
}

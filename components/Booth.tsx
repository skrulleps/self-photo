"use client";
import { useEffect, useReducer, useState, useSyncExternalStore, type ChangeEvent } from "react";
import Image from "next/image";
import { boothReducer, DEFAULT_TIMER, initialBooth, TIMER_OPTIONS } from "@/lib/booth/machine";
import { useCamera } from "@/lib/camera/useCamera";
import { captureFrame } from "@/lib/camera/capture";
import { loadPhotos } from "@/lib/camera/upload";
import { useCustomTemplates, writeCustomTemplates } from "@/lib/export/customTemplates";
import { emailPrint, IMAGE_FORMATS, renderPrintFile, savePrint, sharePrint, type ImageFormat, type SaveResult } from "@/lib/export/savePrint";
import { countdownNotes, RESULT_NOTES, SHUTTER_NOTES } from "@/lib/sound/notes";
import { playSound, toggleMuted, unlockSound, useMuted } from "@/lib/sound/player";
import { newTemplate, PRESETS } from "@/lib/template/presets";
import { TITLE_MAX } from "@/lib/template/schema";
import { upsertTemplate } from "@/lib/template/store";
import type { Template } from "@/lib/template/types";
import FrameEditor from "./FrameEditor";
import PrintPreview from "./PrintPreview";
import TemplatePicker from "./TemplatePicker";

const LABEL = "grid gap-1 text-sm font-medium";
const STEPS = ["Pilih frame", "Jepret", "Simpan"];
const SPARKLES = [
  { src: "star", left: "12%", top: "16%", size: 64 },
  { src: "heart", left: "22%", top: "58%", size: 48 },
  { src: "heart", left: "80%", top: "14%", size: 52 },
  { src: "star", left: "72%", top: "62%", size: 60 },
];
const DECOR = [
  { src: "heart", className: "left-[3%] top-[18%]", size: 56 },
  { src: "star", className: "right-[4%] top-[12%]", size: 64 },
  { src: "bunny", className: "left-[2%] bottom-[10%]", size: 84 },
  { src: "heart", className: "right-[3%] bottom-[22%]", size: 44 },
];

const HINT = {
  idle: "Pilih frame, isi teksnya, lalu mulai.",
  ready: "Tiap slot bisa pakai kamera atau gambar dari device.",
  countdown: "Siap-siap, jangan gerak!",
  capturing: "Siap-siap, jangan gerak!",
  review: "Hasilnya udah jadi. Simpan atau ulangi dari awal.",
};

const noSubscribe = () => () => {};
const formatToday = () => new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

export default function Booth() {
  const [state, dispatch] = useReducer(boothReducer, initialBooth);
  const [photos, setPhotos] = useState<HTMLCanvasElement[]>([]);
  const [templateId, setTemplateId] = useState(PRESETS[0].id);
  const [editing, setEditing] = useState<Template | null>(null);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState(0);
  const [timer, setTimer] = useState<number>(DEFAULT_TIMER);
  const [format, setFormat] = useState<ImageFormat>("png");
  const [ready, setReady] = useState<{ file: File; url: string } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const { videoRef, start, stop, error } = useCamera();
  const custom = useCustomTemplates();
  const muted = useMuted();
  // tanggal cuma ada di browser: saat prerender nilainya kosong, jadi nggak bikin hydration mismatch
  const today = useSyncExternalStore(noSubscribe, formatToday, () => "");

  const templates = [...PRESETS, ...custom];
  const template = templates.find((t) => t.id === templateId) ?? PRESETS[0];
  const text = { title, subtitle: subtitle ?? today };
  const inSession = state.phase === "ready" || state.phase === "countdown" || state.phase === "capturing";
  const reviewing = state.phase === "review";
  const step = state.phase === "idle" ? 0 : inSession ? 1 : 2;

  // countdown, capture frame on the last tick
  useEffect(() => {
    if (state.phase !== "countdown") return;
    const fast = new URLSearchParams(window.location.search).get("fast") === "1";
    const id = setTimeout(() => {
      dispatch({ type: "TICK" });
      if (state.count > 1 || !videoRef.current) return;
      const frame = captureFrame(videoRef.current);
      setPhotos((p) => [...p, frame]);
      setFlash((n) => n + 1);
      playSound(SHUTTER_NOTES);
      dispatch({ type: "CAPTURED" });
    }, fast ? 100 : 1000);
    return () => clearTimeout(id);
  }, [state.phase, state.count, state.shot, videoRef]);

  // bunyi tiap angka countdown
  useEffect(() => {
    if (state.phase === "countdown") playSound(countdownNotes(state.count));
  }, [state.phase, state.count]);

  // video baru kelihatan pas sesi mulai, sebagian browser perlu di-play ulang setelah elemennya tampil
  useEffect(() => {
    if (inSession && !error) videoRef.current?.play().catch(() => {});
  }, [inSession, error, videoRef]);

  // selesai atau batal: off camera
  useEffect(() => {
    if (state.phase === "review" || state.phase === "idle") stop();
  }, [state.phase, stop]);

  // hasilnya ada di paling atas, jadi di HP yang lagi scroll ke bawah tetap langsung kelihatan
  useEffect(() => {
    if (!reviewing) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
    playSound(RESULT_NOTES);
  }, [reviewing]);

  // file hasil disiapkan duluan, biar klik simpan/bagikan langsung jalan (lihat renderPrintFile)
  useEffect(() => {
    if (!reviewing) return;
    let alive = true, url = "";
    renderPrintFile({ template, photos, text: { title, subtitle: subtitle ?? today } }, format)
      .then((file) => {
        if (!alive) return;
        url = URL.createObjectURL(file);
        setReady({ file, url });
      })
      .catch(() => { if (alive) setNotice("Fotonya gagal diproses. Klik Ulangi lalu coba lagi."); });
    return () => {
      alive = false;
      if (url) URL.revokeObjectURL(url);
      setReady(null);
    };
  }, [reviewing, template, photos, title, subtitle, today, format]);

  // kamera gagal tetap masuk sesi: slotnya masih bisa diisi dari device
  async function begin() {
    unlockSound();
    setBusy(true);
    setNotice(null);
    setPhotos([]);
    await start();
    dispatch({ type: "START", total: template.slots.length });
    setBusy(false);
  }

  async function pick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setNotice(null);
    try {
      const [photo] = await loadPhotos([file], 1);
      setPhotos((p) => [...p, photo]);
      dispatch({ type: "PICKED" });
    } catch {
      setNotice("Gambarnya nggak bisa dibuka. Pilih file JPG atau PNG lain.");
    }
    setBusy(false);
  }

  async function deliver(action: (file: File) => Promise<SaveResult>, downloaded = "Fotonya udah disimpan.") {
    if (!ready) return;
    setBusy(true);
    setNotice(null);
    try {
      const result = await action(ready.file);
      if (result === "shared") setNotice("Fotonya udah dibagikan.");
      if (result === "downloaded") setNotice(downloaded);
      if (result === "emailed") setNotice("Fotonya udah diunduh. Lampirkan file-nya ke email yang kebuka. Kalau email nggak kebuka, kirim file-nya lewat aplikasi email kamu.");
    } catch {
      setNotice("Fotonya gagal diproses. Coba klik tombolnya lagi.");
    }
    setBusy(false);
  }

  function reset(type: "RETAKE" | "CANCEL") {
    dispatch({ type });
    setPhotos([]);
    setNotice(null);
  }

  function saveFrame(t: Template) {
    if (!writeCustomTemplates(upsertTemplate(custom, t))) return false;
    setTemplateId(t.id);
    setEditing(null);
    return true;
  }

  function deleteFrame(t: Template) {
    if (window.confirm(`Hapus frame "${t.name}"?`)) writeCustomTemplates(custom.filter((x) => x.id !== t.id));
  }

  return (
    <main className="safe-area mx-auto grid w-full max-w-5xl gap-5 p-4 sm:gap-6 sm:p-8">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <Image src="/characters/cat.svg" alt="" width={84} height={84} unoptimized loading="eager" className="wiggle size-14 sm:size-21" />
        <div className="grid min-w-0 flex-1 gap-1">
          <h1 className="brand">Studio Jepret</h1>
          <p className="text-sm font-medium text-muted sm:text-base">{editing ? "Atur frame kamu sendiri, lalu simpan." : HINT[state.phase]}</p>
        </div>
        {!editing && (
          <ol className="steps" aria-label="Langkah">
            {STEPS.map((label, i) => (
              <li key={label} aria-current={i === step ? "step" : undefined}>
                <span>{i + 1}</span>
                {label}
              </li>
            ))}
          </ol>
        )}
        <button className="chip" aria-pressed={!muted} onClick={toggleMuted}>
          {muted ? "Suara mati" : "Suara nyala"}
        </button>
      </header>

      {DECOR.map((d, i) => (
        <Image key={i} src={`/characters/${d.src}.svg`} alt="" width={d.size} height={d.size} unoptimized loading="eager" className={`float-decor ${d.className}`} style={{ animationDelay: `${i * 0.6}s` }} />
      ))}

      {editing ? (
        <FrameEditor initial={editing} onSave={saveFrame} onCancel={() => setEditing(null)} />
      ) : (
        <div className={reviewing ? "grid justify-items-center gap-6" : "grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_auto]"}>
          <div className={`grid min-w-0 gap-5 ${reviewing ? "w-full justify-items-center" : ""}`}>
            {state.phase === "idle" && (
              <>
                <TemplatePicker
                  templates={templates}
                  customIds={custom.map((t) => t.id)}
                  selectedId={template.id}
                  onSelect={setTemplateId}
                  onCreate={() => setEditing(newTemplate(crypto.randomUUID()))}
                  onEdit={setEditing}
                  onDelete={deleteFrame}
                />
                <section className="card grid gap-3">
                  <h2 className="card-title">Tulis pesanmu</h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className={LABEL}>
                      Teks utama
                      <input className="field" value={title} maxLength={TITLE_MAX} placeholder={template.text.title} onChange={(e) => setTitle(e.target.value)} />
                    </label>
                    <label className={LABEL}>
                      Teks kecil
                      <input className="field" value={text.subtitle} maxLength={TITLE_MAX} onChange={(e) => setSubtitle(e.target.value)} />
                    </label>
                  </div>
                </section>
              </>
            )}

            {inSession && (
              <p className="pose-pill">
                Pose {Math.min(state.shot + 1, state.total)} dari {state.total}
              </p>
            )}
            {inSession && error && <p role="alert" className="note">{error} Kamu tetap bisa pakai gambar dari device.</p>}

            <div className="booth-window relative aspect-4/3 w-full overflow-hidden" hidden={!inSession || !!error}>
              <video ref={videoRef} playsInline muted className="h-full w-full object-cover" style={{ transform: "scaleX(-1)" }} />
              <div aria-live="polite" className="absolute inset-0 grid place-items-center">
                {state.phase === "countdown" && <span key={state.count} className="count-bubble">{state.count}</span>}
              </div>
            </div>

            {(state.phase === "idle" || state.phase === "ready") && (
              <div role="group" aria-label="Timer" className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium">Timer</span>
                {TIMER_OPTIONS.map((s) => (
                  <button key={s} className="chip" aria-pressed={timer === s} onClick={() => setTimer(s)} disabled={busy}>
                    {s} detik
                  </button>
                ))}
              </div>
            )}

            {reviewing && (
              <div role="group" aria-label="Format file" className="flex flex-wrap items-center justify-center gap-2">
                <span className="text-sm font-medium">Format</span>
                {IMAGE_FORMATS.map((f) => (
                  <button key={f} className="chip" aria-pressed={format === f} onClick={() => setFormat(f)} disabled={busy}>
                    {f.toUpperCase()}
                  </button>
                ))}
              </div>
            )}

            <div className={`actions ${reviewing ? "actions-center" : ""}`}>
              {state.phase === "idle" && <button className="btn btn-primary" onClick={begin} disabled={busy}>Mulai jepret</button>}
              {inSession && (
                <>
                  <button className="btn btn-primary" onClick={() => { unlockSound(); dispatch({ type: "SHOOT", seconds: timer }); }} disabled={state.phase !== "ready" || !!error || busy}>
                    {state.phase !== "ready" ? "Siap-siap..." : state.shot === 0 ? "Jepret" : "Jepret berikutnya"}
                  </button>
                  {state.phase === "ready" && (
                    <label className="btn btn-secondary cursor-pointer focus-within:ring-2 focus-within:ring-accent">
                      Pilih dari device
                      <input type="file" accept="image/*" className="sr-only" disabled={busy} onChange={pick} />
                    </label>
                  )}
                  <button className="btn btn-secondary" onClick={() => reset("CANCEL")} disabled={state.phase !== "ready" || busy}>Batal</button>
                </>
              )}
              {state.phase === "review" && (
                <>
                  <button className="btn btn-primary" onClick={() => deliver(savePrint)} disabled={busy || !ready}>{ready ? "Simpan" : "Menyiapkan..."}</button>
                  <button className="btn btn-secondary" onClick={() => deliver(sharePrint, "Browser ini belum bisa berbagi langsung, jadi fotonya diunduh. Kirim file-nya lewat aplikasi favoritmu.")} disabled={busy || !ready}>Bagikan</button>
                  <button className="btn btn-secondary" onClick={() => deliver(emailPrint)} disabled={busy || !ready}>Kirim email</button>
                  <button className="btn btn-secondary" onClick={() => reset("RETAKE")} disabled={busy}>Ulangi</button>
                </>
              )}
            </div>
            {notice && <p role="status" className="note">{notice}</p>}
            {reviewing && (
              <p className="hidden text-center text-sm font-medium text-muted pointer-coarse:block">
                Fotonya belum masuk galeri? Tekan lama gambarnya, lalu pilih Simpan gambar.
              </p>
            )}
          </div>

          <div className={reviewing ? "spotlight order-first" : "justify-self-center lg:sticky lg:top-4"}>
            {reviewing && (
              <>
                <h2 className="reveal-title">Yeay, fotonya udah jadi!</h2>
                {SPARKLES.map((s, i) => (
                  <Image key={i} src={`/characters/${s.src}.svg`} alt="" width={s.size} height={s.size} unoptimized className="reveal-sparkle" style={{ left: s.left, top: s.top, animationDelay: `${i * 0.25}s` }} />
                ))}
              </>
            )}
            <div className={`mat ${reviewing ? "mat-hero" : "mat-tilt"}`}>
              <div className="relative">
                <PrintPreview
                  template={template}
                  photos={photos}
                  title={text.title}
                  subtitle={text.subtitle}
                  label={reviewing ? "Hasil print" : inSession ? "Frame" : "Preview print"}
                  style={{ display: "block", maxHeight: reviewing ? "64svh" : "60svh", borderRadius: 10 }}
                />
                {/* gambar asli di atas canvas: di HP bisa ditekan lama lalu disimpan, juga di browser dalam aplikasi yang memblokir unduhan */}
                {/* eslint-disable-next-line @next/next/no-img-element -- blob URL lokal, bukan aset yang bisa dioptimasi */}
                {reviewing && ready && <img src={ready.url} alt="" aria-hidden="true" className="absolute inset-0 size-full rounded-[10px]" />}
              </div>
              <p className="mat-caption">{template.name}</p>
            </div>
          </div>
        </div>
      )}

      {flash > 0 && <div key={flash} className="booth-flash" aria-hidden="true" />}
    </main>
  );
}

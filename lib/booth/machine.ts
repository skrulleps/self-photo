export type Phase = "idle" | "ready" | "countdown" | "capturing" | "review";

export interface BoothState { phase: Phase; shot: number; total: number; count: number }

export type BoothEvent =
  | { type: "START"; total: number }
  | { type: "SHOOT"; seconds?: number }
  | { type: "TICK" }
  | { type: "CAPTURED" }
  | { type: "PICKED" }
  | { type: "CANCEL" }
  | { type: "RETAKE" };

export const initialBooth: BoothState = { phase: "idle", shot: 0, total: 0, count: 0 };

export const TIMER_OPTIONS = [3, 5, 10] as const;
export const DEFAULT_TIMER = 3;
const TIMER_MAX = 10;

// angka timer dari luar dibulatkan dan dijaga 1..10, nilai rusak balik ke bawaan
export function clampTimer(seconds: number | undefined): number {
  if (seconds === undefined || !Number.isFinite(seconds)) return DEFAULT_TIMER;
  return Math.min(TIMER_MAX, Math.max(1, Math.round(seconds)));
}

// slot keisi: lanjut nunggu slot berikutnya, atau selesai kalau udah penuh
function advance(s: BoothState): BoothState {
  const next = s.shot + 1;
  return { ...s, phase: next >= s.total ? "review" : "ready", shot: next };
}

export function boothReducer(s: BoothState, e: BoothEvent): BoothState {
  switch (e.type) {
    case "START":
      return s.phase === "idle" && e.total > 0 ? { phase: "ready", shot: 0, total: e.total, count: 0 } : s;
    case "SHOOT":
      return s.phase === "ready" ? { ...s, phase: "countdown", count: clampTimer(e.seconds) } : s;
    case "TICK":
      if (s.phase !== "countdown") return s;
      return s.count > 1 ? { ...s, count: s.count - 1 } : { ...s, phase: "capturing", count: 0 };
    case "CAPTURED":
      return s.phase === "capturing" ? advance(s) : s;
    case "PICKED":
      return s.phase === "ready" ? advance(s) : s;
    case "CANCEL":
      return s.phase === "ready" ? initialBooth : s;
    case "RETAKE":
      return s.phase === "review" ? initialBooth : s;
  }
}

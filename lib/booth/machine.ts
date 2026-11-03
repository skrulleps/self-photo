export type Phase = "idle" | "countdown" | "capturing" | "review";

export interface BoothState { phase: Phase; shot: number; total: number; count: number }

export type BoothEvent =
  | { type: "START"; total: number }
  | { type: "TICK" }
  | { type: "CAPTURED" }
  | { type: "RETAKE" };

export const initialBooth: BoothState = { phase: "idle", shot: 0, total: 0, count: 0 };

export function boothReducer(s: BoothState, e: BoothEvent): BoothState {
  switch (e.type) {
    case "START":
      return s.phase === "idle" && e.total > 0 ? { phase: "countdown", shot: 0, total: e.total, count: 3 } : s;
    case "TICK":
      if (s.phase !== "countdown") return s;
      return s.count > 1 ? { ...s, count: s.count - 1 } : { ...s, phase: "capturing", count: 0 };
    case "CAPTURED": {
      if (s.phase !== "capturing") return s;
      const next = s.shot + 1;
      return next >= s.total ? { ...s, phase: "review", shot: next } : { ...s, phase: "countdown", shot: next, count: 3 };
    }
    case "RETAKE":
      return s.phase === "review" ? initialBooth : s;
  }
}
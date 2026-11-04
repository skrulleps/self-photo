import { useSyncExternalStore } from "react";
import type { Note } from "./notes";

const KEY = "studio-jepret:muted";
const VOLUME = 0.12;

const listeners = new Set<() => void>();
let audio: AudioContext | null = null;
let muted: boolean | null = null;

function readMuted() {
  if (muted !== null) return muted;
  try {
    muted = window.localStorage.getItem(KEY) === "1";
  } catch {
    muted = false;
  }
  return muted;
}

const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
};

export const useMuted = () => useSyncExternalStore(subscribe, readMuted, () => false);

export function toggleMuted() {
  muted = !readMuted();
  try {
    window.localStorage.setItem(KEY, muted ? "1" : "0");
  } catch {
    // nggak bisa disimpan: pilihannya tetap berlaku sampai halaman ditutup
  }
  listeners.forEach((fn) => fn());
}

// browser cuma mengizinkan audio setelah ada klik, jadi ini dipanggil di handler tombol
export function unlockSound() {
  if (typeof AudioContext === "undefined") return;
  audio ??= new AudioContext();
  if (audio.state === "suspended") audio.resume().catch(() => {});
}

// suara cuma pemanis: kalau gagal, alur booth harus tetap jalan
export function playSound(notes: Note[]) {
  if (!audio || readMuted()) return;
  const now = audio.currentTime;
  for (const note of notes) {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    const start = now + note.start, end = start + note.duration;
    osc.type = note.type ?? "sine";
    osc.frequency.value = note.freq;
    gain.gain.setValueAtTime(VOLUME, start);
    gain.gain.exponentialRampToValueAtTime(0.001, end);
    osc.connect(gain).connect(audio.destination);
    osc.start(start);
    osc.stop(end);
  }
}

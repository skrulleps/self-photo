import { describe, expect, it } from "vitest";
import { countdownNotes, RESULT_NOTES, SHUTTER_NOTES } from "@/lib/sound/notes";

describe("countdownNotes", () => {
  it("detik terakhir nadanya lebih tinggi", () => {
    expect(countdownNotes(1)[0].freq).toBeGreaterThan(countdownNotes(2)[0].freq);
  });
  it("angka selain terakhir nadanya sama", () => {
    expect(countdownNotes(3)).toEqual(countdownNotes(2));
  });
});

describe("RESULT_NOTES", () => {
  it("nadanya naik dan berurutan", () => {
    RESULT_NOTES.slice(1).forEach((n, i) => {
      expect(n.freq).toBeGreaterThan(RESULT_NOTES[i].freq);
      expect(n.start).toBeGreaterThan(RESULT_NOTES[i].start);
    });
  });
  it("mulai setelah bunyi jepret selesai", () => {
    const shutterEnd = Math.max(...SHUTTER_NOTES.map((n) => n.start + n.duration));
    expect(RESULT_NOTES[0].start).toBeGreaterThanOrEqual(shutterEnd);
  });
});

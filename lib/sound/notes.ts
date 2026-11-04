// start dan duration dalam detik, relatif ke saat suara dimainkan
export interface Note {
  freq: number;
  start: number;
  duration: number;
  type?: OscillatorType;
}

const C5 = 523.25, E5 = 659.25, G5 = 783.99, C6 = 1046.5, E6 = 1318.5;

// detik terakhir nadanya lebih tinggi, jadi orang tahu fotonya mau diambil
export function countdownNotes(count: number): Note[] {
  return [{ freq: count === 1 ? C6 : G5, start: 0, duration: 0.14 }];
}

export const SHUTTER_NOTES: Note[] = [
  { freq: 1800, start: 0, duration: 0.04, type: "square" },
  { freq: 1200, start: 0.06, duration: 0.05, type: "square" },
];

// mulai agak telat biar nggak numpuk dengan bunyi jepret foto terakhir
export const RESULT_NOTES: Note[] = [C5, E5, G5, C6, E6].map((freq, i) => ({
  freq,
  start: 0.2 + i * 0.11,
  duration: i === 4 ? 0.45 : 0.16,
}));

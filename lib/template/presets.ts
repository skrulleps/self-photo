import type { Template } from './types';

const S = { width: 600, height: 1800 };
const px = ([x, y, width, height]: number[]) => ({ x: x / S.width, y: y / S.height, width: width / S.width, height: height / S.height });

export const PRESETS: Template[] = [
  {
    id: "blush",
    name: "Blush",
    size: S,
    slots: [[40, 40, 520, 390], [40, 450, 520, 390], [40, 860, 520, 390]].map(px),
    textArea: px([40, 1270, 520, 440]),
    background: { color: "#ffd6e5" },
    photo: { radius: 20 },
    text: { font: "sans-serif", color: "#c2185b", title: "you & me" },
  },
];
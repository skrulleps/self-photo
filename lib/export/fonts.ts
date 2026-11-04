const FONT_VARS: Record<string, string> = { Fredoka: "--font-fredoka" };

// next/font mengganti nama font, jadi nama aslinya dibaca dari CSS variable yang dipasang di <html>
export function fontFamily(name: string) {
  const cssVar = FONT_VARS[name];
  if (!cssVar) return name;
  return getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim() || name;
}

const probe = (name: string) => `700 40px ${fontFamily(name)}`;

export const isFontReady = (name: string) => document.fonts.check(probe(name));

// font belum dimuat bikin canvas diam-diam pakai fallback, jadi tunggu dulu sebelum export
export const loadFont = (name: string) => document.fonts.load(probe(name)).catch(() => []);

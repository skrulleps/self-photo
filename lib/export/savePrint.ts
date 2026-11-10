import { renderPrint, type RenderInput } from "@/lib/render/render";
import { fontFamily, loadFont } from "./fonts";
import { getImage, loadImages } from "./imageCache";

export type SaveResult = "shared" | "downloaded" | "emailed" | "cancelled";

const SHARE_TITLE = "Foto dari Studio Jepret";

async function toPngFile(input: RenderInput): Promise<File> {
  const { template } = input;
  await Promise.all([loadImages(template.layers.map((l) => l.src)), loadFont(template.text.font)]);
  const canvas = document.createElement("canvas");
  canvas.width = template.size.width;
  canvas.height = template.size.height;
  renderPrint(canvas.getContext("2d")!, { ...input, images: getImage, fonts: fontFamily });
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(new File([blob], `studio-jepret-${template.id}.png`, { type: "image/png" }));
      else reject(new Error("Gagal membuat PNG"));
    }, "image/png");
  });
}

function download(file: File) {
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  a.click();
  URL.revokeObjectURL(url);
}

// null artinya browser nggak bisa share, jadi pemanggil pakai jalur cadangan
async function tryShare(file: File): Promise<SaveResult | null> {
  if (!navigator.canShare?.({ files: [file] })) return null;
  try {
    await navigator.share({ files: [file], title: SHARE_TITLE });
    return "shared";
  } catch (e) {
    return e instanceof DOMException && e.name === "AbortError" ? "cancelled" : null;
  }
}

const isTouch = () => window.matchMedia("(pointer: coarse)").matches;

// share cuma buat layar sentuh: Chrome desktop juga punya canShare, tapi di sana harusnya unduh
export async function savePrint(input: RenderInput): Promise<SaveResult> {
  const file = await toPngFile(input);
  const shared = isTouch() ? await tryShare(file) : null;
  if (shared) return shared;
  download(file);
  return "downloaded";
}

export async function sharePrint(input: RenderInput): Promise<SaveResult> {
  const file = await toPngFile(input);
  const shared = await tryShare(file);
  if (shared) return shared;
  download(file);
  return "downloaded";
}

export function mailtoLink(subject: string, body: string) {
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// mailto nggak bisa membawa lampiran. Di HP lewat share sheet (ada aplikasi email di sana),
// di desktop fotonya diunduh dulu lalu pengguna melampirkannya sendiri.
export async function emailPrint(input: RenderInput): Promise<SaveResult> {
  const file = await toPngFile(input);
  const shared = isTouch() ? await tryShare(file) : null;
  if (shared) return shared;
  download(file);
  const a = document.createElement("a");
  a.href = mailtoLink(SHARE_TITLE, "Hai! Ini foto aku dari Studio Jepret.");
  a.click();
  return "emailed";
}

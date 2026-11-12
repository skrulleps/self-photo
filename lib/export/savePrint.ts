import { renderPrint, type RenderInput } from "@/lib/render/render";
import { fontFamily, loadFont } from "./fonts";
import { getImage, loadImages } from "./imageCache";

export type SaveResult = "shared" | "downloaded" | "emailed" | "cancelled";
export type ImageFormat = "png" | "jpg";

export const IMAGE_FORMATS: readonly ImageFormat[] = ["png", "jpg"];
const MIME: Record<ImageFormat, string> = { png: "image/png", jpg: "image/jpeg" };
const JPG_QUALITY = 0.92;
const SHARE_TITLE = "Foto dari Studio Jepret";

export function printFileName(templateId: string, format: ImageFormat) {
  return `studio-jepret-${templateId}.${format}`;
}

// Dibuat sebelum tombol diklik. Safari dan Chrome HP cuma mengizinkan share dan unduh
// selama masih di dalam klik; kalau nunggu render dulu, izinnya keburu habis dan nggak terjadi apa-apa.
export async function renderPrintFile(input: RenderInput, format: ImageFormat): Promise<File> {
  const { template } = input;
  await Promise.all([loadImages(template.layers.map((l) => l.src)), loadFont(template.text.font)]);
  const canvas = document.createElement("canvas");
  canvas.width = template.size.width;
  canvas.height = template.size.height;
  renderPrint(canvas.getContext("2d")!, { ...input, images: getImage, fonts: fontFamily });
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(new File([blob], printFileName(template.id, format), { type: MIME[format] }));
        else reject(new Error("Gagal membuat gambar"));
      },
      MIME[format],
      format === "jpg" ? JPG_QUALITY : undefined,
    );
  });
}

// link harus ada di halaman (Firefox HP), dan URL-nya jangan langsung dicabut:
// sebagian browser HP baru membaca file-nya setelah klik selesai
function download(file: File) {
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  a.rel = "noopener";
  a.style.display = "none";
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
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
// iPadOS mengaku Mac, jadi dicek juga dari layar sentuhnya
const isIOS = () => /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.userAgent.includes("Macintosh") && navigator.maxTouchPoints > 1);

// iPhone: unduhan masuk ke app Files, bukan Foto. Lewat share sheet ada "Simpan Gambar" ke Foto.
// Android dan desktop: unduh langsung, masuk ke galeri atau folder Download.
export async function savePrint(file: File): Promise<SaveResult> {
  const shared = isIOS() ? await tryShare(file) : null;
  if (shared) return shared;
  download(file);
  return "downloaded";
}

export async function sharePrint(file: File): Promise<SaveResult> {
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
export async function emailPrint(file: File): Promise<SaveResult> {
  const shared = isTouch() ? await tryShare(file) : null;
  if (shared) return shared;
  download(file);
  const a = document.createElement("a");
  a.href = mailtoLink(SHARE_TITLE, "Hai! Ini foto aku dari Studio Jepret.");
  a.click();
  return "emailed";
}

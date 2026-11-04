import { fitWithin } from "@/lib/render/geometry";

const MAX_EDGE = 2000;
const CHARACTER_EDGE = 800;

// PNG biar transparansinya aman, ukurannya dikecilkan karena hasilnya disimpan di localStorage
export async function loadCharacter(file: File): Promise<{ src: string; aspect: number }> {
  const bitmap = await createImageBitmap(file);
  const c = document.createElement("canvas");
  Object.assign(c, fitWithin(bitmap.width, bitmap.height, CHARACTER_EDGE));
  c.getContext("2d")!.drawImage(bitmap, 0, 0, c.width, c.height);
  const aspect = bitmap.height / bitmap.width;
  bitmap.close();
  return { src: c.toDataURL("image/png"), aspect };
}

export async function loadPhotos(files: File[], max: number): Promise<HTMLCanvasElement[]> {
  return Promise.all(files.slice(0, max).map(async (file) => {
    const bitmap = await createImageBitmap(file);
    const c = document.createElement("canvas");
    Object.assign(c, fitWithin(bitmap.width, bitmap.height, MAX_EDGE));
    c.getContext("2d")!.drawImage(bitmap, 0, 0, c.width, c.height);
    bitmap.close();
    return c;
  }));
}

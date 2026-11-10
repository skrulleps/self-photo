const cache = new Map<string, HTMLImageElement>();

export const getImage = (src: string) => cache.get(src);

// gambar yang gagal dimuat dilewati, jadi satu file rusak nggak menggagalkan seluruh print
export function loadImages(srcs: string[]): Promise<void[]> {
  return Promise.all(srcs.map((src) => new Promise<void>((resolve) => {
    if (cache.has(src)) return resolve();
    const img = new Image();
    img.onload = () => { cache.set(src, img); resolve(); };
    img.onerror = () => resolve();
    img.src = src;
  })));
}

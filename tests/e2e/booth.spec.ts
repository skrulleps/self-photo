import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAEBgIApD5fRAAAAABJRU5ErkJggg==",
  "base64",
);
const PNG_FILE = { name: "foto.png", mimeType: "image/png", buffer: PNG_1X1 };
const GRAY = [221, 221, 221];
const STRIP_SLOT_CENTERS = [235, 645, 1055];

const result = (page: Page) => page.getByRole("img", { name: "Hasil print" });
const shoot = (page: Page) => page.getByRole("button", { name: /^Jepret/ });
const device = (page: Page) => page.getByLabel("Pilih dari device");

// warna pixel di koordinat print
function pixel(page: Page, name: string, y: number) {
  return () => page.getByRole("img", { name }).evaluate(
    (c: HTMLCanvasElement, py) => Array.from(c.getContext("2d")!.getImageData(300, py, 1, 1).data).slice(0, 3),
    y,
  );
}

function pngSize(path: string) {
  const b = readFileSync(path);
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
}

async function shootAll(page: Page, total: number) {
  await page.getByRole("button", { name: "Mulai jepret" }).click();
  for (let i = 1; i <= total; i++) {
    await expect(page.getByText(`Pose ${i} dari ${total}`)).toBeVisible();
    await shoot(page).click();
  }
  await expect(result(page)).toBeVisible();
}

async function denyCamera(page: Page) {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException("ditolak", "NotAllowedError"));
  });
}

test("preview kamera tampil dan videonya benar-benar jalan sebelum jepret", async ({ page }) => {
  await page.goto("/?fast=1");
  await page.getByRole("button", { name: "Mulai jepret" }).click();

  const video = page.locator("video");
  await expect(video).toBeVisible();
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.videoWidth)).toBeGreaterThan(0);
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(false);
  const t0 = await video.evaluate((v: HTMLVideoElement) => v.currentTime);
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime)).toBeGreaterThan(t0);
});

test("tiap jepret masuk ke frame, lalu nunggu klik buat foto berikutnya", async ({ page }) => {
  await page.goto("/?fast=1");
  await page.getByRole("button", { name: "Mulai jepret" }).click();
  await expect(shoot(page)).toBeEnabled();
  await expect.poll(pixel(page, "Frame", STRIP_SLOT_CENTERS[0])).toEqual(GRAY);

  await shoot(page).click();
  await expect(page.getByText("Pose 2 dari 3")).toBeVisible();
  await expect(page.getByRole("button", { name: "Jepret berikutnya" })).toBeEnabled();
  await expect.poll(pixel(page, "Frame", STRIP_SLOT_CENTERS[0])).not.toEqual(GRAY);
  await expect.poll(pixel(page, "Frame", STRIP_SLOT_CENTERS[1])).toEqual(GRAY);
  await expect(page.locator("video")).toBeVisible();
});

test("slot bisa campur: kamera lalu gambar dari device", async ({ page }) => {
  await page.goto("/?fast=1");
  await page.getByRole("button", { name: "Mulai jepret" }).click();
  await expect(shoot(page)).toBeEnabled();
  await shoot(page).click();
  await expect(page.getByText("Pose 2 dari 3")).toBeVisible();

  await device(page).setInputFiles(PNG_FILE);
  await expect(page.getByText("Pose 3 dari 3")).toBeVisible();
  await expect.poll(pixel(page, "Frame", STRIP_SLOT_CENTERS[1])).not.toEqual(GRAY);
  await expect.poll(pixel(page, "Frame", STRIP_SLOT_CENTERS[2])).toEqual(GRAY);

  await shoot(page).click();
  await expect(result(page)).toBeVisible();
});

test("jepret 3 foto lalu simpan PNG 600x1800", async ({ page }) => {
  await page.goto("/?fast=1");
  await shootAll(page, 3);

  for (const y of STRIP_SLOT_CENTERS) {
    await expect.poll(pixel(page, "Hasil print", y)).not.toEqual(GRAY);
  }

  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Simpan" }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe("studio-jepret-blush.png");
  expect(pngSize(await file.path())).toEqual({ width: 600, height: 1800 });
});

test("bisa simpan sebagai JPG", async ({ page }) => {
  await page.goto("/?fast=1");
  await shootAll(page, 3);
  const format = page.getByRole("group", { name: "Format file" });
  await expect(format.getByRole("button", { name: "PNG" })).toHaveAttribute("aria-pressed", "true");
  await format.getByRole("button", { name: "JPG" }).click();

  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Simpan" }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe("studio-jepret-blush.jpg");
  // tanda awal file JPEG
  expect([...readFileSync(await file.path()).subarray(0, 3)]).toEqual([0xff, 0xd8, 0xff]);
});

test.describe("di HP Android", () => {
  test.use({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36",
  });

  test("simpan langsung mengunduh, nggak membuka share sheet", async ({ page }) => {
    await page.addInitScript(() => {
      navigator.canShare = () => true;
      navigator.share = async () => { document.title = "shared"; };
    });
    await page.goto("/?fast=1");
    await shootAll(page, 3);
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Simpan" }).tap();
    expect((await download).suggestedFilename()).toBe("studio-jepret-blush.png");
    await expect(page).not.toHaveTitle("shared");
  });

  test("halaman muat di layar HP tanpa geser ke samping", async ({ page }) => {
    const noSideScroll = () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    await page.goto("/?fast=1");
    expect(await noSideScroll()).toBe(true);
    await page.getByRole("button", { name: "Mulai jepret" }).tap();
    await expect(shoot(page)).toBeEnabled();
    expect(await noSideScroll()).toBe(true);
    for (let i = 0; i < 3; i++) {
      await shoot(page).tap();
      if (i < 2) await expect(page.getByText(`Pose ${i + 2} dari 3`)).toBeVisible();
    }
    await expect(result(page)).toBeVisible();
    expect(await noSideScroll()).toBe(true);
  });

  test("gambar hasil bisa ditekan lama buat disimpan", async ({ page }) => {
    await page.goto("/?fast=1");
    await shootAll(page, 3);
    const img = page.locator(".mat img");
    await expect(img).toHaveAttribute("src", /^blob:/);
    const [a, b] = [await img.boundingBox(), await result(page).boundingBox()];
    expect(a).toEqual(b);
  });
});

test.describe("di iPhone", () => {
  test.use({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
  });

  test("simpan lewat share sheet biar bisa masuk ke Foto", async ({ page }) => {
    await page.addInitScript(() => {
      navigator.canShare = () => true;
      // Safari menolak share kalau udah lewat dari klik, test ini memastikan share dipanggil saat itu juga
      navigator.share = async (data) => {
        if (!navigator.userActivation.isActive) throw new DOMException("telat", "NotAllowedError");
        document.title = `shared:${data?.files?.[0]?.name}`;
      };
    });
    await page.goto("/?fast=1");
    await shootAll(page, 3);
    await page.getByRole("button", { name: "Simpan" }).tap();
    await expect(page).toHaveTitle("shared:studio-jepret-blush.png");
  });
});

test("hasil print tampil di tengah layar, dengan tombol simpan di bawahnya", async ({ page }) => {
  await page.goto("/?fast=1");
  await shootAll(page, 3);
  await expect(page.getByRole("heading", { name: "Yeay, fotonya udah jadi!" })).toBeVisible();

  const center = (b: { x: number; width: number }) => b.x + b.width / 2;
  const viewport = page.viewportSize()!;
  // nunggu animasi masuk selesai: posisinya baru stabil setelah itu
  await expect.poll(async () => Math.abs(center((await result(page).boundingBox())!) - viewport.width / 2)).toBeLessThan(10);

  const print = (await result(page).boundingBox())!;
  const save = (await page.getByRole("button", { name: "Simpan" }).boundingBox())!;
  expect(save.y).toBeGreaterThan(print.y + print.height);
});

test("bagikan mengirim file PNG lewat share sheet", async ({ page }) => {
  await page.addInitScript(() => {
    navigator.canShare = () => true;
    navigator.share = async (data) => {
      document.title = `shared:${data?.files?.[0]?.name}`;
    };
  });
  await page.goto("/?fast=1");
  await shootAll(page, 3);
  await page.getByRole("button", { name: "Bagikan" }).click();
  await expect(page.getByRole("status")).toContainText("udah dibagikan");
  await expect(page).toHaveTitle("shared:studio-jepret-blush.png");
});

test("batal di share sheet bukan error", async ({ page }) => {
  await page.addInitScript(() => {
    navigator.canShare = () => true;
    navigator.share = () => Promise.reject(new DOMException("batal", "AbortError"));
  });
  await page.goto("/?fast=1");
  await shootAll(page, 3);
  await page.getByRole("button", { name: "Bagikan" }).click();
  await expect(page.getByRole("button", { name: "Bagikan" })).toBeEnabled();
  await expect(page.getByRole("status")).toBeHidden();
});

test("browser tanpa fitur share: bagikan jatuh ke unduh dengan penjelasan", async ({ page }) => {
  await page.addInitScript(() => {
    navigator.canShare = () => false;
  });
  await page.goto("/?fast=1");
  await shootAll(page, 3);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Bagikan" }).click();
  expect((await download).suggestedFilename()).toBe("studio-jepret-blush.png");
  await expect(page.getByRole("status")).toContainText("belum bisa berbagi");
});

test("kirim email di desktop: foto diunduh dan ada petunjuk melampirkan", async ({ page }) => {
  await page.goto("/?fast=1");
  await shootAll(page, 3);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Kirim email" }).click();
  expect((await download).suggestedFilename()).toBe("studio-jepret-blush.png");
  await expect(page.getByRole("status")).toContainText("Lampirkan");
});

// hitung nada yang dimainkan: suaranya sendiri nggak bisa didengar test
async function countNotes(page: Page) {
  await page.addInitScript(() => {
    const create = AudioContext.prototype.createOscillator;
    AudioContext.prototype.createOscillator = function () {
      document.documentElement.dataset.notes = String(Number(document.documentElement.dataset.notes ?? 0) + 1);
      return create.call(this);
    };
  });
}
const notesPlayed = (page: Page) => page.evaluate(() => Number(document.documentElement.dataset.notes ?? 0));

test("countdown, jepret, dan hasil berbunyi", async ({ page }) => {
  await countNotes(page);
  await page.goto("/?fast=1");
  await page.getByRole("button", { name: "Mulai jepret" }).click();
  await expect(shoot(page)).toBeEnabled();
  expect(await notesPlayed(page)).toBe(0);

  await shoot(page).click();
  await expect(page.getByText("Pose 2 dari 3")).toBeVisible();
  // 3 bunyi countdown + 2 nada jepret
  await expect.poll(() => notesPlayed(page)).toBe(5);

  for (const n of [3]) {
    await shoot(page).click();
    await expect(page.getByText(`Pose ${n} dari 3`)).toBeVisible();
  }
  await shoot(page).click();
  await expect(result(page)).toBeVisible();
  // 3 sesi x 5 nada + 5 nada hasil
  await expect.poll(() => notesPlayed(page)).toBe(20);
});

test("timer bisa diganti, dan countdown-nya ikut panjang", async ({ page }) => {
  await countNotes(page);
  await page.goto("/?fast=1");
  const timer = page.getByRole("group", { name: "Timer" });
  await expect(timer.getByRole("button", { name: "3 detik" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Mulai jepret" }).click();

  await timer.getByRole("button", { name: "5 detik" }).click();
  await expect(timer.getByRole("button", { name: "5 detik" })).toHaveAttribute("aria-pressed", "true");
  await expect(timer.getByRole("button", { name: "3 detik" })).toHaveAttribute("aria-pressed", "false");
  await shoot(page).click();
  await expect(page.getByText("Pose 2 dari 3")).toBeVisible();
  // 5 bunyi countdown + 2 nada jepret
  await expect.poll(() => notesPlayed(page)).toBe(7);
  // pilihan timer tetap dipakai buat jepretan berikutnya
  await expect(timer.getByRole("button", { name: "5 detik" })).toHaveAttribute("aria-pressed", "true");
});

test("suara bisa dimatikan dan pilihannya diingat setelah reload", async ({ page }) => {
  await countNotes(page);
  await page.goto("/?fast=1");
  await page.getByRole("button", { name: "Suara nyala" }).click();
  await page.reload();
  await expect(page.getByRole("button", { name: "Suara mati" })).toBeVisible();

  await shootAll(page, 3);
  expect(await notesPlayed(page)).toBe(0);
});

test("template grid minta 4 pose dan hasilnya 1200x1500", async ({ page }) => {
  await page.goto("/?fast=1");
  await page.getByRole("button", { name: "Umum" }).click();
  await expect(page.getByRole("button", { name: "Blush" })).toBeHidden();
  await page.getByRole("button", { name: "Kotak Berempat" }).click();
  await shootAll(page, 4);

  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Simpan" }).click();
  expect(pngSize(await (await download).path())).toEqual({ width: 1200, height: 1500 });
});

test("ulangi balik ke awal tanpa foto lama", async ({ page }) => {
  await page.goto("/?fast=1");
  await shootAll(page, 3);
  await page.getByRole("button", { name: "Ulangi" }).click();

  await expect(page.getByRole("button", { name: "Mulai jepret" })).toBeEnabled();
  await expect.poll(pixel(page, "Preview print", STRIP_SLOT_CENTERS[0])).toEqual(GRAY);
});

test("batal di tengah sesi: kamera mati dan foto dibuang", async ({ page }) => {
  await page.goto("/?fast=1");
  await page.getByRole("button", { name: "Mulai jepret" }).click();
  await shoot(page).click();
  await expect(page.getByText("Pose 2 dari 3")).toBeVisible();
  await page.getByRole("button", { name: "Batal" }).click();

  await expect(page.getByRole("button", { name: "Mulai jepret" })).toBeEnabled();
  await expect(page.locator("video")).toBeHidden();
  await expect.poll(() => page.locator("video").evaluate((v: HTMLVideoElement) => v.srcObject)).toBeNull();
  await expect.poll(pixel(page, "Preview print", STRIP_SLOT_CENTERS[0])).toEqual(GRAY);
});

test("izin kamera ditolak: ada pesan, semua slot bisa diisi dari device", async ({ page }) => {
  await denyCamera(page);
  await page.goto("/?fast=1");
  await page.getByRole("button", { name: "Mulai jepret" }).click();
  await expect(page.getByText("Izin kamera ditolak")).toBeVisible();
  await expect(page.locator("video")).toBeHidden();
  await expect(shoot(page)).toBeDisabled();

  for (const n of [2, 3]) {
    await device(page).setInputFiles(PNG_FILE);
    await expect(page.getByText(`Pose ${n} dari 3`)).toBeVisible();
  }
  await device(page).setInputFiles(PNG_FILE);
  await expect(result(page)).toBeVisible();
  for (const y of STRIP_SLOT_CENTERS) {
    await expect.poll(pixel(page, "Hasil print", y)).not.toEqual(GRAY);
  }
  await expect(page.getByRole("button", { name: "Simpan" })).toBeEnabled();
});

test("file rusak dari device: ada pesan, slotnya tetap nunggu", async ({ page }) => {
  await page.goto("/?fast=1");
  await page.getByRole("button", { name: "Mulai jepret" }).click();
  await expect(shoot(page)).toBeEnabled();
  await device(page).setInputFiles({ name: "rusak.png", mimeType: "image/png", buffer: Buffer.from("bukan gambar") });
  await expect(page.getByRole("status")).toContainText("nggak bisa dibuka");
  await expect(page.getByText("Pose 1 dari 3")).toBeVisible();
});

test("teks tamu dibatasi 32 karakter dan tanggal terisi otomatis", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Teks utama").pressSequentially("x".repeat(40));
  await expect(page.getByLabel("Teks utama")).toHaveValue("x".repeat(32));
  await expect(page.getByLabel("Teks kecil")).toHaveValue(/\d{4}$/);
});

test("kamera mati setelah sesi selesai", async ({ page }) => {
  await page.goto("/?fast=1");
  await shootAll(page, 3);
  await expect.poll(() => page.locator("video").evaluate((v: HTMLVideoElement) => v.srcObject)).toBeNull();
});

test("bikin frame dengan karakter, tetap ada setelah reload, lalu dipakai jepret", async ({ page }) => {
  await page.goto("/?fast=1");
  await page.getByRole("button", { name: "+ Bikin frame" }).click();
  await page.getByLabel("Nama frame").fill("Frame Saya");
  await page.getByRole("button", { name: "Grid 4 foto" }).click();
  await page.getByLabel("Import dari device").setInputFiles(PNG_FILE);
  await expect(page.getByRole("button", { name: "Karakter 1" })).toBeVisible();
  await page.getByRole("button", { name: "Tambah Kucing" }).click();
  await expect(page.getByRole("button", { name: "Karakter 2" })).toBeVisible();
  await page.getByRole("button", { name: "Simpan frame" }).click();

  await page.reload();
  await page.getByRole("button", { name: "Frame Saya", exact: true }).click();
  await shootAll(page, 4);

  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Simpan" }).click();
  expect(pngSize(await (await download).path())).toEqual({ width: 1200, height: 1500 });
});

test("frame acara bisa difilter dan dipakai", async ({ page }) => {
  await page.goto("/?fast=1");
  await page.getByRole("button", { name: "Acara" }).click();
  for (const name of ["Halloween", "Graduation Day", "Valentine", "Happy New Year"]) {
    await expect(page.getByRole("button", { name })).toBeVisible();
  }
  await expect(page.getByRole("button", { name: "Blush" })).toBeHidden();

  await page.getByRole("button", { name: "Valentine" }).click();
  await shootAll(page, 4);
});

test("susunan, bentuk, dan motif bisa dipilih di editor", async ({ page }) => {
  await page.goto("/?fast=1");
  await page.getByRole("button", { name: "+ Bikin frame" }).click();
  await page.getByLabel("Nama frame").fill("Frame Unik");
  await page.getByRole("group", { name: "Layout" }).getByRole("button", { name: "Duo 2 foto" }).click();
  await page.getByRole("group", { name: "Bentuk foto" }).getByRole("button", { name: "Bintang" }).click();
  await page.getByRole("group", { name: "Motif latar" }).getByRole("button", { name: "Garis" }).click();
  await page.getByRole("button", { name: "Simpan frame" }).click();

  await page.getByRole("button", { name: "Frame Unik", exact: true }).click();
  await shootAll(page, 2);
});

test("karakter bisa digeser langsung di canvas", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "+ Bikin frame" }).click();
  await page.getByRole("button", { name: "Tambah Kelinci" }).click();
  const slider = page.getByLabel("Geser kiri-kanan");
  await expect(slider).toHaveValue("0.5");

  // hover menggulir canvas ke layar dan gagal dengan jelas kalau ada elemen lain yang menutupi titik tengahnya
  const canvas = page.getByRole("img", { name: "Editor frame" });
  await canvas.hover();
  const box = (await canvas.boundingBox())!;
  const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
  await page.mouse.down();
  await page.mouse.move(cx + box.width / 4, cy, { steps: 4 });
  await page.mouse.up();

  // digeser seperempat lebar canvas: dari 0.5 harusnya sekitar 0.75
  await expect.poll(async () => Number(await slider.inputValue())).toBeGreaterThan(0.6);
});

test("frame custom bisa dihapus", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "+ Bikin frame" }).click();
  await page.getByLabel("Nama frame").fill("Sementara");
  await page.getByRole("button", { name: "Simpan frame" }).click();

  page.on("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Hapus Sementara" }).click();
  await expect(page.getByRole("button", { name: "Sementara", exact: true })).toBeHidden();
});

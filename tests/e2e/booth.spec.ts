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

  const box = (await page.getByRole("img", { name: "Editor frame" }).boundingBox())!;
  const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + box.width / 4, cy, { steps: 4 });
  await page.mouse.up();

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

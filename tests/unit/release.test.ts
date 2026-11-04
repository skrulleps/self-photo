import { describe, expect, it } from "vitest";
import { addEntry, bumpVersion, hasPending, releaseChangelog, releaseNotes } from "../../scripts/release.mjs";

const OLD = "## [0.2.0] - 2026-11-03\n\n### Added\n\n- Lama\n";
const log = (unreleased = "") => `# Changelog\n\n## [Unreleased]\n\n${unreleased}${unreleased && "\n\n"}${OLD}`;

describe("bumpVersion", () => {
  it.each([
    ["patch", "1.2.4"],
    ["minor", "1.3.0"],
    ["major", "2.0.0"],
  ])("%s dari 1.2.3 jadi %s", (level, expected) => {
    expect(bumpVersion("1.2.3", level)).toBe(expected);
  });
  it("angka dihitung sebagai angka, bukan teks", () => {
    expect(bumpVersion("0.9.0", "minor")).toBe("0.10.0");
  });
  it("level yang salah ditolak", () => {
    expect(() => bumpVersion("1.2.3", "besar")).toThrow("major, minor, atau patch");
    expect(() => bumpVersion("1.2.3", undefined)).toThrow();
  });
  it("versi yang formatnya salah ditolak", () => {
    expect(() => bumpVersion("1.2", "patch")).toThrow("x.y.z");
  });
});

describe("addEntry", () => {
  it("bikin bagian baru kalau belum ada", () => {
    expect(addEntry(log(), "added", "Fitur baru")).toBe(log("### Added\n\n- Fitur baru"));
  });
  it("nambah ke bagian yang sudah ada, di urutan paling bawah", () => {
    expect(addEntry(log("### Added\n\n- Pertama"), "added", "Kedua")).toBe(log("### Added\n\n- Pertama\n- Kedua"));
  });
  it("nggak mengganggu bagian setelahnya", () => {
    const out = addEntry(log("### Added\n\n- A\n\n### Fixed\n\n- B"), "added", "C");
    expect(out).toBe(log("### Added\n\n- A\n- C\n\n### Fixed\n\n- B"));
  });
  it("catatan nggak pernah masuk ke versi lama", () => {
    expect(addEntry(log(), "added", "Baru").endsWith(OLD)).toBe(true);
  });
  it("teks ditulis apa adanya, simbol nggak dianggap perintah", () => {
    expect(addEntry(log(), "fixed", "$& $(rm -rf) `x`")).toContain("- $& $(rm -rf) `x`");
  });
  it("baris baru digabung biar nggak bisa menyisipkan judul versi palsu", () => {
    expect(addEntry(log(), "added", "a\n## [9.9.9]")).toContain("- a ## [9.9.9]\n");
  });
  it("jenis catatan yang salah ditolak, termasuk nama bawaan object", () => {
    expect(() => addEntry(log(), "baru", "x")).toThrow("Jenis catatan");
    expect(() => addEntry(log(), "constructor", "x")).toThrow("Jenis catatan");
  });
  it("catatan kosong ditolak", () => {
    expect(() => addEntry(log(), "added", "   ")).toThrow("kosong");
  });
  it("changelog tanpa Unreleased ditolak", () => {
    expect(() => addEntry(OLD, "added", "x")).toThrow("Unreleased");
  });
});

describe("hasPending", () => {
  it("true kalau Unreleased punya catatan", () => {
    expect(hasPending(log("### Added\n\n- Baru"))).toBe(true);
  });
  it("catatan di versi lama nggak dihitung", () => {
    expect(hasPending(log())).toBe(false);
  });
  it("judul bagian tanpa catatan nggak dihitung", () => {
    expect(hasPending(log("### Added"))).toBe(false);
  });
});

describe("releaseNotes", () => {
  const two = `## [Unreleased]\n\n## [0.3.0] - 2026-11-04\n\n### Fixed\n\n- Baru\n\n${OLD}`;
  it("cuma mengambil isi versi itu, tanpa judul versi", () => {
    expect(releaseNotes(two, "0.3.0")).toBe("### Fixed\n\n- Baru");
  });
  it("versi paling lama juga bisa diambil", () => {
    expect(releaseNotes(two, "0.2.0")).toBe("### Added\n\n- Lama");
  });
  it("versi yang belum ada ditolak", () => {
    expect(() => releaseNotes(two, "9.9.9")).toThrow("belum ada");
  });
});

describe("releaseChangelog", () => {
  it("Unreleased jadi versi bertanggal, lalu Unreleased baru yang kosong", () => {
    const out = releaseChangelog(log("### Added\n\n- Baru"), "0.3.0", "2026-11-04");
    expect(out).toBe(`# Changelog\n\n## [Unreleased]\n\n## [0.3.0] - 2026-11-04\n\n### Added\n\n- Baru\n\n${OLD}`);
  });
  it("Unreleased kosong ditolak", () => {
    expect(() => releaseChangelog(log(), "0.3.0", "2026-11-04")).toThrow("kosong");
  });
  it("versi yang sudah ada ditolak", () => {
    expect(() => releaseChangelog(log("### Added\n\n- Baru"), "0.2.0", "2026-11-04")).toThrow("sudah ada");
  });
});

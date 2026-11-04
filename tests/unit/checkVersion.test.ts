import { describe, expect, it } from "vitest";
import { checkVersions } from "../../scripts/check-version.mjs";

const input = (version: string, patch = {}) => ({
  pkg: { version },
  lock: { version, packages: { "": { version } } },
  changelog: `## [${version}] - 2026-11-04`,
  base: "0.2.0",
  ...patch,
});

describe("checkVersions", () => {
  it("versi naik dan semua file sinkron: aman", () => {
    expect(checkVersions(input("0.3.0"))).toEqual([]);
  });
  it("versi sama dengan branch tujuan: aman", () => {
    expect(checkVersions(input("0.2.0"))).toEqual([]);
  });
  it("tanpa branch tujuan cuma cek file", () => {
    expect(checkVersions(input("0.1.0", { base: undefined }))).toEqual([]);
  });
  it("versi turun ditolak, dibandingkan sebagai angka", () => {
    expect(checkVersions(input("0.1.9"))).toHaveLength(1);
    expect(checkVersions(input("0.10.0", { base: "0.9.0" }))).toEqual([]);
  });
  it("format versi salah ditolak", () => {
    expect(checkVersions(input("versi-baru"))).toHaveLength(1);
  });
  it("lockfile yang beda versi ditolak, termasuk di bagian packages", () => {
    expect(checkVersions(input("0.3.0", { lock: { version: "0.2.0", packages: { "": { version: "0.3.0" } } } }))).toHaveLength(1);
    expect(checkVersions(input("0.3.0", { lock: { version: "0.3.0", packages: { "": { version: "0.2.0" } } } }))).toHaveLength(1);
  });
  it("changelog tanpa bagian versi itu ditolak", () => {
    expect(checkVersions(input("0.3.0", { changelog: "## [0.2.0]" }))).toHaveLength(1);
  });
});

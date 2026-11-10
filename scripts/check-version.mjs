import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;

function isLower(a, b) {
  const [x, y] = [a, b].map((v) => v.match(SEMVER).slice(1).map(Number));
  const i = x.findIndex((n, idx) => n !== y[idx]);
  return i !== -1 && x[i] < y[i];
}

// versi boleh sama dengan base: nggak semua PR perlu rilis baru, misalnya PR dokumentasi
export function checkVersions({ pkg, lock, changelog, base }) {
  const { version } = pkg;
  if (!SEMVER.test(version ?? "")) return [`Versi "${version}" di package.json bukan format x.y.z.`];

  const errors = [];
  if (lock.version !== version || lock.packages?.[""]?.version !== version) {
    errors.push(`Versi di package-lock.json nggak sama dengan package.json (${version}). Jalankan npm install.`);
  }
  if (!changelog.includes(`## [${version}]`)) {
    errors.push(`CHANGELOG.md belum punya bagian "## [${version}]". Tambahkan catatan rilisnya.`);
  }
  if (base && SEMVER.test(base) && isLower(version, base)) {
    errors.push(`Versi ${version} lebih rendah dari versi di branch tujuan (${base}).`);
  }
  return errors;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const read = (path) => readFileSync(path, "utf8");
  const baseRef = process.env.BASE_REF;
  const base = baseRef
    ? JSON.parse(execFileSync("git", ["show", `origin/${baseRef}:package.json`], { encoding: "utf8" })).version
    : undefined;
  const errors = checkVersions({
    pkg: JSON.parse(read("package.json")),
    lock: JSON.parse(read("package-lock.json")),
    changelog: read("CHANGELOG.md"),
    base,
  });
  errors.forEach((e) => console.error(e));
  if (errors.length) process.exit(1);
  console.log("✅ Version check passed.");
}

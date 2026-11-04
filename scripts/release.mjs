import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const HEAD = "## [Unreleased]";
const SECTIONS = { added: "Added", changed: "Changed", fixed: "Fixed", removed: "Removed", deprecated: "Deprecated", security: "Security" };

export function bumpVersion(version, level) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!match) throw new Error(`Versi "${version}" bukan format x.y.z.`);
  const [major, minor, patch] = match.slice(1).map(Number);
  if (level === "major") return `${major + 1}.0.0`;
  if (level === "minor") return `${major}.${minor + 1}.0`;
  if (level === "patch") return `${major}.${minor}.${patch + 1}`;
  throw new Error(`Pilih major, minor, atau patch, bukan "${level}".`);
}

function unreleased(changelog) {
  const start = changelog.indexOf(HEAD);
  if (start < 0) throw new Error(`CHANGELOG.md belum punya "${HEAD}".`);
  const next = changelog.indexOf("\n## [", start + HEAD.length);
  return [start, next < 0 ? changelog.length : next + 1];
}

export function addEntry(changelog, type, text) {
  const section = Object.hasOwn(SECTIONS, type) ? SECTIONS[type] : undefined;
  if (!section) throw new Error(`Jenis catatan harus salah satu dari: ${Object.keys(SECTIONS).join(", ")}.`);
  const entry = text?.replace(/\s+/g, " ").trim();
  if (!entry) throw new Error("Isi catatannya masih kosong.");

  const [start, end] = unreleased(changelog);
  let body = changelog.slice(start, end).trimEnd();
  const heading = `\n### ${section}`;
  const at = body.indexOf(heading);
  if (at < 0) {
    body += `\n${heading}\n\n- ${entry}`;
  } else {
    const nextSection = body.indexOf("\n### ", at + 1);
    const cut = nextSection < 0 ? body.length : nextSection;
    body = `${body.slice(0, cut).trimEnd()}\n- ${entry}\n${body.slice(cut)}`.trimEnd();
  }
  return `${changelog.slice(0, start)}${body}\n\n${changelog.slice(end)}`;
}

export function hasPending(changelog) {
  const [start, end] = unreleased(changelog);
  return /^- /m.test(changelog.slice(start, end));
}

export function releaseChangelog(changelog, version, date) {
  if (changelog.includes(`## [${version}]`)) throw new Error(`Versi ${version} sudah ada di changelog.`);
  if (!hasPending(changelog)) throw new Error("Bagian [Unreleased] masih kosong. Tambah catatan dulu.");
  const [start, end] = unreleased(changelog);
  const notes = changelog.slice(start + HEAD.length, end).trim();
  return `${changelog.slice(0, start)}${HEAD}\n\n## [${version}] - ${date}\n\n${notes}\n\n${changelog.slice(end)}`;
}

export function releaseNotes(changelog, version) {
  const start = changelog.indexOf(`## [${version}]`);
  if (start < 0) throw new Error(`Versi ${version} belum ada di changelog.`);
  const bodyStart = changelog.indexOf("\n", start);
  const next = changelog.indexOf("\n## [", bodyStart);
  return changelog.slice(bodyStart, next < 0 ? changelog.length : next).trim();
}

function main([command, ...args]) {
  const read = (file) => readFileSync(file, "utf8").replace(/\r\n/g, "\n");
  const json = (data) => `${JSON.stringify(data, null, 2)}\n`;

  if (command === "log") {
    const [type, ...words] = args;
    writeFileSync("CHANGELOG.md", addEntry(read("CHANGELOG.md"), type, words.join(" ")));
    return "✅ changelog updated.";
  }
  if (command === "bump") {
    const pkg = JSON.parse(read("package.json"));
    const lock = JSON.parse(read("package-lock.json"));
    const version = bumpVersion(pkg.version, args[0]);
    // tanggal lokal: toISOString pakai UTC, jadi pagi hari di WIB bisa tercatat kemarin
    const date = new Date().toLocaleDateString("en-CA");
    // dihitung semua dulu, jadi kalau ada yang gagal nggak ada file yang berubah setengah jalan
    const changelog = releaseChangelog(read("CHANGELOG.md"), version, date);
    pkg.version = lock.version = lock.packages[""].version = version;
    writeFileSync("package.json", json(pkg));
    writeFileSync("package-lock.json", json(lock));
    writeFileSync("CHANGELOG.md", changelog);
    return `Versi naik ke ${version}.`;
  }
  if (command === "pending") return String(hasPending(read("CHANGELOG.md")));
  if (command === "notes") return releaseNotes(read("CHANGELOG.md"), args[0]);
  throw new Error('Pakai: npm run log <jenis> "isi catatan", atau npm run bump <major|minor|patch>.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    console.log(main(process.argv.slice(2)));
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}

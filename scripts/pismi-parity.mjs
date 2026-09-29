#!/usr/bin/env node
/**
 * Сверка подстановки сайта с render.py курса: файлы, которые отдаёт страница
 * ПІСМІ, должны совпадать байт в байт с тем, что собирает Python из тех же
 * шаблонов с теми же данными.
 *
 *   node scripts/pismi-parity.mjs --course "<каталог дисциплины>/tools/solver" \
 *       [--work ~/.cache/pismi-parity] [--zips <каталог>] [--full]
 *
 * Берёт public/pismi (его кладёт tools/solver/export_to_site.py) и
 * src/lib/pismi-work.ts (Node 22.6+ читает TypeScript сам). Для каждого
 * набора: render.py --lab N --tier T --pib … --group … --out <tmp> и те же
 * файлы через selectedFiles() + fill(). --zips кладёт архивы buildArchive()
 * для проверки распаковкой и php -l. --full — все пары вариантов ЛР2
 * (по умолчанию каждый вариант обеих программ хотя бы раз).
 *
 * ЛР3, тема «Розклад занять»: render.py для своей работы берёт настоящий
 * розклад (seed), а в статику сайта идут выдуманные записи (site_seed).
 * Такое расхождение table.sql сверяется со сборкой в режиме сайта и
 * считается ожидаемым.
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildArchive, fill, selectedFiles, studentValues } from "../src/lib/pismi-work.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const site = path.resolve(here, "..");
const pismi = path.join(site, "public", "pismi");

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};
const course = opt("--course");
if (!course) {
  console.error("нужен --course <…>/tools/solver");
  process.exit(2);
}
const render = path.join(course, "render.py");
const work = path.resolve(opt("--work", path.join(os.homedir(), ".cache", "pismi-parity")));
const zips = opt("--zips");
const full = args.includes("--full");

const index = JSON.parse(fs.readFileSync(path.join(pismi, "index.json"), "utf8"));

const STUDENTS = [
  { pib: "Мар’яненко Ольга Петрівна", group: "КІ-101" },
  { pib: "  Мар'яненко   Ольга  Петрівна ", group: " КІ-101 " },
];

function python(argv) {
  return execFileSync("python3", argv, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

function listFiles(root) {
  const out = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else out.push(path.relative(root, full).split(path.sep).join("/"));
    }
  };
  walk(root);
  return out.sort();
}

/** Сборка своей работы Python и сравнение с сайтом. */
function compare(labNo, selection, student, extra) {
  const lab = index.labs[String(labNo)];
  const check = studentValues(student, index.palette, index.forbidden);
  if (!check.ok) throw new Error(`данные не прошли проверку: ${JSON.stringify(check.errors)}`);

  const out = fs.mkdtempSync(path.join(work, `lab${labNo}-`));
  python([
    render, "--lab", String(labNo), "--tier", selection.tier,
    "--pib", student.pib, "--group", student.group, "--out", out, ...extra,
  ]);

  const files = selectedFiles(lab, selection);
  const problems = [];
  const pyFiles = listFiles(out);
  const tsPaths = files.map((f) => f.path).sort();
  if (JSON.stringify(pyFiles) !== JSON.stringify(tsPaths)) {
    problems.push(`состав: python [${pyFiles}] ≠ сайт [${tsPaths}]`);
  }

  const texts = [];
  for (const file of files) {
    const template = fs.readFileSync(path.join(pismi, file.url), "utf8");
    texts.push({ path: file.path, template });
    const mine = Buffer.from(fill(template, check.values), "utf8");
    const theirsPath = path.join(out, file.path);
    if (!fs.existsSync(theirsPath)) continue;
    const theirs = fs.readFileSync(theirsPath);
    if (!mine.equals(theirs)) problems.push({ file: file.path, mine, theirs });
  }
  fs.rmSync(out, { recursive: true, force: true });

  return { lab, check, problems, texts };
}

/** ЛР3 в режиме сайта (site_seed) — тем же кодом курса, что и dist/. */
function lab3SiteMode(tier, theme, student, relPath) {
  const code = [
    "import sys, json",
    `sys.path.insert(0, ${JSON.stringify(course)})`,
    "import labs",
    "from labs import lab3",
    "v = labs.placeholder_values(sys.argv[1], sys.argv[2])",
    "files = lab3.build(sys.argv[3], {'theme': sys.argv[4], 'site': True})",
    "sys.stdout.buffer.write(labs.fill(files[sys.argv[5]], v).encode('utf-8'))",
  ].join("\n");
  return execFileSync("python3", ["-c", code, student.pib, student.group, tier, theme, relPath]);
}

fs.mkdirSync(work, { recursive: true });
if (zips) fs.mkdirSync(zips, { recursive: true });

const cases = [];
for (const [key, lab] of Object.entries(index.labs)) {
  const n = Number(key);
  for (const tier of lab.tiers) {
    if (n === 2) {
      const p1 = lab.variants.program1.map((v) => v.n);
      const p2 = lab.variants.program2.map((v) => v.n);
      const pairs = full
        ? p1.flatMap((a) => p2.map((b) => [a, b]))
        : p1.map((a) => [a, ((a - 1) % p2.length) + 1]).concat([[1, 13], [2, 12]]);
      for (const [v1, v2] of pairs) cases.push({ n, sel: { tier, v1, v2 }, extra: ["--v1", String(v1), "--v2", String(v2)] });
    } else if (n === 3) {
      for (const theme of lab.themes) cases.push({ n, sel: { tier, theme: theme.code }, extra: ["--theme", theme.code] });
    } else {
      cases.push({ n, sel: { tier }, extra: [] });
    }
  }
}

let ok = 0;
let expected = 0;
const failures = [];
const zipped = [];
const stamp = new Date(2026, 8, 29, 12, 0, 0);

for (const [si, student] of STUDENTS.entries()) {
  for (const c of cases) {
    const { lab, check, problems, texts } = compare(c.n, c.sel, student, c.extra);
    const label = `ЛР${c.n} ${JSON.stringify(c.sel)} ${JSON.stringify(student.pib)}`;
    let real = [];
    for (const p of problems) {
      if (typeof p === "string") {
        real.push(p);
        continue;
      }
      if (c.n === 3 && p.file === "table.sql") {
        const siteMode = lab3SiteMode(c.sel.tier, c.sel.theme, student, p.file);
        if (p.mine.equals(siteMode)) {
          expected++;
          continue;
        }
      }
      real.push(`${p.file}: ${p.mine.length} Б на сайте, ${p.theirs.length} Б у render.py`);
    }
    if (real.length) failures.push(`${label}\n    ${real.join("\n    ")}`);
    else ok++;

    // Архивы: по одному на уровень ЛР1/4/5, на тему ЛР3 и на вариант ЛР2 —
    // для каждого варианта ввода (с ’ и с '), чтобы php -l видел оба апострофа.
    if (zips && !(c.n === 2 && c.sel.v2 !== ((c.sel.v1 - 1) % 13) + 1)) {
      const { name, bytes } = buildArchive(lab, texts, check.values, stamp);
      const suffix = [c.sel.tier, c.sel.v1 && `v${c.sel.v1}-${c.sel.v2}`, c.sel.theme].filter(Boolean).join("-");
      const file = path.join(zips, name.replace(/\.zip$/, `-${suffix}-${si + 1}.zip`));
      fs.writeFileSync(file, bytes);
      zipped.push(file);
    }
  }
}

console.log(`наборов сверено: ${ok + failures.length} (${cases.length} × ${STUDENTS.length} вариантов ввода)`);
console.log(`совпали байт в байт: ${ok}`);
if (expected) console.log(`ожидаемые расхождения (ЛР3, table.sql: site_seed вместо настоящего розкладу): ${expected}`);
if (zips) console.log(`архивов: ${zipped.length} → ${zips}`);
if (failures.length) {
  console.log(`НЕ совпали: ${failures.length}`);
  for (const f of failures.slice(0, 20)) console.log("  " + f);
  process.exitCode = 1;
}
fs.rmSync(work, { recursive: true, force: true });

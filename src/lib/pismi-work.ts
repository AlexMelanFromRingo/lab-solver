/**
 * Готовая работа ПІСМІ из шаблона: данные студента, подстановка, архив.
 *
 * Шаблоны лежат в public/pismi (их выкладывает tools/solver/export_to_site.py
 * из репозитория курса) с заполнителями %%PIB%%, %%GROUP%% и т. д. Подстановка
 * здесь обязана давать байт в байт то же, что render.py курса
 * (labs/__init__.py: placeholder_values, pib_short, accent_for, fill), —
 * проверяется scripts/pismi-parity.mjs.
 *
 * Модуль без импортов и без JSX: его же напрямую запускает Node в проверке.
 */

// --- формат public/pismi/index.json -------------------------------------------

export interface PaletteColor {
  accent: string;
  soft: string;
  ink: string;
}

/** Один набор файлов: каталог в public/pismi и пути внутри него. */
export interface FileBundle {
  dir: string;
  files: string[];
}

/** ЛР2: работа = common + program1/<v1> + program2/<v2>. */
export interface Lab2Sets {
  common: FileBundle;
  program1: Record<string, FileBundle>;
  program2: Record<string, FileBundle>;
}

export interface Deviation {
  where?: string;
  what: string;
  why: string;
}

export interface Lab3Theme {
  code: string;
  title: string;
  table: string;
  fields: string[];
  source: string;
}

export interface PismiLab {
  number: number;
  title: string;
  work_dir: string;
  /** Корневой каталог архива, как в методичке: project/ или lara/. */
  root: string;
  /** Пустые каталоги, которые должны быть в архиве (ЛР4: src/). */
  empty_dirs: string[];
  tiers: string[];
  /** ЛР1, ЛР4, ЛР5: FileBundle; ЛР2: Lab2Sets; ЛР3: тема → FileBundle. */
  sets: Record<string, FileBundle | Lab2Sets | Record<string, FileBundle>>;
  /** Уровень → картинка относительно public/pismi. */
  previews: Record<string, string>;
  files: { path: string; note: string }[];
  variants?: {
    program1: { n: number; formula: string; given: string }[];
    program2: { n: number; title: string; example: string }[];
  };
  themes?: Lab3Theme[];
  features?: Record<string, string[]>;
  tier_notes?: Record<string, string>;
  overlay?: string;
  generated_by_steps?: string;
  ports: { host: number; container: number; service: string }[];
  run: string[];
  report: string[];
  notes?: string[];
  deviations: Deviation[];
}

export interface TierInfo {
  code: string;
  title: string;
  note: string;
}

export interface PismiIndex {
  format: number;
  placeholders: Record<string, string>;
  /** Символы, недопустимые в ПІБ и группе. */
  forbidden: string[];
  palette: PaletteColor[];
  tiers: TierInfo[];
  labs: Record<string, PismiLab>;
}

// --- данные студента ------------------------------------------------------------

/**
 * Пробельные символы Python (str.isspace), а не JS: \s в JS не знает
 * U+001C–U+001F и U+0085, зато считает пробелом U+FEFF. От этого зависит,
 * как делится ПІБ на слова, а значит — и инициалы, и цвет акцента.
 */
const WS = "[\\t\\n\\v\\f\\r\\x1c-\\x20\\x85\\xa0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]";
const WS_RUN = new RegExp(`${WS}+`);
const WS_EDGES = new RegExp(`^${WS}+|${WS}+$`, "g");

/** str.split() без аргументов. */
function pySplit(text: string): string[] {
  return text.split(WS_RUN).filter((word) => word !== "");
}

/** str.strip() без аргументов. */
function pyStrip(text: string): string {
  return text.replace(WS_EDGES, "");
}

/** Порядок важен: так их подставляет fill() в Python. */
export const PLACEHOLDER_KEYS = ["PIB", "PIB_SHORT", "GROUP", "ACCENT", "ACCENT_SOFT", "ACCENT_INK"] as const;
export type PlaceholderKey = (typeof PLACEHOLDER_KEYS)[number];
export type PlaceholderValues = Record<PlaceholderKey, string>;

/** «Сидоренко Петро Іванович» → «Сидоренко П. І.»; первая буква — кодовая точка, как w[0] в Python. */
export function pibShort(pib: string): string {
  const words = pySplit(pib);
  if (words.length === 0) return "";

  return [words[0], ...words.slice(1, 3).map((w) => Array.from(w)[0] + ".")].join(" ");
}

/** FNV-1a, 32 бита. */
export function fnv1a32(bytes: Uint8Array): number {
  let value = 0x811c9dc5;
  for (const byte of bytes) {
    value ^= byte;
    value = Math.imul(value, 0x01000193) >>> 0;
  }

  return value >>> 0;
}

export function accentFor(pib: string, palette: PaletteColor[]): PaletteColor {
  const bytes = new TextEncoder().encode(pyStrip(pib));

  return palette[fnv1a32(bytes) % palette.length];
}

export interface StudentInput {
  pib: string;
  group: string;
}

export type StudentCheck =
  | { ok: true; values: PlaceholderValues }
  | { ok: false; errors: { pib?: string; group?: string } };

/** Недопустимые символы значения — по одному разу, в порядке появления. */
function badChars(value: string, forbidden: string[]): string[] {
  const found: string[] = [];
  for (const ch of value) {
    if (forbidden.includes(ch) && !found.includes(ch)) found.push(ch);
  }

  return found;
}

/** placeholder_values(): ПІБ — слова через один пробел, группа — без крайних пробелов. */
export function studentValues(
  input: StudentInput,
  palette: PaletteColor[],
  forbidden: string[],
): StudentCheck {
  const pib = pySplit(input.pib).join(" ");
  const group = pyStrip(input.group);
  const errors: { pib?: string; group?: string } = {};

  for (const [key, value] of [["pib", pib], ["group", group]] as const) {
    const bad = badChars(value, forbidden);
    if (!value) errors[key] = "Пусто";
    else if (bad.length) errors[key] = `Нельзя использовать ${bad.join(" ")}`;
  }
  if (errors.pib || errors.group) return { ok: false, errors };

  const accent = accentFor(pib, palette);

  return {
    ok: true,
    values: {
      PIB: pib,
      PIB_SHORT: pibShort(pib),
      GROUP: group,
      ACCENT: accent.accent,
      ACCENT_SOFT: accent.soft,
      ACCENT_INK: accent.ink,
    },
  };
}

/** fill(): замена по очереди, потом проверка, что заполнителей не осталось. */
export function fill(text: string, values: PlaceholderValues): string {
  let out = text;
  for (const key of PLACEHOLDER_KEYS) {
    out = out.split(`%%${key}%%`).join(values[key]);
  }

  const left = out.match(/%%[A-Z_]+%%/g);
  if (left) throw new Error(`остались заполнители: ${[...new Set(left)].sort().join(", ")}`);

  return out;
}

// --- состав работы -------------------------------------------------------------

export interface Selection {
  tier: string;
  /** ЛР2: варианты программ № 1 и № 2. */
  v1?: number;
  v2?: number;
  /** ЛР3: тема справочника. */
  theme?: string;
}

export interface WorkFile {
  /** Путь внутри работы, как в методичке: www/index.php. */
  path: string;
  /** Шаблон относительно public/pismi. */
  url: string;
}

/** Файлы выбранного набора в порядке пояснений из манифеста. */
export function selectedFiles(lab: PismiLab, selection: Selection): WorkFile[] {
  const tierSets = lab.sets[selection.tier];
  if (!tierSets) return [];

  const bundles: FileBundle[] = [];
  if (lab.number === 2) {
    const sets = tierSets as Lab2Sets;
    const one = sets.program1[String(selection.v1)];
    const two = sets.program2[String(selection.v2)];
    if (!one || !two) return [];
    bundles.push(sets.common, one, two);
  } else if (lab.number === 3) {
    const bundle = (tierSets as Record<string, FileBundle>)[selection.theme ?? ""];
    if (!bundle) return [];
    bundles.push(bundle);
  } else {
    bundles.push(tierSets as FileBundle);
  }

  const byPath = new Map<string, WorkFile>();
  for (const bundle of bundles) {
    for (const path of bundle.files) byPath.set(path, { path, url: `${bundle.dir}/${path}` });
  }

  const order = lab.files.map((f) => f.path);
  const rank = (path: string) => {
    const i = order.indexOf(path);
    return i < 0 ? order.length : i;
  };

  return [...byPath.values()].sort((a, b) => rank(a.path) - rank(b.path) || a.path.localeCompare(b.path));
}

/** Имя архива: «ЛР1-Сидоренко.zip»; без данных — «ЛР1.zip». */
export function archiveName(lab: PismiLab, values: PlaceholderValues | null): string {
  const surname = values ? pySplit(values.PIB)[0] ?? "" : "";
  const safe = surname.replace(/[\\/:*?"<>|]/g, "_");

  return safe ? `ЛР${lab.number}-${safe}.zip` : `ЛР${lab.number}.zip`;
}

/** Содержимое архива: пути с корнем из методички, плюс пустые каталоги. */
export function archiveEntries(
  lab: PismiLab,
  files: { path: string; text: string }[],
): { path: string; data: Uint8Array | null }[] {
  const encoder = new TextEncoder();
  const root = lab.root.replace(/\/+$/, "");
  const dirs = new Set<string>([`${root}/`]);
  const entries: { path: string; data: Uint8Array | null }[] = [];

  for (const file of files) {
    const full = `${root}/${file.path}`;
    const parts = full.split("/");
    for (let i = 1; i < parts.length; i++) dirs.add(parts.slice(0, i).join("/") + "/");
    entries.push({ path: full, data: encoder.encode(file.text) });
  }
  for (const dir of lab.empty_dirs) dirs.add(`${root}/${dir.replace(/\/+$/, "")}/`);

  return [...[...dirs].sort().map((path) => ({ path, data: null })), ...entries];
}

// --- ZIP без сжатия --------------------------------------------------------------

let crcTable: Uint32Array | null = null;

function crc32(data: Uint8Array): number {
  if (!crcTable) {
    crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTable[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (const byte of data) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);

  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Архив ZIP со способом «stored»: тексты работы весят десятки килобайт, и
 * сжатие не стоит отдельной библиотеки. Имена — UTF-8 (флаг 11), атрибуты —
 * Unix: 0644 у файлов, 0755 у каталогов (data = null).
 */
export function zipStore(entries: { path: string; data: Uint8Array | null }[], date = new Date()): Uint8Array {
  const encoder = new TextEncoder();
  const time = (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1);
  const day = ((Math.max(date.getFullYear(), 1980) - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();

  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const name = encoder.encode(entry.path);
    const data = entry.data ?? new Uint8Array(0);
    const isDir = entry.data === null;
    const crc = crc32(data);

    const local = new Uint8Array(30 + name.length + data.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, isDir ? 20 : 10, true);
    lv.setUint16(6, 0x0800, true);
    lv.setUint16(8, 0, true);
    lv.setUint16(10, time, true);
    lv.setUint16(12, day, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, data.length, true);
    lv.setUint32(22, data.length, true);
    lv.setUint16(26, name.length, true);
    lv.setUint16(28, 0, true);
    local.set(name, 30);
    local.set(data, 30 + name.length);

    const central = new Uint8Array(46 + name.length);
    const cv = new DataView(central.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, (3 << 8) | 20, true);
    cv.setUint16(6, isDir ? 20 : 10, true);
    cv.setUint16(8, 0x0800, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, time, true);
    cv.setUint16(14, day, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, data.length, true);
    cv.setUint32(24, data.length, true);
    cv.setUint16(28, name.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, (((isDir ? 0o040755 : 0o100644) << 16) | (isDir ? 0x10 : 0)) >>> 0, true);
    cv.setUint32(42, offset, true);
    central.set(name, 46);

    locals.push(local);
    centrals.push(central);
    offset += local.length;
  }

  const centralSize = centrals.reduce((sum, c) => sum + c.length, 0);
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, entries.length, true);
  ev.setUint16(10, entries.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);

  const out = new Uint8Array(offset + centralSize + end.length);
  let at = 0;
  for (const part of [...locals, ...centrals, end]) {
    out.set(part, at);
    at += part.length;
  }

  return out;
}

/** Есть ли в тексте заполнители (ЛР4 — окружение дословно, в нём их нет). */
export function hasPlaceholders(text: string): boolean {
  return /%%[A-Z_]+%%/.test(text);
}

/**
 * Всё вместе: тексты шаблонов → архив работы с подставленными данными.
 * Без данных (values = null) собирается только набор без заполнителей.
 */
export function buildArchive(
  lab: PismiLab,
  files: { path: string; template: string }[],
  values: PlaceholderValues | null,
  date?: Date,
): { name: string; bytes: Uint8Array } {
  const filled = files.map((f) => {
    if (values) return { path: f.path, text: fill(f.template, values) };
    if (hasPlaceholders(f.template)) throw new Error(`${f.path}: нужны данные студента`);
    return { path: f.path, text: f.template };
  });

  return { name: archiveName(lab, values), bytes: zipStore(archiveEntries(lab, filled), date) };
}

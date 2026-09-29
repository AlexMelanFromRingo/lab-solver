/**
 * «Прикладна криптологія», ЛР 2 — криптоаналіз шифртекстів ЛР 1 трьома
 * методами методички «методи»: частотним (шифр зсуву), автокореляційним і
 * методом Казіскі (шифр Віженера).
 *
 * Алфавіт — N1 з ЛР 1: символ з кодом 20h…FFh (CP1251) має позицію
 * X1 = Ord(C) − 32, N = 224. Ключ у ЛР 1 іде за позицією байта у файлі,
 * тому й тут позиції рахуються по всьому файлу: керуючі символи (CR/LF)
 * не аналізуються, але своє місце в періоді займають.
 */

export const N = 224;
const BASE = 32;
/** Позиції в N1 символів, яким методичка ставить у відповідність найчастіші: пробіл і «о» (EEh). */
export const X1_SPACE = 0x20 - BASE;
export const X1_O = 0xee - BASE;

const mod = (a: number, n: number) => ((a % n) + n) % n;

/** X1 кожного байта файлу; −1 — керуючий символ (не шифрувався). */
export function n1Symbols(bytes: ArrayLike<number>): number[] {
  return Array.from(bytes, (b) => (b >= BASE ? b - BASE : -1));
}

export const symbolCount = (sym: number[]) => sym.filter((x) => x >= 0).length;

// --------------------------------------------------------------- 2.1 частотний метод

export interface FreqRow {
  x1: number;
  count: number;
  share: number;
}

/** Частоти символів шифртексту — від найчастішого. */
export function frequencies(sym: number[]): FreqRow[] {
  const cnt = new Map<number, number>();
  let total = 0;
  for (const s of sym)
    if (s >= 0) {
      cnt.set(s, (cnt.get(s) ?? 0) + 1);
      total++;
    }
  return [...cnt]
    .map(([x1, count]) => ({ x1, count, share: count / total }))
    .sort((a, b) => b.count - a.count || a.x1 - b.x1);
}

export interface ShiftGuess {
  /** припущення: найчастіший ↔ пробіл, другий ↔ «о» */
  assumed: "пробіл" | "о";
  cipherX1: number;
  key: number;
}

/**
 * Кроки 2–5 частотного методу: ключ = (X1 найчастішого − X1 пробілу) mod N;
 * запасний варіант — другий за частотою символ ↔ «о».
 */
export function shiftGuesses(sym: number[]): ShiftGuess[] {
  const f = frequencies(sym);
  if (!f.length) return [];
  const out: ShiftGuess[] = [{ assumed: "пробіл", cipherX1: f[0].x1, key: mod(f[0].x1 - X1_SPACE, N) }];
  if (f.length > 1) out.push({ assumed: "о", cipherX1: f[1].x1, key: mod(f[1].x1 - X1_O, N) });
  return out;
}

// --------------------------------------------------------- 2.2 автокореляційний метод

export interface AcRow {
  t: number;
  n: number;
  gamma: number;
}

/** nₜ — кількість i ∈ [1, L − t] з Cᵢ = Cᵢ₊ₜ (керуючі символи не рахуються); γₜ = nₜ / (L − t). */
export function autocorrelation(sym: number[], tMax: number): AcRow[] {
  const L = sym.length;
  const rows: AcRow[] = [];
  for (let t = 1; t <= Math.min(tMax, L - 1); t++) {
    let n = 0;
    for (let i = 0; i + t < L; i++) if (sym[i] >= 0 && sym[i] === sym[i + t]) n++;
    rows.push({ t, n, gamma: n / (L - t) });
  }
  return rows;
}

/**
 * Крок 4: відбираються t з великим γₜ, мінімальне з них — період.
 * Поріг методички «γₜ > 0,5» для природного тексту недосяжний (γ на періоді
 * ≈ 0,06), тому тут він відносний: γₜ > 0,5 · max γ.
 */
export function acPeriod(rows: AcRow[]): { threshold: number; picked: number[]; period: number | null } {
  const max = Math.max(0, ...rows.map((r) => r.gamma));
  const threshold = max / 2;
  const picked = rows.filter((r) => r.gamma > threshold && r.n > 0).map((r) => r.t);
  return { threshold, picked, period: picked.length ? picked[0] : null };
}

// ------------------------------------------------------------------ 2.3 метод Казіскі

export interface Trigram {
  tri: number[];
  positions: number[]; // 1-based, як у методичці
  distances: number[];
  gcd: number;
}

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);

/** Кроки 1–3: повторювані три-грами, їхні позиції, відстані між сусідніми повтореннями та їх НСД. */
export function kasiskiTrigrams(sym: number[]): Trigram[] {
  const pos = new Map<string, number[]>();
  for (let i = 0; i + 3 <= sym.length; i++) {
    if (sym[i] < 0 || sym[i + 1] < 0 || sym[i + 2] < 0) continue;
    const k = `${sym[i]},${sym[i + 1]},${sym[i + 2]}`;
    const list = pos.get(k);
    if (list) list.push(i + 1);
    else pos.set(k, [i + 1]);
  }
  const out: Trigram[] = [];
  for (const [k, p] of pos) {
    if (p.length < 2) continue;
    const distances = p.slice(1).map((x, i) => x - p[i]);
    out.push({ tri: k.split(",").map(Number), positions: p, distances, gcd: distances.reduce(gcd) });
  }
  return out.sort((a, b) => b.positions.length - a.positions.length || a.positions[0] - b.positions[0]);
}

/**
 * Крок 4: період — НСД, спільний для більшості відстаней. Для кожного
 * кандидата d ≥ 2 рахується частка відстаней, кратних d; беремо найбільше d,
 * частка якого не нижча 0,8 від найкращої (дільники періоду мають таку ж
 * частку, кратні — удвічі меншу).
 */
export function kasiskiPeriod(tris: Trigram[], dMax = 40): { shares: { d: number; share: number }[]; period: number | null } {
  const all = tris.flatMap((t) => t.distances);
  if (!all.length) return { shares: [], period: null };
  const shares: { d: number; share: number }[] = [];
  for (let d = 2; d <= dMax; d++) shares.push({ d, share: all.filter((x) => x % d === 0).length / all.length });
  const best = Math.max(...shares.map((s) => s.share));
  if (best === 0) return { shares, period: null };
  const period = Math.max(...shares.filter((s) => s.share >= 0.8 * best).map((s) => s.d));
  return { shares, period };
}

// ------------------------------------------------- крок 5: зсуви в межах періоду

/** Гіпотези для стовпця, як у частотному методі: 1-й ↔ пробіл (основна), 2-й ↔ «о», далі навпаки. */
export type Hypothesis = "1-пробіл" | "2-о" | "2-пробіл" | "1-о";
export const HYPOTHESES: Hypothesis[] = ["1-пробіл", "2-о", "2-пробіл", "1-о"];

export interface ColumnShift {
  col: number; // 1-based
  length: number;
  top: FreqRow[]; // два найчастіші символи стовпця
  key: number; // зсув за обраною гіпотезою
}

/** Частотний криптоаналіз серед перших, других, … символів блоків довжини period (позиції — по файлу). */
export function columnShifts(sym: number[], period: number, pick: Hypothesis[] = []): ColumnShift[] {
  return Array.from({ length: period }, (_, c) => {
    const col = sym.filter((s, i) => i % period === c && s >= 0);
    const top = frequencies(col).slice(0, 2);
    const h = pick[c] ?? "1-пробіл";
    const cipher = (h.startsWith("1") ? top[0] : top[1] ?? top[0])?.x1 ?? X1_SPACE;
    const plain = h.endsWith("о") ? X1_O : X1_SPACE;
    return { col: c + 1, length: col.length, top, key: mod(cipher - plain, N) };
  });
}

/** Якщо знайдений ключ — повтор коротшого (період вийшов кратним), повертає найкоротший. */
export function reduceKey(keys: number[]): number[] {
  for (let d = 1; d < keys.length; d++) if (keys.length % d === 0 && keys.every((k, i) => k === keys[i % d])) return keys.slice(0, d);
  return keys;
}

/** Символ пароля, що дає зсув k: код k + 32 (зворотне до X1 = Ord − 32). */
export const keyByte = (k: number) => k + BASE;

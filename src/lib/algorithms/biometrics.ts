/**
 * «Методи та засоби захисту інформації», ЛР «Дослідження характеристик та
 * точності біометрії за відбитками пальців». Моделює те, що в учбовій програмі
 * ИХБ.exe показано графіками: за відстанями між векторами відбитків своїх і
 * чужих осіб будуються FAR (чужого прийнято) і FRR (свого відхилено) від порога
 * суміщення, крива ROC і рівень рівної помилки EER. Плюс оцінка збігу двох
 * відбитків за формулою K (ідентичні, якщо K > 65 %).
 */

export interface RocPoint {
  t: number;
  far: number;
  frr: number;
}

export interface Accuracy {
  grid: RocPoint[];
  eer: { t: number; value: number };
  /** Порог, де FAR і FRR дорівнюють заданим граничним відстаням. */
}

/**
 * FAR(t) = частка чужих з відстанню ≤ t (помилково прийнятих),
 * FRR(t) = частка своїх з відстанню > t (помилково відхилених).
 * Менша відстань — більша схожість; приймаємо при відстані ≤ порога t.
 */
export function accuracy(genuine: number[], impostor: number[], steps = 100): Accuracy {
  if (!genuine.length || !impostor.length) throw new Error("Потрібні відстані і для своїх, і для чужих");
  const all = [...genuine, ...impostor];
  const lo = Math.min(...all);
  const hi = Math.max(...all);
  const span = hi - lo || 1;
  const far = (t: number) => impostor.filter((d) => d <= t).length / impostor.length;
  const frr = (t: number) => genuine.filter((d) => d > t).length / genuine.length;
  const grid: RocPoint[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = lo - span * 0.05 + (span * 1.1 * i) / steps;
    grid.push({ t, far: far(t), frr: frr(t) });
  }
  // EER — поріг, де |FAR − FRR| мінімальний
  let eer = grid[0];
  for (const p of grid) if (Math.abs(p.far - p.frr) < Math.abs(eer.far - eer.frr)) eer = p;
  return { grid, eer: { t: eer.t, value: (eer.far + eer.frr) / 2 } };
}

/** Значення FAR/FRR у конкретному порозі суміщення. */
export function atThreshold(genuine: number[], impostor: number[], t: number): { far: number; frr: number } {
  return {
    far: impostor.filter((d) => d <= t).length / impostor.length,
    frr: genuine.filter((d) => d > t).length / genuine.length,
  };
}

export interface Minutia {
  x: number;
  y: number;
  /** Орієнтація (кут), градуси. */
  a: number;
}

export interface MatchResult {
  matched: Minutia[];
  unmatchedRef: Minutia[];
  unmatchedInput: Minutia[];
  total: number;
  k: number;
  identical: boolean;
}

/** Кутова різниця з урахуванням періоду 360°. */
const angDiff = (a: number, b: number) => {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
};

/**
 * Оцінка збігу двох векторів відбитків: деталь еталона збігається з деталлю
 * введеного, якщо вона в межах допуску за відстанню і орієнтацією (жадібне
 * зіставлення найближчих). K = збіглих / усього деталей · 100 %; за методичкою
 * при K > 65 % відбитки вважаються ідентичними.
 */
export function fingerprintMatch(ref: Minutia[], input: Minutia[], posTol: number, angTol: number): MatchResult {
  if (!ref.length || !input.length) throw new Error("Потрібні точки еталонного і введеного відбитків");
  const usedInput = new Set<number>();
  const matched: Minutia[] = [];
  const unmatchedRef: Minutia[] = [];
  for (const r of ref) {
    let best = -1;
    let bestD = Infinity;
    input.forEach((p, j) => {
      if (usedInput.has(j)) return;
      const d = Math.hypot(r.x - p.x, r.y - p.y);
      if (d <= posTol && angDiff(r.a, p.a) <= angTol && d < bestD) {
        bestD = d;
        best = j;
      }
    });
    if (best >= 0) {
      usedInput.add(best);
      matched.push(r);
    } else unmatchedRef.push(r);
  }
  const unmatchedInput = input.filter((_, j) => !usedInput.has(j));
  const total = Math.max(ref.length, input.length);
  const k = (matched.length / total) * 100;
  return { matched, unmatchedRef, unmatchedInput, total, k, identical: k > 65 };
}

/** Розбір рядків «x y кут» у точки відбитка. */
export function parseMinutiae(src: string): Minutia[] {
  return src
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l, i) => {
      const parts = l.split(/[\s,;]+/).map(Number);
      if (parts.length < 3 || parts.some((v) => !Number.isFinite(v))) throw new Error(`Рядок ${i + 1}: потрібно «x y кут»`);
      return { x: parts[0], y: parts[1], a: parts[2] };
    });
}

/** Числа з рядка (відстані). */
export function parseDistances(src: string): number[] {
  return src
    .split(/[\s,;]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map(Number)
    .filter((v) => Number.isFinite(v));
}

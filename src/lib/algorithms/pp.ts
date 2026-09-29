/**
 * «Проектний практикум» (C#, Visual Studio) — расчёты, которые методичка
 * просит занести в таблицы отчёта: энергия сигнала методом средних
 * прямоугольников (ЛР 2), число обменов в сортировках (ЛР 3), число
 * операций при выборке из матрицы (ЛР 4), модели светофора, рельсовой цепи
 * и реле (ЛР 6–8). Циклы повторяют код методички операция в операцию.
 */

// ------------------------------------------------------------ ЛР 2

export interface Signal {
  fn: "SIN" | "COS";
  u: number;
  f: number;
  phase: number;
}

/** Додаток 1 методички. */
export const SIGNALS: Signal[] = [
  { fn: "SIN", u: 220, f: 25, phase: 2 },
  { fn: "COS", u: 127, f: 50, phase: 5 },
  { fn: "SIN", u: 380, f: 75, phase: 4 },
  { fn: "COS", u: 400, f: 100, phase: 5 },
  { fn: "SIN", u: 12, f: 25, phase: 3 },
  { fn: "COS", u: 230, f: 50, phase: 3 },
  { fn: "SIN", u: 2, f: 75, phase: 3 },
  { fn: "COS", u: 115, f: 100, phase: 2 },
  { fn: "SIN", u: 240, f: 25, phase: 2 },
  { fn: "COS", u: 3, f: 50, phase: 3 },
  { fn: "SIN", u: 120, f: 75, phase: 2 },
  { fn: "COS", u: 190, f: 100, phase: 0 },
  { fn: "SIN", u: 5, f: 25, phase: 4 },
  { fn: "COS", u: 415, f: 50, phase: 3 },
  { fn: "SIN", u: 48, f: 75, phase: 0 },
];

export const signalAt = (s: Signal, t: number) => s.u * (s.fn === "SIN" ? Math.sin : Math.cos)(2 * Math.PI * s.f * t + s.phase);

/** Цикл btnOK_Click: for (t = a + Δt/2; t <= b; t = t + Δt) E += u²; E *= Δt. */
export function energy(s: Signal, a: number, b: number, n: number): number {
  let e = 0;
  const dt = (b - a) / n;
  for (let t = a + dt / 2; t <= b; t = t + dt) e += signalAt(s, t) ** 2;
  return e * dt;
}

/** Точное значение на периоде [0; 1/f]: U²/(2f) — от фазы не зависит. */
export const exactEnergy = (s: Signal) => (s.u * s.u) / (2 * s.f);

/** Таблица 2.4: значения после каждой итерации (у закрывающей скобки тела цикла). */
export function iterations(s: Signal, a: number, b: number, n: number) {
  const rows: { i: number; t: number; e: number; dt: number }[] = [];
  let e = 0;
  const dt = (b - a) / n;
  let i = 0;
  for (let t = a + dt / 2; t <= b; t = t + dt) {
    e += signalAt(s, t) ** 2;
    rows.push({ i: ++i, t, e, dt });
  }
  return rows;
}

// ------------------------------------------------------------ ЛР 3

/** InsertionSort(a, step) из CodeFile3.cs; возвращает число обменов. */
function insertion(a: number[], step: number): number {
  let swaps = 0;
  for (let i = step; i < a.length; i++)
    for (let j = i; j >= step && a[j - step] > a[j]; j -= step) {
      [a[j - step], a[j]] = [a[j], a[j - step]];
      swaps++;
    }
  return swaps;
}

export const insertionSwaps = (a: number[]) => insertion([...a], 1);

export function shellSwaps(a0: number[]): number {
  const a = [...a0];
  let swaps = 0;
  for (let step = Math.floor(a.length / 2); step > 0; step = Math.floor(step / 2)) swaps += insertion(a, step);
  return swaps;
}

/** Детерминированный генератор, чтобы среднее по «случайным» массивам не менялось от перезагрузки страницы. */
export function lcg(seed: number) {
  let x = seed >>> 0;
  return (max: number) => {
    x = (Math.imul(x, 1664525) + 1013904223) >>> 0;
    return x % max;
  };
}

export function sortTable(lengths: number[], trials = 2000) {
  const rnd = lcg(12345);
  return lengths.map((n) => {
    const asc = Array.from({ length: n }, (_, i) => i);
    const desc = Array.from({ length: n }, (_, i) => -i + (n - 1));
    let si = 0;
    let ss = 0;
    for (let k = 0; k < trials; k++) {
      const r = Array.from({ length: n }, () => rnd(10));
      si += insertionSwaps(r);
      ss += shellSwaps(r);
    }
    return {
      n,
      insAsc: insertionSwaps(asc),
      insDesc: insertionSwaps(desc),
      insRand: si / trials,
      shAsc: shellSwaps(asc),
      shDesc: shellSwaps(desc),
      shRand: ss / trials,
    };
  });
}

// ------------------------------------------------------------ ЛР 4

export const SUBARRAY_TASKS = [
  "Кількості ненульових елементів в кожному рядку масиву окремо.",
  "Ненульові елементи по діагоналі, починаючи з [0, 0].",
  "Елементи, які більші за елемент в тому ж рядку в нульовому стовпці.",
  "Суми непарних елементів в кожному рядку окремо.",
  "Всі елементи рядків, в яких є хоча б один нульовий елемент.",
  "Ненульові елементи, абсолютне значення яких не перевищує 5.",
  "Елементи, які менші за половину максимального елементу в масиві.",
  "Парні елементи з верхньої половини рядків масиву.",
];

export const CHARACTERISTIC_TASKS = ["Середнє значення елементів.", "Максимальний елемент.", "Сума квадратів елементів.", "Кількість парних елементів."];

/** Номер задачи табл. 4.1 (1…8) и 4.2 (1…4) по варианту 1…16. */
export const lab4Tasks = (v: number) => ({ sub: Math.floor((v - 1) / 2) + 1, ch: Math.floor((v - 1) / 4) + 1 });

/** GetSubarray так же, как в C#-коде страницы; ops — число проверенных элементов. */
export function getSubarray(task: number, a: number[][]): { sub: number[]; ops: number } {
  const rows = a.length;
  const cols = a[0].length;
  const sub: number[] = [];
  let ops = 0;
  switch (task) {
    case 1:
      for (let i = 0; i < rows; i++) {
        let c = 0;
        for (let j = 0; j < cols; j++) {
          ops++;
          if (a[i][j] !== 0) c++;
        }
        sub.push(c);
      }
      break;
    case 2:
      for (let k = 0; k < Math.min(rows, cols); k++) {
        ops++;
        if (a[k][k] !== 0) sub.push(a[k][k]);
      }
      break;
    case 3:
      for (let i = 0; i < rows; i++)
        for (let j = 1; j < cols; j++) {
          ops++;
          if (a[i][j] > a[i][0]) sub.push(a[i][j]);
        }
      break;
    case 4:
      for (let i = 0; i < rows; i++) {
        let s = 0;
        for (let j = 0; j < cols; j++) {
          ops++;
          if (a[i][j] % 2 !== 0) s += a[i][j];
        }
        sub.push(s);
      }
      break;
    case 5:
      for (let i = 0; i < rows; i++) {
        let zero = false;
        for (let j = 0; j < cols && !zero; j++) {
          ops++;
          if (a[i][j] === 0) zero = true;
        }
        if (zero) for (let j = 0; j < cols; j++) sub.push(a[i][j]);
      }
      break;
    case 6:
      for (let i = 0; i < rows; i++)
        for (let j = 0; j < cols; j++) {
          ops++;
          if (a[i][j] !== 0 && Math.abs(a[i][j]) <= 5) sub.push(a[i][j]);
        }
      break;
    case 7: {
      let max = a[0][0];
      for (let i = 0; i < rows; i++)
        for (let j = 0; j < cols; j++) {
          ops++;
          if (a[i][j] > max) max = a[i][j];
        }
      for (let i = 0; i < rows; i++)
        for (let j = 0; j < cols; j++) {
          ops++;
          if (a[i][j] < max / 2) sub.push(a[i][j]);
        }
      break;
    }
    case 8:
      for (let i = 0; i < Math.floor(rows / 2); i++)
        for (let j = 0; j < cols; j++) {
          ops++;
          if (a[i][j] % 2 === 0) sub.push(a[i][j]);
        }
      break;
  }
  return { sub, ops };
}

export function characteristic(task: number, sub: number[]): number {
  switch (task) {
    case 1:
      return sub.length ? sub.reduce((s, x) => s + x, 0) / sub.length : NaN;
    case 2:
      return sub.length ? Math.max(...sub) : NaN;
    case 3:
      return sub.reduce((s, x) => s + x * x, 0);
    default:
      return sub.filter((x) => x % 2 === 0).length;
  }
}

export const ascMatrix = (rows: number, cols: number) => Array.from({ length: rows }, (_, i) => Array.from({ length: cols }, (_, j) => i * cols + j));

export function opsTable(task: number, lengths: number[], trials = 500) {
  const rnd = lcg(777);
  return lengths.map((n) => {
    let sum = 0;
    for (let k = 0; k < trials; k++) sum += getSubarray(task, Array.from({ length: n }, () => Array.from({ length: n }, () => rnd(10)))).ops;
    return { n, asc: getSubarray(task, ascMatrix(n, n)).ops, rand: sum / trials };
  });
}

// ------------------------------------------------------- ЛР 6–8: моделі

/** Сигнальний вогонь: денний режим 11,5 В, допуск −1,0 / +0,5 В. */
export const lightVisible = (voltage: number, lampGood: boolean, lensGood = true) => voltage >= 10.5 && voltage <= 12 && lampGood && lensGood;

/** Імпульсне РК: РЛ 0…2000 м, мінімальний опір баласту 1 Ом·км. */
export const trackSignal = (ballast: number, shunt: number, begin = 0, end = 2000) => ballast >= 1 && (shunt < begin || shunt > end);

/** Реле КШ1-280 з гістерезисом: стан змінюється лише за порогами. */
export function relaySweep(voltages: number[]) {
  let neutral: "Тиловий" | "Фронтовий" = "Тиловий";
  let polar: "Нормальний" | "Переведений" = "Нормальний";
  return voltages.map((v) => {
    if (Math.abs(v) <= 1.4) neutral = "Тиловий";
    if (Math.abs(v) >= 6.5) neutral = "Фронтовий";
    if (v <= -3.9) polar = "Переведений";
    if (v >= 3.9) polar = "Нормальний";
    return { v, neutral, polar };
  });
}

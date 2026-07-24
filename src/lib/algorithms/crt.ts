/**
 * Система линейных сравнений (курсовая, 2 курс) — портировано 1:1 с реального решателя
 * coursework_year2_pt2/Test/ChineseWithExplain.py: та же последовательность шагов,
 * те же формулы и те же пояснения. Решает ровно три сравнения вида a·x ≡ b (mod m)
 * (не произвольное число уравнений — курсовая была именно на три), сначала сводя каждое
 * к нормальному виду x ≡ C (mod m) через линейное сравнение, затем комбинируя по
 * классической Китайской теореме об остатках (модули предполагаются попарно
 * взаимно простыми — так же, как в исходном решателе).
 */

export function gcd(a: bigint, b: bigint): bigint {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b) [a, b] = [b, a % b];
  return a;
}

/** Рекурсивный расширенный Евклид — реализован так же, как в исходнике (a,b) -> (g,y,x) с переставленными x/y. */
export function extendedGcd(a: bigint, b: bigint): [bigint, bigint, bigint] {
  if (a === 0n) return [b, 0n, 1n];
  const [g, y, x] = extendedGcd(b % a, a);
  return [g, x - (b / a) * y, y];
}

export function lcmOfThree(a: bigint, b: bigint, c: bigint): bigint {
  const gcdAb = gcd(a, b);
  const lcmAb = (a * b) / gcdAb;
  const gcdAbc = gcd(lcmAb, c);
  return (lcmAb * c) / gcdAbc;
}

/** Решает a·x ≡ b (mod m); возвращает нормализованное x0 ∈ [0, m) или null, если неразрешимо. */
export function linearCongruence(a: bigint, b: bigint, m: bigint): bigint | null {
  const [g, x] = extendedGcd(a, m);
  if (b % g === 0n) {
    let x0 = (x * (b / g)) % m;
    x0 = ((x0 % m) + m) % m;
    return x0;
  }
  return null;
}

export interface Congruence {
  a: bigint;
  b: bigint;
  m: bigint;
}

export interface CrtResult {
  M: bigint;
  steps: string[];
  solutions: (bigint | null)[];
  yAnswers: bigint[];
  solvable: boolean;
  answer: bigint | null;
}

/** Дословно main_calc()+solve_linear()+chinese_theorem() из ChineseWithExplain.py. */
export function solveThreeCongruences(eqs: [Congruence, Congruence, Congruence]): CrtResult {
  const steps: string[] = [];
  const [e0, e1, e2] = eqs;
  const M = lcmOfThree(e0.m, e1.m, e2.m);

  steps.push(`Наименьшее общее кратное модулей ${e0.m}, ${e1.m} и ${e2.m} (обозначается как M) равно ${M}`);
  steps.push("**********");
  steps.push("Для решения Китайской теоремой об остатках, нам нужно сначала решить каждое сравнение отдельно.");
  steps.push("Полученные значения будут далее использоваться в формуле в качестве параметра C");

  const solutions: (bigint | null)[] = [];
  for (const eq of eqs) {
    const sol = linearCongruence(eq.a, eq.b, eq.m);
    if (sol !== null) {
      steps.push(`Решение линейного сравнения ${eq.a} x ≡ ${eq.b} mod ${eq.m} -> x≡ ${sol} mod( ${M} )`);
    } else {
      steps.push(`Линейное сравнение ${eq.a} x ≡ ${eq.b} mod ${eq.m} неразрешимо.`);
    }
    solutions.push(sol);
  }

  const solvable = solutions.every((s) => s !== null);
  if (!solvable) {
    return { M, steps, solutions, yAnswers: [], solvable: false, answer: null };
  }

  steps.push("**********");
  steps.push("Далее мы переходим к самой Китайской теореме об остатках и будем использовать эту формулу для расчёта y(i):");
  steps.push("M/m(i) * y(i) ≡ 1 mod(m(i))");

  const yAnswers: bigint[] = [];
  eqs.forEach((eq, i) => {
    const Mi = M / eq.m;
    const y = linearCongruence(Mi, 1n, eq.m)!;
    yAnswers.push(y);
    steps.push(`Для ${Mi} y${i + 1} ≡ 1 mod ${eq.m} значение y${i + 1} равно ${y}`);
  });

  steps.push("**********");
  steps.push(
    "Итоговый ответ вычисляется по формуле ( (M/m(i))*(c(i))*y(i)+(M/m(i+1))*(c(i+1))*y(i+1)...(M/m(n))*(c(n))*y(n) ) mod(M)"
  );

  const sum = eqs.reduce((acc, eq, i) => acc + (yAnswers[i] * (M / eq.m) * solutions[i]!), 0n);
  const answer = ((sum % M) + M) % M;
  steps.push(`Итоговый ответ: ${answer} mod(${M})`);

  return { M, steps, solutions, yAnswers, solvable: true, answer };
}

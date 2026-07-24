/**
 * Тесты на простоту — курсовая по прикладной криптологии требовала писать эти тесты
 * с нуля (как в primary_tests и rust-rsa-from-scratch, где Миллер-Рабин на 50 раундов
 * проверяет кандидатов, найденных собственным ГПСЧ). Здесь — те же четыре теста
 * с трассировкой шагов, чтобы можно было свериться со своей реализацией вручную.
 */

import { jacobiSymbol, modExp, randomBigIntBits } from "./bignum-utils";

export interface TestStep {
  label: string;
  detail: string;
}

export interface TestResult {
  isPrime: boolean;
  certain: boolean;
  steps: TestStep[];
}

export function trialDivision(n: bigint): TestResult {
  const steps: TestStep[] = [];
  if (n < 2n) return { isPrime: false, certain: true, steps: [{ label: "n < 2", detail: "по определению не простое" }] };
  if (n === 2n || n === 3n) return { isPrime: true, certain: true, steps: [{ label: "n ∈ {2,3}", detail: "простое" }] };
  if (n % 2n === 0n) return { isPrime: false, certain: true, steps: [{ label: "n чётное", detail: "делится на 2" }] };

  let d = 3n;
  const limit = bigintSqrt(n);
  steps.push({ label: "Граница перебора", detail: `√n ≈ ${limit}` });
  while (d <= limit) {
    if (n % d === 0n) {
      steps.push({ label: "Найден делитель", detail: `n делится на ${d}` });
      return { isPrime: false, certain: true, steps };
    }
    d += 2n;
  }
  steps.push({ label: "Делителей не найдено", detail: `перебраны все нечётные до √n` });
  return { isPrime: true, certain: true, steps };
}

function bigintSqrt(n: bigint): bigint {
  if (n < 2n) return n;
  let x = n;
  let y = (x + 1n) / 2n;
  while (y < x) {
    x = y;
    y = (x + n / x) / 2n;
  }
  return x;
}

export function fermatTest(n: bigint, rounds: number): TestResult {
  const steps: TestStep[] = [];
  if (n < 4n) return trialDivision(n);
  for (let i = 0; i < rounds; i++) {
    let a = (randomBigIntBits(Math.min(32, n.toString(2).length)) % (n - 3n)) + 2n;
    a = ((a % (n - 2n)) + (n - 2n)) % (n - 2n) + 2n;
    const r = modExp(a, n - 1n, n);
    steps.push({ label: `Свидетель a=${a}`, detail: `a^(n-1) mod n = ${r}` });
    if (r !== 1n) {
      steps.push({ label: "Тест провален", detail: "n — составное (свидетель Ферма)" });
      return { isPrime: false, certain: true, steps };
    }
  }
  steps.push({ label: "Все раунды пройдены", detail: `n, вероятно, простое (p ошибки ≤ (1/2)^${rounds}, ловится числами Кармайкла)` });
  return { isPrime: true, certain: false, steps };
}

export function millerRabinTest(n: bigint, rounds: number): TestResult {
  const steps: TestStep[] = [];
  if (n < 4n) return trialDivision(n);
  if (n % 2n === 0n) return { isPrime: false, certain: true, steps: [{ label: "n чётное", detail: "составное" }] };

  let d = n - 1n;
  let r = 0n;
  while (d % 2n === 0n) {
    d /= 2n;
    r += 1n;
  }
  steps.push({ label: "Разложение n−1", detail: `n−1 = 2^${r} · ${d}` });

  for (let i = 0; i < rounds; i++) {
    let a = (randomBigIntBits(Math.min(32, n.toString(2).length)) % (n - 3n)) + 2n;
    a = ((a % (n - 3n)) + (n - 3n)) % (n - 3n) + 2n;
    let x = modExp(a, d, n);
    if (x === 1n || x === n - 1n) {
      steps.push({ label: `Свидетель a=${a}`, detail: `a^d mod n = ${x} — раунд пройден` });
      continue;
    }
    let witness = true;
    for (let j = 0n; j < r - 1n; j++) {
      x = (x * x) % n;
      if (x === n - 1n) {
        witness = false;
        break;
      }
    }
    if (witness) {
      steps.push({ label: `Свидетель a=${a}`, detail: "составное число подтверждено" });
      return { isPrime: false, certain: true, steps };
    }
    steps.push({ label: `Свидетель a=${a}`, detail: "раунд пройден" });
  }
  steps.push({ label: "Все раунды пройдены", detail: `n — вероятно простое (p ошибки ≤ 4^-${rounds})` });
  return { isPrime: true, certain: false, steps };
}

export function solovayStrassenTest(n: bigint, rounds: number): TestResult {
  const steps: TestStep[] = [];
  if (n < 3n) return trialDivision(n);
  if (n % 2n === 0n) return { isPrime: false, certain: true, steps: [{ label: "n чётное", detail: "составное" }] };

  for (let i = 0; i < rounds; i++) {
    let a = (randomBigIntBits(Math.min(32, n.toString(2).length)) % (n - 3n)) + 2n;
    a = ((a % (n - 2n)) + (n - 2n)) % (n - 2n) + 2n;
    const jac = jacobiSymbol(a, n);
    const jacMod = ((BigInt(jac) % n) + n) % n;
    const euler = modExp(a, (n - 1n) / 2n, n);
    steps.push({
      label: `Свидетель a=${a}`,
      detail: `символ Якоби (a/n) = ${jac}, a^((n-1)/2) mod n = ${euler}`,
    });
    if (jac === 0 || euler !== jacMod) {
      steps.push({ label: "Тест провален", detail: "n — составное" });
      return { isPrime: false, certain: true, steps };
    }
  }
  steps.push({ label: "Все раунды пройдены", detail: `n — вероятно простое (p ошибки ≤ (1/2)^${rounds})` });
  return { isPrime: true, certain: false, steps };
}

export type PrimalityMethod = "trial" | "fermat" | "miller-rabin" | "solovay-strassen";

export function runPrimalityTest(n: bigint, method: PrimalityMethod, rounds = 20): TestResult {
  switch (method) {
    case "trial":
      return trialDivision(n);
    case "fermat":
      return fermatTest(n, rounds);
    case "miller-rabin":
      return millerRabinTest(n, rounds);
    case "solovay-strassen":
      return solovayStrassenTest(n, rounds);
  }
}

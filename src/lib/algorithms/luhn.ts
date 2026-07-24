/**
 * Алгоритм Луна — источник: card-check-algo/src/app/app.component.ts (luhnSteps/isValid/checkDigit).
 */

export interface LuhnDigitStep {
  original: number;
  doubled: boolean;
  value: number;
  afterCorrection: number;
}

export interface LuhnResult {
  steps: LuhnDigitStep[];
  total: number;
  isValid: boolean;
  checkDigit: number;
}

function digitsOf(input: string): number[] {
  const clean = input.replace(/\s+/g, "");
  if (!/^\d+$/.test(clean)) throw new Error("Номер должен содержать только цифры");
  return clean.split("").map(Number);
}

/** Проверка полного номера (с контрольной цифрой) по модулю 10, удвоение через цифру справа налево. */
export function luhnCheck(input: string): LuhnResult {
  const digits = digitsOf(input);
  const steps: LuhnDigitStep[] = [];
  let total = 0;

  for (let i = 0; i < digits.length; i++) {
    const fromRight = digits.length - 1 - i;
    const doubled = fromRight % 2 === 1;
    let value = digits[i];
    if (doubled) value *= 2;
    const afterCorrection = value > 9 ? value - 9 : value;
    steps.push({ original: digits[i], doubled, value, afterCorrection });
    total += afterCorrection;
  }

  return {
    steps,
    total,
    isValid: digits.length >= 1 && total % 10 === 0,
    checkDigit: digits[digits.length - 1],
  };
}

/** Довычисляет недостающую контрольную цифру для номера без неё (последняя цифра ещё не проставлена). */
export function luhnComputeCheckDigit(partial: string): number {
  const digits = digitsOf(partial);
  let total = 0;
  for (let i = 0; i < digits.length; i++) {
    const fromRight = digits.length - i; // считаем так, будто check-digit будет добавлена справа
    const doubled = fromRight % 2 === 1;
    let value = digits[i];
    if (doubled) value *= 2;
    total += value > 9 ? value - 9 : value;
  }
  return (10 - (total % 10)) % 10;
}

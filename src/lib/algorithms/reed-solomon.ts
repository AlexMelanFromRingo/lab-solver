/**
 * Код Рида-Соломона над GF(2⁸) — портировано из вашего же Angular-приложения
 * error-codes-explorer/src/app/pages/reed-solomon/reed-solomon.ts (чистые функции
 * вынесены как есть, сигнальная логика Angular убрана).
 */

const GF_POLY = 0x11d; // x^8 + x^4 + x^3 + x^2 + 1
const GF_SIZE = 256;

const gfExp: number[] = new Array(512);
const gfLog: number[] = new Array(256);

(function initGF() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    gfExp[i] = x;
    gfLog[x] = i;
    x = x << 1;
    if (x >= GF_SIZE) x = (x ^ GF_POLY) & 0xff;
  }
  for (let i = 255; i < 512; i++) gfExp[i] = gfExp[i - 255];
  gfLog[0] = -1;
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return gfExp[gfLog[a] + gfLog[b]];
}

function gfDiv(a: number, b: number): number {
  if (b === 0) throw new Error("Деление на 0 в GF(2⁸)");
  if (a === 0) return 0;
  return gfExp[(gfLog[a] - gfLog[b] + 255) % 255];
}

function gfInverse(x: number): number {
  return gfExp[255 - gfLog[x]];
}

function polyMul(p: number[], q: number[]): number[] {
  const result = new Array(p.length + q.length - 1).fill(0);
  for (let i = 0; i < p.length; i++) for (let j = 0; j < q.length; j++) result[i + j] ^= gfMul(p[i], q[j]);
  return result;
}

function polyEval(p: number[], x: number): number {
  let result = p[0];
  for (let i = 1; i < p.length; i++) result = gfMul(result, x) ^ p[i];
  return result;
}

export function rsGeneratorPoly(nsym: number): number[] {
  let g = [1];
  for (let i = 0; i < nsym; i++) g = polyMul(g, [1, gfExp[i]]);
  return g;
}

export function rsEncode(msg: number[], nsym: number): number[] {
  const gen = rsGeneratorPoly(nsym);
  const msgOut = new Array(msg.length + nsym).fill(0);
  for (let i = 0; i < msg.length; i++) msgOut[i] = msg[i];
  for (let i = 0; i < msg.length; i++) {
    const coef = msgOut[i];
    if (coef !== 0) for (let j = 1; j < gen.length; j++) msgOut[i + j] ^= gfMul(gen[j], coef);
  }
  const result = [...msg];
  for (let i = 0; i < nsym; i++) result.push(msgOut[msg.length + i]);
  return result;
}

export function rsCalcSyndromes(msg: number[], nsym: number): number[] {
  const synd = [0];
  for (let i = 0; i < nsym; i++) synd.push(polyEval(msg, gfExp[i]));
  return synd;
}

export function rsCheckSyndromes(synd: number[]): boolean {
  return synd.slice(1).every((s) => s === 0);
}

export function rsFindErrorLocator(synd: number[], nsym: number): number[] {
  let errLoc = [1];
  let oldLoc = [1];
  const syndShift = 0;

  for (let i = 0; i < nsym; i++) {
    const K = i + syndShift + 1;
    let delta = synd[K];
    for (let j = 1; j < errLoc.length; j++) delta ^= gfMul(errLoc[errLoc.length - 1 - j], synd[K - j]);

    oldLoc.push(0);

    if (delta !== 0) {
      if (oldLoc.length > errLoc.length) {
        const newLoc = oldLoc.map((c) => gfMul(c, delta));
        oldLoc = errLoc.map((c) => gfMul(c, gfInverse(delta)));
        errLoc = newLoc;
      }
      for (let j = 0; j < oldLoc.length; j++) errLoc[errLoc.length - 1 - j] ^= gfMul(delta, oldLoc[oldLoc.length - 1 - j]);
    }
  }

  while (errLoc.length > 0 && errLoc[0] === 0) errLoc.shift();

  const errs = errLoc.length - 1;
  if (errs * 2 > nsym) throw new Error("Слишком много ошибок для исправления");
  return errLoc;
}

export function rsFindErrors(errLoc: number[], msgLen: number): number[] {
  const errs = errLoc.length - 1;
  const errPos: number[] = [];
  for (let i = 0; i < msgLen; i++) {
    if (polyEval(errLoc, gfExp[255 - i]) === 0) errPos.push(msgLen - 1 - i);
  }
  if (errPos.length !== errs) throw new Error("Не удалось найти позиции ошибок");
  return errPos;
}

export function rsFindErrorMagnitudes(synd: number[], errLoc: number[], errPos: number[], msgLen: number): number[] {
  const nsym = synd.length - 1;
  const errMag: number[] = new Array(msgLen).fill(0);

  const syndPoly: number[] = [];
  for (let i = nsym; i >= 1; i--) syndPoly.push(synd[i]);

  let omega = polyMul(syndPoly, errLoc);
  if (omega.length > nsym) omega = omega.slice(omega.length - nsym);

  for (let i = 0; i < errPos.length; i++) {
    const Xi = gfExp[msgLen - 1 - errPos[i]];
    const XiInv = gfInverse(Xi);
    const omegaVal = polyEval(omega, XiInv);

    let errLocPrime = 1;
    for (let j = 0; j < errPos.length; j++) {
      if (j !== i) {
        const Xj = gfExp[msgLen - 1 - errPos[j]];
        errLocPrime = gfMul(errLocPrime, 1 ^ gfMul(XiInv, Xj));
      }
    }
    if (errLocPrime === 0) continue;
    errMag[errPos[i]] = gfDiv(omegaVal, errLocPrime);
  }
  return errMag;
}

export interface RsStep {
  title: string;
  description: string;
  data?: string;
}

export interface RsCorrectionResult {
  success: boolean;
  corrected: number[];
  errorPositions: number[];
  errorMagnitudes: number[];
  message: string;
  steps: RsStep[];
}

export function rsDecodeAndCorrect(received: number[], nsym: number): RsCorrectionResult {
  const steps: RsStep[] = [];
  const synd = rsCalcSyndromes(received, nsym);

  if (rsCheckSyndromes(synd)) {
    steps.push({ title: "Проверка синдромов", description: "Все синдромы равны 0 — ошибок нет" });
    return { success: true, corrected: received, errorPositions: [], errorMagnitudes: [], message: "Ошибок не обнаружено", steps };
  }

  steps.push({
    title: "Синдромы ≠ 0",
    description: "Обнаружены ненулевые синдромы — есть ошибки",
    data: synd.slice(1).map((s) => s.toString(16).padStart(2, "0").toUpperCase()).join(" "),
  });

  try {
    const errLoc = rsFindErrorLocator(synd, nsym);
    steps.push({
      title: "Полином-локатор ошибок (Берлекэмпа-Мэсси)",
      description: `Коэффициенты: [${errLoc.map((c) => c.toString(16).toUpperCase()).join(", ")}]`,
      data: `Степень: ${errLoc.length - 1} → ${errLoc.length - 1} ошибок`,
    });

    const errPos = rsFindErrors(errLoc, received.length);
    steps.push({
      title: "Позиции ошибок (поиск Ченя)",
      description: "Найдены корни полинома-локатора",
      data: `Позиции: [${errPos.join(", ")}]`,
    });

    const errMag = rsFindErrorMagnitudes(synd, errLoc, errPos, received.length);
    const corrected = [...received];
    for (const pos of errPos) corrected[pos] ^= errMag[pos];

    steps.push({
      title: "Величины ошибок (алгоритм Форни)",
      description: errPos.map((p) => `Позиция ${p}: величина 0x${errMag[p].toString(16).toUpperCase().padStart(2, "0")}`).join("; "),
    });

    return { success: true, corrected, errorPositions: errPos, errorMagnitudes: errMag, message: `Исправлено ${errPos.length} ошибок`, steps };
  } catch (e) {
    const msg = (e as Error).message || "Не удалось исправить";
    steps.push({ title: "Ошибка декодирования", description: msg });
    return { success: false, corrected: received, errorPositions: [], errorMagnitudes: [], message: msg, steps };
  }
}

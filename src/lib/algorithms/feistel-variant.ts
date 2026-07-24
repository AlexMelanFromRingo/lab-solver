/**
 * Конструктор сети Фейстеля по номеру варианта — Лаба 3 "Прикладной криптологии".
 *
 * Источник таблицы вариантов: RiderProjects/AppliedCryptology_Lab3_Gen/Variants.md
 * (и её более чистая копия в Obsidian-заметке Третий курс/Прикладная криптология/Variants.md).
 * Референсные реализации: RiderProjects/AppliedCryptology_Lab3_Gen/*.cpp (общий конструктор),
 * RiderProjects/Lab3/Lab3.cpp и Обсидиан-заметка "Lab 3.md" (конкретный вариант 19 Ани:
 * n=16, K=16, F1=XOR, round = rightRotate(sbox(R XOR roundKey), 3)).
 *
 * Ключевая идея (её же фиксирует TODO в самой Variants.md): при размере блока n=16
 * полу-блоки L/R занимают n/2=8 бит, а не 4 — поэтому S-box, рассчитанный в методичке
 * на 4-битный вход, применяется не к целому полу-блоку, а к каждому 4-битному нибблу
 * полу-блока по отдельности. Это верно для любой ширины полу-блока (4/8/16/32 бита).
 */

export type F1Id = 1 | 2 | 3;
export type F23Id = 4 | 5 | 6;

export const F1_NAMES: Record<F1Id, string> = {
  1: "[+] сложение по mod 2^(n/2)",
  2: "(+) XOR",
  3: "[×] умножение по mod 2^(n/2)",
};

export const F23_NAMES: Record<F23Id, string> = {
  4: "<<< циклический сдвиг влево",
  5: ">>> циклический сдвиг вправо",
  6: "S(n) — S-box по ниблам",
};

export interface F23Spec {
  id: F23Id;
  param: number;
}

export interface VariantSpec {
  variant: number;
  n: number; // размер блока, бит
  k: number; // размер ключа, бит
  f1: F1Id;
  f2: F23Spec;
  f3: F23Spec;
  note?: string;
}

// Фиксированный 16-элементный S-box (тот же, что в референсных реализациях Lab3 —
// 4-битная подстановка, применяется пониблово к полу-блоку любой ширины).
export const SBOX4 = [0xc, 0x5, 0x6, 0xb, 0x9, 0x0, 0xa, 0xd, 0x3, 0xe, 0xf, 0x8, 0x4, 0x7, 0x1, 0x2];

// Таблица 24 вариантов, транскрибирована из Variants.md 1:1.
export const VARIANTS: VariantSpec[] = [
  { variant: 1, n: 8, k: 8, f1: 1, f2: { id: 4, param: 2 }, f3: { id: 6, param: 4 } },
  { variant: 2, n: 8, k: 16, f1: 2, f2: { id: 5, param: 2 }, f3: { id: 6, param: 2 } },
  { variant: 3, n: 8, k: 32, f1: 3, f2: { id: 5, param: 1 }, f3: { id: 6, param: 4 } },
  { variant: 4, n: 8, k: 8, f1: 1, f2: { id: 4, param: 3 }, f3: { id: 5, param: 2 } },
  { variant: 5, n: 8, k: 16, f1: 2, f2: { id: 6, param: 4 }, f3: { id: 5, param: 3 } },
  { variant: 6, n: 8, k: 32, f1: 3, f2: { id: 4, param: 1 }, f3: { id: 5, param: 2 } },
  { variant: 7, n: 8, k: 8, f1: 2, f2: { id: 6, param: 2 }, f3: { id: 4, param: 3 } },
  { variant: 8, n: 8, k: 16, f1: 1, f2: { id: 5, param: 2 }, f3: { id: 6, param: 4 } },
  { variant: 9, n: 16, k: 16, f1: 3, f2: { id: 4, param: 5 }, f3: { id: 6, param: 4 } },
  { variant: 10, n: 16, k: 32, f1: 2, f2: { id: 4, param: 3 }, f3: { id: 5, param: 2 } },
  { variant: 11, n: 16, k: 16, f1: 1, f2: { id: 6, param: 4 }, f3: { id: 5, param: 2 } },
  { variant: 12, n: 16, k: 32, f1: 2, f2: { id: 6, param: 8 }, f3: { id: 4, param: 5 } },
  {
    variant: 13,
    n: 16,
    k: 16,
    f1: 3,
    f2: { id: 5, param: 4 },
    f3: { id: 6, param: 0 },
    note: "В исходной методичке параметры F2/F3 отмечены знаком «?» — здесь взято правдоподобное значение, сверьте с преподавателем.",
  },
  { variant: 14, n: 16, k: 32, f1: 1, f2: { id: 5, param: 2 }, f3: { id: 5, param: 2 } },
  { variant: 15, n: 16, k: 64, f1: 2, f2: { id: 4, param: 4 }, f3: { id: 6, param: 4 } },
  { variant: 16, n: 16, k: 32, f1: 3, f2: { id: 6, param: 4 }, f3: { id: 5, param: 5 } },
  { variant: 17, n: 8, k: 8, f1: 2, f2: { id: 5, param: 2 }, f3: { id: 6, param: 2 } },
  { variant: 18, n: 16, k: 32, f1: 1, f2: { id: 6, param: 4 }, f3: { id: 4, param: 4 } },
  { variant: 19, n: 16, k: 16, f1: 3, f2: { id: 5, param: 2 }, f3: { id: 6, param: 8 } },
  { variant: 20, n: 16, k: 64, f1: 2, f2: { id: 6, param: 8 }, f3: { id: 5, param: 2 } },
  { variant: 21, n: 8, k: 32, f1: 1, f2: { id: 4, param: 3 }, f3: { id: 6, param: 4 } },
  { variant: 22, n: 16, k: 64, f1: 1, f2: { id: 4, param: 7 }, f3: { id: 6, param: 2 } },
  { variant: 23, n: 8, k: 32, f1: 2, f2: { id: 6, param: 4 }, f3: { id: 5, param: 3 } },
  { variant: 24, n: 16, k: 64, f1: 3, f2: { id: 5, param: 7 }, f3: { id: 6, param: 8 } },
];

export function getVariant(n: number): VariantSpec {
  const v = VARIANTS.find((x) => x.variant === n);
  if (!v) throw new Error(`Нет варианта №${n}`);
  return v;
}

function mask(w: number): bigint {
  return (1n << BigInt(w)) - 1n;
}

function rotl(v: bigint, p: number, w: number): bigint {
  const pp = BigInt(((p % w) + w) % w);
  const wide = BigInt(w);
  return ((v << pp) | (v >> (wide - pp))) & mask(w);
}

function rotr(v: bigint, p: number, w: number): bigint {
  const pp = BigInt(((p % w) + w) % w);
  const wide = BigInt(w);
  return ((v >> pp) | (v << (wide - pp))) & mask(w);
}

/** S-box по ниблам: делит значение шириной w бит на нибблы по 4 бита и подставляет каждый отдельно. */
function sboxNibbles(v: bigint, w: number): bigint {
  const nibbles = w / 4;
  let out = 0n;
  for (let i = 0; i < nibbles; i++) {
    const shift = BigInt(i * 4);
    const nibble = Number((v >> shift) & 0xfn);
    out |= BigInt(SBOX4[nibble]) << shift;
  }
  return out;
}

function applyF1(a: bigint, b: bigint, id: F1Id, w: number): bigint {
  switch (id) {
    case 1:
      return (a + b) & mask(w);
    case 2:
      return a ^ b;
    case 3:
      return (a * b) & mask(w);
  }
}

function applyF23(v: bigint, spec: F23Spec, w: number): bigint {
  switch (spec.id) {
    case 4:
      return rotl(v, spec.param, w);
    case 5:
      return rotr(v, spec.param, w);
    case 6:
      return sboxNibbles(v, w);
  }
}

export interface RoundTrace {
  round: number;
  roundKey: bigint;
  lIn: bigint;
  rIn: bigint;
  afterF1: bigint;
  afterF2: bigint;
  afterF3: bigint;
  lOut: bigint;
  rOut: bigint;
}

export interface RunResult {
  output: bigint;
  trace: RoundTrace[];
  halfWidth: number;
  roundKeys: bigint[];
}

/** Раундовые ключи: K бит ключа режутся на куски по halfWidth бит и используются циклически. */
export function generateRoundKeys(key: bigint, k: number, halfWidth: number, rounds: number): bigint[] {
  const numChunks = Math.max(1, Math.ceil(k / halfWidth));
  const chunks: bigint[] = [];
  for (let i = 0; i < numChunks; i++) {
    chunks.push((key >> BigInt(i * halfWidth)) & mask(halfWidth));
  }
  const keys: bigint[] = [];
  for (let i = 0; i < rounds; i++) keys.push(chunks[i % numChunks]);
  return keys;
}

export function defaultRounds(spec: VariantSpec): number {
  const halfWidth = spec.n / 2;
  return Math.max(4, Math.ceil(spec.k / halfWidth));
}

function runBlock(
  block: bigint,
  spec: VariantSpec,
  roundKeys: bigint[],
  direction: "encrypt" | "decrypt"
): RunResult {
  const halfWidth = spec.n / 2;
  let L = (block >> BigInt(halfWidth)) & mask(halfWidth);
  let R = block & mask(halfWidth);
  // Классический приём для обращения сети Фейстеля: меняем местами L/R, прогоняем
  // ТОТ ЖЕ раундовый механизм с ключами в обратном порядке, затем меняем местами
  // ещё раз. Без этого свопа реверс раундовых ключей сам по себе не инвертирует
  // шифрование — F считалась бы от другой половины блока.
  if (direction === "decrypt") [L, R] = [R, L];

  const orderedKeys = direction === "encrypt" ? roundKeys : [...roundKeys].reverse();
  const trace: RoundTrace[] = [];

  orderedKeys.forEach((roundKey, i) => {
    const lIn = L;
    const rIn = R;
    const afterF1 = applyF1(rIn, roundKey, spec.f1, halfWidth);
    const afterF2 = applyF23(afterF1, spec.f2, halfWidth);
    const afterF3 = applyF23(afterF2, spec.f3, halfWidth);
    const rOut = lIn ^ afterF3;
    const lOut = rIn;
    trace.push({ round: i + 1, roundKey, lIn, rIn, afterF1, afterF2, afterF3, lOut, rOut });
    L = lOut;
    R = rOut;
  });

  if (direction === "decrypt") [L, R] = [R, L];
  const output = (L << BigInt(halfWidth)) | R;
  return { output, trace, halfWidth, roundKeys: orderedKeys };
}

export function encryptBlock(block: bigint, spec: VariantSpec, key: bigint, rounds: number): RunResult {
  const roundKeys = generateRoundKeys(key, spec.k, spec.n / 2, rounds);
  return runBlock(block, spec, roundKeys, "encrypt");
}

export function decryptBlock(block: bigint, spec: VariantSpec, key: bigint, rounds: number): RunResult {
  const roundKeys = generateRoundKeys(key, spec.k, spec.n / 2, rounds);
  return runBlock(block, spec, roundKeys, "decrypt");
}

/** Шифрование произвольного текста: UTF-8 байты режутся на блоки по n/8 байт, последний блок дополняется нулями. */
export function encryptText(text: string, spec: VariantSpec, key: bigint, rounds: number): { hex: string; padded: number } {
  const bytesPerBlock = spec.n / 8;
  const data = new TextEncoder().encode(text);
  const padded = (bytesPerBlock - (data.length % bytesPerBlock)) % bytesPerBlock;
  const total = data.length + padded;
  const out = new Uint8Array(total);
  out.set(data);

  const outBytes = new Uint8Array(total);
  for (let off = 0; off < total; off += bytesPerBlock) {
    let block = 0n;
    for (let i = 0; i < bytesPerBlock; i++) block = (block << 8n) | BigInt(out[off + i]);
    const { output } = encryptBlock(block, spec, key, rounds);
    for (let i = bytesPerBlock - 1; i >= 0; i--) {
      outBytes[off + i] = Number(output & 0xffn);
      block = output >> BigInt((bytesPerBlock - i) * 8);
    }
    let v = output;
    for (let i = bytesPerBlock - 1; i >= 0; i--) {
      outBytes[off + i] = Number(v & 0xffn);
      v >>= 8n;
    }
  }
  const hex = Array.from(outBytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  return { hex, padded };
}

export function decryptTextFromHex(hex: string, spec: VariantSpec, key: bigint, rounds: number, padded: number): string {
  const bytesPerBlock = spec.n / 8;
  const clean = hex.replace(/\s+/g, "");
  const total = clean.length / 2;
  const inBytes = new Uint8Array(total);
  for (let i = 0; i < total; i++) inBytes[i] = parseInt(clean.substr(i * 2, 2), 16);

  const outBytes = new Uint8Array(total);
  for (let off = 0; off < total; off += bytesPerBlock) {
    let block = 0n;
    for (let i = 0; i < bytesPerBlock; i++) block = (block << 8n) | BigInt(inBytes[off + i]);
    const { output } = decryptBlock(block, spec, key, rounds);
    let v = output;
    for (let i = bytesPerBlock - 1; i >= 0; i--) {
      outBytes[off + i] = Number(v & 0xffn);
      v >>= 8n;
    }
  }
  const trimmed = outBytes.slice(0, total - padded);
  return new TextDecoder().decode(trimmed);
}

export function bitsToHex(v: bigint, bits: number): string {
  return v.toString(16).padStart(Math.ceil(bits / 4), "0");
}

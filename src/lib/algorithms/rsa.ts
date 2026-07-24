/**
 * RSA "с нуля" — курсовая работа собиралась из лабораторных за семестр, и суть задания
 * была не "зашифровать AES-ключом", а написать весь стек самостоятельно: свой ГПСЧ,
 * свой тест простоты (Миллер-Рабин), свой расширенный Евклид для d = e⁻¹ mod φ(n).
 * Источник: rust-rsa-from-scratch/src/main.rs (mod_exp, is_prime, extended_euclid_special,
 * generate_prime/generate_e) — здесь тот же алгоритм на BigInt (в оригинале был ограничен
 * u32, что резко занижало реальный размер ключа).
 */

import { LCG, extGcd, gcd, modExp, modInverse } from "./bignum-utils";
import { millerRabinTest } from "./primality";

export interface PrimeSearchStep {
  candidate: bigint;
  isPrime: boolean;
  attempt: number;
}

export interface PrimeSearchResult {
  prime: bigint;
  attempts: PrimeSearchStep[];
}

/** Ищет простое число заданной битности, кандидаты генерирует собственный LCG, проверяет Миллером-Рабином. */
export function findPrime(bits: number, seed: bigint, rounds = 20): PrimeSearchResult {
  const rng = new LCG(seed);
  const attempts: PrimeSearchStep[] = [];
  for (let i = 0; i < 5000; i++) {
    const candidate = rng.randomOdd(bits);
    const result = millerRabinTest(candidate, rounds);
    attempts.push({ candidate, isPrime: result.isPrime, attempt: i + 1 });
    if (result.isPrime) return { prime: candidate, attempts };
  }
  throw new Error("Не удалось найти простое число за 5000 попыток — увеличьте битность");
}

export interface RsaKeys {
  p: bigint;
  q: bigint;
  n: bigint;
  phi: bigint;
  e: bigint;
  d: bigint;
}

export function chooseE(phi: bigint): bigint {
  const candidate = 65537n;
  if (candidate < phi && gcd(candidate, phi) === 1n) return candidate;
  let e = 3n;
  while (gcd(e, phi) !== 1n) e += 2n;
  return e;
}

export function generateKeys(bitsPerPrime: number, seedP: bigint, seedQ: bigint): RsaKeys {
  let { prime: p } = findPrime(bitsPerPrime, seedP);
  let { prime: q } = findPrime(bitsPerPrime, seedQ);
  if (p === q) q = findPrime(bitsPerPrime, seedQ + 12345n).prime;

  const n = p * q;
  const phi = (p - 1n) * (q - 1n);
  const e = chooseE(phi);
  const d = modInverse(e, phi);
  if (d === null) throw new Error("Не удалось вычислить d — попробуйте другие p, q");
  return { p, q, n, phi, e, d };
}

export function keysFromPQE(p: bigint, q: bigint, e: bigint): RsaKeys {
  const n = p * q;
  const phi = (p - 1n) * (q - 1n);
  const d = modInverse(e, phi);
  if (d === null) throw new Error("e не взаимно просто с φ(n) — обратного элемента не существует");
  return { p, q, n, phi, e, d };
}

export function encryptNumber(m: bigint, e: bigint, n: bigint): bigint {
  if (m >= n) throw new Error("Сообщение должно быть меньше n — увеличьте p, q или разбейте на блоки");
  return modExp(m, e, n);
}

export function decryptNumber(c: bigint, d: bigint, n: bigint): bigint {
  return modExp(c, d, n);
}

function chunkSizeBytes(n: bigint): number {
  const bits = n.toString(2).length;
  return Math.max(1, Math.floor((bits - 1) / 8));
}

export function encryptText(text: string, e: bigint, n: bigint): bigint[] {
  const bytes = new TextEncoder().encode(text);
  const size = chunkSizeBytes(n);
  const blocks: bigint[] = [];
  for (let off = 0; off < bytes.length; off += size) {
    let block = 0n;
    const end = Math.min(off + size, bytes.length);
    for (let i = off; i < end; i++) block = (block << 8n) | BigInt(bytes[i]);
    blocks.push(encryptNumber(block, e, n));
  }
  return blocks;
}

export function decryptText(blocks: bigint[], d: bigint, n: bigint): string {
  const size = chunkSizeBytes(n);
  const out: number[] = [];
  for (const c of blocks) {
    let m = decryptNumber(c, d, n);
    const bytes: number[] = [];
    while (m > 0n) {
      bytes.unshift(Number(m & 0xffn));
      m >>= 8n;
    }
    while (bytes.length < size && out.length + bytes.length < blocks.length * size) {
      // не дополняем нулями слева искусственно — только то, что реально получилось
      break;
    }
    out.push(...bytes);
  }
  return new TextDecoder().decode(new Uint8Array(out));
}

/**
 * Точная схема файлового RSA-шифратора из курсовой (rsa_encryptor/src/main.rs):
 * данные режутся на 20-битные блоки (не байтовые!), перед ними — 5-битный заголовок
 * с длиной паддинга последнего блока, каждый зашифрованный блок пишется как 4 байта
 * (big-endian), всё вместе кодируется в Base64. Схема расчитана на "оригинальные"
 * ключи (простые ≤ 15 бит, n умещается меньше чем в 32 бита) — как и в реальном
 * инструменте; для более крупных ключей 4-байтная упаковка блока переполнится.
 */
const BASE64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function base64Encode(bytes: number[]): string {
  let output = "";
  let val = 0;
  let valb = -6;
  for (const c of bytes) {
    val = (val << 8) + c;
    valb += 8;
    while (valb >= 0) {
      output += BASE64_CHARS[(val >> valb) & 0x3f];
      valb -= 6;
    }
  }
  if (valb > -6) output += BASE64_CHARS[((val << 8) >> (valb + 8)) & 0x3f];
  while (output.length % 4 !== 0) output += "=";
  return output;
}

function base64Decode(input: string): number[] {
  const table = new Array(256).fill(-1);
  for (let i = 0; i < BASE64_CHARS.length; i++) table[BASE64_CHARS.charCodeAt(i)] = i;
  const output: number[] = [];
  let val = 0;
  let valb = -8;
  for (const ch of input) {
    const c = table[ch.charCodeAt(0)];
    if (c === -1) break;
    val = (val << 6) + c;
    valb += 6;
    if (valb >= 0) {
      output.push((val >> valb) & 0xff);
      valb -= 8;
    }
  }
  return output;
}

function bytesToBits(bytes: number[]): number[] {
  const bits: number[] = [];
  for (const b of bytes) for (let i = 7; i >= 0; i--) bits.push((b >> i) & 1);
  return bits;
}

function bitsToBytes(bits: number[]): number[] {
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    let b = 0;
    for (let j = 0; j < 8; j++) b = (b << 1) | bits[i + j];
    bytes.push(b);
  }
  return bytes;
}

const FILE_BLOCK_BITS = 20;

export function encryptFileScheme(text: string, e: bigint, n: bigint): string {
  if (n >= 1n << 32n) {
    throw new Error("Эта схема — как в оригинальном файловом шифраторе — рассчитана на n < 2^32 (простые ≤ 15 бит). Уменьшите битность ключа.");
  }
  const dataBits = bytesToBits(Array.from(new TextEncoder().encode(text)));
  const totalWithoutPad = 5 + dataBits.length;
  const pad = (FILE_BLOCK_BITS - (totalWithoutPad % FILE_BLOCK_BITS)) % FILE_BLOCK_BITS;

  const plaintextBits: number[] = [];
  for (let i = 4; i >= 0; i--) plaintextBits.push((pad >> i) & 1);
  plaintextBits.push(...dataBits);
  for (let i = 0; i < pad; i++) plaintextBits.push(0);

  const blockCount = plaintextBits.length / FILE_BLOCK_BITS;
  const cipherBytes: number[] = [];
  for (let i = 0; i < blockCount; i++) {
    let blockValue = 0n;
    const offset = i * FILE_BLOCK_BITS;
    for (let b = 0; b < FILE_BLOCK_BITS; b++) blockValue = (blockValue << 1n) | BigInt(plaintextBits[offset + b]);
    const cipherBlock = modExp(blockValue, e, n);
    cipherBytes.push(
      Number((cipherBlock >> 24n) & 0xffn),
      Number((cipherBlock >> 16n) & 0xffn),
      Number((cipherBlock >> 8n) & 0xffn),
      Number(cipherBlock & 0xffn)
    );
  }
  return base64Encode(cipherBytes);
}

export function decryptFileScheme(base64: string, d: bigint, n: bigint): string {
  const cipherBytes = base64Decode(base64);
  if (cipherBytes.length % 4 !== 0) throw new Error("После Base64-декодирования размер не кратен 4 байтам — повреждённые данные");

  const blockCount = cipherBytes.length / 4;
  const allBits: number[] = [];
  for (let i = 0; i < blockCount; i++) {
    let c = 0n;
    c |= BigInt(cipherBytes[i * 4]) << 24n;
    c |= BigInt(cipherBytes[i * 4 + 1]) << 16n;
    c |= BigInt(cipherBytes[i * 4 + 2]) << 8n;
    c |= BigInt(cipherBytes[i * 4 + 3]);
    const m = modExp(c, d, n);
    for (let bit = FILE_BLOCK_BITS - 1; bit >= 0; bit--) allBits.push(Number((m >> BigInt(bit)) & 1n));
  }

  if (allBits.length < 5) throw new Error("Слишком мало данных для заголовка паддинга");
  let pad = 0;
  for (let i = 0; i < 5; i++) pad = (pad << 1) | allBits[i];

  const dataBitsLen = allBits.length - 5 - pad;
  if (dataBitsLen < 0 || dataBitsLen % 8 !== 0) throw new Error("Некорректный заголовок паддинга — длина данных не кратна 8 битам");

  const dataBits = allBits.slice(5, 5 + dataBitsLen);
  const bytes = bitsToBytes(dataBits);
  return new TextDecoder().decode(new Uint8Array(bytes));
}

export function signNumber(m: bigint, d: bigint, n: bigint): bigint {
  return modExp(m, d, n);
}

export function verifySignature(m: bigint, sig: bigint, e: bigint, n: bigint): boolean {
  return modExp(sig, e, n) === ((m % n) + n) % n;
}

export { extGcd };

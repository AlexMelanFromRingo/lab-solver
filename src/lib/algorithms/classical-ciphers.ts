/**
 * Классические шифры — Лаба 1 (Univetsity/.../Cryptology/Криптология/Лаба 1 Шифры,
 * AnyaLaboratoryWork/Caesar.cpp, Vigenere.cpp, GammaOTP_File.cpp).
 *
 * Оригинальные C++ реализации работают побайтово в диапазоне [32,255] (224 символа —
 * печатные ASCII + верхняя половина однобайтовой кириллической кодовой страницы).
 * Браузер оперирует UTF-16, поэтому режим "bytes" применяет ту же арифметику
 * к кодам символов, а режим "ru33" — классический вариант по 33-буквенному
 * кириллическому алфавиту (без "ё"), как в 1.py и вузовских методичках.
 */

export type Alphabet = "bytes" | "ru33";

const RU33 = "абвгдежзийклмнопрстуфхцчшщъыьэюя";
const BYTES_MIN = 32;
const BYTES_RANGE = 224; // [32, 255]

function shiftChar(ch: string, shift: number, alphabet: Alphabet): string {
  if (alphabet === "bytes") {
    const code = ch.codePointAt(0)!;
    if (code < BYTES_MIN || code > 255) return ch;
    const shifted = ((code - BYTES_MIN + shift) % BYTES_RANGE + BYTES_RANGE) % BYTES_RANGE;
    return String.fromCharCode(BYTES_MIN + shifted);
  }
  const lower = ch.toLowerCase();
  const idx = RU33.indexOf(lower);
  if (idx === -1) return ch;
  const isUpper = ch !== lower;
  const shifted = ((idx + shift) % 33 + 33) % 33;
  const out = RU33[shifted];
  return isUpper ? out.toUpperCase() : out;
}

export function caesarEncode(text: string, shift: number, alphabet: Alphabet = "bytes"): string {
  return Array.from(text).map((ch) => shiftChar(ch, shift, alphabet)).join("");
}

export function caesarDecode(text: string, shift: number, alphabet: Alphabet = "bytes"): string {
  return caesarEncode(text, -shift, alphabet);
}

function keyShifts(key: string, alphabet: Alphabet): number[] {
  if (alphabet === "bytes") {
    return Array.from(key).map((ch) => {
      const code = ch.codePointAt(0)!;
      return ((code - BYTES_MIN) % BYTES_RANGE + BYTES_RANGE) % BYTES_RANGE;
    });
  }
  return Array.from(key).map((ch) => {
    const idx = RU33.indexOf(ch.toLowerCase());
    return idx === -1 ? 0 : idx;
  });
}

export function vigenereEncode(text: string, key: string, alphabet: Alphabet = "bytes"): string {
  if (!key) return text;
  const shifts = keyShifts(key, alphabet);
  let ki = 0;
  return Array.from(text)
    .map((ch) => {
      const out = shiftChar(ch, shifts[ki % shifts.length], alphabet);
      ki += 1;
      return out;
    })
    .join("");
}

export function vigenereDecode(text: string, key: string, alphabet: Alphabet = "bytes"): string {
  if (!key) return text;
  const shifts = keyShifts(key, alphabet).map((s) => -s);
  let ki = 0;
  return Array.from(text)
    .map((ch) => {
      const out = shiftChar(ch, shifts[ki % shifts.length], alphabet);
      ki += 1;
      return out;
    })
    .join("");
}

function toBytes(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.replace(/\s+/g, "");
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.substr(i * 2, 2), 16);
  return out;
}

/** Гаммирование: XOR с повторяющимся ключом. Самообратная операция — encode === decode. */
export function gammaXorHex(text: string, key: string): string {
  const data = toBytes(text);
  const keyBytes = toBytes(key || "\0");
  const out = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) out[i] = data[i] ^ keyBytes[i % keyBytes.length];
  return bytesToHex(out);
}

export function gammaXorFromHex(hex: string, key: string): string {
  const data = hexToBytes(hex);
  const keyBytes = toBytes(key || "\0");
  const out = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) out[i] = data[i] ^ keyBytes[i % keyBytes.length];
  return new TextDecoder().decode(out);
}

/** Одноразовый блокнот: ключ той же длины, что и сообщение (в байтах), генерируется случайно. */
export function otpGenerateKeyHex(byteLength: number): string {
  const key = new Uint8Array(byteLength);
  crypto.getRandomValues(key);
  return bytesToHex(key);
}

export function otpEncodeHex(text: string, keyHex: string): string {
  const data = toBytes(text);
  const keyBytes = hexToBytes(keyHex);
  const out = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) out[i] = data[i] ^ keyBytes[i % keyBytes.length];
  return bytesToHex(out);
}

export function otpDecodeFromHex(cipherHex: string, keyHex: string): string {
  const data = hexToBytes(cipherHex);
  const keyBytes = hexToBytes(keyHex);
  const out = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) out[i] = data[i] ^ keyBytes[i % keyBytes.length];
  return new TextDecoder().decode(out);
}

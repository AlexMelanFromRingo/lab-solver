/**
 * ГОСТ 28147-89 — портировано с реальной VHDL-реализации (Univetsity/4th_year/1st_half/
 * Плис/5/{GOST.vhd,GOST_Package.vhd}). Отличие от "хрестоматийного" ГОСТа: в этой
 * реализации один и тот же 16-значный S-box применяется ко всем 8 ниблам (вместо восьми
 * разных таблиц замен), и он не биективен (два входа дают одинаковый выход — видно в
 * самом VHDL-коде, комментарии там местами не совпадают с фактическим return). Это не
 * ломает расшифрование: в сети Фейстеля раундовая функция не обязана быть обратимой,
 * обратимость обеспечивается самой структурой сети — так что раунды и ключи здесь
 * воспроизведены дословно, включая эту особенность.
 */

const MASK32 = 0xffffffffn;

// Таблица подстановки Podstanovka — взята из фактических return-значений VHDL (не из
// комментариев, которые местами расходятся с кодом), один на все 8 нибл.
const GOST_SBOX = [4, 10, 9, 3, 13, 8, 0, 14, 6, 11, 1, 12, 6, 15, 5, 9];

// Раундовые константы X0..X7 — те же, что зашиты в GOST.vhd.
export const GOST_ROUND_KEYS = [
  0xd6c9ba87n, 0xa98b7c6dn, 0x69cad7b8n, 0xb6c8a7d9n, 0xef320415n, 0xe23f4501n, 0xef231045n, 0x05e41f23n,
];

function rotl32(v: bigint, bits: number): bigint {
  const b = BigInt(bits);
  return ((v << b) | (v >> (32n - b))) & MASK32;
}

function substitute(s: bigint): bigint {
  let out = 0n;
  for (let i = 0; i < 8; i++) {
    const shift = BigInt(i * 4);
    const nibble = Number((s >> shift) & 0xfn);
    out |= BigInt(GOST_SBOX[nibble]) << shift;
  }
  return out;
}

function iteration(n: bigint, x: bigint): bigint {
  const n2 = (n >> 32n) & MASK32;
  const n1 = n & MASK32;
  let s = (n1 + x) & MASK32;
  s = substitute(s);
  s = rotl32(s, 11);
  s ^= n2;
  return (n1 << 32n) | s;
}

function razmen(n: bigint): bigint {
  return ((n & MASK32) << 32n) | ((n >> 32n) & MASK32);
}

/** Порядок ключей: 24 раунда прямого прохода (X0..X7 ×3) + 8 раундов обратного (X7..X0). */
function encryptKeyOrder(): bigint[] {
  const keys: bigint[] = [];
  for (let cycle = 0; cycle < 3; cycle++) keys.push(...GOST_ROUND_KEYS);
  keys.push(...[...GOST_ROUND_KEYS].reverse());
  return keys;
}

/** Порядок ключей при расшифровании: 8 раундов прямого (X0..X7) + 24 обратного (X7..X0 ×3). */
function decryptKeyOrder(): bigint[] {
  const keys: bigint[] = [...GOST_ROUND_KEYS];
  for (let cycle = 0; cycle < 3; cycle++) keys.push(...[...GOST_ROUND_KEYS].reverse());
  return keys;
}

export interface GostRoundTrace {
  round: number;
  key: bigint;
  output: bigint;
}

export interface GostResult {
  output: bigint;
  trace: GostRoundTrace[];
}

function run(block: bigint, keyOrder: bigint[]): GostResult {
  let n = block;
  const trace: GostRoundTrace[] = [];
  keyOrder.forEach((x, i) => {
    n = iteration(n, x);
    trace.push({ round: i + 1, key: x, output: n });
  });
  n = razmen(n);
  return { output: n, trace };
}

export function gostEncryptBlock(block: bigint): GostResult {
  return run(block, encryptKeyOrder());
}

export function gostDecryptBlock(block: bigint): GostResult {
  return run(block, decryptKeyOrder());
}

// ── RC4 ──────────────────────────────────────────────────────────────────
export interface Rc4Trace {
  ksaSwaps: number;
  keystream: number[];
}

/** Классический RC4: KSA (перестановка S-блока по ключу) + PRGA (генерация гаммы). */
export function rc4Keystream(keyBytes: number[], length: number): Rc4Trace {
  const S = Array.from({ length: 256 }, (_, i) => i);
  let j = 0;
  for (let i = 0; i < 256; i++) {
    j = (j + S[i] + keyBytes[i % keyBytes.length]) % 256;
    [S[i], S[j]] = [S[j], S[i]];
  }
  let i = 0;
  j = 0;
  const keystream: number[] = [];
  for (let k = 0; k < length; k++) {
    i = (i + 1) % 256;
    j = (j + S[i]) % 256;
    [S[i], S[j]] = [S[j], S[i]];
    keystream.push(S[(S[i] + S[j]) % 256]);
  }
  return { ksaSwaps: 256, keystream };
}

export function rc4Encrypt(data: number[], keyBytes: number[]): number[] {
  const { keystream } = rc4Keystream(keyBytes, data.length);
  return data.map((b, i) => b ^ keystream[i]);
}

// ---------------------------------------------------------------------------
// Стандартный ГОСТ 28147-89 (Магма) — порт GOST_28147_89/gost_package.vhd и
// gost_cipher.vhd из сховища vhdl-rc4: восемь разных узлов замены (набор
// параметров), 256-битный ключ X0..X7 (X0 — старшие 32 бита), 24 раунда
// X0..X7 ×3 и 8 раундов X7..X0. Проверено векторами gost_tb.vhd.

export type GostParamSet = "TC26-Z" | "Test" | "CryptoPro-A";

export const GOST_SBOX_SETS: Record<GostParamSet, number[][]> = {
  Test: [
    [4, 10, 9, 2, 13, 8, 0, 14, 6, 11, 1, 12, 7, 15, 5, 3],
    [14, 11, 4, 12, 6, 13, 15, 10, 2, 3, 8, 1, 0, 7, 5, 9],
    [5, 8, 1, 13, 10, 3, 4, 2, 14, 15, 12, 7, 6, 0, 9, 11],
    [7, 13, 10, 1, 0, 8, 9, 15, 14, 4, 6, 12, 11, 2, 5, 3],
    [6, 12, 7, 1, 5, 15, 13, 8, 4, 10, 9, 14, 0, 3, 11, 2],
    [4, 11, 10, 0, 7, 2, 1, 13, 3, 6, 8, 5, 9, 12, 15, 14],
    [13, 11, 4, 1, 3, 15, 5, 9, 0, 10, 14, 7, 6, 8, 2, 12],
    [1, 15, 13, 0, 5, 7, 10, 4, 9, 2, 3, 14, 6, 11, 8, 12],
  ],
  "CryptoPro-A": [
    [9, 6, 3, 2, 8, 11, 1, 7, 10, 4, 14, 15, 12, 0, 13, 5],
    [3, 7, 14, 9, 8, 10, 15, 0, 5, 2, 6, 12, 11, 4, 13, 1],
    [14, 4, 6, 2, 11, 3, 13, 8, 12, 15, 5, 10, 0, 7, 1, 9],
    [14, 7, 10, 12, 13, 1, 3, 9, 0, 2, 11, 4, 15, 8, 5, 6],
    [11, 5, 1, 9, 8, 13, 15, 0, 14, 4, 2, 3, 12, 7, 10, 6],
    [3, 10, 13, 12, 1, 2, 0, 11, 7, 5, 9, 4, 8, 15, 14, 6],
    [1, 13, 2, 9, 7, 10, 6, 0, 8, 12, 4, 5, 15, 3, 11, 14],
    [11, 10, 15, 5, 0, 12, 14, 8, 6, 2, 3, 9, 1, 7, 13, 4],
  ],
  "TC26-Z": [
    [12, 4, 6, 2, 10, 5, 11, 9, 14, 8, 13, 7, 0, 3, 15, 1],
    [6, 8, 2, 3, 9, 10, 5, 12, 1, 14, 4, 7, 11, 13, 0, 15],
    [11, 3, 5, 8, 2, 15, 10, 13, 14, 1, 7, 4, 12, 9, 6, 0],
    [12, 8, 2, 1, 13, 4, 15, 6, 7, 0, 10, 5, 3, 14, 9, 11],
    [7, 15, 5, 10, 8, 1, 6, 13, 0, 9, 3, 14, 11, 4, 2, 12],
    [5, 13, 15, 6, 9, 2, 12, 10, 11, 7, 8, 1, 4, 3, 14, 0],
    [8, 14, 2, 5, 6, 9, 1, 12, 15, 4, 11, 0, 13, 10, 3, 7],
    [1, 7, 14, 13, 0, 5, 8, 3, 4, 15, 10, 6, 9, 12, 11, 2],
  ],
};

function gostF(x: bigint, k: bigint, sbox: number[][]): bigint {
  const t = (x + k) & MASK32;
  let v = 0n;
  for (let i = 0; i < 8; i++) v |= BigInt(sbox[i][Number((t >> BigInt(4 * i)) & 0xfn)]) << BigInt(4 * i);
  return rotl32(v, 11);
}

const keyIndex = (r: number, decrypting: boolean) => {
  const rr = decrypting ? 31 - r : r;
  return rr < 24 ? rr % 8 : 7 - (rr % 8);
};

/** Блок 64 бита; ключ 256 бит; как gost_cipher: N1 — младшие 32 бита, результат new_N1 & N1. */
export function gostStdBlock(block: bigint, key: bigint, set: GostParamSet, decrypt = false): bigint {
  const sbox = GOST_SBOX_SETS[set];
  const k = Array.from({ length: 8 }, (_, i) => (key >> BigInt(224 - 32 * i)) & MASK32);
  let n1 = block & MASK32;
  let n2 = (block >> 32n) & MASK32;
  for (let r = 0; r < 32; r++) {
    const f = gostF(n1, k[keyIndex(r, decrypt)], sbox);
    const newN1 = n2 ^ f;
    if (r === 31) return (newN1 << 32n) | n1;
    n2 = n1;
    n1 = newN1;
  }
  return 0n;
}

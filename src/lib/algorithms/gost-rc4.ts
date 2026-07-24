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

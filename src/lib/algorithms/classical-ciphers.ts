/**
 * «Прикладна криптологія», ЛР 1 «Криптозахист текстових файлів» — шість
 * методів методички над байтами файлу (CP1251):
 * перестановка, Цезаря, одноразовий блокнот, Віженера з паролем, Віженера з
 * датчиком випадкових чисел, гамування.
 *
 * Прийом методички — алфавіт N1: X1 = Ord(C) − 32, Y1 = (X1 + зсув) mod 224,
 * Y = Y1 + 32. Кожен символ рядка обробляється однією формулою, без
 * розгалужень, і результат завжди в 20h…FFh — керуючих кодів шифр не
 * породжує (рядки читаються без CR/LF, як Readln/Writeln). Керуючі символи,
 * що є в самому файлі (CR/LF між рядками, 05h 06h 07h у тестовому
 * source.txt), обходяться — лишаються як є.
 *
 * Ключ береться за позицією байта у файлі: CR/LF займають свою позицію
 * ключа, хоч і не змінюються. Так зашифровано еталон викладача до ЛР 1
 * (текст і його шифр Віженера з періодом 11 збігаються побайтно).
 */

export const N = 224;
const BASE = 32;
const mod = (a: number, n: number) => ((a % n) + n) % n;

/** Y = ((X − 32 ± shift(i)) mod 224) + 32 для символів 20h…FFh; i — позиція байта у файлі. */
function substitute(bytes: ArrayLike<number>, shift: (i: number) => number, sign: 1 | -1): number[] {
  return Array.from(bytes, (b, i) => (b < BASE ? b : BASE + mod(b - BASE + sign * shift(i), N)));
}

// ---------------------------------------------------------------- Цезар

export const caesar = (bytes: ArrayLike<number>, shift: number, sign: 1 | -1 = 1) => substitute(bytes, () => shift, sign);

// ---------------------------------------------------- одноразовий блокнот

/** Ключ — послідовність зсувів 0…223 довжиною в текст (нова для кожного тексту). */
export function otpKey(length: number): number[] {
  const r = new Uint32Array(length);
  crypto.getRandomValues(r);
  return Array.from(r, (x) => x % N);
}

export function otp(bytes: ArrayLike<number>, key: number[], sign: 1 | -1 = 1) {
  if (key.length < bytes.length) throw new Error(`Ключ коротший за текст: ${key.length} < ${bytes.length}`);
  return substitute(bytes, (i) => key[i], sign);
}

// ------------------------------------------------------ Віженер з паролем

/** Зсуви пароля — позиції його символів у N1. */
export function passwordShifts(password: ArrayLike<number>): number[] {
  const k = Array.from(password).filter((b) => b >= BASE).map((b) => b - BASE);
  if (!k.length) throw new Error("Пароль не містить жодного символу з кодом 20h…FFh");
  return k;
}

export const vigenere = (bytes: ArrayLike<number>, shifts: number[], sign: 1 | -1 = 1) => substitute(bytes, (i) => shifts[i % shifts.length], sign);

// -------------------------------------------------- датчик Random з Delphi

/**
 * Генератор Random(N) середовища Delphi: RandSeed := RandSeed·134775813 + 1
 * (mod 2³²), результат — старші 32 біти добутку RandSeed·N. Початкове
 * значення RandSeed і є ключем.
 */
export function delphiRandom(seed: number, count: number, range = N): number[] {
  let s = seed >>> 0;
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    s = (Math.imul(s, 134775813) + 1) >>> 0;
    out.push(Number((BigInt(s) * BigInt(range)) >> BigInt(32)));
  }
  return out;
}

/** Віженер з датчиком: таблиця з K зсувів заповнюється Random(224) після RandSeed := seed. */
export const vigenereRandomShifts = (seed: number, k: number) => delphiRandom(seed, k);

/** Гамування: гама — Random(224) для кожного символу тексту. */
export function gamma(bytes: ArrayLike<number>, seed: number, sign: 1 | -1 = 1) {
  const g = delphiRandom(seed, bytes.length);
  return substitute(bytes, (i) => g[i], sign);
}

// ------------------------------------------------------------ перестановка

/**
 * Таблиця CryptTab: CryptTab[i] — місце, на яке стає i-й символ блоку
 * (методичка: «шифр» з CryptTab = 2 4 1 3 → «фшри»). Перевіряє, що це
 * перестановка чисел 1…K.
 */
export function parseCryptTab(src: string): number[] {
  const t = src.trim().split(/[\s,;]+/).filter(Boolean).map(Number);
  const k = t.length;
  if (k < 2 || t.some((x) => !Number.isInteger(x) || x < 1 || x > k) || new Set(t).size !== k)
    throw new Error("CryptTab — перестановка чисел 1…K без повторів, K ≥ 2");
  return t;
}

/**
 * Перестановка в межах рядків (між керуючими символами), повними блоками по
 * K символів; неповний хвіст рядка лишається як є — так рядкова структура
 * файлу не порушується.
 */
export function permute(bytes: ArrayLike<number>, tab: number[], inverse = false): number[] {
  const out = Array.from(bytes);
  const k = tab.length;
  let start = 0;
  const flush = (end: number) => {
    for (let b = start; b + k <= end; b += k) {
      const block = out.slice(b, b + k);
      for (let i = 0; i < k; i++) {
        if (inverse) out[b + i] = block[tab[i] - 1];
        else out[b + tab[i] - 1] = block[i];
      }
    }
  };
  for (let i = 0; i <= out.length; i++) {
    if (i === out.length || out[i] < BASE) {
      flush(i);
      start = i + 1;
    }
  }
  return out;
}

/** Керуючі символи в шифртексті, крім тих, що стояли у вихідному тексті на тих самих місцях. */
export function newControlChars(src: ArrayLike<number>, enc: ArrayLike<number>): number {
  let n = 0;
  for (let i = 0; i < enc.length; i++) if (enc[i] < BASE && enc[i] !== src[i]) n++;
  return n;
}

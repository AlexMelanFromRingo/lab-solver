/**
 * Побайтовое представление, которое использует byte-level BPE (GPT-2 и
 * pre_tokenizers.ByteLevel из Hugging Face tokenizers).
 *
 * Каждый байт UTF-8 показывается отдельным печатным символом: печатные байты
 * ASCII и Latin-1 остаются собой, остальные сдвигаются в диапазон с U+0100.
 * Поэтому пробел выглядит как «Ġ», а кириллическая «т» (байты D1 82) — как
 * «ÑĤ». Таблица та же, что bytes_to_unicode() в коде GPT-2.
 */

const BYTE_TO_SYMBOL: string[] = (() => {
  const keep: number[] = [];
  for (let b = 0x21; b <= 0x7e; b++) keep.push(b);
  for (let b = 0xa1; b <= 0xac; b++) keep.push(b);
  for (let b = 0xae; b <= 0xff; b++) keep.push(b);
  const map: string[] = new Array(256);
  for (const b of keep) map[b] = String.fromCodePoint(b);
  let n = 0;
  for (let b = 0; b < 256; b++) {
    if (map[b] === undefined) map[b] = String.fromCodePoint(256 + n++);
  }
  return map;
})();

const SYMBOL_TO_BYTE = new Map<string, number>(BYTE_TO_SYMBOL.map((s, b) => [s, b]));

export const utf8 = (s: string): number[] => [...new TextEncoder().encode(s)];

export const byteSymbols = (bytes: number[]): string => bytes.map((b) => BYTE_TO_SYMBOL[b]).join("");

export const hex = (b: number): string => b.toString(16).padStart(2, "0");

/** Байты токена из его записи символами; null — в строке есть символ не из таблицы. */
export function tokenBytes(token: string): number[] | null {
  const out: number[] = [];
  for (const ch of token) {
    const b = SYMBOL_TO_BYTE.get(ch);
    if (b === undefined) return null;
    out.push(b);
  }
  return out;
}

/**
 * Декодирование как bytes.decode("utf-8", errors="backslashreplace"):
 * целые последовательности становятся символами, байт, который не
 * складывается в символ, — записью \xNN. Так видно, где граница токенов
 * разрезала кириллическую букву.
 */
export function decodeLenient(bytes: number[]): string {
  let out = "";
  let i = 0;
  while (i < bytes.length) {
    const b = bytes[i];
    const len = b < 0x80 ? 1 : b >= 0xc2 && b <= 0xdf ? 2 : b >= 0xe0 && b <= 0xef ? 3 : b >= 0xf0 && b <= 0xf4 ? 4 : 0;
    if (len === 0 || i + len > bytes.length) {
      out += `\\x${hex(b)}`;
      i += 1;
      continue;
    }
    const seq = bytes.slice(i, i + len);
    if (seq.slice(1).some((c) => c < 0x80 || c > 0xbf)) {
      out += `\\x${hex(b)}`;
      i += 1;
      continue;
    }
    try {
      out += new TextDecoder("utf-8", { fatal: true }).decode(new Uint8Array(seq));
      i += len;
    } catch {
      out += `\\x${hex(b)}`;
      i += 1;
    }
  }
  return out;
}

/**
 * Список токенов из вывода зошита: ['ĠÐ¿', 'ÑĢ', ...] в кавычках любого
 * вида. Если кавычек нет, токены разделяются пробелами и запятыми.
 */
export function parseTokenList(src: string): string[] {
  const quoted = [...src.matchAll(/'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"/g)];
  if (quoted.length > 0) {
    return quoted.map((m) => (m[1] ?? m[2]).replace(/\\(.)/g, "$1"));
  }
  return src.split(/[\s,]+/).filter(Boolean);
}

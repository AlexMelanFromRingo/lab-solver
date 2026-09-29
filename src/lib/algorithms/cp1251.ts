/**
 * Кодова сторінка Windows-1251 — у ній лабораторні програми читають і пишуть
 * текстові файли. Нижня половина (00h–7Fh) збігається з ASCII, верхня —
 * таблиця нижче. Код 98h у CP1251 не призначений: тут він відображається в
 * U+0098, щоб шифртекст із таким байтом проходив через рядок туди й назад.
 */

const HIGH =
  "ЂЃ‚ѓ„…†‡€‰Љ‹ЊЌЋЏ" +
  "ђ‘’“”•–—\u0098™љ›њќћџ" +
  " ЎўЈ¤Ґ¦§Ё©Є«¬­®Ї" +
  "°±Ііґµ¶·ё№є»јЅѕї" +
  "АБВГДЕЖЗИЙКЛМНОП" +
  "РСТУФХЦЧШЩЪЫЬЭЮЯ" +
  "абвгдежзийклмноп" +
  "рстуфхцчшщъыьэюя";

const TO_BYTE = new Map<string, number>(Array.from(HIGH, (ch, i) => [ch, 0x80 + i]));

/** Код символу в CP1251 або undefined, якщо символу в кодовій сторінці немає. */
export function cp1251Code(ch: string): number | undefined {
  const c = ch.charCodeAt(0);
  return c < 0x80 ? c : TO_BYTE.get(ch);
}

export function cp1251Char(byte: number): string {
  return byte < 0x80 ? String.fromCharCode(byte) : HIGH[byte - 0x80];
}

/** Рядок → байти CP1251; символи поза кодовою сторінкою стають «?». */
export function cp1251Encode(text: string): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(new ArrayBuffer(text.length));
  for (let i = 0; i < text.length; i++) bytes[i] = cp1251Code(text[i]) ?? 0x3f;
  return bytes;
}

export function cp1251Decode(bytes: ArrayLike<number>): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += cp1251Char(bytes[i]);
  return s;
}

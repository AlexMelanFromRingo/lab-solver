/**
 * ТІК, ЛР 1 «Дослідження способів кодування повідомлень»: таблиця 1 (символ,
 * позначення в Unicode, UTF-8 і UTF-16 BE — байти, hex, двійковий код),
 * 16-кове подання текстового файлу в UTF-8, UTF-16 BE і ANSI (CP-1251),
 * як у переглядачі Far Manager, перехід на новий рядок CR LF, бітрейт WAV і
 * розмір растрового зображення за глибиною кольору.
 */

import { cp1251Code } from "./cp1251";

const hex2 = (b: number) => b.toString(16).toUpperCase().padStart(2, "0");

export function utf8Bytes(s: string): number[] {
  return [...new TextEncoder().encode(s)];
}

/** UTF-16 BE: суррогатная пара для символов за пределами BMP. */
export function utf16beBytes(s: string): number[] {
  const out: number[] = [];
  for (let i = 0; i < s.length; i++) {
    const u = s.charCodeAt(i);
    out.push(u >> 8, u & 0xff);
  }
  return out;
}

export interface CharRow {
  ch: string;
  code: string;
  utf8: number[];
  utf16: number[];
}

export function charRow(ch: string): CharRow {
  const cp = ch.codePointAt(0) ?? 0;
  return { ch, code: `U+${cp.toString(16).toUpperCase().padStart(4, "0")}`, utf8: utf8Bytes(ch), utf16: utf16beBytes(ch) };
}

export const hexOf = (b: number[]) => b.map(hex2).join(" ");
export const binOf = (b: number[]) => b.map((x) => x.toString(2).padStart(8, "0")).join(" ");

export type FileEncoding = "utf8" | "utf8bom" | "utf16be" | "cp1251";

/** Байты файла, как их сохраняет «Блокнот»: строки через CR LF, UTF-16 BE — с маркером FE FF. */
export function fileBytes(lines: string[], enc: FileEncoding): { bytes: number[]; lost: string[] } {
  const text = lines.join("\r\n");
  const lost: string[] = [];
  switch (enc) {
    case "utf8":
      return { bytes: utf8Bytes(text), lost };
    case "utf8bom":
      return { bytes: [0xef, 0xbb, 0xbf, ...utf8Bytes(text)], lost };
    case "utf16be":
      return { bytes: [0xfe, 0xff, ...utf16beBytes(text)], lost };
    case "cp1251": {
      const bytes = [...text].map((c) => {
        const b = cp1251Code(c);
        if (b === undefined) {
          lost.push(c);
          return 0x3f;
        }
        return b;
      });
      return { bytes, lost };
    }
  }
}

/** Как F3 → F4 (Hex) в Far Manager: смещение, 16 байт, текстовая колонка. */
export function hexDump(bytes: number[]): string {
  const lines: string[] = [];
  for (let o = 0; o < bytes.length; o += 16) {
    const row = bytes.slice(o, o + 16);
    const hex = row.map(hex2).join(" ").padEnd(16 * 3 - 1);
    const txt = row.map((b) => (b >= 0x20 && b < 0x7f ? String.fromCharCode(b) : ".")).join("");
    lines.push(`${o.toString(16).toUpperCase().padStart(10, "0")}: ${hex.slice(0, 23)}  ${hex.slice(24)}  ${txt}`);
  }
  return lines.join("\n");
}

/** Бітрейт некомпресованого WAV (PCM): fд · розрядність · канали. */
export const pcmBitrate = (fs: number, bits: number, channels: number) => fs * bits * channels;

/** Розмір растру без стиснення, байт: W · H · глибина / 8 (без заголовка й палітри). */
export const rasterBytes = (w: number, h: number, depth: number) => Math.ceil((w * h * depth) / 8);

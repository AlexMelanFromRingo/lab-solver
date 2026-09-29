"use client";

import { useState } from "react";
import { ModuleHeader } from "@/components/module-header";
import { Card, CardBody } from "@/components/ui/card";
import { TextField } from "@/components/ui/field";
import { InfoNote } from "@/components/ui/info-note";
import { OutputBlock } from "@/components/ui/output-block";
import { modules } from "@/lib/modules";
import { cp1251Code } from "@/lib/algorithms/cp1251";
import { binOf, charRow, fileBytes, hexDump, hexOf, pcmBitrate, rasterBytes, type FileEncoding } from "@/lib/algorithms/unicode-coding";

const mod = modules.find((m) => m.slug === "unicode-coding")!;

const FILES: { enc: FileEncoding; title: string; note: string }[] = [
  { enc: "utf8", title: "UTF-8", note: "«Блокнот» Windows 10/11 зберігає UTF-8 без маркера; «UTF-8 з BOM» додає EF BB BF на початку." },
  { enc: "utf16be", title: "UTF-16 BE", note: "Маркер порядку байтів FE FF, далі по два байти на символ, старший — першим." },
  { enc: "cp1251", title: "ANSI (CP-1251)", note: "По одному байту на символ; кирилиця — 80h…FFh, латиниця й CR LF — як в ASCII." },
];

function Num({ label, value, set }: { label: string; value: string; set: (v: string) => void }) {
  return <TextField label={label} value={value} onChange={(e) => set(e.target.value.replace(",", "."))} />;
}

export default function UnicodeCodingPage() {
  const [latin, setLatin] = useState("Anna");
  const [cyr, setCyr] = useState("Анна");
  const [emoji, setEmoji] = useState("😀");
  const [fs, setFs] = useState("44100");
  const [bits, setBits] = useState("16");
  const [ch, setCh] = useState("2");
  const [w, setW] = useState("800");
  const [h, setH] = useState("600");

  const chars = [latin.trim()[0], cyr.trim()[0], [...emoji.trim()][0]].filter(Boolean) as string[];
  const rows = chars.map(charRow);
  const lines = [latin.trim(), cyr.trim()];
  const bitrate = pcmBitrate(Number(fs), Number(bits), Number(ch));

  return (
    <div>
      <ModuleHeader module={mod} />
      <div className="mx-auto max-w-5xl space-y-8 px-6 py-10">
        <InfoNote>
          Таблиця 1 і 16-кові подання файлів рахуються з введеного імені: перша літера латиницею й кирилицею плюс
          будь-який emoji (п. 2.3). Файл п. 3 — ім&apos;я латиницею й кирилицею на двох рядках, як велить методичка;
          дампи — у вигляді переглядача Far Manager (F3, F4 — Hex).
        </InfoNote>

        <Card>
          <CardBody className="space-y-5 pt-6">
            <h2 className="font-display text-lg font-semibold text-ink">П. 2 — таблиця 1: кодування символів Unicode</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <TextField label="Ім'я латиницею" value={latin} onChange={(e) => setLatin(e.target.value)} />
              <TextField label="Ім'я кирилицею" value={cyr} onChange={(e) => setCyr(e.target.value)} />
              <TextField label="Emoji (п. 2.3)" value={emoji} onChange={(e) => setEmoji(e.target.value)} />
            </div>
            <div className="overflow-x-auto rounded-[4px] border border-border">
              <table className="w-full font-mono text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-ink-faint">
                    <th className="px-3 py-2 text-left">Символ</th>
                    <th className="px-3 py-2 text-left">Unicode</th>
                    <th className="px-3 py-2 text-left">UTF-8, байт</th>
                    <th className="px-3 py-2 text-left">UTF-8, hex</th>
                    <th className="px-3 py-2 text-left">UTF-16 BE, байт</th>
                    <th className="px-3 py-2 text-left">UTF-16 BE, hex</th>
                    <th className="px-3 py-2 text-left">Двійковий код UTF-8 / UTF-16</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.code} className="border-b border-border/50 align-top last:border-0">
                      <td className="px-3 py-1.5 text-ink">{r.ch}</td>
                      <td className="px-3 py-1.5 text-ink-dim">{r.code}</td>
                      <td className="px-3 py-1.5 text-ink">{r.utf8.length}</td>
                      <td className="px-3 py-1.5 text-ink">{hexOf(r.utf8)}</td>
                      <td className="px-3 py-1.5 text-ink">{r.utf16.length}</td>
                      <td className="px-3 py-1.5 text-ink">{hexOf(r.utf16)}</td>
                      <td className="px-3 py-1.5 text-ink-dim">
                        {binOf(r.utf8)}
                        <br />
                        {binOf(r.utf16)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm leading-relaxed text-ink-dim">
              П. 2.5: латиниця (U+0000…U+007F) в UTF-8 — 1 байт, у UTF-16 — 2; кирилиця (U+0400…U+04FF) — 2 і 2;
              emoji поза базовою площиною (понад U+FFFF) — 4 байти в обох: у UTF-8 — чотирибайтова послідовність
              11110xxx 10xxxxxx…, у UTF-16 — сурогатна пара D800–DBFF + DC00–DFFF.
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-5 pt-6">
            <h2 className="font-display text-lg font-semibold text-ink">П. 3 — 16-кове подання файлів</h2>
            {FILES.map((f) => {
              const r = fileBytes(lines, f.enc);
              return (
                <div key={f.enc} className="space-y-1.5">
                  <OutputBlock label={`${f.title}: ${r.bytes.length} байт`} value={hexDump(r.bytes)} wrap={false} />
                  <p className="text-xs text-ink-faint">
                    {f.note}
                    {r.lost.length > 0 && ` Символів ${[...new Set(r.lost)].join(" ")} у CP-1251 немає — «Блокнот» замінить їх на «?» (3Fh).`}
                  </p>
                </div>
              );
            })}
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-5 pt-6">
            <h2 className="font-display text-lg font-semibold text-ink">П. 4–5 — CP-1251 і перехід на новий рядок</h2>
            <OutputBlock
              label="Кирилиця імені: Unicode → CP-1251"
              value={[...new Set([...cyr.trim()])]
                .map((c) => {
                  const b = cp1251Code(c);
                  return `${c}  ${charRow(c).code}  →  ${b === undefined ? "немає в CP-1251" : `${b.toString(16).toUpperCase()}h (рядок ${(b >> 4).toString(16).toUpperCase()}x, стовпець x${(b & 15).toString(16).toUpperCase()})`}`;
                })
                .join("\n")}
              wrap={false}
            />
            <p className="text-sm leading-relaxed text-ink-dim">
              Enter у «Блокноті» Windows записує два знаки керування ASCII: CR (0Dh, повернення каретки) і LF (0Ah,
              переведення рядка) — у дампах вище вони між двома рядками; в UTF-16 BE — 00 0D 00 0A.
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-5 pt-6">
            <h2 className="font-display text-lg font-semibold text-ink">П. 6.2 і 9 — бітрейт WAV і розмір растру</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <Num label="Частота дискретизації, Гц" value={fs} set={setFs} />
              <Num label="Розрядність, біт" value={bits} set={setBits} />
              <Num label="Канали" value={ch} set={setCh} />
            </div>
            <OutputBlock label="Бітрейт PCM = fд · розрядність · канали" value={Number.isFinite(bitrate) ? `${bitrate} біт/с = ${bitrate / 1000} кбіт/с` : "—"} />
            <div className="grid gap-4 sm:grid-cols-3">
              <Num label="Ширина, пікселів" value={w} set={setW} />
              <Num label="Висота, пікселів" value={h} set={setH} />
            </div>
            <OutputBlock
              label="Розмір без стиснення = W · H · глибина / 8 (для перевірки таблиці 2)"
              value={[1, 4, 8, 16, 24, 32].map((d) => `${String(d).padStart(2)} біт: ${(rasterBytes(Number(w), Number(h), d) / 1024).toFixed(1)} кбайт`).join("\n")}
              wrap={false}
            />
            <p className="text-xs leading-relaxed text-ink-faint">
              Файл TIFF більший на заголовок, а при 8 бітах і менше — ще й на палітру; зі стисненням LZW — менший. Для SVG
              розмір від масштабу не залежить: при збільшенні вп&apos;ятеро контури лишаються гладкими, а растр розпадається
              на квадрати пікселів (п. 10.2).
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

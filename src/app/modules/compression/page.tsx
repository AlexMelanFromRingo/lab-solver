"use client";

import { useState } from "react";
import { ModuleHeader } from "@/components/module-header";
import { Card, CardBody } from "@/components/ui/card";
import { NumberField, TextAreaField, TextField } from "@/components/ui/field";
import { InfoNote } from "@/components/ui/info-note";
import { OutputBlock } from "@/components/ui/output-block";
import { modules } from "@/lib/modules";
import { jpegBlock, lzss, ratioOf, rgbToYuv, shareOf, type SizeRow } from "@/lib/algorithms/compression";

const mod = modules.find((m) => m.slug === "compression")!;

const LOREM =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. " +
  "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure " +
  "dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non " +
  "proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";

// Блок 8×8 из классического примера JPEG (Википедия, «JPEG», раздел о ДКП)
const BLOCK = [
  "52 55 61 66 70 61 64 73",
  "63 59 55 90 109 85 69 72",
  "62 59 68 113 144 104 66 73",
  "63 58 71 122 154 106 70 69",
  "67 61 68 104 126 88 68 70",
  "79 65 60 70 77 68 58 75",
  "85 71 64 59 55 61 65 83",
  "87 79 69 68 65 76 78 94",
].join("\n");

const f = (v: number, d = 1) => (Number.isFinite(v) ? Number(v.toFixed(d)).toString().replace(".", ",") : "—");
const grid = (m: number[][], d = 0) => m.map((r) => r.map((v) => f(v, d).padStart(6)).join("")).join("\n");
const bytesOf = (s: string) => [...new TextEncoder().encode(s)];

export default function CompressionPage() {
  const [rows, setRows] = useState("text.txt 120 38\nphoto.bmp 1440 1230\nchart.bmp 1440 22");
  const [text, setText] = useState(LOREM);
  const [rgb, setRgb] = useState("200 120 60");
  const [block, setBlock] = useState(BLOCK);
  const [q, setQ] = useState(50);

  let table: string;
  try {
    const parsed: SizeRow[] = rows
      .trim()
      .split("\n")
      .map((l) => {
        const p = l.trim().split(/\s+/);
        const after = Number(p.pop()!.replace(",", "."));
        const before = Number(p.pop()!.replace(",", "."));
        if (!(before > 0 && after > 0)) throw new Error(`Рядок «${l}»: потрібні назва, розмір до і після`);
        return { name: p.join(" ") || "—", before, after };
      });
    table = [
      `${"Назва".padEnd(22)}${"до".padStart(10)}${"після".padStart(10)}${"частина, %".padStart(12)}${"разів".padStart(9)}`,
      ...parsed.map((r) => `${r.name.padEnd(22)}${f(r.before, 2).padStart(10)}${f(r.after, 2).padStart(10)}${f(shareOf(r), 2).padStart(12)}${f(ratioOf(r), 2).padStart(9)}`),
    ].join("\n");
  } catch (e) {
    table = (e as Error).message;
  }

  const firstTwo = text.trim().split(/\s+/).slice(0, 2).join(" ");
  const repeated = Array(80).fill(firstTwo).join("");
  const lz = [
    { name: "Псевдовипадковий", s: text },
    { name: "Містить повтори слів", s: repeated },
  ].map((x) => {
    const b = bytesOf(x.s);
    const r = lzss(b);
    return { ...x, before: b.length, ...r };
  });

  const [R, G, B] = rgb.split(/[\s,;]+/).map(Number);
  const yuv = rgbToYuv(R, G, B);
  let jpeg: ReturnType<typeof jpegBlock> | string;
  try {
    const m = block
      .trim()
      .split("\n")
      .map((l) => l.trim().split(/\s+/).map(Number));
    if (m.length !== 8 || m.some((r) => r.length !== 8 || r.some((v) => !(v >= 0 && v <= 255)))) throw new Error("Потрібно 8 рядків по 8 чисел 0…255");
    jpeg = jpegBlock(m, q);
  } catch (e) {
    jpeg = (e as Error).message;
  }

  return (
    <div>
      <ModuleHeader module={mod} />
      <div className="mx-auto max-w-5xl space-y-8 px-6 py-10">
        <InfoNote>
          Розміри з 7-Zip і графічного редактора в кожного свої (файли дає викладач), тому таблиці 1, 2, 4 тут —
          обчислення з ваших розмірів. Таблиця 3 — оцінка стандартним LZSS; демо «LZSS-demo» викладача може мати
          інші параметри, але різниця між псевдовипадковим текстом і повторами буде та сама за характером.
        </InfoNote>

        <Card>
          <CardBody className="space-y-5 pt-6">
            <h2 className="font-display text-lg font-semibold text-ink">Таблиці 1, 2, 4 — частина після стиснення і кратність</h2>
            <TextAreaField label="Рядки: назва (файлу або методу) · розмір до · розмір після, кБ" value={rows} onChange={(e) => setRows(e.target.value)} />
            <OutputBlock label="Частина = після / до · 100 %; кратність = до / після" value={table} wrap={false} />
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-5 pt-6">
            <h2 className="font-display text-lg font-semibold text-ink">Таблиця 3 — словникове стиснення (LZSS)</h2>
            <TextAreaField label="Псевдовипадковий текст (Lorem Ipsum Generator)" value={text} onChange={(e) => setText(e.target.value)} />
            <OutputBlock
              label={`Повтори: перші два слова «${firstTwo}», вставлені 80 разів (п. 3.8)`}
              value={[
                `${"Тип тексту".padEnd(24)}${"до, байт".padStart(10)}${"після, байт".padStart(13)}${"частина, %".padStart(12)}   літерали / посилання`,
                ...lz.map((x) => `${x.name.padEnd(24)}${String(x.before).padStart(10)}${String(x.size).padStart(13)}${f((x.size / x.before) * 100, 1).padStart(12)}   ${x.literals} / ${x.matches}`),
              ].join("\n")}
              wrap={false}
            />
            <p className="text-xs leading-relaxed text-ink-faint">
              LZSS: вікно 4096 байт, збіг 3…18 байт; літерал — прапорець + 8 біт, посилання — прапорець + 12 біт зсуву + 4
              біти довжини. Псевдовипадковий текст майже не має довгих повторів — розмір близький до оригіналу (навіть більший
              через прапорці), повтори ж стискаються в рази.
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-5 pt-6">
            <h2 className="font-display text-lg font-semibold text-ink">П. 5 — етапи JPEG</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Піксель R G B" value={rgb} onChange={(e) => setRgb(e.target.value)} />
              <OutputBlock label="Y, U (Cb), V (Cr)" value={`Y = ${f(yuv.y)}   U = ${f(yuv.u)}   V = ${f(yuv.v)}`} />
            </div>
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem]">
              <TextAreaField label="Блок яскравості 8×8 (0…255)" value={block} onChange={(e) => setBlock(e.target.value)} className="min-h-[11rem] font-mono" />
              <NumberField label="Якість q (1…100)" min={1} max={100} value={q} onChange={(e) => setQ(Math.min(100, Math.max(1, Number(e.target.value) || 1)))} />
            </div>
            {typeof jpeg === "string" ? (
              <p className="text-sm text-codes">{jpeg}</p>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                <OutputBlock label="Пряме перетворення: коефіцієнти ДКП" value={grid(jpeg.dct)} wrap={false} />
                <OutputBlock label={`Огрублення: квантовані (нулів ${jpeg.zeros} з 64)`} value={grid(jpeg.quant)} wrap={false} />
                <OutputBlock label="Таблиця квантування для q" value={grid(jpeg.table)} wrap={false} />
                <OutputBlock label={`Зворотне перетворення (найбільша похибка ${jpeg.err})`} value={grid(jpeg.back)} wrap={false} />
              </div>
            )}
            <p className="text-xs leading-relaxed text-ink-faint">
              Чим нижча якість, тим більші кроки квантування і тим більше високочастотних коефіцієнтів стає нулями — саме
              вони дають виграш у розмірі; на зображенні це розмиття дрібних деталей і «блочність» на межах 8×8 (п. 5.9).
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

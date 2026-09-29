"use client";

import { useRef } from "react";

/**
 * Рамка рисунка с выгрузкой для отчёта: SVG и PNG чёрным по белому.
 *
 * На сайте рисунок в цветах тёмной темы (CSS-переменные), в отчёт он идёт
 * монохромным на белом: переменные подменяются цветами печати. Если задан
 * pxPerCm, у SVG размеры в сантиметрах, а в PNG записывается разрешение
 * (чанк pHYs) — Word вставит рисунок так, что клетка будет ровно 1 см и
 * масштаб «В/см» на диаграмме останется верным.
 */

const PRINT: [RegExp, string][] = [
  [/var\(--background\)/g, "#ffffff"],
  [/var\(--ink-faint\)/g, "#555555"],
  [/var\(--ink-dim\)/g, "#000000"],
  [/var\(--ink\)/g, "#000000"],
  [/var\(--cat-[a-z]+\)/g, "#000000"],
  [/var\(--font-mono, monospace\)/g, "monospace"],
];

function printable(svg: SVGSVGElement, pxPerCm?: number): { text: string; w: number; h: number } {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.removeAttribute("class");
  // Сетка-миллиметровка нужна на экране, в отчёт рисунок идёт без неё.
  clone.querySelectorAll("[data-screen-only]").forEach((el) => el.remove());
  const [x, y, w, h] = (clone.getAttribute("viewBox") ?? "0 0 100 100").split(/\s+/).map(Number);
  if (pxPerCm) {
    clone.setAttribute("width", `${(w / pxPerCm).toFixed(2)}cm`);
    clone.setAttribute("height", `${(h / pxPerCm).toFixed(2)}cm`);
  }
  let text = new XMLSerializer().serializeToString(clone);
  for (const [re, v] of PRINT) text = text.replace(re, v);
  text = text.replace(/<svg[^>]*>/, (m) => `${m}<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#ffffff"/>`);
  return { text, w, h };
}

const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (const b of bytes) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** Вставляет чанк pHYs сразу после IHDR (8 байт подписи + 25 байт IHDR). */
function withDpi(png: Uint8Array, dpi: number): Uint8Array {
  const ppm = Math.round(dpi / 0.0254);
  const chunk = new Uint8Array(21);
  const dv = new DataView(chunk.buffer);
  dv.setUint32(0, 9);
  chunk.set([0x70, 0x48, 0x59, 0x73], 4);
  dv.setUint32(8, ppm);
  dv.setUint32(12, ppm);
  chunk[16] = 1;
  dv.setUint32(17, crc32(chunk.subarray(4, 17)));
  const out = new Uint8Array(png.length + 21);
  out.set(png.subarray(0, 33));
  out.set(chunk, 33);
  out.set(png.subarray(33), 54);
  return out;
}

function save(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const safeName = (s: string) => s.replace(/[\\/:*?"<>|]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 80) || "рисунок";

export function FigureFrame({ title, pxPerCm, children }: { title: string; pxPerCm?: number; children: React.ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const svg = () => box.current?.querySelector("svg") ?? null;

  const saveSvg = () => {
    const el = svg();
    if (!el) return;
    save(new Blob([printable(el, pxPerCm).text], { type: "image/svg+xml" }), `${safeName(title)}.svg`);
  };

  const savePng = () => {
    const el = svg();
    if (!el) return;
    const { text, w, h } = printable(el);
    const scale = 4;
    const img = new Image();
    const url = URL.createObjectURL(new Blob([text], { type: "image/svg+xml" }));
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(w * scale);
      canvas.height = Math.round(h * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob(async (b) => {
        if (!b) return;
        const dpi = pxPerCm ? scale * pxPerCm * 2.54 : scale * 96;
        const bytes = withDpi(new Uint8Array(await b.arrayBuffer()), dpi);
        save(new Blob([bytes.buffer as ArrayBuffer], { type: "image/png" }), `${safeName(title)}.png`);
      }, "image/png");
    };
    img.src = url;
  };

  const btn = "rounded-[3px] border border-border px-2 py-0.5 font-mono text-[11px] text-ink-dim transition-colors hover:border-border-strong hover:text-ink";
  return (
    <figure className="space-y-2">
      <div ref={box} className="overflow-x-auto rounded-[4px] border border-border bg-black/20 p-2">
        {children}
      </div>
      <figcaption className="flex items-start justify-between gap-3 text-xs text-ink-faint">
        <span>{title}</span>
        <span className="flex shrink-0 gap-1.5">
          <button type="button" onClick={saveSvg} className={btn} title="Чёрным по белому, для отчёта">
            SVG
          </button>
          <button type="button" onClick={savePng} className={btn} title="Чёрным по белому, для отчёта">
            PNG
          </button>
        </span>
      </figcaption>
    </figure>
  );
}

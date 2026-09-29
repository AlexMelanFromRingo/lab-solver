/**
 * Структурная схема микропроцессорной системы курсовой ПМС: ЦПЕ с шинами
 * адреса, данных и управления, интерфейсы каналов задания (ІРПР — 8255,
 * ІРПС — 8251, АЦП/ЦАП), внешние устройства (ПВВ) с направлением и
 * разрядностью обмена, контроллер прерываний (КП, 8259) с двоичными
 * датчиками и запросами асинхронных каналов, генератор G скорости ІРПС.
 */

import type { Drawing, DrawItem } from "@/lib/drawing";

export type ChannelKind = "par" | "ser" | "analog";
export interface Channel {
  kind: ChannelKind;
  sync: boolean;
  dir: "in" | "out" | "io";
}

export interface MpsSpec {
  addrBits: number;
  channels: Channel[];
  sensors: number;
  speed: number;
}

export function mpsStructure(spec: MpsSpec): Drawing {
  const items: DrawItem[] = [];
  const n = spec.channels.length;
  const X0 = 170;
  const STEP = 140;
  const W = Math.max(640, X0 + n * STEP + 20);
  const bus = [
    { y: 40, label: `ША, ${spec.addrBits}` },
    { y: 70, label: "ШД, 8" },
    { y: 100, label: "ШК" },
  ];
  items.push({ k: "rect", x: 20, y: 20, w: 110, h: 110, bold: true });
  items.push({ k: "text", x: 75, y: 70, text: "ЦПЕ", anchor: "middle", bold: true, plain: true });
  items.push({ k: "text", x: 75, y: 86, text: "(MCU 8051)", anchor: "middle", size: 9.5, plain: true });
  items.push({ k: "text", x: 75, y: 124, text: "INT", anchor: "middle", size: 9.5, plain: true });
  bus.forEach((b, i) => {
    items.push({ k: "line", pts: [[130, b.y], [W - 20, b.y]], bold: true, arrow: true, arrowStart: i === 1 });
    items.push({ k: "text", x: 136, y: b.y - 5, text: b.label, size: 9.5, plain: true });
  });

  const intSources: number[] = [];
  spec.channels.forEach((c, i) => {
    const x = X0 + i * STEP;
    const y = 150;
    const name = c.kind === "par" ? "ІРПР" : c.kind === "ser" ? "ІРПС" : c.dir === "in" ? "АЦП" : "ЦАП";
    const chip = c.kind === "par" ? "8255" : c.kind === "ser" ? "8251" : "";
    items.push({ k: "rect", x, y, w: 100, h: 60, bold: true });
    items.push({ k: "text", x: x + 50, y: y + 26, text: name, anchor: "middle", bold: true, plain: true });
    items.push({ k: "text", x: x + 50, y: y + 42, text: [chip, c.kind === "analog" ? "" : c.sync ? "синхр." : "асинхр."].filter(Boolean).join(", "), anchor: "middle", size: 9, plain: true });
    // Связь с шинами
    items.push({ k: "line", pts: [[x + 22, 40], [x + 22, y]], arrow: true });
    items.push({ k: "line", pts: [[x + 50, 70], [x + 50, y]], arrow: true, arrowStart: true });
    items.push({ k: "line", pts: [[x + 78, 100], [x + 78, y]], arrow: true });
    // Внешнее устройство
    const py = 260;
    items.push({ k: "rect", x, y: py, w: 100, h: 46 });
    items.push({ k: "text", x: x + 50, y: py + 27, text: c.kind === "analog" ? (c.dir === "in" ? "датчик" : "виконавчий") : "ПВВ", anchor: "middle", plain: true });
    const width = c.kind === "ser" ? "1" : "8";
    const lanes = c.dir === "io" ? [x + 34, x + 66] : [x + 50];
    lanes.forEach((lx, k) => {
      const inward = c.dir === "in" || (c.dir === "io" && k === 0);
      items.push({ k: "line", pts: inward ? [[lx, py], [lx, y + 60]] : [[lx, y + 60], [lx, py]], arrow: true });
      items.push({ k: "text", x: lx + 4, y: y + 84, text: width, size: 9, plain: true });
    });
    if (c.kind === "ser") {
      items.push({ k: "rect", x: x + 106, y: y + 12, w: 28, h: 22 });
      items.push({ k: "text", x: x + 120, y: y + 27, text: "G", anchor: "middle", italic: true, plain: true });
      items.push({ k: "line", pts: [[x + 106, y + 23], [x + 100, y + 23]], arrow: true });
      items.push({ k: "text", x: x + 50, y: py + 60, text: `${spec.speed} біт/с`, anchor: "middle", size: 9.5, plain: true });
    }
    if (!c.sync && c.kind !== "analog") intSources.push(x);
  });

  // Контроллер прерываний
  const ky = 340;
  const need = intSources.length + spec.sensors > 0;
  if (need) {
    items.push({ k: "rect", x: 20, y: ky, w: 110, h: 70, bold: true });
    items.push({ k: "text", x: 75, y: ky + 32, text: "КП", anchor: "middle", bold: true, plain: true });
    items.push({ k: "text", x: 75, y: ky + 48, text: "(8259)", anchor: "middle", size: 9, plain: true });
    items.push({ k: "line", pts: [[75, ky], [75, 130]], arrow: true });
    intSources.forEach((sx, i) => {
      const ly = ky + 12 + i * 10;
      // Запрос выходит из левой грани интерфейса и идёт вниз в промежутке между столбцами
      items.push({ k: "line", pts: [[sx, 200], [sx - 14, 200], [sx - 14, ly], [130, ly]], arrow: true });
    });
    items.push({ k: "text", x: 136, y: ky - 8, text: "INT від асинхронних каналів", size: 9, plain: true });
    for (let i = 0; i < Math.min(spec.sensors, 8); i++) {
      const sx = 30 + i * (90 / Math.max(1, Math.min(spec.sensors, 8) - 1 || 1));
      items.push({ k: "line", pts: [[sx, ky + 110], [sx, ky + 70]], arrow: true });
      items.push({ k: "text", x: sx, y: ky + 124, text: `D${i + 1}`, anchor: "middle", size: 9.5, italic: true, plain: true });
    }
  }
  return { w: W, h: need ? ky + 132 : 330, items };
}

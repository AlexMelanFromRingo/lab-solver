/**
 * Структура сети для отчётов ЛМ («структура мережі з указівкою відстаней,
 * місця розміщень серверів та комунікаційного устаткування»): здания
 * варианта с этажами и комнатами, серверная в центральном здании, устройства
 * и связи кампуса с длинами. Звезда — от серверного здания, как в примере
 * методички (вариант 43: два сегмента 10Base-FL по 200 м между самыми
 * удалёнными станциями); для Token Ring и FDDI — кольцо через концентраторы.
 */

import type { Drawing, DrawItem } from "@/lib/drawing";
import { lanVariant } from "./lan";

export type LanLab = "e1" | "e2" | "e3" | "e4" | "m1" | "m2" | "m3";

const TECH: Record<LanLab, { center: string; local: string; campus: string; inside: string; ring?: "single" | "dual" }> = {
  e1: { center: "Hub", local: "Hub", campus: "10Base-FL", inside: "10Base-T (кручена пара)" },
  e2: { center: "Switch Ethernet", local: "Hub", campus: "10Base-FL", inside: "10Base-T (кручена пара)" },
  e3: { center: "Повторювач I кл.", local: "Повторювач", campus: "100Base-FX", inside: "100Base-TX (кручена пара)" },
  e4: { center: "Switch Fast Ethernet", local: "Повторювач I кл.", campus: "100Base-FX", inside: "100Base-TX (кручена пара)" },
  m1: { center: "MSAU", local: "MSAU", campus: "оптика", inside: "STP / UTP", ring: "single" },
  m2: { center: "Switch Token Ring", local: "MSAU", campus: "оптика", inside: "STP / UTP" },
  m3: { center: "Концентратор FDDI", local: "Концентратор FDDI", campus: "оптика (MMF)", inside: "кручена пара / оптика", ring: "dual" },
};

export function lanStructure(n: number, lab: LanLab): Drawing {
  const { infra, traffic } = lanVariant(n);
  const t = TECH[lab];
  const items: DrawItem[] = [];
  const BW = 160;
  const ROOM = Math.min(24, (BW - 44) / infra.rooms);
  const FLOOR = 18;
  const others = infra.buildings - 1;
  const W = Math.max(640, others * (BW + 20) + 40);
  const bh = 34 + infra.floors * FLOOR + 30; // название, этажи, место под устройство

  /** Серверное здание — устройство внизу, под этажами; остальные — вверху, под названием, куда приходит связь кампуса. */
  const building = (x: number, y: number, k: number, server: boolean) => {
    items.push({ k: "rect", x, y, w: BW, h: bh + (server ? 28 : 0), bold: true });
    items.push({ k: "text", x: x + 6, y: y + 14, text: `Building (${k})${server ? " — серверна" : ""}`, size: 10, bold: true, plain: true });
    const f0 = server ? y + 22 : y + 52;
    for (let f = infra.floors; f >= 1; f--) {
      const fy = f0 + (infra.floors - f) * FLOOR;
      items.push({ k: "text", x: x + 6, y: fy + 12, text: `${f} пов.`, size: 8.5, plain: true });
      for (let r = 0; r < infra.rooms; r++) items.push({ k: "rect", x: x + 40 + r * ROOM, y: fy + 2, w: ROOM - 3, h: FLOOR - 4 });
    }
    return f0 + infra.floors * FLOOR;
  };
  const device = (cx: number, cy: number, label?: string) => {
    items.push({ k: "rect", x: cx - 26, y: cy - 9, w: 52, h: 18 });
    if (label) items.push({ k: "text", x: cx, y: cy + 22, text: label, size: 9, anchor: "middle", plain: true });
  };

  // Серверное здание сверху по центру
  const sx = W / 2 - BW / 2;
  const floorsEnd = building(sx, 16, 1, true);
  const servers = `Сервери: ${traffic.file} файл., ${traffic.http} HTTP, ${traffic.ftp} FTP, ${traffic.db} БД`;
  items.push({ k: "text", x: sx + 6, y: floorsEnd + 14, text: servers, size: 8.5, plain: true });
  const c = { x: W / 2, y: floorsEnd + 36 };
  device(c.x, c.y, t.center);

  const serverBottom = 16 + bh + 28;
  const top = serverBottom + 70;
  const pos = Array.from({ length: others }, (_, i) => {
    const x = 20 + i * (BW + 20) + (W - 40 - others * (BW + 20) + 20) / 2;
    building(x, top, i + 2, false);
    const d = { x: x + BW / 2, y: top + 36 };
    device(d.x, d.y);
    return d;
  });

  const label = (x: number, y: number, text: string) => items.push({ k: "text", x, y, text, size: 9.5, anchor: "middle", bold: true, plain: true });
  const dist = `${t.campus}, ${infra.distance} м`;
  if (!t.ring) {
    pos.forEach((p, i) => {
      const midY = (serverBottom + top) / 2 + (i - (others - 1) / 2) * 7;
      items.push({ k: "line", pts: [[c.x, c.y + 9], [c.x, midY], [p.x, midY], [p.x, p.y - 9]], bold: true });
      if (Math.abs(p.x - c.x) < 1) items.push({ k: "text", x: p.x + 8, y: midY + 4, text: dist, size: 9.5, bold: true, plain: true });
      else label(p.x + (p.x < c.x ? 50 : -50), midY - 5, dist);
    });
  } else {
    // Кольцо: серверное здание → здания по порядку → обратно
    const ring = [c, ...pos];
    const off = t.ring === "dual" ? [-3, 3] : [0];
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i];
      const b = ring[(i + 1) % ring.length];
      for (const o of off) {
        if (i === 0) items.push({ k: "line", pts: [[a.x - 26, a.y + o], [b.x + o, a.y + o], [b.x + o, b.y - 9]], bold: true });
        else if (i === ring.length - 1) items.push({ k: "line", pts: [[a.x + 26, a.y + o], [W - 10 + o, a.y + o], [W - 10 + o, c.y + o], [c.x + 26, c.y + o]], bold: true });
        else items.push({ k: "line", pts: [[a.x + 26, a.y + o], [b.x - 26, b.y + o]], bold: true });
      }
      if (i > 0 && i < ring.length - 1) label((a.x + b.x) / 2, a.y - 8, `${infra.distance} м`);
    }
    label(pos[0].x - 30, c.y - 8, `${infra.distance} м`);
    items.push({ k: "text", x: W - 16, y: (c.y + pos[pos.length - 1].y) / 2, text: `${infra.distance} м`, size: 9.5, anchor: "end", bold: true, plain: true });
  }
  const bottom = top + bh + 20;
  const legend = [
    `У будинках${infra.buildings > 1 ? ` 2–${infra.buildings}` : ""}: ${t.local}; кабель — ${t.inside}, поверх 18 × 3 м; кампус — ${t.campus}.`,
    `Варіант ${n}: тип інфраструктури ${infra.type}, трафіку ${traffic.type}; відстань між будинками ${infra.distance} м.`,
  ];
  legend.forEach((text, i) => items.push({ k: "text", x: 20, y: bottom + i * 14, text, size: 9.5, plain: true }));
  return { w: W, h: bottom + 26, items };
}

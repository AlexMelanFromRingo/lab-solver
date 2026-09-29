/**
 * Рисунки индивидуального задания БД в обозначениях методички: графическая
 * интерпретация зависимостей (рис. 2.6, 2.9–2.11: ключ — блок слева, от
 * атрибутов ключа — стрелки к зависимым, транзитивные — от неключевых) и
 * диаграмма ER-типа (рис. 2.13: связь — ромб, степень «1»/«Б» у концов,
 * узел обязательного класса — внутри полосы блока сущности, необязательного —
 * снаружи, на линии связи; ключ — подчёркнутый курсив под блоком).
 */

import type { Drawing, DrawItem } from "@/lib/drawing";
import type { Cls, Degree, Fd } from "./normalize";

const same = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x));

/** Зависимости, которые остаются внутри отношения с атрибутами attrs. */
export function projectFds(attrs: string[], fds: Fd[]): Fd[] {
  return fds
    .filter((f) => f.lhs.every((x) => attrs.includes(x)))
    .map((f) => ({ lhs: f.lhs, rhs: f.rhs.filter((r) => attrs.includes(r) && !f.lhs.includes(r)) }))
    .filter((f) => f.rhs.length > 0);
}

export function fdGraph(attrs: string[], key: string[], fds: Fd[]): Drawing {
  const items: DrawItem[] = [];
  const nonKey = attrs.filter((a) => !key.includes(a));
  const own = projectFds(attrs, fds);
  // Глубина неключевого атрибута: 1 — зависит от ключа (или его части), дальше — через неключевые
  const depth: Record<string, number> = {};
  nonKey.forEach((a) => (depth[a] = 1));
  for (let it = 0; it < nonKey.length; it++)
    for (const f of own)
      for (const r of f.rhs) {
        const src = f.lhs.filter((x) => nonKey.includes(x));
        if (nonKey.includes(r) && src.length) depth[r] = Math.max(depth[r], 1 + Math.max(...src.map((x) => depth[x] ?? 1)));
      }
  const KX = 20;
  const KW = 150;
  const ROW = 20;
  const kh = Math.max(56, key.length * ROW + 20);
  const cols: Record<number, string[]> = {};
  // Порядок в столбце: сначала зависимые от части ключа, внизу — от всего ключа (как рис. 2.6)
  const fullKeyDep = (a: string) => own.some((f) => same(f.lhs, key) && f.rhs.includes(a));
  [...nonKey].sort((x, y) => Number(fullKeyDep(x)) - Number(fullKeyDep(y))).forEach((a) => (cols[depth[a]] ??= []).push(a));
  const BW = 160;
  const BH = 32;
  const pos: Record<string, { x: number; y: number }> = {};
  for (const [d, list] of Object.entries(cols)) list.forEach((a, i) => (pos[a] = { x: KX + KW + 70 + (Number(d) - 1) * (BW + 70), y: 20 + i * (BH + 22) }));
  const maxRows = Math.max(1, ...Object.values(cols).map((l) => l.length));
  const h = Math.max(kh + 40, 20 + maxRows * (BH + 22)) + 4;
  items.push({ k: "rect", x: KX, y: 20, w: KW, h: kh });
  key.forEach((a, i) => items.push({ k: "text", x: KX + KW / 2, y: 20 + 18 + i * ROW, text: a, anchor: "middle", size: 11, plain: true }));
  nonKey.forEach((a) => {
    const p = pos[a];
    items.push({ k: "rect", x: p.x, y: p.y, w: BW, h: BH });
    items.push({ k: "text", x: p.x + BW / 2, y: p.y + BH / 2 + 4, text: a, anchor: "middle", size: 11, plain: true });
  });
  // Общий «ствол» для стрелок из одного источника в один столбец
  const trunks: Record<string, number> = {};
  const perCol: Record<number, number> = {};
  for (const f of own) {
    const fromKey = f.lhs.every((x) => key.includes(x));
    let sx: number;
    let sy: number;
    if (fromKey && same(f.lhs, key)) {
      // От всего ключа — из нижней грани блока ключа вниз, потом вправо (рис. 2.6)
      const bx = KX + KW - 24;
      const by = 20 + kh;
      let bottomDot = false;
      f.rhs
        .filter((x) => nonKey.includes(x))
        .forEach((r) => {
          const t = pos[r];
          const ty = t.y + BH / 2;
          if (ty > by) {
            bottomDot = true;
            items.push({ k: "line", pts: [[bx, by], [bx, ty], [t.x, ty]], arrow: true });
          } else {
            // Цель на уровне блока ключа — стрелка прямо из его правой грани
            items.push({ k: "circle", x: KX + KW, y: ty, r: 3.5, fill: true });
            items.push({ k: "line", pts: [[KX + KW, ty], [t.x, ty]], arrow: true });
          }
        });
      if (bottomDot) items.push({ k: "circle", x: bx, y: by, r: 3.5, fill: true });
      continue;
    }
    if (fromKey) {
      sx = KX + KW;
      sy = 20 + 14 + (f.lhs.map((x) => key.indexOf(x)).reduce((a, b) => a + b, 0) / f.lhs.length) * ROW;
      items.push({ k: "circle", x: sx, y: sy, r: 3.5, fill: true });
    } else {
      const src = pos[f.lhs.find((x) => nonKey.includes(x))!];
      sx = src.x + BW;
      sy = src.y + BH / 2;
    }
    for (const r of f.rhs.filter((x) => nonKey.includes(x))) {
      const t = pos[r];
      const ty = t.y + BH / 2;
      const tk = `${sx},${sy},${t.x}`;
      if (trunks[tk] === undefined) {
        perCol[t.x] = (perCol[t.x] ?? 0) + 1;
        trunks[tk] = t.x - 12 - (perCol[t.x] - 1) * 12;
      }
      const mx = trunks[tk];
      items.push({ k: "line", pts: Math.abs(ty - sy) < 1 ? [[sx, sy], [t.x, ty]] : [[sx, sy], [mx, sy], [mx, ty], [t.x, ty]], arrow: true });
    }
  }
  const w = Math.max(...Object.values(pos).map((p) => p.x + BW), KX + KW) + 20;
  return { w, h, items };
}

/** Диаграмма ER-типа для одной связи. Для «1:Б» первая сущность — на стороне «Б», как в ErCalc. */
export function erDiagram(deg: Degree, e1: { name: string; key: string; cls: Cls }, e2: { name: string; key: string; cls: Cls }, verb: string): Drawing {
  const items: DrawItem[] = [];
  const W = 640;
  const y = 60;
  const EW = 160;
  const EH = 48;
  const S = 14;
  const [d1, d2] = deg === "1:1" ? ["1", "1"] : deg === "1:Б" ? ["Б", "1"] : ["Б", "Б"];
  // Сущность 1 слева (полоса справа), сущность 2 справа (полоса слева)
  const a = { x: 20, y: y - EH / 2 };
  const b = { x: W - 20 - EW, y: y - EH / 2 };
  items.push({ k: "rect", x: a.x, y: a.y, w: EW, h: EH, bold: true });
  items.push({ k: "line", pts: [[a.x + EW - S, a.y], [a.x + EW - S, a.y + EH]] });
  items.push({ k: "text", x: a.x + (EW - S) / 2, y: y + 4, text: e1.name, anchor: "middle", bold: true, size: 11.5, plain: true });
  items.push({ k: "rect", x: b.x, y: b.y, w: EW, h: EH, bold: true });
  items.push({ k: "line", pts: [[b.x + S, b.y], [b.x + S, b.y + EH]] });
  items.push({ k: "text", x: b.x + S + (EW - S) / 2, y: y + 4, text: e2.name, anchor: "middle", bold: true, size: 11.5, plain: true });
  const cx = W / 2;
  items.push({ k: "line", pts: [[a.x + EW, y], [cx - 50, y]] });
  items.push({ k: "line", pts: [[cx + 50, y], [b.x, y]] });
  items.push({ k: "diamond", x: cx, y, w: 100, h: 50 });
  items.push({ k: "text", x: cx, y: y + 4, text: verb, anchor: "middle", size: 11, plain: true });
  // Узлы класса принадлежности
  const node = (inside: boolean, stripX: number, dir: number) => items.push({ k: "circle", x: inside ? stripX : stripX + dir * 9, y, r: 3.5, fill: true });
  node(e1.cls === "обов'язковий", a.x + EW - S / 2, 1);
  node(e2.cls === "обов'язковий", b.x + S / 2, -1);
  items.push({ k: "text", x: a.x + EW + 18, y: y - 8, text: d1, bold: true, size: 12, plain: true });
  items.push({ k: "text", x: b.x - 18, y: y - 8, text: d2, bold: true, size: 12, anchor: "end", plain: true });
  const keyLine = (x: number, key: string) => {
    items.push({ k: "text", x, y: y + EH / 2 + 18, text: key, italic: true, underline: true, size: 11, plain: true });
    items.push({ k: "text", x: x + key.length * 6.3 + 2, y: y + EH / 2 + 18, text: ", …", italic: true, size: 11, plain: true });
  };
  keyLine(a.x + 4, e1.key);
  keyLine(b.x + S + 4, e2.key);
  return { w: W, h: 120, items };
}

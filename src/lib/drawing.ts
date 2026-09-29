/**
 * Чертёж из примитивов для схем, у которых нет своей модели (схема
 * заземления, структуры сетей): отрезки и ломаные со стрелками, прямоугольники,
 * окружности, точки соединений, надписи, штриховка земли. Координаты — px.
 */

export type DrawItem =
  | { k: "line"; pts: [number, number][]; arrow?: boolean; arrowStart?: boolean; dashed?: boolean; bold?: boolean }
  | { k: "rect"; x: number; y: number; w: number; h: number; bold?: boolean; dashed?: boolean; fill?: boolean }
  | { k: "circle"; x: number; y: number; r: number; fill?: boolean }
  | { k: "dot"; x: number; y: number }
  /** В тексте «_» — нижний индекс, если не plain (имена вроде NEXT_ADDR). */
  | { k: "text"; x: number; y: number; text: string; anchor?: "start" | "middle" | "end"; size?: number; italic?: boolean; bold?: boolean; plain?: boolean }
  /** Земля: линия с косой штриховкой снизу. */
  | { k: "ground"; x1: number; x2: number; y: number };

export interface Drawing {
  w: number;
  h: number;
  items: DrawItem[];
}

/**
 * Защитное заземление в трёхфазной сети до 1000 В с изолированной нейтралью:
 * фаза L3 замкнула на корпус, ток замыкания Iз уходит через заземлитель Rз и
 * возвращается через сопротивления изоляции Zіз исправных фаз. Человек,
 * коснувшийся корпуса, включён параллельно Rз, поэтому Uдот = Iз·Rз мало и
 * ток через человека Iл = Uдот/Rл тоже.
 */
export function groundingScheme(): Drawing {
  const G = 300;
  const phases = [30, 52, 74];
  const items: DrawItem[] = [];
  const zx = [500, 530, 560];

  items.push({ k: "text", x: 40, y: 14, text: "Мережа 380/220 В з ізольованою нейтраллю", size: 11 });
  phases.forEach((y, i) => {
    items.push({ k: "line", pts: [[40, y], [620, y]] });
    items.push({ k: "text", x: 32, y: y + 4, text: `L${i + 1}`, anchor: "end", italic: true });
  });

  // Изоляция фаз относительно земли
  zx.forEach((x, i) => {
    items.push({ k: "dot", x, y: phases[i] });
    items.push({ k: "line", pts: [[x, phases[i]], [x, 180]] });
    items.push({ k: "rect", x: x - 5, y: 180, w: 10, h: 30 });
    items.push({ k: "line", pts: [[x, 210], [x, G]] });
  });
  items.push({ k: "text", x: 572, y: 192, text: "Z_із", italic: true });
  items.push({ k: "text", x: 572, y: 214, text: "ізоляція", size: 10 });
  items.push({ k: "text", x: 572, y: 226, text: "фаз", size: 10 });

  // Электроустановка: двигатель в корпусе, питание от трёх фаз
  items.push({ k: "rect", x: 170, y: 110, w: 140, h: 90, bold: true });
  items.push({ k: "text", x: 176, y: 124, text: "корпус", size: 10 });
  items.push({ k: "circle", x: 240, y: 160, r: 18 });
  items.push({ k: "text", x: 240, y: 165, text: "М", anchor: "middle", bold: true });
  [230, 240, 250].forEach((x, i) => {
    items.push({ k: "dot", x, y: phases[i] });
    items.push({ k: "line", pts: [[x, phases[i]], [x, i === 1 ? 142 : 145]] });
  });

  // Замыкание фазы L3 на корпус
  items.push({ k: "dot", x: 250, y: 124 });
  items.push({ k: "line", pts: [[250, 124], [276, 130], [270, 135], [308, 142]], arrow: true, bold: true });
  items.push({ k: "text", x: 318, y: 124, text: "замикання фази", size: 10 });
  items.push({ k: "text", x: 318, y: 136, text: "на корпус", size: 10 });

  // Защитный проводник и заземлитель
  items.push({ k: "dot", x: 190, y: 200 });
  items.push({ k: "line", pts: [[190, 200], [190, 240], [110, 240], [110, G + 10]], bold: true });
  items.push({ k: "text", x: 150, y: 234, text: "захисний провідник", anchor: "middle", size: 10 });
  items.push({ k: "rect", x: 104, y: G + 10, w: 12, h: 34, fill: true });
  items.push({ k: "text", x: 96, y: G + 32, text: "R_з ≤ 4 Ом", anchor: "end", italic: true });
  items.push({ k: "text", x: 124, y: G + 44, text: "заземлювач", size: 10 });
  items.push({ k: "line", pts: [[100, 256], [100, 284]], arrow: true });
  items.push({ k: "text", x: 94, y: 274, text: "I_з", anchor: "end", italic: true });

  // Человек касается корпуса
  const hx = 372;
  items.push({ k: "circle", x: hx, y: 176, r: 9 });
  items.push({ k: "line", pts: [[hx, 185], [hx, 248]] });
  items.push({ k: "line", pts: [[hx, 248], [hx - 12, G]] });
  items.push({ k: "line", pts: [[hx, 248], [hx + 12, G]] });
  items.push({ k: "line", pts: [[hx, 196], [310, 172]] });
  items.push({ k: "line", pts: [[hx, 196], [hx + 18, 228]] });
  items.push({ k: "dot", x: 310, y: 172 });
  items.push({ k: "line", pts: [[hx + 30, 206], [hx + 30, 240]], arrow: true });
  items.push({ k: "text", x: hx + 36, y: 228, text: "I_л", italic: true });
  items.push({ k: "text", x: hx + 36, y: 196, text: "R_л", italic: true });

  // Ток возвращается через землю к изоляции исправных фаз
  items.push({ k: "line", pts: [[140, G + 26], [490, G + 26]], arrow: true, dashed: true });
  items.push({ k: "text", x: 430, y: G + 42, text: "I_з (через землю)", italic: true, size: 11 });

  items.push({ k: "ground", x1: 30, x2: 620, y: G });
  return { w: 640, h: 360, items };
}

// ------------------------------------------------------------ схемы сетей

export interface NetNode {
  id: string;
  kind: "router" | "switch" | "pc" | "server" | "hub";
  x: number;
  y: number;
  name: string;
  /** Строки под (или над) значком: адрес, VLAN… */
  lines?: string[];
  /** Где подписи: снизу (по умолчанию), сверху или сбоку. */
  above?: boolean;
  side?: "left" | "right";
}

export interface NetLink {
  a: string;
  b: string;
  /** Последовательный канал — излом посередине. */
  serial?: boolean;
  dashed?: boolean;
  /** Подписи у концов (порт, адрес интерфейса) и посередине (сеть). */
  aLabel?: string;
  bLabel?: string;
  label?: string;
  /** Где подписи портов вдоль связи, доля длины от узла (по умолчанию 0,3). */
  at?: number;
}

/** Схема сети: значки узлов, связи, порты и адреса у концов связей. */
export function netDrawing(nodes: NetNode[], links: NetLink[], w: number, h: number): Drawing {
  const items: DrawItem[] = [];
  const at = (id: string) => nodes.find((n) => n.id === id)!;
  for (const l of links) {
    const a = at(l.a);
    const b = at(l.b);
    if (l.serial) {
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.hypot(dx, dy);
      const nx = -dy / d;
      const ny = dx / d;
      items.push({ k: "line", pts: [[a.x, a.y], [mx - (dx / d) * 6 + nx * 8, my - (dy / d) * 6 + ny * 8], [mx + (dx / d) * 6 - nx * 8, my + (dy / d) * 6 - ny * 8], [b.x, b.y]], bold: true });
    } else items.push({ k: "line", pts: [[a.x, a.y], [b.x, b.y]], dashed: l.dashed });
    // Нормаль к связи, смотрящая вверх (или вправо для вертикальных): с этой стороны — порты, с другой — имя сети.
    const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    let nx = -(b.y - a.y) / len;
    let ny = (b.x - a.x) / len;
    if (ny > 0 || (Math.abs(ny) < 0.2 && nx < 0)) {
      nx = -nx;
      ny = -ny;
    }
    const block = (cx: number, cy: number, text: string, sgn: number, size: number, bold = false) => {
      const rows = text.split("\n");
      const hgt = rows.length * 11;
      // Центр блока отнесён от линии по нормали на половину его высоты и ширины
      const wid = Math.max(...rows.map((r) => r.length)) * size * 0.55;
      const off = 6 + Math.abs(ny) * (hgt / 2) + Math.abs(nx) * (wid / 2);
      const bx = cx + nx * off * sgn;
      const by = cy + ny * off * sgn;
      rows.forEach((r, i) => items.push({ k: "text", x: bx, y: by - hgt / 2 + 9 + i * 11, text: r, size, anchor: "middle", bold, plain: true }));
    };
    const t = l.at ?? 0.3;
    if (l.aLabel) block(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, l.aLabel, 1, 9);
    if (l.bLabel) block(b.x + (a.x - b.x) * t, b.y + (a.y - b.y) * t, l.bLabel, 1, 9);
    if (l.label) block((a.x + b.x) / 2, (a.y + b.y) / 2, l.label, -1, 10, true);
  }
  for (const n of nodes) {
    const { x, y } = n;
    let half = 14;
    switch (n.kind) {
      case "router":
        items.push({ k: "circle", x, y, r: 15 });
        items.push({ k: "line", pts: [[x - 9, y - 4], [x + 9, y - 4]], arrow: true });
        items.push({ k: "line", pts: [[x + 9, y + 4], [x - 9, y + 4]], arrow: true });
        half = 15;
        break;
      case "switch":
      case "hub":
        items.push({ k: "rect", x: x - 22, y: y - 10, w: 44, h: 20 });
        if (n.kind === "switch") {
          items.push({ k: "line", pts: [[x - 14, y - 3], [x + 14, y - 3]], arrow: true });
          items.push({ k: "line", pts: [[x + 14, y + 4], [x - 14, y + 4]], arrow: true });
        } else items.push({ k: "text", x, y: y + 4, text: "HUB", size: 9, anchor: "middle", plain: true });
        half = 10;
        break;
      case "pc":
        items.push({ k: "rect", x: x - 14, y: y - 12, w: 28, h: 19 });
        items.push({ k: "line", pts: [[x, y + 7], [x, y + 11]] });
        items.push({ k: "line", pts: [[x - 9, y + 12], [x + 9, y + 12]], bold: true });
        break;
      case "server":
        items.push({ k: "rect", x: x - 11, y: y - 16, w: 22, h: 32 });
        for (const dy of [-8, -2, 4]) items.push({ k: "line", pts: [[x - 7, y + dy], [x + 7, y + dy]] });
        half = 16;
        break;
    }
    const text = [n.name, ...(n.lines ?? [])];
    const wHalf = n.kind === "switch" || n.kind === "hub" ? 22 : 15;
    text.forEach((s, i) =>
      items.push({
        k: "text",
        x: n.side === "left" ? x - wHalf - 6 : n.side === "right" ? x + wHalf + 6 : x,
        y: n.side ? y + 4 - 6 * (text.length - 1) + 12 * i : n.above ? y - half - 6 - 12 * (text.length - 1 - i) : y + half + 13 + 12 * i,
        text: s,
        size: i ? 9.5 : 10.5,
        bold: i === 0,
        anchor: n.side === "left" ? "end" : n.side === "right" ? "start" : "middle",
        plain: true,
      }),
    );
  }
  return { w, h, items };
}

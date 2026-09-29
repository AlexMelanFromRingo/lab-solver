/**
 * Чертёж из примитивов для схем, у которых нет своей модели (схема
 * заземления, структуры сетей): отрезки и ломаные со стрелками, прямоугольники,
 * окружности, точки соединений, надписи, штриховка земли. Координаты — px.
 */

export type DrawItem =
  | { k: "line"; pts: [number, number][]; arrow?: boolean; dashed?: boolean; bold?: boolean }
  | { k: "rect"; x: number; y: number; w: number; h: number; bold?: boolean; dashed?: boolean; fill?: boolean }
  | { k: "circle"; x: number; y: number; r: number; fill?: boolean }
  | { k: "dot"; x: number; y: number }
  | { k: "text"; x: number; y: number; text: string; anchor?: "start" | "middle" | "end"; size?: number; italic?: boolean; bold?: boolean }
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

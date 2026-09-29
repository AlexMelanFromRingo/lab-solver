/**
 * Данные рисунков, которые требуют отчёты: векторные диаграммы и треугольники
 * (ТЕМК), графики зависимостей (ТЕМК, ООП). Рисуются компонентами
 * PhasorDiagram и XYPlot, выгружаются в SVG/PNG чёрным по белому.
 */

/** Масштаб группы векторов: все векторы с этим key рисуются в одном масштабе. */
export interface PhasorScale {
  key: string;
  /** Обозначение масштаба: «m_U», «m_I» (после «_» — индекс). */
  name: string;
  unit: string;
  /** Сколько клеток занимает самый длинный вектор группы (по умолчанию 8). */
  cells?: number;
}

export interface Phasor {
  /** Начало вектора (для топографической диаграммы); по умолчанию — начало координат. */
  from?: [number, number];
  to: [number, number];
  /** Подпись; после «_» — нижний индекс: «U_Rк». */
  label: string;
  scale: string;
  /** false — отрезок без стрелки (стороны треугольников). */
  arrow?: boolean;
  dashed?: boolean;
  /** С какой стороны от направления вектора подпись. */
  side?: "l" | "r";
  /** Где вдоль вектора подпись, доля длины (по умолчанию 0,55). */
  at?: number;
}

/** Дуга угла у начала координат, градусы против часовой стрелки. */
export interface PhasorArc {
  from: number;
  to: number;
  label: string;
}

export interface PhasorFigure {
  phasors: Phasor[];
  scales: PhasorScale[];
  arcs?: PhasorArc[];
  /** Оси +1 и +j комплексной плоскости. */
  axes?: boolean;
  /** Подписи векторов подчёркнуты — обозначение комплексных величин, как в образцах отчётов. */
  complex?: boolean;
}

export interface PlotAxis {
  label: string;
  unit: string;
}

export interface PlotSeries {
  label: string;
  points: [number, number][];
  dashed?: boolean;
  /** Подписать значения у точек. */
  values?: boolean;
  /** false — без маркеров (густые расчётные точки, осциллограммы). */
  markers?: boolean;
}

export interface PlotFigure {
  x: PlotAxis;
  y: PlotAxis;
  series: PlotSeries[];
  /** Плавная кривая через опытные точки (монотонный кубический сплайн); иначе ломаная. */
  smooth?: boolean;
  /** Свои деления оси x (октавные полосы и т. п.): x точек — позиции at. */
  xTicks?: { at: number; label: string }[];
  /** Горизонтальные линии — норма и т. п. */
  hlines?: { y: number; label: string }[];
  /** Выделенные диапазоны по x (превышение нормы). */
  shade?: { from: number; to: number; label?: string }[];
}

/** Сигнал временной диаграммы: значение действует с момента t до следующего изменения. */
export interface TimingSignal {
  name: string;
  /** Шина: значения пишутся в «шестигранниках», как в PSpice. */
  bus?: boolean;
  changes: [number, number | string][];
}

export interface TimingFigure {
  from: number;
  to: number;
  unit: string;
  signals: TimingSignal[];
  /** Деления оси времени; по умолчанию — шаг 1–2–5. */
  ticks?: number[];
}

/** Шаг 1–2–5·10ⁿ не меньше v; с wide — ещё и 2,5 (масштабы вроде 0,25 А/см). */
export function niceUp(v: number, wide = false): number {
  if (!(v > 0) || !Number.isFinite(v)) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  const m = v / p;
  return (m <= 1 ? 1 : m <= 2 ? 2 : wide && m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p;
}

/** Число с запятой, без хвостовых нулей. */
export const fmtNum = (v: number, d = 3) => (Number.isFinite(v) ? Number(v.toFixed(d)).toString().replace(".", ",").replace("-", "−") : "—");

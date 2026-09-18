/**
 * Нечёткое логическое вывод по Мамдани — лабораторные «Систем штучного
 * інтелекту» (методичні вказівки А. А. Косолапова, ДІІТ, 2012).
 *
 * Повторяет схему программы FLS, в которой делается работа:
 *
 *   фазификация    — значение функции принадлежности терма во входной точке;
 *   агрегирование  — свёртка посылок правила (конъюнкция или дизъюнкция);
 *   активизация    — импликация: функция вывода ограничивается силой правила;
 *   аккумуляция    — свёртка заключений всех правил;
 *   дефазификация  — переход к чёткому числу.
 *
 * Каждый из пяти этапов настраивается — ради этого лабораторная и делается:
 * методичка требует сравнить результаты при разных способах построения
 * дизъюнкции, импликации, аккумуляции и дефазификации.
 *
 * Функции принадлежности задаются точками, как в методичке: запись
 * {1/0; 1/20; 0/45} — это пары «принадлежность/значение». Между точками
 * функция линейна, за крайними точками постоянна.
 *
 * Сверено с реальным выводом: для системы управления мобильным роботом
 * (задание 7) при исходном наборе методов дистанция 100 см и направление 75°
 * дают 135,00°, дистанция 20 см и направление 145° — 15,00°. Обе точки
 * совпадают и с программой FLS, и с ручным расчётом в отчёте.
 */

export interface Term {
  name: string;
  /** Точки функции принадлежности: [x, μ], по возрастанию x. */
  points: [number, number][];
  /** Расшифровка, когда методичка называет терм символом: NB, PS и т. п. */
  label?: string;
  /** Исходная запись, когда методичка задаёт терм формулой, а не точками. */
  formula?: string;
  /** Точная функция — точки тогда её кусочно-линейное приближение. */
  exact?: (x: number) => number;
}

export interface Variable {
  name: string;
  /** Подпись для страницы: имя терма без подчёркиваний, с единицами. */
  label: string;
  unit?: string;
  /** Универс: [левая граница, правая]. */
  universe: [number, number];
  terms: Term[];
}

export interface Rule {
  /** Посылки: [имя переменной, имя терма]. */
  when: [string, string][];
  /** Имя терма выходной переменной. */
  then: string;
  /** Связка посылок; в базах правил методички везде конъюнктивная. */
  op?: "and" | "or";
}

export interface FuzzySystem {
  inputs: Variable[];
  output: Variable;
  rules: Rule[];
}

export type Norm = "minimum" | "maximum";
export type Defuzz = "cog" | "fimax" | "mom";

export interface Methods {
  /** Построение конъюнкции посылок. */
  conj: Norm;
  /** Построение дизъюнкции посылок. */
  disj: Norm;
  /** Импликация — активизация заключения. */
  impl: Norm;
  /** Аккумуляция заключений всех правил. */
  accum: Norm;
  /** Дефазификация: центр тяжести, первый максимум, средний из максимумов. */
  defuzz: Defuzz;
}

/** Набор, с которого методичка предписывает начинать исследование. */
export const INITIAL_METHODS: Methods = {
  conj: "minimum",
  disj: "maximum",
  impl: "minimum",
  accum: "maximum",
  defuzz: "cog",
};

export const METHOD_LABELS: Record<Norm | Defuzz, string> = {
  minimum: "минимум",
  maximum: "максимум",
  cog: "центр тяжести",
  fimax: "первый максимум",
  mom: "средний из максимумов",
};

/** Значение функции принадлежности терма в точке. */
export function membership(term: Term, x: number): number {
  const pts = term.points;
  if (pts.length === 0) return 0;
  if (x <= pts[0][0]) return pts[0][1];
  if (x >= pts[pts.length - 1][0]) return pts[pts.length - 1][1];

  for (let i = 1; i < pts.length; i++) {
    const [x1, y1] = pts[i - 1];
    const [x2, y2] = pts[i];
    if (x <= x2) {
      if (x2 === x1) return Math.max(y1, y2);
      return y1 + ((y2 - y1) * (x - x1)) / (x2 - x1);
    }
  }

  return pts[pts.length - 1][1];
}

const apply = (norm: Norm, values: number[]): number =>
  norm === "minimum" ? Math.min(...values) : Math.max(...values);

export interface FiredRule {
  index: number;
  antecedents: { variable: string; term: string; degree: number }[];
  /** Сила правила — свёртка посылок выбранной операцией. */
  strength: number;
  then: string;
  op: "and" | "or";
}

export interface InferenceResult {
  fuzzified: { variable: string; term: string; degree: number }[];
  /** Все правила с их силой; несработавшие имеют силу 0. */
  fired: FiredRule[];
  /** Аккумулированное множество по универсу выхода. */
  curve: { x: number; mu: number }[];
  /** Чёткий результат; null, если не сработало ни одно правило. */
  crisp: number | null;
  /** Наибольшее значение аккумулированной функции. */
  peak: number;
}

/** Число отсчётов по универсу выхода: столько же берёт проверочный расчёт. */
const STEPS = 1000;

/**
 * Полный вывод с сохранением всех промежуточных величин.
 *
 * @param values значения входных переменных: имя → число
 */
export function infer(
  system: FuzzySystem,
  values: Record<string, number>,
  methods: Methods = INITIAL_METHODS
): InferenceResult {
  const termOf = (variable: Variable, name: string) =>
    variable.terms.find((t) => t.name === name);

  const degreeOf = (variableName: string, termName: string): number => {
    const variable = system.inputs.find((v) => v.name === variableName);
    const term = variable && termOf(variable, termName);
    const x = values[variableName];
    return variable && term && Number.isFinite(x) ? membership(term, x) : 0;
  };

  // --- фазификация ---------------------------------------------------------
  const fuzzified: InferenceResult["fuzzified"] = [];
  for (const variable of system.inputs) {
    for (const term of variable.terms) {
      fuzzified.push({
        variable: variable.name,
        term: term.name,
        degree: degreeOf(variable.name, term.name),
      });
    }
  }

  // --- агрегирование посылок ----------------------------------------------
  const fired: FiredRule[] = system.rules.map((rule, index) => {
    const antecedents = rule.when.map(([variable, term]) => ({
      variable,
      term,
      degree: degreeOf(variable, term),
    }));

    const op = rule.op ?? "and";
    const degrees = antecedents.map((a) => a.degree);
    const strength = degrees.length
      ? apply(op === "and" ? methods.conj : methods.disj, degrees)
      : 0;

    return { index, antecedents, strength, then: rule.then, op };
  });

  // --- активизация и аккумуляция ------------------------------------------
  const curve: { x: number; mu: number }[] = [];

  for (const x of outputGrid(system.output)) {
    const activated = fired.map((rule) => {
      const term = termOf(system.output, rule.then);
      // Активизация: заключение ограничивается силой правила.
      return apply(methods.impl, [rule.strength, term ? membership(term, x) : 0]);
    });

    curve.push({ x, mu: activated.length ? apply(methods.accum, activated) : 0 });
  }

  const peak = curve.reduce((max, p) => Math.max(max, p.mu), 0);

  return { fuzzified, fired, curve, peak, crisp: defuzzify(curve, methods.defuzz) };
}

/**
 * Сетка по универсу выхода.
 *
 * Равномерных отсчётов мало: в задании 1 терм выхода, заданный формулой, после
 * приближения оказывается пиком шириной в сотые доли универса, и равномерная
 * сетка прошла бы мимо него, оставив вывод пустым. Поэтому к равномерным
 * точкам добавляются все изломы функций принадлежности и их ближайшие
 * окрестности — тогда ни один узкий терм не теряется.
 */
function outputGrid(output: Variable): number[] {
  const [lo, hi] = output.universe;
  const xs = new Set<number>();

  for (let i = 0; i <= STEPS; i++) xs.add(lo + ((hi - lo) * i) / STEPS);

  for (const term of output.terms) {
    for (const [x] of term.points) {
      if (x < lo || x > hi) continue;
      // Сам излом и точки рядом с ним: без них треугольник шириной меньше
      // шага сетки вырождается в отрезок нулевой площади.
      for (const dx of [-1e-4, 0, 1e-4]) {
        const value = x + dx;
        if (value >= lo && value <= hi) xs.add(value);
      }
    }
  }

  return [...xs].sort((a, b) => a - b);
}

/** Переход от аккумулированного множества к чёткому значению. */
function defuzzify(curve: { x: number; mu: number }[], method: Defuzz): number | null {
  if (method === "cog") {
    // Сетка неравномерная, поэтому интеграл берётся по трапециям, а не
    // простой суммой отсчётов.
    let moment = 0;
    let mass = 0;
    for (let i = 1; i < curve.length; i++) {
      const a = curve[i - 1];
      const b = curve[i];
      const width = b.x - a.x;
      mass += ((a.mu + b.mu) / 2) * width;
      moment += ((a.mu * a.x + b.mu * b.x) / 2) * width;
    }
    return mass > 1e-12 ? moment / mass : null;
  }

  const peak = curve.reduce((max, p) => Math.max(max, p.mu), 0);
  if (peak <= 0) return null;

  const tops = curve.filter((p) => p.mu >= peak - 1e-12).map((p) => p.x);
  if (method === "fimax") return tops[0];

  return tops.reduce((sum, x) => sum + x, 0) / tops.length;
}

/**
 * Кусочно-линейное приближение функции, заданной формулой.
 *
 * Методичка требует этого прямо: «в FLS функції приналежності апроксимувати
 * 3-7-ма кусково-лінійними функціями». Точки выбираются не равномерно, а там,
 * где функция отклоняется от уже проведённых отрезков сильнее всего: у
 * сигмоиды на универсе в тысячу единиц весь излом умещается в несколько
 * десятков, и равномерная сетка его просто не заметила бы.
 *
 * @param count число точек (отрезков на единицу меньше)
 */
export function piecewise(
  f: (x: number) => number,
  lo: number,
  hi: number,
  count = 7
): [number, number][] {
  const SAMPLES = 4000;
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i <= SAMPLES; i++) {
    const x = lo + ((hi - lo) * i) / SAMPLES;
    xs.push(x);
    ys.push(f(x));
  }

  // Начинаем с концов универса и каждый раз добавляем точку там, где отрезок
  // расходится с функцией больше всего, пока точек не станет сколько нужно.
  const chosen = [0, SAMPLES];
  while (chosen.length < count) {
    let bestIndex = -1;
    let bestError = 0;

    for (let k = 1; k < chosen.length; k++) {
      const a = chosen[k - 1];
      const b = chosen[k];
      if (b - a < 2) continue;
      const slope = (ys[b] - ys[a]) / (xs[b] - xs[a]);

      for (let i = a + 1; i < b; i++) {
        const error = Math.abs(ys[i] - (ys[a] + slope * (xs[i] - xs[a])));
        if (error > bestError) {
          bestError = error;
          bestIndex = i;
        }
      }
    }

    if (bestIndex < 0) break;
    chosen.push(bestIndex);
    chosen.sort((p, q) => p - q);
  }

  return chosen.map((i) => [round(xs[i]), round(ys[i])] as [number, number]);
}

/** Наибольшее расхождение приближения с точной функцией. */
export function approximationError(term: Term): number {
  if (!term.exact) return 0;
  const lo = term.points[0][0];
  const hi = term.points[term.points.length - 1][0];
  let worst = 0;
  for (let i = 0; i <= 2000; i++) {
    const x = lo + ((hi - lo) * i) / 2000;
    worst = Math.max(worst, Math.abs(term.exact(x) - membership(term, x)));
  }
  return worst;
}

function round(value: number): number {
  return Math.round(value * 1e4) / 1e4;
}

/** Запись функции принадлежности так, как её приводит методичка. */
export function formatTerm(term: Term): string {
  return `{${term.points.map(([x, mu]) => `${trim(mu)}/${trim(x)}`).join("; ")}}`;
}

/** Имя терма в том виде, в каком его читает человек. */
export function humanName(name: string): string {
  return name.replace(/_/g, " ");
}

function trim(value: number): string {
  return String(Number(value.toFixed(4))).replace(".", ",");
}

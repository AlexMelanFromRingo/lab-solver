import type { GuideModule } from "./types";
import { fn1 } from "@/lib/math/expr";
import { heatExplicit, waveExplicit } from "@/lib/algorithms/numeric";

/**
 * «Алгоритми та методи обчислень» — примеры листов Maple из LIDER (pz1, laba2,
 * Newton, laba3, pz4, pz5, крайові задачі) и варианты индивидуального задания
 * «Розв'язування крайових задач математичної фізики методом сіток» (ind_zavd).
 * Для ЛР1–5 таблиц вариантов в курсе нет: данные выдавались каждому, поэтому
 * здесь калькуляторы с примерами методички по умолчанию.
 */

const SRC = "Алгоритми та методи обчислень, приклади виконання в Maple (LIDER)";

const MAPLE_SLAE = `restart; with(linalg):
A := matrix(3, 3, [1.5, 2.3, -3.7, 2.8, 3.4, 5.8, 1.2, 7.3, -2.3]);
B := vector(3, [4.5, -3.2, 5.6]);
AN := inverse(A);            # метод оберненої матриці
E := multiply(A, AN);        # перевірка: одинична матриця
X := multiply(AN, B);
X1 := linsolve(A, B);        # метод Гаусса
# ітерації: x = C.x + d, умова збіжності norm(C) < 1
C := matrix(3, 3, [0.48, -0.43, 0.045, -0.12, 0.27, 0.23, -0.13, -0.11, 0.05]);
norm(C);`;

const MAPLE_ITER = `restart; with(numtheory):
f := 1.8*x^2 - sin(10*x);
pf := diff(f, x);
g := x - f/k;
plot([f, pf], x = -1..1, color = [red, black]);
x := -0.6;
k := round(maximize(pf)/2);     # у прикладі k = -6
x1 := g;
while (abs(x1 - x)/abs(x) > 0.001) do x := x1; x1 := evalf(g) od;`;

const MAPLE_NEWTON = `restart;
F := x -> x^3 - 0.7*x^2 + 0.75;
f := D(F); ff := D(f);
plot(F(x), x = -0.8..-0.7);
a[0] := -0.8: b[0] := -0.7:
x[0] := -0.8:
evalf(F(x[0])*ff(x[0]));        # > 0 — з цього кінця стартує Ньютон
epsilon := 10^(-3);
NW := x -> x - F(x)/f(x);
i := 0: flag := 1:
while flag = 1 do x[i+1] := evalf(NW(x[i])); if evalf(abs(x[i+1] - x[i])) < epsilon then flag := 0 fi; i := i + 1 od:
X_current := x[i]; X_approximate := fsolve(F(x), x);`;

const MAPLE_LAGRANGE = `Digits := 20;
X := vector(6, [1000, 1010, 1020, 1030, 1040, 1050]);
Y := vector(6, [3.0, 3.0, 3.01, 3.012, 3.017, 3.021]);
x0 := 1025;
C := vector(6, [1, 1, 1, 1, 1, 1]):
for i from 1 to 6 do for j from 1 to 6 do
  if (i <> j) then C[i] := C[i]*(x - X[j])/(X[i] - X[j]) fi
od od;
L := simplify(sum('C[i]*Y[i]', 'i' = 1..6));
subs(x = x0, L);`;

const MAPLE_CAUCHY = `restart;
f := proc(x, y) x*y + x*cos(y) end;
am := matrix(11, 2);
x0 := 0; y0 := 0; am[1, 1] := x0; am[1, 2] := y0;
a := 0; b := 1; h := 0.1; eps := 0.0001;
x1 := x0; y11 := y0;
for i from 2 to 11 do
  x0 := x1; y0 := y11; x1 := a + h*(i - 1); am[i, 1] := x1;
  y10 := y0 + h*f(x0, y0);
  y11 := y0 + h/2*(f(x0, y0) + f(x1, y10));
  del := abs(y11 - y10);
  while (del > eps) do y10 := y11; y11 := y0 + h/2*(f(x0, y0) + f(x1, y10)); del := abs(y11 - y10) od;
  am[i, 2] := y11
od:
evalm(am);`;

// Индивидуальное задание: нечётные — теплопроводность, чётные — колебания струны.
// log в таблице десятичный (φ(0) = ψ1(0) у вариантов 3, 11, 23 только с log10).
interface PdeVariant {
  phi: string;
  phi2?: string;
  psi1: string;
  psi2: string;
}

const PDE: PdeVariant[] = [
  { phi: "cos(2x)", psi1: "1 - 6t", psi2: "-0.4161t^2" },
  { phi: "x(x - 1)", phi2: "x^2 + 1", psi1: "t", psi2: "2(t + 1)" },
  { phi: "1.2 + log10(x + 0.4)", psi1: "0.8 + t", psi2: "1.3461 + sin(t)" },
  { phi: "x cos(pi x)", phi2: "2 - 2x^2", psi1: "2t", psi2: "-1 + t^2" },
  { phi: "ln(2.63 - x)", psi1: "3(0.14 - t)", psi2: "4t" },
  { phi: "(x + 0.2) sin(pi x/2)", phi2: "1.2x", psi1: "0", psi2: "0.2122(t + 1)" },
  { phi: "sin(x + 0.45)", psi1: "0.4518", psi2: "3t^2 + 0.9959" },
  { phi: "3x(1 - x)", phi2: "x^2 - 2x + 2", psi1: "2t", psi2: "t" },
  { phi: "2cos(x + 0.55)", psi1: "1.705", psi2: "0.0416 + 3t" },
  { phi: "(x + 0.5)^2", phi2: "-0.5(x - 1)^2", psi1: "0.5(0.5 - t)", psi2: "2.25 + t" },
  { phi: "log10(1.43 + 2x)", psi1: "0.1553 + 3t", psi2: "3(t + 0.1784)" },
  { phi: "(x + 0.4) sin(pi x)", phi2: "0.5(1 - x)^2", psi1: "0.5t", psi2: "0" },
  { phi: "sin(x + 0.2)", psi1: "3t + 0.02", psi2: "0.8521t^2" },
  { phi: "(1 - x)(x^2 + 1)", phi2: "0.5", psi1: "1", psi2: "0.5t" },
  { phi: "cos(x + 0.66)", psi1: "3t + 0.79", psi2: "-0.0801 + t^2" },
  { phi: "1 - x^2 + x", phi2: "2x", psi1: "1", psi2: "(1 + t)^2" },
  { phi: "cos(2x + 0.19)", psi1: "t + 0.982", psi2: "-0.5084 + t^2" },
  { phi: "sin(0.55x + 0.03)", phi2: "(x - 1)^2", psi1: "t + 0.03", psi2: "0.548t^2" },
  { phi: "cos(0.55x + 0.03)", psi1: "t + 0.9553", psi2: "0.8364 + 3t^2" },
  { phi: "(2 - x) sin(pi x)", phi2: "0", psi1: "0.5t^2", psi2: "3.35t" },
  { phi: "log10(242 + x)", psi1: "2.3838 + t", psi2: "6(-t + 0.227)" },
  { phi: "x^2 cos(pi x)", phi2: "0.5(x + 1)", psi1: "0.5t", psi2: "t - 1" },
  { phi: "log10(1.43 + 2x)", psi1: "0.1553 + t^3", psi2: "3(t^3 + 0.1784)" },
  { phi: "(2 + x)(0.5x + 1)", phi2: "(x - 1)^3", psi1: "2 + t", psi2: "4.5 - 3t^2" },
];

const MAPLE_FN = new Set(["sin", "cos", "tan", "exp", "ln", "log", "log10", "sqrt", "abs", "arctan"]);

/** Запись для Maple: явное умножение (2x → 2*x, x(…) → x*(…)) и Pi. */
function toMaple(e: string): string {
  const toks = e.match(/\d+\.?\d*|[A-Za-z_][A-Za-z_0-9]*|[-+*/^()]/g) ?? [];
  let out = "";
  let prev: string | null = null;
  for (const t of toks) {
    const isValue = (x: string) => /^[\d.]/.test(x) || /^[A-Za-z_]/.test(x) || x === ")";
    const startsValue = /^[\d.]/.test(t) || /^[A-Za-z_]/.test(t) || t === "(";
    if (prev && isValue(prev) && startsValue && !(t === "(" && MAPLE_FN.has(prev))) out += "*";
    else if (prev && !(t === "(" && MAPLE_FN.has(prev ?? ""))) out += " ";
    out += t === "pi" ? "Pi" : t;
    prev = t;
  }
  return out.replace(/ ?\* ?/g, "*").replace(/ \( /g, " (").replace(/\( /g, "(").replace(/ \)/g, ")").replace(/ \^ /g, "^");
}

const r4 = (v: number) => Number(v.toFixed(4));

export const AMO_GUIDES: GuideModule[] = [
  {
    slug: "amo-lab1",
    intro:
      "Система линейных уравнений четырьмя способами из методички: обратной матрицей (с проверкой A·A⁻¹ = E), " +
      "Гауссом, простыми итерациями и Зейделем. Для итераций калькулятор сам ищет перестановку уравнений и " +
      "неизвестных с диагональным преобладанием, а если её нет — объясняет, что делать.",
    widget: "slae",
    computed: () => ({ code: [{ title: "Команды Maple по примеру методички", code: MAPLE_SLAE }] }),
    guide: {
      source: `${SRC}, ЛР1`,
      goals: ["Изучить методы решения систем линейных алгебраических уравнений и нахождения обратной матрицы."],
      steps: [
        { title: "Обратная матрица", body: "inverse(A), проверка multiply(A, AN) = E, X = AN·B." },
        { title: "Гаусс", body: "linsolve(A, B) — или прямой и обратный ход вручную; результат совпадает с обратной матрицей." },
        { title: "Итерации и Зейдель", body: "Привести к виду x = Cx + d; достаточное условие сходимости — norm(C) < 1 (норма по строкам) или диагональное преобладание; итерации до заданной точности." },
      ],
      screenshots: [],
      report: ["Лист Maple (.mw) с решением своей системы всеми способами и проверкой."],
      questions: [],
    },
  },
  {
    slug: "amo-lab2",
    intro:
      "Нелинейное уравнение простой итерацией по схеме методички: корень отделяется графиком, итерационная " +
      "функция g(x) = x − f(x)/k с k = round(max f′/2), остановка по относительной разности 0,001.",
    widget: "iter",
    computed: () => ({ code: [{ title: "Команды Maple по примеру методички", code: MAPLE_ITER }] }),
    guide: {
      source: `${SRC}, ЛР2 (laba2)`,
      goals: ["Реализовать решение нелинейных и трансцендентных уравнений методом итераций."],
      steps: [
        { title: "Отделение корня", body: "plot([f, pf]) — отрезок, где f меняет знак; каждый корень уточняется отдельно." },
        { title: "Итерационная функция", body: "g = x − f/k, k = round(maximize(pf)/2) на отрезке; знак k — знак производной." },
        { title: "Уточнение", body: "while abs(x1 − x)/abs(x) > 0.001 do x := x1; x1 := evalf(g) od." },
      ],
      screenshots: [],
      report: ["Лист Maple (.mw) с отделением корней и итерациями."],
      questions: [],
    },
  },
  {
    slug: "amo-mk1",
    intro:
      "Задание к модульному контролю: уточнение корня методами Ньютона, хорд и комбинированным. Начальная точка — " +
      "конец отрезка, где F·F″ > 0; остановка при |x_{i+1} − x_i| < 10⁻³; результат сверяется с fsolve.",
    widget: "roots",
    computed: () => ({ code: [{ title: "Команды Maple по примеру методички (метод Ньютона)", code: MAPLE_NEWTON }] }),
    guide: {
      source: `${SRC}, індивідуальні завдання «Метод Ньютона», «Метод хорд», «Комбінований метод»`,
      goals: ["Методы Ньютона, хорд и комбинированный: вычислительные схемы и сходимость."],
      steps: [
        { title: "Отрезок", body: "График F(x), отрезок [a; b] со сменой знака; F′ и F″ на нём знакопостоянны." },
        { title: "Начальная точка", body: "evalf(F(x[0])·ff(x[0])) > 0 — Ньютон стартует с этого конца, у хорд он неподвижен." },
        { title: "Итерации и сравнение", body: "До |x_{i+1} − x_i| < ε, затем fsolve(F(x), x)." },
      ],
      screenshots: [],
      report: ["Лист Maple (.mw) с решением своих уравнений."],
      questions: [],
    },
  },
  {
    slug: "amo-lab3-4",
    intro:
      "Приближение функций: интерполяционный многочлен Лагранжа по узлам и значение в точке x₀ (ЛР3) и " +
      "аппроксимация методом наименьших квадратов (ЛР4). По умолчанию — узлы примера методички.",
    widget: "approx",
    computed: () => ({ code: [{ title: "Команды Maple по примеру методички (Лагранж)", code: MAPLE_LAGRANGE }] }),
    guide: {
      source: `${SRC}, ЛР3 (laba3) и ЛР4 (pz4)`,
      goals: ["Интерполяция многочленом Лагранжа.", "Аппроксимация и сглаживание методом наименьших квадратов."],
      steps: [
        { title: "Лагранж", body: "Базисные множители C[i] = Π (x − X[j])/(X[i] − X[j]), L = Σ C[i]·Y[i], значение subs(x = x0, L); Digits := 20 — узлы большие." },
        { title: "МНК", body: "Коэффициенты многочлена из нормальных уравнений (или fit/LeastSquares), график точек и кривой." },
        { title: "Графики", body: "plot([[x, y], …], style = point) вместе с многочленом." },
      ],
      screenshots: [],
      report: ["Лист Maple (.mw) с обоими приближениями и графиками."],
      questions: [],
    },
  },
  {
    slug: "amo-lab5",
    intro:
      "Задача Коши для обыкновенного дифференциального уравнения: метод Эйлера, Эйлера–Коши с итерационным " +
      "уточнением, как в примере методички, и Рунге–Кутта 4-го порядка — таблица значений на отрезке.",
    widget: "cauchy",
    computed: () => ({ code: [{ title: "Команды Maple по примеру методички (Эйлер–Коши)", code: MAPLE_CAUCHY }] }),
    guide: {
      source: `${SRC}, ЛР5 (pz5)`,
      goals: ["Численное интегрирование ОДУ методами Эйлера и Рунге–Кутта, анализ точности."],
      steps: [
        { title: "Эйлер–Коши", body: "Прогноз y10 = y0 + h·f(x0, y0), уточнение y11 = y0 + h/2·(f(x0, y0) + f(x1, y10)), пока |y11 − y10| > eps." },
        { title: "Рунге–Кутта", body: "k1…k4 и y = y0 + (k1 + 2k2 + 2k3 + k4)/6." },
        { title: "Точность", body: "Сравнить методы между собой (и с dsolve, если решение аналитическое)." },
      ],
      screenshots: [],
      report: ["Лист Maple (.mw) с таблицами обоих методов."],
      questions: [],
    },
  },
  {
    slug: "amo-exam",
    intro:
      "Индивидуальное задание к экзамену: первая краевая задача методом сеток по явной схеме — для нечётных " +
      "вариантов уравнение теплопроводности, для чётных — колебаний струны. Таблица значений на всей сетке и " +
      "команды Maple под свой вариант.",
    variant: {
      label: "варианта",
      min: 1,
      max: 24,
      hint: "Вариант индивидуального задания 1–24; нечётный — теплопроводность, чётный — колебания струны.",
      compute: (v) => {
        const d = PDE[v - 1];
        const phi = fn1(d.phi);
        const p1 = fn1(d.psi1, "t");
        const p2 = fn1(d.psi2, "t");
        const heat = v % 2 === 1;
        const checks = [
          `φ(0) = ${r4(phi(0))}, ψ1(0) = ${r4(p1(0))}`,
          `φ(1) = ${r4(phi(1))}, ψ2(0) = ${r4(p2(0))}`,
        ];
        const mismatch = Math.abs(phi(0) - p1(0)) > 0.01 || Math.abs(phi(1) - p2(0)) > 0.01;
        if (heat) {
          const r = heatExplicit(phi, p1, p2, 1, 0.1, 0.05);
          return {
            tables: [
              {
                title: `Теплопроводность, вариант ${v}: τ = h²/2 = ${r.tau}, σ = ${r.sigma}`,
                columns: ["t \\ x", ...r.x.map(String)],
                rows: r.u.map((row, j) => [r.t[j], ...row.map(r4)]),
                note: `u(x, 0) = ${d.phi}; u(0, t) = ${d.psi1}; u(1, t) = ${d.psi2}. ${checks.join("; ")}${mismatch ? " — начальное и граничные условия в углах не согласованы, так в таблице вариантов; на ответ по схеме это не влияет." : "."}`,
              },
            ],
            code: [
              {
                title: "Команды Maple (как в примере «Розрахункова робота №2»)",
                code: [
                  "restart; with(linalg):",
                  "a := 1; h := 0.1; T := 0.05;",
                  "tau := h^2/2;",
                  "u := matrix(11, 11);",
                  `for j from 2 to 11 do t := tau*(j - 1); u[j, 1] := evalf(${toMaple(d.psi1)}); u[j, 11] := evalf(${toMaple(d.psi2)}) od;`,
                  `for i from 1 to 11 do x := h*(i - 1); u[1, i] := evalf(${toMaple(d.phi)}) od;`,
                  "for i from 1 to 10 do for j from 2 to 10 do",
                  "  u[i+1, j] := evalf(a^2*(tau/h^2)*(u[i, j-1] + u[i, j+1]) + (1 - 2*a^2*(tau/h^2))*u[i, j])",
                  "od od;",
                  "evalm(u);",
                ].join("\n"),
              },
            ],
          };
        }
        const phi2 = fn1(d.phi2 ?? "0");
        const good = waveExplicit(phi, phi2, p1, p2, 1, 0.1, 0.06, 10, false);
        const asIs = waveExplicit(phi, phi2, p1, p2, 1, 0.1, 0.06, 10, true);
        const tab = (r: typeof good, title: string) => ({
          title,
          columns: ["t \\ x", ...r.x.map(String)],
          rows: r.u.map((row, j) => [r.t[j], ...row.map(r4)]),
        });
        return {
          tables: [
            {
              ...tab(good, `Колебания струны, вариант ${v}: τ = 0.06, λ² = (aτ/h)² = ${r4(good.lambda2)} — верная схема`),
              note: `u(x, 0) = ${d.phi}; u_t(x, 0) = ${d.phi2 ?? "не задано"}; u(0, t) = ${d.psi1}; u(1, t) = ${d.psi2}. ${checks.join("; ")}.`,
            },
            tab(asIs, "Та же сетка по формуле методички (коэффициент 2 − λ²) — для сравнения"),
          ],
          code: [
            {
              title: "Команды Maple (как в примере «кз для рівняння коливань»), с исправленным коэффициентом",
              code: [
                "restart; with(linalg):",
                `phi1 := proc(x) ${toMaple(d.phi)} end;`,
                `phi2 := proc(x) ${toMaple(d.phi2 ?? "0")} end;`,
                `psi1 := proc(t) ${toMaple(d.psi1)} end;`,
                `psi2 := proc(t) ${toMaple(d.psi2)} end;`,
                "a := 1; h := 0.1; tau := 0.06; m := 10; n := 10;",
                "U := matrix(m + 1, n + 1);",
                "for i from 1 to m + 1 do x := (i - 1)*h; U[i, 1] := phi1(x); U[i, 2] := phi1(x) + tau*phi2(x) od;",
                "for j from 1 to n + 1 do t := (j - 1)*tau; U[1, j] := evalf(psi1(t)); U[m + 1, j] := evalf(psi2(t)) od:",
                "for j from 2 to n do for i from 2 to m do",
                "  U[i, j+1] := evalf(-U[i, j-1] + tau^2*a^2/h^2*(U[i-1, j] + U[i+1, j]) + 2*(1 - tau^2*a^2/h^2)*U[i, j])",
                "od od;",
                "evalm(U);",
              ].join("\n"),
            },
          ],
        };
      },
    },
    errata: [
      "В примере для струны основная формула записана с коэффициентом (2 − τ²a²/h²)·U[i, j]; в явной схеме «крест» он равен 2(1 − τ²a²/h²). С коэффициентом из методички значения растут до сотен (в самом примере — до 100 к t = 0,6) — это ошибка формулы, а не свойство задачи. Здесь — верная схема и, для сравнения, таблица по формуле методички.",
      "В условии для струны T = 0,06, а в примере — T = 0,6 при τ = 0,06 и 10 слоях; при T = 0,06 получился бы один шаг по времени. Взято как в примере: τ = 0,06, 10 слоёв.",
      "log в таблице вариантов — десятичный логарифм, как log10 в примере: только с ним φ(0) совпадает с ψ1(0) в вариантах 3, 11 и 23.",
      "Вариант 17: «cos(2x + 019)» — взято 0,19 (ψ1(0) = cos 0,19 = 0,982). Вариант 20: φ2(x) в методичке не указана — взята 0; уточните у преподавателя.",
    ],
    guide: {
      source: "Алгоритми та методи обчислень, варіанти індивідуальних завдань «Розв’язування крайових задач математичної фізики методом сіток» (ind_zavd)",
      goals: ["Составить таблицу значений решения первой краевой задачи по явной разностной схеме."],
      steps: [
        { title: "Теплопроводность (нечётные варианты)", body: "a = 1, h = 0,1, T = 0,05; τ = h²/2 — граница устойчивости явной схемы; начальный слой по φ(x), концы по ψ1(t), ψ2(t)." },
        { title: "Колебания струны (чётные варианты)", body: "a = 1, h = 0,1, τ = 0,06; первые два слоя по φ1 и φ2, концы по ψ1, ψ2, дальше схема «крест»." },
        { title: "Таблица", body: "evalm(u) — вся сетка; при желании plot3d/matrixplot." },
      ],
      screenshots: [],
      report: ["Лист Maple (.mw) с таблицей значений решения."],
      questions: [],
    },
  },
];

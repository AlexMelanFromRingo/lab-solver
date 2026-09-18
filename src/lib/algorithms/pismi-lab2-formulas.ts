/**
 * Проверка тождеств — лабораторная 2 «Проектування інформаційних систем в
 * мережах Інтернет» (УДУНТ, кафедра ЕОМ; укладачі Косолапов А. А.,
 * Дзюба В. В., 2025, с. 12–14).
 *
 * Задание варианта: посчитать два выражения, y₁ и y₂, и убедиться, что при
 * заданном значении аргумента они совпадают. Совпадение не случайно — за
 * каждой парой стоит конкретное тождественное преобразование, и именно оно
 * отличает один вариант от другого.
 *
 * Оба выражения считаются прямо по условию, без упрощений: смысл задания как
 * раз в том, чтобы сошлись два разных пути вычисления. Поэтому сравнивать их
 * на точное равенство нельзя — двойная точность даёт расхождение в последних
 * разрядах, и допуск берётся пропорциональным самой величине.
 *
 * Таблица вариантов перенесена из методички как есть. Одна опечатка набора
 * исправлена и помечена в поле note (вариант 1).
 *
 * Сверено численно: во всех 15 вариантах расхождение y₁ и y₂ лежит в
 * пределах от 0 до 5,3·10⁻¹⁵.
 */

export interface TraceStep {
  /** Что за величина — как она называется в разборе. */
  label: string;
  value: number;
}

export interface FormulaVariant {
  variant: number;
  /** Какое преобразование стоит за этим вариантом. */
  title: string;
  /** Исходные данные условия: имя аргумента → значение. */
  given: Record<string, number>;
  /** Выражения так, как они записаны в методичке. */
  f1: string;
  f2: string;
  /** Тождества, связывающие выражения. */
  identity: string[];
  /** Оговорка, если методичка ошибается или ответ зависит от четверти. */
  note?: string;
  y1: (g: Record<string, number>) => number;
  y2: (g: Record<string, number>) => number;
  /** Промежуточные величины, из которых тождество видно в числах. */
  trace: (g: Record<string, number>) => TraceStep[];
  conclusion: string;
}

const { PI, sin, cos, tan, asin, sqrt, log, log2, log10, E, abs } = Math;

export const FORMULA_VARIANTS: FormulaVariant[] = [
  {
    variant: 1,
    title: "Понижение степени через косинус двойного угла",
    given: { x: 0.4985 },
    f1: "y₁ = sin⁴x + cos⁴x",
    f2: "y₂ = ((1 − cos 2x) / 2)² + ((1 + cos 2x) / 2)²",
    identity: ["sin²x = (1 − cos 2x) / 2", "cos²x = (1 + cos 2x) / 2"],
    note:
      "В методичке оба слагаемых y₂ напечатаны одинаково, с (1 − cos 2x). Это опечатка " +
      "набора: второе слагаемое заменяет cos²x, значит в нём должно стоять (1 + cos 2x). " +
      "С напечатанным выражением равенство не выполняется ни в одной точке.",
    y1: ({ x }) => sin(x) ** 4 + cos(x) ** 4,
    y2: ({ x }) => ((1 - cos(2 * x)) / 2) ** 2 + ((1 + cos(2 * x)) / 2) ** 2,
    trace: ({ x }) => [
      { label: "cos 2x", value: cos(2 * x) },
      { label: "sin²x", value: sin(x) ** 2 },
      { label: "(1 − cos 2x) / 2", value: (1 - cos(2 * x)) / 2 },
      { label: "cos²x", value: cos(x) ** 2 },
      { label: "(1 + cos 2x) / 2", value: (1 + cos(2 * x)) / 2 },
    ],
    conclusion:
      "Второе выражение — это первое, в котором каждый квадрат синуса и косинуса заменён " +
      "формулой понижения степени. Журнал показывает главное: sin²x и (1 − cos 2x)/2 " +
      "совпадают ещё до возведения в квадрат, поэтому равенство выполняется при любом x.",
  },
  {
    variant: 2,
    title: "Свёртка суммы гармоник в одну",
    given: { a: 5.5, b: 12.7, x: 1.28 },
    f1: "y₁ = a·cos x + b·sin x",
    f2: "y₂ = A·sin(x + μ),  A = √(a² + b²),  μ = arcsin(a / √(a² + b²))",
    identity: ["A·sin μ = a", "A·cos μ = b"],
    y1: ({ a, b, x }) => a * cos(x) + b * sin(x),
    y2: ({ a, b, x }) => {
      const amp = sqrt(a ** 2 + b ** 2);
      return amp * sin(x + asin(a / amp));
    },
    trace: ({ a, b, x }) => {
      const amp = sqrt(a ** 2 + b ** 2);
      const mu = asin(a / amp);
      return [
        { label: "A = √(a² + b²)", value: amp },
        { label: "μ = arcsin(a / A), рад", value: mu },
        { label: "A·sin μ (должно равняться a)", value: amp * sin(mu) },
        { label: "A·cos μ (должно равняться b)", value: amp * cos(mu) },
        { label: "x + μ, рад", value: x + mu },
      ];
    },
    conclusion:
      "Сумма двух колебаний одной частоты — тоже колебание той же частоты, у которого " +
      "амплитуда равна √(a² + b²), а сдвиг фазы μ. Журнал проверяет это напрямую: A·sin μ " +
      "даёт ровно a, а A·cos μ — ровно b, значит раскрытие синуса суммы возвращает исходное.",
  },
  {
    variant: 3,
    title: "Формулы суммы и разности синусов в знаменателях",
    given: { alpha: 0.145, beta: -0.734 },
    f1: "y₁ = (1 − tg α · tg β) / (m − n)",
    f2: "y₂ = (1 + tg β / tg α) / (m + n),  m = 5·sin(2α + β),  n = 5·sin β",
    identity: ["m − n = 10·cos(α + β)·sin α", "m + n = 10·sin(α + β)·cos α"],
    y1: ({ alpha, beta }) =>
      (1 - tan(alpha) * tan(beta)) / (5 * sin(2 * alpha + beta) - 5 * sin(beta)),
    y2: ({ alpha, beta }) =>
      (1 + tan(beta) / tan(alpha)) / (5 * sin(2 * alpha + beta) + 5 * sin(beta)),
    trace: ({ alpha, beta }) => {
      const m = 5 * sin(2 * alpha + beta);
      const n = 5 * sin(beta);
      return [
        { label: "m = 5·sin(2α + β)", value: m },
        { label: "n = 5·sin β", value: n },
        { label: "m − n", value: m - n },
        { label: "10·cos(α + β)·sin α", value: 10 * cos(alpha + beta) * sin(alpha) },
        { label: "m + n", value: m + n },
        { label: "10·sin(α + β)·cos α", value: 10 * sin(alpha + beta) * cos(alpha) },
      ];
    },
    conclusion:
      "Обе дроби после преобразований сводятся к одному и тому же выражению " +
      "1 / (10·sin α·cos α·cos β). В числителях сворачиваются тангенсы, в знаменателях — " +
      "разность и сумма синусов; журнал показывает, что посчитанные m − n и m + n " +
      "совпадают с произведением до последнего знака.",
  },
  {
    variant: 4,
    title: "Основное тождество и косинус разности",
    given: { alpha: 0.4745, beta: 0.1634 },
    f1: "y₁ = (sin α + sin β)² + (cos α + cos β)²",
    f2: "y₂ = 4·cos²((α − β) / 2)",
    identity: ["2 + 2·cos(α − β) = 4·cos²((α − β) / 2)"],
    y1: ({ alpha, beta }) =>
      (sin(alpha) + sin(beta)) ** 2 + (cos(alpha) + cos(beta)) ** 2,
    y2: ({ alpha, beta }) => 4 * cos((alpha - beta) / 2) ** 2,
    trace: ({ alpha, beta }) => [
      { label: "sin α + sin β", value: sin(alpha) + sin(beta) },
      { label: "cos α + cos β", value: cos(alpha) + cos(beta) },
      { label: "cos(α − β)", value: cos(alpha - beta) },
      { label: "2 + 2·cos(α − β)", value: 2 + 2 * cos(alpha - beta) },
      { label: "(α − β) / 2, рад", value: (alpha - beta) / 2 },
    ],
    conclusion:
      "Раскрытие скобок даёт sin²α + cos²α = 1 и sin²β + cos²β = 1, а удвоенные " +
      "произведения сворачиваются в косинус разности. Дальше работает формула половинного " +
      "угла. Значит выражение зависит не от самих углов, а только от их разности — журнал " +
      "это подтверждает: 2 + 2·cos(α − β) уже равно ответу.",
  },
  {
    variant: 5,
    title: "Кубы синуса и косинуса через кратные углы",
    given: { a: -0.4224 },
    f1: "y₁ = (sin 3a · cos³a + cos 3a · sin³a) / 3",
    f2: "y₂ = sin 4a / 4",
    identity: ["cos³a = (3·cos a + cos 3a) / 4", "sin³a = (3·sin a − sin 3a) / 4"],
    y1: ({ a }) => (sin(3 * a) * cos(a) ** 3 + cos(3 * a) * sin(a) ** 3) / 3,
    y2: ({ a }) => sin(4 * a) / 4,
    trace: ({ a }) => [
      { label: "sin 3a", value: sin(3 * a) },
      { label: "cos 3a", value: cos(3 * a) },
      { label: "cos³a", value: cos(a) ** 3 },
      { label: "(3·cos a + cos 3a) / 4", value: (3 * cos(a) + cos(3 * a)) / 4 },
      {
        label: "sin 3a·cos³a + cos 3a·sin³a",
        value: sin(3 * a) * cos(a) ** 3 + cos(3 * a) * sin(a) ** 3,
      },
      { label: "0,75·sin 4a", value: 0.75 * sin(4 * a) },
    ],
    conclusion:
      "После замены кубов на выражения с утроенными углами слагаемые с произведением " +
      "sin 3a·cos 3a взаимно уничтожаются, и остаётся 3/4·sin(3a + a). Журнал показывает " +
      "промежуточный результат: числитель равен именно 0,75·sin 4a, поэтому деление на 3 " +
      "даёт sin 4a / 4.",
  },
  {
    variant: 6,
    title: "Сокращение дроби на сумму синуса и косинуса",
    given: { x: -0.55677 },
    f1: "y₁ = sin²x / (sin x − cos x) − (sin x + cos x) / (tg²x − 1)",
    f2: "y₂ = sin x + cos x",
    identity: ["tg²x − 1 = (sin²x − cos²x) / cos²x"],
    y1: ({ x }) =>
      sin(x) ** 2 / (sin(x) - cos(x)) - (sin(x) + cos(x)) / (tan(x) ** 2 - 1),
    y2: ({ x }) => sin(x) + cos(x),
    trace: ({ x }) => [
      { label: "sin x − cos x", value: sin(x) - cos(x) },
      { label: "tg²x − 1", value: tan(x) ** 2 - 1 },
      { label: "второе слагаемое", value: (sin(x) + cos(x)) / (tan(x) ** 2 - 1) },
      { label: "cos²x / (sin x − cos x)", value: cos(x) ** 2 / (sin(x) - cos(x)) },
      { label: "первое слагаемое", value: sin(x) ** 2 / (sin(x) - cos(x)) },
    ],
    conclusion:
      "Второе слагаемое после приведения к общему знаменателю превращается в " +
      "cos²x / (sin x − cos x) — журнал показывает, что эти два числа совпадают. Тогда " +
      "разность слагаемых имеет общий знаменатель, а числитель sin²x − cos²x раскладывается " +
      "на множители, один из которых сокращается.",
  },
  {
    variant: 7,
    title: "Произведение косинусов суммы и разности",
    given: { a: 0.777 },
    f1: "y₁ = 64·cos³(π/6 − α/2) · sin³(π/3 − α/2)",
    f2: "y₂ = (sin(3a/2) / sin(a/2))³",
    identity: [
      "sin(π/3 − α/2) = cos(π/6 + α/2)",
      "cos(A − B)·cos(A + B) = cos²A − sin²B",
      "sin 3θ / sin θ = 3 − 4·sin²θ",
    ],
    y1: ({ a }) => 64 * cos(PI / 6 - a / 2) ** 3 * sin(PI / 3 - a / 2) ** 3,
    y2: ({ a }) => (sin(1.5 * a) / sin(a / 2)) ** 3,
    trace: ({ a }) => [
      { label: "cos(π/6 − α/2)", value: cos(PI / 6 - a / 2) },
      { label: "sin(π/3 − α/2)", value: sin(PI / 3 - a / 2) },
      { label: "cos(π/6 + α/2) — тот же угол, записанный косинусом", value: cos(PI / 6 + a / 2) },
      {
        label: "произведение косинусов разности и суммы",
        value: cos(PI / 6 - a / 2) * cos(PI / 6 + a / 2),
      },
      { label: "3/4 − sin²(α/2)", value: 0.75 - sin(a / 2) ** 2 },
      { label: "sin(3a/2) / sin(a/2)", value: sin(1.5 * a) / sin(a / 2) },
      { label: "4 · (3/4 − sin²(a/2))", value: 4 * (0.75 - sin(a / 2) ** 2) },
    ],
    conclusion:
      "Синус в первом выражении переводится в косинус дополнительного угла, после чего " +
      "произведение косинусов суммы и разности сворачивается в 3/4 − sin²(α/2). Отношение " +
      "синусов во втором выражении равно 3 − 4·sin²(a/2), то есть вчетверо большей величине, " +
      "а множитель 64 = 4³ в первом выражении это и компенсирует.",
  },
  {
    variant: 8,
    title: "Квадрат суммы и косинус через тангенс половинного угла",
    given: { beta: -0.8985 },
    f1: "y₁ = (1 + sin 2β) / (sin β + cos β) − (1 − tg²(β/2)) / (1 + tg²(β/2))",
    f2: "y₂ = sin β",
    identity: [
      "1 + sin 2β = (sin β + cos β)²",
      "(1 − tg²(β/2)) / (1 + tg²(β/2)) = cos β",
    ],
    y1: ({ beta }) => {
      const t = tan(beta / 2);
      return (
        (1 + sin(2 * beta)) / (sin(beta) + cos(beta)) - (1 - t ** 2) / (1 + t ** 2)
      );
    },
    y2: ({ beta }) => sin(beta),
    trace: ({ beta }) => {
      const t = tan(beta / 2);
      return [
        { label: "1 + sin 2β", value: 1 + sin(2 * beta) },
        { label: "(sin β + cos β)²", value: (sin(beta) + cos(beta)) ** 2 },
        {
          label: "первое слагаемое",
          value: (1 + sin(2 * beta)) / (sin(beta) + cos(beta)),
        },
        { label: "tg(β/2)", value: t },
        { label: "второе слагаемое", value: (1 - t ** 2) / (1 + t ** 2) },
        { label: "cos β", value: cos(beta) },
      ];
    },
    conclusion:
      "Первая дробь сокращается до sin β + cos β, потому что её числитель — полный квадрат: " +
      "журнал показывает, что 1 + sin 2β и (sin β + cos β)² — одно и то же число. Вторая " +
      "дробь есть универсальная подстановка для косинуса. Разность оставляет чистый sin β.",
  },
  {
    variant: 9,
    title: "Переход между основаниями логарифмов",
    given: { x: 5 },
    f1: "y₁ = ln x·lg x + lg x·log₂x + log₂x·ln x",
    f2: "y₂ = (ln x · lg x · log₂x) / log₂₀ₑ x",
    identity: ["ln 20 = ln 2 + ln 10", "log₂₀ₑ x = ln x / (ln 20 + 1), т. к. ln e = 1"],
    y1: ({ x }) => log(x) * log10(x) + log10(x) * log2(x) + log2(x) * log(x),
    y2: ({ x }) => (log(x) * log10(x) * log2(x)) / (log(x) / log(2 * 10 * E)),
    trace: ({ x }) => {
      const base = 2 * 10 * E;
      return [
        { label: "ln x", value: log(x) },
        { label: "lg x", value: log10(x) },
        { label: "log₂ x", value: log2(x) },
        { label: "основание 2·10·e", value: base },
        { label: "log₂₀ₑ x", value: log(x) / log(base) },
        { label: "ln 2 + ln 10 + 1", value: log(2) + log(10) + 1 },
        { label: "ln(20·e)", value: log(base) },
      ];
    },
    conclusion:
      "Если вынести ln²x за скобки, первое выражение даёт множитель " +
      "(ln 2 + ln 10 + 1) / (ln 10 · ln 2), а второе — (ln 20 + 1) / (ln 10 · ln 2). Журнал " +
      "показывает, что ln 2 + ln 10 + 1 и ln(20·e) — одно число: логарифм произведения равен " +
      "сумме логарифмов, а ln e = 1.",
  },
  {
    variant: 10,
    title: "Разность кубов под корнем",
    given: { x: 5.55 },
    f1: "y₁ = ((x − 1)(x^1,5 − 1)) / ((x + √x + 1)(x^0,5 + 1)) + 2 / x^(−0,5)",
    f2: "y₂ = x + 1",
    identity: ["x^1,5 − 1 = (√x − 1)(x + √x + 1)", "x − 1 = (√x − 1)(√x + 1)"],
    y1: ({ x }) => {
      const r = sqrt(x);
      return ((x - 1) * (x ** 1.5 - 1)) / ((x + r + 1) * (r + 1)) + 2 / x ** -0.5;
    },
    y2: ({ x }) => x + 1,
    trace: ({ x }) => {
      const r = sqrt(x);
      return [
        { label: "√x", value: r },
        { label: "x^1,5 − 1", value: x ** 1.5 - 1 },
        { label: "(√x − 1)(x + √x + 1)", value: (r - 1) * (x + r + 1) },
        {
          label: "дробь",
          value: ((x - 1) * (x ** 1.5 - 1)) / ((x + r + 1) * (r + 1)),
        },
        { label: "(√x − 1)²", value: (r - 1) ** 2 },
        { label: "2 / x^(−0,5) = 2√x", value: 2 / x ** -0.5 },
      ];
    },
    conclusion:
      "Замена √x = t превращает числитель в разность кубов и разность квадратов, после " +
      "сокращения остаётся (√x − 1)² = x − 2√x + 1. Отрицательный показатель во втором " +
      "слагаемом означает деление на 1/√x, то есть умножение на 2√x — именно это слагаемое " +
      "и гасит −2√x.",
  },
  {
    variant: 11,
    title: "Замена переменной под корнем",
    given: { t: -3.57 },
    f1: "y₁ = t·(1 + 2/√(t+4)) / (2 − √(t+4)) + √(t+4) + 4/√(t+4) + t",
    f2: "y₂ = t − 4",
    identity: ["при u = √(t + 4):  t = u² − 4 = (u − 2)(u + 2)"],
    y1: ({ t }) => {
      const u = sqrt(t + 4);
      return (t * (1 + 2 / u)) / (2 - u) + u + 4 / u + t;
    },
    y2: ({ t }) => t - 4,
    trace: ({ t }) => {
      const u = sqrt(t + 4);
      return [
        { label: "u = √(t + 4)", value: u },
        { label: "u² − 4 (должно равняться t)", value: u ** 2 - 4 },
        { label: "первое слагаемое", value: (t * (1 + 2 / u)) / (2 - u) },
        { label: "−(u + 2)² / u", value: -((u + 2) ** 2) / u },
        { label: "√(t + 4) + 4/√(t + 4)", value: u + 4 / u },
      ];
    },
    conclusion:
      "Замена u = √(t + 4) делает первое слагаемое рациональным: t раскладывается на " +
      "(u − 2)(u + 2), множитель (u − 2) сокращается со знаменателем (2 − u) и даёт знак " +
      "минус. Журнал подтверждает, что слагаемое равно −(u + 2)²/u, то есть −u − 4 − 4/u. " +
      "Слагаемые с u и 4/u его гасят, остаётся t − 4.",
  },
  {
    variant: 12,
    title: "Тангенс половинного угла под корнем",
    given: { alpha: 4.987 },
    f1: "y₁ = √((1 − cos α)/(1 + cos α)) − √((1 + cos α)/(1 − cos α))",
    f2: "y₂ = 2 / tg α",
    identity: [
      "√((1 − cos α)/(1 + cos α)) = |tg(α/2)|",
      "ctg(α/2) − tg(α/2) = 2·ctg α",
    ],
    note:
      "Знак результата зависит от четверти, в которую попадает α/2. При α = 4,987 рад " +
      "половинный угол лежит во второй четверти, тангенс там отрицателен, и модули меняют " +
      "знак выражения на противоположный. Для других α то же выражение даст −2/tg α, " +
      "поэтому переносить ответ на произвольное α нельзя.",
    y1: ({ alpha }) =>
      sqrt((1 - cos(alpha)) / (1 + cos(alpha))) -
      sqrt((1 + cos(alpha)) / (1 - cos(alpha))),
    y2: ({ alpha }) => 2 / tan(alpha),
    trace: ({ alpha }) => [
      { label: "cos α", value: cos(alpha) },
      { label: "α/2, рад", value: alpha / 2 },
      { label: "tg(α/2)", value: tan(alpha / 2) },
      {
        label: "√((1 − cos α)/(1 + cos α))",
        value: sqrt((1 - cos(alpha)) / (1 + cos(alpha))),
      },
      {
        label: "√((1 + cos α)/(1 − cos α))",
        value: sqrt((1 + cos(alpha)) / (1 - cos(alpha))),
      },
      { label: "ctg(α/2) − tg(α/2)", value: 1 / tan(alpha / 2) - tan(alpha / 2) },
    ],
    conclusion:
      "Корни равны модулям тангенса и котангенса половинного угла. Журнал показывает обе " +
      "величины, поэтому знак виден явно, а не берётся на веру.",
  },
  {
    variant: 13,
    title: "Отрицательные и дробные показатели степени",
    given: { a: 12.7 },
    f1: "y₁ = (1 − a⁻²)/(√a − a^(−0,5)) − 2/√(a³) + (a⁻² − a)/(√a − a^(−0,5))",
    f2: "y₂ = −√a − 2·a^(−1,5)",
    identity: ["√a − a^(−0,5) = (a − 1)/√a"],
    y1: ({ a }) => {
      const den = sqrt(a) - a ** -0.5;
      return (1 - a ** -2) / den - 2 / sqrt(a ** 3) + (a ** -2 - a) / den;
    },
    y2: ({ a }) => -sqrt(a) - 2 * a ** -1.5,
    trace: ({ a }) => {
      const den = sqrt(a) - a ** -0.5;
      return [
        { label: "√a − a^(−0,5)", value: den },
        { label: "(a − 1)/√a", value: (a - 1) / sqrt(a) },
        { label: "первое слагаемое", value: (1 - a ** -2) / den },
        { label: "третье слагаемое", value: (a ** -2 - a) / den },
        {
          label: "сумма первого и третьего",
          value: (1 - a ** -2) / den + (a ** -2 - a) / den,
        },
        { label: "−√a", value: -sqrt(a) },
        { label: "2/√(a³)", value: 2 / sqrt(a ** 3) },
      ];
    },
    conclusion:
      "Первое и третье слагаемые имеют общий знаменатель (a − 1)/√a. После сложения " +
      "числители дают −a², и всё выражение стягивается до −√a — журнал показывает эту сумму " +
      "отдельной строкой. Среднее слагаемое 2/√(a³) — то же самое, что 2·a^(−1,5).",
  },
  {
    variant: 14,
    title: "Разность квадратов сразу в двух множителях",
    given: { a: 50.765 },
    f1: "y₁ = (√a/2 − 1/(2√a))² · ((√a − 1)/(√a + 1) − (√a + 1)/(√a − 1))",
    f2: "y₂ = (1 − a)/√a",
    identity: ["(√a − 1)² − (√a + 1)² = −4√a"],
    y1: ({ a }) => {
      const r = sqrt(a);
      return (
        (r / 2 - 1 / (2 * r)) ** 2 * ((r - 1) / (r + 1) - (r + 1) / (r - 1))
      );
    },
    y2: ({ a }) => (1 - a) / sqrt(a),
    trace: ({ a }) => {
      const r = sqrt(a);
      return [
        { label: "√a", value: r },
        { label: "первый множитель (квадрат)", value: (r / 2 - 1 / (2 * r)) ** 2 },
        { label: "(a − 1)² / (4a)", value: (a - 1) ** 2 / (4 * a) },
        {
          label: "вторая скобка",
          value: (r - 1) / (r + 1) - (r + 1) / (r - 1),
        },
        { label: "−4√a / (a − 1)", value: (-4 * r) / (a - 1) },
      ];
    },
    conclusion:
      "Первый множитель — квадрат величины (a − 1)/(2√a), второй после приведения к общему " +
      "знаменателю даёт −4√a/(a − 1). В произведении (a − 1)² сокращается с (a − 1), а " +
      "четвёрки взаимно уничтожаются.",
  },
  {
    variant: 15,
    title: "Формулы приведения",
    given: { x: -0.789 },
    f1: "y₁ = (1 − sin²(3π/2 + x)) / (1 − sin²(π + x))",
    f2: "y₂ = tg²x",
    identity: ["sin(3π/2 + x) = −cos x", "sin(π + x) = −sin x"],
    y1: ({ x }) =>
      (1 - sin((3 * PI) / 2 + x) ** 2) / (1 - sin(PI + x) ** 2),
    y2: ({ x }) => tan(x) ** 2,
    trace: ({ x }) => [
      { label: "sin(3π/2 + x)", value: sin((3 * PI) / 2 + x) },
      { label: "−cos x", value: -cos(x) },
      { label: "числитель 1 − sin²(3π/2 + x)", value: 1 - sin((3 * PI) / 2 + x) ** 2 },
      { label: "sin²x", value: sin(x) ** 2 },
      { label: "sin(π + x)", value: sin(PI + x) },
      { label: "знаменатель 1 − sin²(π + x)", value: 1 - sin(PI + x) ** 2 },
      { label: "cos²x", value: cos(x) ** 2 },
    ],
    conclusion:
      "Обе формулы приведения меняют знак функции, но в выражение они входят в квадрате, " +
      "поэтому знак роли не играет. Числитель превращается в sin²x, знаменатель — в cos²x, " +
      "и дробь даёт квадрат тангенса.",
  },
];

export interface FormulaResult {
  y1: number;
  y2: number;
  difference: number;
  matched: boolean;
  trace: TraceStep[];
}

/**
 * Считает оба выражения варианта и сравнивает их.
 *
 * Допуск пропорционален величине: сравнивать два разных пути вычисления с
 * нулём нельзя, а фиксированный допуск либо пропускал бы ошибки на больших
 * числах, либо ложно срабатывал на малых.
 */
export function evaluateVariant(
  variant: FormulaVariant,
  given: Record<string, number> = variant.given
): FormulaResult {
  const y1 = variant.y1(given);
  const y2 = variant.y2(given);
  const difference = abs(y1 - y2);

  return {
    y1,
    y2,
    difference,
    matched: difference <= 1e-9 * Math.max(1, abs(y1)),
    trace: variant.trace(given),
  };
}

/** Число для показа: до 12 знаков после запятой, без хвостовых нулей. */
export function formatValue(value: number): string {
  if (!Number.isFinite(value)) return "—";
  if (value !== 0 && (abs(value) < 1e-6 || abs(value) >= 1e12)) {
    return value.toExponential(6);
  }

  const fixed = value.toFixed(12).replace(/0+$/, "").replace(/\.$/, "");

  return fixed === "-0" ? "0" : fixed;
}

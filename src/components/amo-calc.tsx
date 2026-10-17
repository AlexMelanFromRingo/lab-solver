"use client";

import { useState } from "react";
import { useLang } from "@/components/lang";
import { tr, type Loc } from "@/lib/i18n";
import { Card, CardBody } from "@/components/ui/card";
import { NumberField, TextAreaField, TextField } from "@/components/ui/field";
import { OutputBlock } from "@/components/ui/output-block";
import { XYPlot } from "@/components/xy-plot";
import type { PlotFigure } from "@/lib/figures";
import { d1, d2, fn1, fn2 } from "@/lib/math/expr";
import { useMounted } from "@/lib/use-mounted";
import {
  cauchy,
  chords,
  combined,
  det,
  dominantOrder,
  gauss,
  inverse,
  iterate,
  lagrange,
  leastSquares,
  mul,
  mulVec,
  newton,
  normInf,
  normalSystem,
  quadrature,
  refineIntegral,
  diffTable,
  simpleIteration,
  toIterForm,
  type Matrix,
} from "@/lib/algorithms/numeric";

const f6 = (v: number) => (Number.isFinite(v) ? Number(v.toPrecision(10)).toString() : String(v));
const fmtRow = (r: number[]) => r.map((v) => f6(v).padStart(14)).join("");
const fmtMat = (m: Matrix) => m.map(fmtRow).join("\n");

function parseNums(s: string): number[] {
  return s
    .replace(/[−–]/g, "-")
    .split(/[\s;]+/)
    .filter(Boolean)
    .map((t) => {
      const v = Number(t.replace(",", "."));
      if (!Number.isFinite(v)) throw new Error(`Не число: «${t}»`);
      return v;
    });
}

function Shell({ title, children }: { title: Loc; children: React.ReactNode }) {
  const { lang } = useLang();
  return (
    <Card>
      <CardBody className="space-y-5 pt-6">
        <h2 className="font-display text-lg font-semibold text-ink">{tr(title, lang)}</h2>
        {children}
      </CardBody>
    </Card>
  );
}

/** Коротка двомовна підписка: t(uk, ru) за поточною мовою. */
function useT() {
  const { lang } = useLang();
  return (uk: string, ruText: string) => (lang === "uk" ? uk : ruText);
}

/** График функции для отделения корня: отрезок [a; b] с запасом по обе стороны, корень — точкой. */
function rootPlot(f: (x: number) => number, a: number, b: number, root?: number, name = "f"): PlotFigure {
  const w = Math.max(b - a, 1e-6);
  const lo = a - 2 * w;
  const hi = b + 2 * w;
  const pts: [number, number][] = [];
  for (let i = 0; i <= 200; i++) {
    const x = lo + ((hi - lo) * i) / 200;
    const y = f(x);
    if (Number.isFinite(y)) pts.push([x, y]);
  }
  return {
    x: { label: "x", unit: "", zero: false },
    y: { label: `${name}(x)`, unit: "", zero: false },
    series: [
      { label: `${name}(x)`, points: pts, markers: false },
      ...(root !== undefined && Number.isFinite(root) ? [{ label: "корінь", points: [[root, 0]] as [number, number][], line: false }] : []),
    ],
  };
}

/** Расчёты мгновенные, поэтому считаются на каждом рендере, без мемоизации. */
function run<T>(fn: () => T): { ok: true; v: T } | { ok: false; error: string } {
  try {
    return { ok: true as const, v: fn() };
  } catch (e) {
    return { ok: false as const, error: (e as Error).message };
  }
}

// ------------------------------------------------------------------- ЛР1

export function SlaeCalc() {
  const t = useT();
  const [aText, setA] = useState("1.5 2.3 -3.7\n2.8 3.4 5.8\n1.2 7.3 -2.3");
  const [bText, setB] = useState("4.5 -3.2 5.6");
  const [eps, setEps] = useState("0.0001");
  const r = run(() => {
    const rows = aText.trim().split("\n").map(parseNums);
    const b = parseNums(bText);
    const n = rows.length;
    if (rows.some((x) => x.length !== n) || b.length !== n) throw new Error(t("Потрібна квадратна матриця n×n і вектор із n чисел","Нужна квадратная матрица n×n и вектор из n чисел"));
    const d = det(rows);
    const inv = inverse(rows);
    const g = gauss(rows, b);
    const dom = dominantOrder(rows, b);
    const base = dom ?? normalSystem(rows, b);
    const form = toIterForm(base.a, base.b);
    const e = Number(eps);
    return {
      rows,
      b,
      d,
      inv,
      check: mul(rows, inv),
      xInv: mulVec(inv, b),
      g,
      dom,
      form,
      norm: normInf(form.c),
      jacobi: dom ? iterate(form.c, form.d, e, false) : null,
      seidel: iterate(form.c, form.d, e, true),
    };
  });

  return (
    <Shell title={{ uk: "Розв’язання системи", ru: "Решение системы" }}>
      <div className="grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <TextAreaField label={t("Матриця A — рядки через Enter","Матрица A — строки через Enter")} value={aText} onChange={(e) => setA(e.target.value)} />
        <div className="space-y-4">
          <TextField label="Вектор B" value={bText} onChange={(e) => setB(e.target.value)} />
          <TextField label={t("Точність ітерацій ε","Точность итераций ε")} value={eps} onChange={(e) => setEps(e.target.value)} />
        </div>
      </div>
      {r.ok ? (
        <div className="space-y-4">
          <OutputBlock label={t(`Обернена матриця A⁻¹ (det A = ${f6(r.v.d)})`,`Обратная матрица A⁻¹ (det A = ${f6(r.v.d)})`)} value={fmtMat(r.v.inv)} wrap={false} />
          <OutputBlock label={t("Перевірка A·A⁻¹ = E","Проверка A·A⁻¹ = E")} value={fmtMat(r.v.check)} wrap={false} />
          <OutputBlock label="X = A⁻¹·B" value={fmtRow(r.v.xInv)} wrap={false} />
          <OutputBlock
            label={t("Метод Гаусса: розширена матриця після кожного кроку прямого ходу","Метод Гаусса: расширенная матрица после каждого шага прямого хода")}
            value={r.v.g.steps.map((m, i) => `${t("крок","шаг")} ${i}\n${fmtMat(m)}`).join("\n\n") + `\n\n${t("зворотний хід","обратный ход")}: X =${fmtRow(r.v.g.x)}`}
            wrap={false}
          />
          <OutputBlock
            label={t("Ітераційні методи","Итерационные методы")}
            value={[
              r.v.dom
                ? t(`Діагональне переважання: рівняння в порядку ${r.v.dom.rows.map((i) => i + 1).join(", ")}, невідомі в порядку ${r.v.dom.cols.map((i) => `x${i + 1}`).join(", ")}`, `Диагональное преобладание: уравнения в порядке ${r.v.dom.rows.map((i) => i + 1).join(", ")}, неизвестные в порядке ${r.v.dom.cols.map((i) => `x${i + 1}`).join(", ")}`)
                : t("Діагонального переважання немає за жодної перестановки. Для Зейделя систему замінено нормальною AᵀA·x = Aᵀb (вона симетрична і додатно визначена — Зейдель збігається); прості ітерації збіжність не гарантують.","Диагонального преобладания нет ни при какой перестановке. Для Зейделя система заменена нормальной AᵀA·x = Aᵀb (она симметрична и положительно определена — Зейдель сходится); простые итерации сходимость не гарантируют."),
              t(`Вигляд x = C·x + d, ‖C‖ = ${f6(r.v.norm)}${r.v.norm < 1 ? " < 1 — ітерації збігаються" : " ≥ 1 — достатня умова не виконана"}`,`Вид x = C·x + d, ‖C‖ = ${f6(r.v.norm)}${r.v.norm < 1 ? " < 1 — итерации сходятся" : " ≥ 1 — достаточное условие не выполнено"}`),
              "C =",
              fmtMat(r.v.form.c),
              `d =${fmtRow(r.v.form.d)}`,
            ].join("\n")}
            wrap={false}
          />
          {r.v.jacobi && (
            <OutputBlock
              label={t(`Прості ітерації, кроків: ${r.v.jacobi.length - 1}`,`Простые итерации, шагов: ${r.v.jacobi.length - 1}`)}
              value={r.v.jacobi.map((s) => `k=${String(s.k).padStart(3)}${fmtRow(s.x)}   Δ=${Number.isNaN(s.delta) ? "—" : s.delta.toExponential(3)}`).join("\n")}
              wrap={false}
            />
          )}
          <OutputBlock
            label={t(`Зейдель, кроків: ${r.v.seidel.length - 1}${r.v.dom?.cols.some((c, i) => c !== i) ? " (x — у переставленому порядку невідомих)" : ""}`,`Зейдель, шагов: ${r.v.seidel.length - 1}${r.v.dom?.cols.some((c, i) => c !== i) ? " (x — в переставленном порядке неизвестных)" : ""}`)}
            value={r.v.seidel.map((s) => `k=${String(s.k).padStart(3)}${fmtRow(s.x)}   Δ=${Number.isNaN(s.delta) ? "—" : s.delta.toExponential(3)}`).join("\n")}
            wrap={false}
          />
        </div>
      ) : (
        <p className="text-sm text-codes">{r.error}</p>
      )}
    </Shell>
  );
}

// ------------------------------------------------------------------- ЛР2

export function IterationCalc() {
  const t = useT();
  const [src, setSrc] = useState("1.8x^2 - sin(10x)");
  const [a, setA] = useState("-0.6");
  const [b, setB] = useState("-0.5");
  const [x0, setX0] = useState("-0.6");
  const [eps, setEps] = useState("0.001");
  const r = run(() => {
    const f = fn1(src);
    return { ...simpleIteration(f, (x) => d1(f, x), Number(a), Number(b), Number(x0), Number(eps)), f };
  });
  return (
    <Shell title={{ uk: "Проста ітерація: g(x) = x − f(x)/k", ru: "Простая итерация: g(x) = x − f(x)/k" }}>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="f(x)" hint={t("ln — натуральний, log10 — десятковий","ln — натуральный, log10 — десятичный")} value={src} onChange={(e) => setSrc(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <TextField label={t("Відрізок: a","Отрезок: a")} value={a} onChange={(e) => setA(e.target.value)} />
          <TextField label="b" value={b} onChange={(e) => setB(e.target.value)} />
          <TextField label="x₀" value={x0} onChange={(e) => setX0(e.target.value)} />
          <TextField label={t("ε (відносна)","ε (относительная)")} value={eps} onChange={(e) => setEps(e.target.value)} />
        </div>
      </div>
      {r.ok ? (
        <OutputBlock
          label={t(`k = round(max f′/2) = ${r.v.k}; ${r.v.converged ? `корінь ${f6(r.v.root)}, кроків: ${r.v.steps.length}` : "ітерації не збіглися — уточніть відрізок і x₀"}`,`k = round(max f′/2) = ${r.v.k}; ${r.v.converged ? `корень ${f6(r.v.root)}, шагов: ${r.v.steps.length}` : "итерации не сошлись — уточните отрезок и x₀"}`)}
          value={r.v.steps.map((s) => `${String(s.i).padStart(3)}  x = ${f6(s.x).padEnd(16)} x₁ = ${f6(s.next).padEnd(16)} |x₁−x|/|x| = ${s.delta.toExponential(3)}`).join("\n")}
          wrap={false}
        />
      ) : null}
      {r.ok ? (
        <XYPlot fig={rootPlot(r.v.f, Number(a), Number(b), r.v.converged ? r.v.root : undefined)} title={`Відокремлення кореня: графік f(x) = ${src} біля [${a}; ${b}]`} />
      ) : (
        <p className="text-sm text-codes">{r.error}</p>
      )}
    </Shell>
  );
}

// ------------------------------------------------------------------- МК1

export function RootsCalc() {
  const t = useT();
  const [src, setSrc] = useState("x^3 - 0.7x^2 + 0.75");
  const [a, setA] = useState("-0.8");
  const [b, setB] = useState("-0.7");
  const [eps, setEps] = useState("0.001");
  const r = run(() => {
    const f = fn1(src);
    const fp = (x: number) => d1(f, x);
    const fpp = (x: number) => d2(f, x);
    const [A, B, e] = [Number(a), Number(b), Number(eps)];
    if (f(A) * f(B) > 0) throw new Error(t(`На [${A}; ${B}] немає зміни знака: F(a)·F(b) > 0`,`На [${A}; ${B}] нет смены знака: F(a)·F(b) > 0`));
    return {
      fa: f(A),
      fb: f(B),
      n: newton(f, fp, fpp, A, B, e),
      c: chords(f, fpp, A, B, e),
      k: combined(f, fp, fpp, A, B, e),
      fppa: fpp(A),
      fppb: fpp(B),
      f,
    };
  });
  return (
    <Shell title={{ uk: "Ньютон, хорди, комбінований метод", ru: "Ньютон, хорды, комбинированный метод" }}>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="F(x)" value={src} onChange={(e) => setSrc(e.target.value)} />
        <div className="grid grid-cols-3 gap-3">
          <TextField label="a" value={a} onChange={(e) => setA(e.target.value)} />
          <TextField label="b" value={b} onChange={(e) => setB(e.target.value)} />
          <TextField label="ε" value={eps} onChange={(e) => setEps(e.target.value)} />
        </div>
      </div>
      {r.ok ? (
        <div className="space-y-4">
          <OutputBlock
            label={t("Вибір початкової точки","Выбор начальной точки")}
            value={t(`F(a) = ${f6(r.v.fa)}, F(b) = ${f6(r.v.fb)}; F″(a) = ${f6(r.v.fppa)}, F″(b) = ${f6(r.v.fppb)}\nНьютон стартує з кінця, де F·F″ > 0: x₀ = ${f6(r.v.n.x0)}; у хорд цей кінець нерухомий.`,`F(a) = ${f6(r.v.fa)}, F(b) = ${f6(r.v.fb)}; F″(a) = ${f6(r.v.fppa)}, F″(b) = ${f6(r.v.fppb)}\nНьютон стартует из конца, где F·F″ > 0: x₀ = ${f6(r.v.n.x0)}; у хорд этот конец неподвижен.`)}
          />
          <OutputBlock
            label={`Ньютон: x = ${f6(r.v.n.root)}`}
            value={r.v.n.steps.map((s) => `x${s.i} = ${f6(s.next).padEnd(16)} Δ = ${s.delta.toExponential(4)}`).join("\n")}
            wrap={false}
          />
          <OutputBlock
            label={t(`Хорди (нерухомий кінець ${f6(r.v.c.fixed)}): x = ${f6(r.v.c.root)}`,`Хорды (неподвижный конец ${f6(r.v.c.fixed)}): x = ${f6(r.v.c.root)}`)}
            value={r.v.c.steps.map((s) => `x${s.i} = ${f6(s.next).padEnd(16)} Δ = ${s.delta.toExponential(4)}`).join("\n")}
            wrap={false}
          />
          <OutputBlock
            label={t(`Комбінований: x ≈ ${f6(r.v.k.root)}`,`Комбинированный: x ≈ ${f6(r.v.k.root)}`)}
            value={r.v.k.steps.map((s) => t(`${s.i}: [${f6(s.a)}; ${f6(s.b)}], довжина ${s.len.toExponential(4)}`,`${s.i}: [${f6(s.a)}; ${f6(s.b)}], длина ${s.len.toExponential(4)}`)).join("\n")}
            wrap={false}
          />
          <XYPlot fig={rootPlot(r.v.f, Number(a), Number(b), r.v.n.root, "F")} title={`Графік F(x) = ${src} і корінь на [${a}; ${b}]`} />
        </div>
      ) : (
        <p className="text-sm text-codes">{r.error}</p>
      )}
    </Shell>
  );
}

// ---------------------------------------------------------------- ЛР3–4

export function ApproxCalc() {
  const t = useT();
  const [xs, setXs] = useState("1000 1010 1020 1030 1040 1050");
  const [ys, setYs] = useState("3.0 3.0 3.01 3.012 3.017 3.021");
  const [x0, setX0] = useState("1025");
  const [deg, setDeg] = useState(1);
  const r = run(() => {
    const X = parseNums(xs);
    const Y = parseNums(ys);
    if (X.length !== Y.length || X.length < 2) throw new Error(t("Вузлів x і значень y має бути порівну, не менше двох","Узлов x и значений y должно быть поровну, не меньше двух"));
    const L = lagrange(X, Y);
    const q = leastSquares(X, Y, Math.min(deg, X.length - 1));
    const poly = (c: number[]) => c.map((v, i) => `${v >= 0 && i ? "+ " : v < 0 ? "− " : ""}${f6(Math.abs(v))}${i ? `·x${i > 1 ? `^${i}` : ""}` : ""}`).join(" ");
    const lo = Math.min(...X);
    const hi = Math.max(...X);
    const grid = Array.from({ length: 121 }, (_, i) => lo + ((hi - lo) * i) / 120);
    const qf = (x: number) => q.coef.reduce((s, c, i) => s + c * x ** i, 0);
    const plot: PlotFigure = {
      x: { label: "x", unit: "", zero: false },
      y: { label: "y", unit: "", zero: false },
      series: [
        { label: "вузли", points: X.map((x, i) => [x, Y[i]] as [number, number]), line: false },
        { label: "Лагранж L(x)", points: grid.map((x) => [x, L.at(x)] as [number, number]), markers: false },
        { label: `МНК, степінь ${Math.min(deg, X.length - 1)}`, points: grid.map((x) => [x, qf(x)] as [number, number]), markers: false, dashed: true },
      ],
    };
    return { L, at: L.at(Number(x0)), lp: poly(L.coef), q, qp: poly(q.coef), qAt: qf(Number(x0)), plot };
  });
  return (
    <Shell title={{ uk: "Інтерполяція Лагранжа і метод найменших квадратів", ru: "Интерполяция Лагранжа и метод наименьших квадратов" }}>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label={t("Вузли x","Узлы x")} value={xs} onChange={(e) => setXs(e.target.value)} />
        <TextField label={t("Значення y","Значения y")} value={ys} onChange={(e) => setYs(e.target.value)} />
        <TextField label={t("Точка x₀","Точка x₀")} value={x0} onChange={(e) => setX0(e.target.value)} />
        <NumberField label={t("Степінь многочлена МНК","Степень многочлена МНК")} min={1} max={5} value={deg} onChange={(e) => setDeg(Number(e.target.value))} />
      </div>
      {r.ok ? (
        <div className="space-y-4">
          <OutputBlock label={t(`Многочлен Лагранжа, L(${x0}) = ${f6(r.v.at)}`,`Многочлен Лагранжа, L(${x0}) = ${f6(r.v.at)}`)} value={`L(x) = ${r.v.lp}`} />
          <OutputBlock label={t(`МНК, степінь ${deg}: сума квадратів відхилень ${f6(r.v.q.residual)}, значення в x₀ = ${f6(r.v.qAt)}`,`МНК, степень ${deg}: сумма квадратов отклонений ${f6(r.v.q.residual)}, значение в x₀ = ${f6(r.v.qAt)}`)} value={`P(x) = ${r.v.qp}`} />
          <XYPlot fig={r.v.plot} title="Вузли інтерполяції, многочлен Лагранжа і наближення МНК" />
        </div>
      ) : (
        <p className="text-sm text-codes">{r.error}</p>
      )}
      <p className="text-xs text-ink-faint">
        {t("При вузлах близько 1000 коефіцієнти розгорнутого многочлена величезні (як у Maple з Digits = 20), а значення рахується за базисними многочленами — без втрати точності.","При узлах около 1000 коэффициенты развёрнутого многочлена огромны (как у Maple с Digits = 20), а значение считается по базисным многочленам — без потери точности.")}
      </p>
    </Shell>
  );
}

// ------------------------------------------------------------------- ЛР5

export function CauchyCalc() {
  const t = useT();
  const [src, setSrc] = useState("x*y + x*cos(y)");
  const [a, setA] = useState("0");
  const [b, setB] = useState("1");
  const [h, setH] = useState("0.1");
  const [y0, setY0] = useState("0");
  const [eps, setEps] = useState("0.0001");
  const r = run(() => {
    const f = fn2(src);
    if (Number(h) <= 0 || (Number(b) - Number(a)) / Number(h) > 2000) throw new Error(t("Крок h надто малий або не додатний","Шаг h слишком мал или не положителен"));
    return cauchy(f, Number(a), Number(b), Number(h), Number(y0), Number(eps));
  });
  return (
    <Shell title={{ uk: "Задача Коші y′ = f(x, y), y(a) = y₀", ru: "Задача Коши y′ = f(x, y), y(a) = y₀" }}>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="f(x, y)" value={src} onChange={(e) => setSrc(e.target.value)} />
        <div className="grid grid-cols-3 gap-3">
          <TextField label="a" value={a} onChange={(e) => setA(e.target.value)} />
          <TextField label="b" value={b} onChange={(e) => setB(e.target.value)} />
          <TextField label="h" value={h} onChange={(e) => setH(e.target.value)} />
          <TextField label="y₀" value={y0} onChange={(e) => setY0(e.target.value)} />
          <TextField label={t("ε уточнення","ε уточнения")} value={eps} onChange={(e) => setEps(e.target.value)} />
        </div>
      </div>
      {r.ok ? (
        <OutputBlock
          label={t("Ейлер · Ейлер–Коші з уточненням · Рунге–Кутта 4-го порядку","Эйлер · Эйлер–Коши с уточнением · Рунге–Кутта 4-го порядка")}
          value={[
            t(`${"x".padStart(8)}${"Ейлер".padStart(16)}${"Ейлер–Коші".padStart(16)}${"Рунге–Кутта".padStart(16)}`,`${"x".padStart(8)}${"Эйлер".padStart(16)}${"Эйлер–Коши".padStart(16)}${"Рунге–Кутта".padStart(16)}`),
            ...r.v.map((row) => `${f6(row.x).padStart(8)}${f6(row.euler).padStart(16)}${f6(row.eulerCauchy).padStart(16)}${f6(row.rk4).padStart(16)}`),
          ].join("\n")}
          wrap={false}
        />
      ) : null}
      {r.ok ? (
        <XYPlot
          fig={{
            x: { label: "x", unit: "", zero: false },
            y: { label: "y", unit: "", zero: false },
            series: [
              { label: "Ейлер", points: r.v.map((row) => [row.x, row.euler] as [number, number]) },
              { label: "Ейлер–Коші", points: r.v.map((row) => [row.x, row.eulerCauchy] as [number, number]), dashed: true },
              { label: "Рунге–Кутта", points: r.v.map((row) => [row.x, row.rk4] as [number, number]) },
            ],
          }}
          title={`Розв'язки задачі Коші y′ = ${src}, y(${a}) = ${y0}`}
        />
      ) : (
        <p className="text-sm text-codes">{r.error}</p>
      )}
    </Shell>
  );
}

export function QuadCalc() {
  const mounted = useMounted();
  const [src, setSrc] = useState("sqrt(x)*ln(x)");
  const [a, setA] = useState("1");
  const [b, setB] = useState("3");
  const [nn, setNn] = useState("100");
  const [step, setStep] = useState("0.5");
  const r = run(() => {
    const f = fn1(src);
    const A = Number(a);
    const B = Number(b);
    const n = Number(nn);
    if (!(B > A)) throw new Error("Потрібно b > a");
    if (!Number.isInteger(n) || n < 2 || n > 100000) throw new Error("n — ціле від 2 до 100000");
    const exact = refineIntegral(f, A, B);
    const dt = Number(step);
    if (!(dt > 0) || (B - A) / dt > 200) throw new Error("Крок таблиці похідних — додатний, не надто малий");
    return { rows: quadrature(f, A, B, n, exact), exact, diff: diffTable(f, A, B, dt) };
  });
  return (
    <Shell title="Чисельне інтегрування та диференціювання">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="f(x)" value={src} onChange={(e) => setSrc(e.target.value)} />
        <div className="grid grid-cols-4 gap-3">
          <TextField label="a" value={a} onChange={(e) => setA(e.target.value)} />
          <TextField label="b" value={b} onChange={(e) => setB(e.target.value)} />
          <TextField label="n" value={nn} onChange={(e) => setNn(e.target.value)} />
          <TextField label="крок таблиці" value={step} onChange={(e) => setStep(e.target.value)} />
        </div>
      </div>
      {!r.ok ? (
        <p className="text-sm text-codes">{r.error}</p>
      ) : mounted ? (
        <>
          <OutputBlock
            label={`Інтеграл: методи пакета student (n = ${nn})`}
            value={[
              `${"Метод".padEnd(32)}${"Значення".padStart(16)}${"Похибка".padStart(18)}`,
              ...r.v.rows.map((row) => `${row.name.padEnd(32)}${f6(row.value).padStart(16)}${(Number.isFinite(row.error) ? row.error.toExponential(3) : String(row.error)).padStart(18)}`),
              "",
              `Точне значення (int): ${f6(r.v.exact)}`,
            ].join("\n")}
            wrap={false}
          />
          <OutputBlock
            label="Похідні f′ і f″ на вузлах (diff)"
            value={[
              `${"x".padStart(8)}${"f(x)".padStart(16)}${"f'(x)".padStart(16)}${"f''(x)".padStart(16)}`,
              ...r.v.diff.map((row) => `${f6(row.x).padStart(8)}${f6(row.f).padStart(16)}${f6(row.d1).padStart(16)}${f6(row.d2).padStart(16)}`),
            ].join("\n")}
            wrap={false}
          />
          <XYPlot
            fig={{
              x: { label: "x", unit: "", zero: false },
              y: { label: "", unit: "", zero: false },
              series: [
                { label: "f(x)", points: r.v.diff.map((row) => [row.x, row.f] as [number, number]) },
                { label: "f'(x)", points: r.v.diff.map((row) => [row.x, row.d1] as [number, number]), dashed: true },
              ],
            }}
            title={`f(x) = ${src} і її похідна на [${a}, ${b}]`}
          />
        </>
      ) : null}
    </Shell>
  );
}

"use client";

import { useState } from "react";
import { Card, CardBody } from "@/components/ui/card";
import { TextAreaField, TextField } from "@/components/ui/field";
import { OutputBlock } from "@/components/ui/output-block";
import { abs, argDeg, gamma, gapEstimate, lab1, lab2, lab2Measured, lab3, magnet, twoBranches, type Branch, type C } from "@/lib/algorithms/circuits";
import { lab3Figures, lab3Mode, magnetPlots, rgr1Figure, rgr2Figure } from "@/lib/algorithms/circuits-figures";
import { PhasorDiagram } from "@/components/phasor-diagram";
import { XYPlot } from "@/components/xy-plot";

const n = (s: string) => Number(s.replace(",", ".").replace(/[−–]/g, "-"));
const f = (v: number, d = 3) => (Number.isFinite(v) ? Number(v.toFixed(d)).toString() : "—");
const pct = (v: number) => (Number.isFinite(v) ? `${v.toFixed(2)} %` : "—");

function Fields({ fields, values, set }: { fields: [string, string][]; values: Record<string, string>; set: (k: string, v: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {fields.map(([k, label]) => (
        <TextField key={k} label={label} value={values[k]} onChange={(e) => set(k, e.target.value)} />
      ))}
    </div>
  );
}

function useForm(init: Record<string, string>) {
  const [v, setV] = useState(init);
  return [v, (k: string, val: string) => setV((x) => ({ ...x, [k]: val }))] as const;
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardBody className="space-y-5 pt-6">
        <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
        {children}
      </CardBody>
    </Card>
  );
}

const row = (name: string, cells: string[]) => name.padEnd(16) + cells.map((c) => c.padStart(11)).join("");

// -------------------------------------------------------------------- ЛР1

export function Lab1Calc() {
  const [v, set] = useForm({ r1: "30", r2: "60", r3: "100", u: "100", uab: "", ubv: "", i1: "", i2: "", i3: "", p: "" });
  const r = lab1({ r1: n(v.r1), r2: n(v.r2), r3: n(v.r3), u: n(v.u) });
  const meas = { uab: n(v.uab), ubv: n(v.ubv), i1: n(v.i1), i2: n(v.i2), i3: n(v.i3), p: n(v.p) };
  const has = (x: number) => v.uab !== "" && Number.isFinite(x);
  const calc = [n(v.u), r.uab, r.ubv, r.sumU, r.i1, r.i2, r.i3, r.sumI, r.pSource];
  const m = [n(v.u), meas.uab, meas.ubv, meas.uab + meas.ubv, meas.i1, meas.i2, meas.i3, meas.i2 + meas.i3, meas.p];
  return (
    <Shell title="Расчёт по сопротивлениям из табл. 1 и сравнение с измерениями">
      <Fields
        fields={[["r1", "R1, Ом"], ["r2", "R2, Ом"], ["r3", "R3, Ом"], ["u", "U, В"], ["uab", "Uаб изм., В"], ["ubv", "Uбв изм., В"], ["i1", "I1 изм., А"], ["i2", "I2 изм., А"], ["i3", "I3 изм., А"], ["p", "P изм., Вт"]]}
        values={v}
        set={set}
      />
      <OutputBlock
        label={`Rе = R1 + R2·R3/(R2 + R3) = ${f(r.re)} Ом; баланс мощностей: Pдж = ${f(r.pSource)} Вт, Pн = ${f(r.pLoad)} Вт`}
        value={[
          row("", ["U", "Uаб", "Uбв", "Uаб+Uбв", "I1", "I2", "I3", "I2+I3", "P"]),
          row("Обчислено", calc.map((x) => f(x))),
          ...(has(meas.uab) ? [row("Виміряно", m.map((x) => f(x))), row("Розбіжність", calc.map((c, i) => (i === 0 ? "" : pct(gamma(c, m[i])))))] : []),
        ].join("\n")}
        wrap={false}
      />
    </Shell>
  );
}

// -------------------------------------------------------------------- ЛР2

export function Lab2Calc() {
  const [v, set] = useForm({ u1: "130", r1: "30", r2: "110", r3: "55", r4: "15", uxx: "65", ikz: "1.8", i: "1.09", p: "30" });
  const c = lab2({ u1: n(v.u1), r1: n(v.r1), r2: n(v.r2), r3: n(v.r3), r4: n(v.r4) });
  const m = lab2Measured(n(v.uxx), n(v.ikz), n(v.i), n(v.p));
  const calc = [Math.abs(c.uxx), c.rin, c.ikz, c.i, c.p, c.eta];
  const meas = [n(v.uxx), m.rin, n(v.ikz), n(v.i), n(v.p), m.eta];
  return (
    <Shell title="Метод эквивалентного генератора (табл. 2)">
      <Fields
        fields={[["u1", "U1, В"], ["r1", "R1, Ом"], ["r2", "R2, Ом"], ["r3", "R3, Ом"], ["r4", "R4, Ом"], ["uxx", "Uxx изм., В"], ["ikz", "Iкз изм., А"], ["i", "I изм., А"], ["p", "P изм., Вт"]]}
        values={v}
        set={set}
      />
      <OutputBlock
        label="Таблиця 2"
        value={[
          row("", ["Uxx, В", "Rвх, Ом", "Iкз, А", "I, А", "P, Вт", "η, %"]),
          row("Виміряно", meas.map((x) => f(x, 2))),
          row("Обчислено", calc.map((x) => f(x, 2))),
          row("Розбіжність", calc.map((x, i) => pct(gamma(x, meas[i])))),
        ].join("\n")}
        wrap={false}
      />
      <p className="text-xs leading-relaxed text-ink-faint">
        Uxx = U1·(R2/(R2+R4) − R1/(R1+R3)), Rвх = R3‖R1 + R4‖R2, Iкз = Uxx/Rвх, в согласованном режиме Rн = Rвх: I = Uxx/(2Rвх),
        P = I²Rвх, η = 50 %. Измеренные Rвх = Uxx/Iкз и η = P/(Uxx·I). Сопротивления — номиналы с корпусов реостатов;
        измерения по умолчанию — из образца отчёта.
      </p>
    </Shell>
  );
}

// -------------------------------------------------------------------- ЛР3

export function Lab3Calc() {
  const [text, setText] = useState("100 1.9 0 80 215 212\n100 1.35 46 60 160 85\n100 1.33 -42 59 158 221");
  let out: string;
  let figs: { mode: string; f: ReturnType<typeof lab3Figures> }[] = [];
  try {
    const rows = text
      .trim()
      .split("\n")
      .map((l) => l.trim().split(/\s+/).map(n));
    if (rows.some((r) => r.length < 6 || r.some((x) => !Number.isFinite(x)))) throw new Error("В каждой строке шесть чисел: U I φ UR Uк UC");
    const res = rows.map((r) => lab3({ u: r[0], i: r[1], phiDeg: r[2], ur: r[3], uk: r[4], uc: r[5] }));
    figs = res.map((x, i) => ({ mode: lab3Mode(rows[i][2]), f: lab3Figures(lab3Mode(rows[i][2]) === "XL = XC", { ...x, i: rows[i][1], ur: rows[i][3], uc: rows[i][5] }) }));
    out = [
      row("№", ["R", "Rр", "Rк", "Zк", "XL", "XC", "Z", "URк", "UL", "P", "Q", "S"]),
      ...res.map((x, i) => row(String(i + 1), [x.R, x.rp, x.rk, x.zk, x.xl, x.xc, x.z, x.urk, x.ul, x.p, x.q, x.s].map((y) => f(y, 2)))),
    ].join("\n");
  } catch (e) {
    out = (e as Error).message;
  }
  return (
    <Shell title="Таблица 2 по измерениям таблицы 1">
      <TextAreaField label="Строки табл. 1: U, В · I, А · φ, град · UR · Uк · UC" value={text} onChange={(e) => setText(e.target.value)} />
      <OutputBlock label="Таблиця 2 (Ом, В, Вт, вар, ВА)" value={out} wrap={false} />
      {figs.map(({ mode, f: g }, k) => (
        <div key={k} className="space-y-3">
          <h3 className="text-sm font-medium text-ink-dim">
            Вимір {k + 1}: {mode}
          </h3>
          <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
            <PhasorDiagram fig={g.vector} title={`Векторна діаграма, вимір ${k + 1} (${mode})`} />
            <div className="space-y-4">
              <PhasorDiagram fig={g.z} title={`Трикутник опорів, вимір ${k + 1}`} />
              <PhasorDiagram fig={g.s} title={`Трикутник потужностей, вимір ${k + 1}`} />
            </div>
          </div>
        </div>
      ))}
      <p className="text-xs leading-relaxed text-ink-faint">
        P = UIcos φ, R = P/I², Rр = UR/I, Zк = Uк/I, Rк = R − Rр, XL = √(Zк² − Rк²), XC = UC/I, Z = U/I, URк = IRк, UL = IXL,
        Q = UIsin φ, S = UI. Числа по умолчанию — измерения из образца отчёта. Диаграмма строится по току, как в образце:
        UR и URк вдоль I, UL вверх, UC вниз, U замыкает цепочку, Uк — от начала URк к концу UL. Режим подписан по φ: резонанс
        в работе добиваются по φ = 0. Масштаб mU, mI — под диаграммой, клетка — 1 см; выгрузка SVG/PNG сохраняет его в Word.
      </p>
    </Shell>
  );
}

// -------------------------------------------------------------------- ЛР5

export function MagnetCalc() {
  const [v, set] = useForm({ wn: "1613", wv: "10", c: "0.1", a: "117.5", b: "126.5", cc: "30.5", s: "7.32e-4", delta: "1.6" });
  const [text, setText] = useState("0.1 27.5 9\n0.2 39 19\n0.4 48 33\n0.6 53 43\n0.8 55 50\n1.0 56.5 54");
  const l = (2 * (n(v.a) + n(v.b) - 2 * n(v.cc))) / 1000;
  let out: string;
  let plots: ReturnType<typeof magnetPlots> | null = null;
  let gaps: number[] = [];
  try {
    const rows = text
      .trim()
      .split("\n")
      .map((x) => x.trim().split(/\s+/).map(n));
    const base = { wn: n(v.wn), wv: n(v.wv), c: n(v.c), l, s: n(v.s) };
    const calc = (gap: boolean) => rows.map((r) => magnet({ ...base, delta: gap ? n(v.delta) / 1000 : 0 }, r[0], gap ? r[2] : r[1]));
    const table = (gap: boolean) =>
      calc(gap).map((x, i) =>
        row(String(i + 1), [x.phi * 1e4, x.b, gap ? x.h0 / 1e5 : NaN, x.hst, x.mua * 1e4, x.mur, x.rst / 1e5, gap ? x.r0 / 1e6 : NaN, x.r / 1e5].map((y) => f(y, 3))),
      );
    plots = magnetPlots(calc(false), calc(true), n(v.delta));
    gaps = gapEstimate(
      base,
      rows.map((r) => ({ i: r[0], n: r[1] })),
      rows.map((r) => ({ i: r[0], n: r[2] })),
    ).map((d) => d * 1000);
    const head = row("№", ["Φ·10⁻⁴", "B, Тл", "H0·10⁵", "Hст", "μa·10⁻⁴", "μr", "Rмст·10⁵", "Rм0·10⁶", "Rм·10⁵"]);
    out = ["Без проміжку", head, ...table(false), "", `Із проміжком δ = ${v.delta} мм`, head, ...table(true)].join("\n");
  } catch (e) {
    out = (e as Error).message;
  }
  return (
    <Shell title="Таблица 1.2 по показаниям миливеберметра">
      <Fields
        fields={[["wn", "Wн, витков"], ["wv", "Wв, витков"], ["c", "C, мВб/дел."], ["s", "S, м²"], ["a", "a, мм"], ["b", "b, мм"], ["cc", "c, мм"], ["delta", "δ, мм"]]}
        values={v}
        set={set}
      />
      <TextAreaField label="Строки: Iн, А · N без зазора · N с зазором (деления)" value={text} onChange={(e) => setText(e.target.value)} />
      <OutputBlock label={`ℓст = 2(a + b − 2c) = ${f(l, 4)} м`} value={out} wrap={false} />
      {gaps.some(Number.isFinite) && (
        <p className="text-sm leading-relaxed text-ink-dim">
          Проверка δ: сталь одна и та же, поэтому точки с промежутком должны лечь на кривую B(Hст) без промежутка. Зазор, при
          котором это выполняется, по строкам: {gaps.map((d) => (Number.isFinite(d) ? `${f(d, 2)} мм` : "—")).join("; ")} — в
          среднем {f(gaps.filter(Number.isFinite).reduce((a, b) => a + b, 0) / gaps.filter(Number.isFinite).length, 2)} мм (в
          поле — {v.delta} мм).
        </p>
      )}
      {plots && (plots.dropped.noGap.length > 0 || plots.dropped.gap.length > 0) && (
        <p className="text-sm leading-relaxed text-ink-dim">
          Hст ≤ 0 в строках {[...plots.dropped.noGap.map((i) => `${i} без промежутка`), ...plots.dropped.gap.map((i) => `${i} с промежутком`)].join(", ")}: H0·δ
          больше Wн·Iн, то есть такой зазор с этими показаниями не сходится (проверьте δ — в опыте две прокладки, в мм). На
          графиках эти точки не показаны.
        </p>
      )}
      {plots && (
        <div className="grid gap-4 xl:grid-cols-2">
          <XYPlot fig={plots.b} title="Крива намагнічування B(Hст)" />
          <XYPlot fig={plots.mu} title="Магнітна проникність μa(Hст)" />
          <XYPlot fig={plots.r} title="Магнітний опір Rм(Hст) = Rмст + Rм0" />
        </div>
      )}
    </Shell>
  );
}

// -------------------------------------------------------------------- РГР

const cstr = (c: C) => `${f(c.re, 3)} ${c.im < 0 ? "−" : "+"} j${f(Math.abs(c.im), 3)} = ${f(abs(c), 3)}·e^(j${f(argDeg(c), 2)}°)`;

export function RgrCalc() {
  const [t1, set1] = useForm({ ur: "100", ul: "100", uc: "100", u: "", i: "1" });
  const [t2, set2] = useForm({ u: "20", r1: "4", xl1: "5", xc1: "0", r2: "0", xl2: "0", xc2: "3" });
  const known = ["ur", "ul", "uc", "u"].filter((k) => t1[k] !== "");
  let res1: string;
  /** Показания для векторной диаграммы; при двух корнях — первый. */
  let sol1: [number, number, number] | null = null;
  if (known.length !== 3) res1 = "Оставьте пустым ровно одно поле — неизвестное показание.";
  else {
    const [ur, ul, uc, u] = [n(t1.ur), n(t1.ul), n(t1.uc), n(t1.u)];
    if (t1.u === "") {
      res1 = `U = √(UR² + (UL − UC)²) = ${f(Math.sqrt(ur ** 2 + (ul - uc) ** 2), 2)} В`;
      sol1 = [ur, ul, uc];
    } else if (t1.ur === "") {
      const r = Math.sqrt(u ** 2 - (ul - uc) ** 2);
      res1 = `UR = √(U² − (UL − UC)²) = ${f(r, 2)} В`;
      sol1 = [r, ul, uc];
    } else if (t1.ul === "") {
      const d = Math.sqrt(u ** 2 - ur ** 2);
      res1 = `UL = UC ± √(U² − UR²): ${f(uc + d, 2)} В или ${f(uc - d, 2)} В (второе — если неотрицательно)`;
      sol1 = [ur, uc + d, uc];
    } else {
      const d = Math.sqrt(u ** 2 - ur ** 2);
      res1 = `UC = UL ± √(U² − UR²): ${f(ul + d, 2)} В или ${f(ul - d, 2)} В (второе — если неотрицательно)`;
      sol1 = [ur, ul, ul + d];
    }
    if (sol1.some((x) => !Number.isFinite(x))) sol1 = null;
  }
  const b1: Branch = { r: n(t2.r1), xl: n(t2.xl1), xc: n(t2.xc1) };
  const b2: Branch = { r: n(t2.r2), xl: n(t2.xl2), xc: n(t2.xc2) };
  const r = twoBranches(n(t2.u), b1, b2);
  return (
    <Shell title="Задачи РГР: показания вольтметров и две параллельные ветви">
      <div>
        <h3 className="mb-2 text-sm font-medium text-ink-dim">Задача 1 — последовательная цепь R, L, C (электромагнитные приборы показывают действующие значения)</h3>
        <Fields fields={[["ur", "UR, В"], ["ul", "UL, В"], ["uc", "UC, В"], ["u", "U, В"], ["i", "I (амперметр), А"]]} values={t1} set={set1} />
        <p className="mt-3 font-mono text-sm text-ink">{res1}</p>
        {sol1 && (
          <div className="mt-4 max-w-xl">
            <PhasorDiagram fig={rgr1Figure(n(t1.i), ...sol1)} title="Задача 1. Векторна діаграма (за струмом)" />
          </div>
        )}
      </div>
      <div>
        <h3 className="mb-2 text-sm font-medium text-ink-dim">Задача 2 — ветви рис. 2 (по своему варианту: какие элементы в какой ветви)</h3>
        <Fields
          fields={[["u", "U, В"], ["r1", "Ветвь 1: R, Ом"], ["xl1", "Ветвь 1: XL, Ом"], ["xc1", "Ветвь 1: XC, Ом"], ["r2", "Ветвь 2: R, Ом"], ["xl2", "Ветвь 2: XL, Ом"], ["xc2", "Ветвь 2: XC, Ом"]]}
          values={t2}
          set={set2}
        />
      </div>
      <OutputBlock
        label="Расчёт в комплексной форме (φu = 0)"
        value={[
          `Z1 = ${cstr(r.z1)} Ом`,
          `Z2 = ${cstr(r.z2)} Ом`,
          `Zэкв = Z1·Z2/(Z1 + Z2) = ${cstr(r.z)} Ом`,
          `I = U/Zэкв = ${cstr(r.I)} А  → I = ${f(abs(r.I))} А`,
          `I1 = U/Z1 = ${cstr(r.I1)} А  → I1 = ${f(abs(r.I1))} А`,
          `I2 = U/Z2 = ${cstr(r.I2)} А  → I2 = ${f(abs(r.I2))} А`,
          `S = U·I* = ${f(r.S.re)} ${r.S.im < 0 ? "−" : "+"} j${f(Math.abs(r.S.im))} ВА (P = ${f(r.S.re)} Вт, Q = ${f(r.S.im)} вар)`,
          "",
          "Законы Кирхгофа в комплексной форме:",
          "  İ = İ1 + İ2",
          "  İ1·Z1 = U",
          "  İ2·Z2 = U",
          "  İ1·Z1 − İ2·Z2 = 0",
        ].join("\n")}
        wrap={false}
      />
      {abs(r.I) > 0 && Number.isFinite(abs(r.I)) && (
        <div className="max-w-xl">
          <PhasorDiagram fig={rgr2Figure(n(t2.u), r.I, r.I1, r.I2)} title="Задача 2. Векторна діаграма, φu = 0" />
        </div>
      )}
    </Shell>
  );
}

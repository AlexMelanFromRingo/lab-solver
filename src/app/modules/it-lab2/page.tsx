"use client";

import { useMemo, useState } from "react";
import { ModuleHeader } from "@/components/module-header";
import { LabProcedure } from "@/components/lab-procedure";
import { Card, CardBody } from "@/components/ui/card";
import { InfoNote } from "@/components/ui/info-note";
import { NumberField, SelectField, TextField } from "@/components/ui/field";
import { OutputBlock } from "@/components/ui/output-block";
import { categories, modules } from "@/lib/modules";
import { IT_GUIDES, IMPORT_WAYS, MATHCAD_MAP, READFILE_ARGS } from "@/lib/data/it-labs";
import {
  EXAMPLE_ARRAY,
  FUNCTIONS,
  mathcadListing,
  pythonListing,
  type PlotConfig,
} from "@/lib/algorithms/it-plot-script";

const mod = modules.find((m) => m.slug === "it-lab2")!;
const accent = categories.it.accent;
const procedure = IT_GUIDES["it-lab2"];

/** График функции: рисуется прямо по выбранному выражению. */
function FunctionPlot({ id, from, to }: { id: string; from: number; to: number }) {
  const W = 700;
  const H = 230;
  const pad = { top: 16, right: 16, bottom: 28, left: 48 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;

  const evaluate = useMemo(() => {
    const map: Record<string, (x: number) => number> = {
      sin: Math.sin,
      cos: Math.cos,
      damped: (x) => Math.exp(-x / 5) * Math.sin(x),
      square: (x) => (x * x) / 10,
      sinc: (x) => (x === 0 ? 1 : Math.sin(x) / x),
    };
    return map[id] ?? Math.sin;
  }, [id]);

  if (!(to > from)) {
    return <p className="text-sm text-ink-dim">Правая граница должна быть больше левой.</p>;
  }

  const points = Array.from({ length: 601 }, (_, i) => {
    const x = from + ((to - from) * i) / 600;
    return { x, y: evaluate(x) };
  }).filter((p) => Number.isFinite(p.y));

  const lo = Math.min(...points.map((p) => p.y));
  const hi = Math.max(...points.map((p) => p.y));
  const span = hi - lo || 1;
  const yLo = lo - span * 0.1;
  const yHi = hi + span * 0.1;

  const sx = (x: number) => pad.left + ((x - from) / (to - from)) * plotW;
  const sy = (y: number) => pad.top + (1 - (y - yLo) / (yHi - yLo)) * plotH;
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"}${sx(p.x).toFixed(2)},${sy(p.y).toFixed(2)}`).join(" ");
  const fmt = (v: number) => String(Math.round(v * 100) / 100).replace(".", ",").replace("-", "\u2212");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img">
      {[0, 0.5, 1].map((f) => (
        <g key={f}>
          <line
            x1={pad.left}
            x2={W - pad.right}
            y1={pad.top + plotH * f}
            y2={pad.top + plotH * f}
            stroke="currentColor"
            strokeWidth={0.5}
            className="text-ink-faint/25"
          />
          <text x={pad.left - 7} y={pad.top + plotH * f + 3.5} textAnchor="end" className="fill-ink-faint text-[9px]">
            {fmt(yHi - (yHi - yLo) * f)}
          </text>
        </g>
      ))}
      {[0, 0.25, 0.5, 0.75, 1].map((f) => (
        <text key={f} x={pad.left + plotW * f} y={H - 9} textAnchor="middle" className="fill-ink-faint text-[9px]">
          {fmt(from + (to - from) * f)}
        </text>
      ))}
      <path d={d} fill="none" stroke="#c00000" strokeWidth={1.8} strokeLinejoin="round" />
    </svg>
  );
}

/** Дискретные значения: точки крестиками, без линии. */
function ArrayPlot({ data }: { data: number[] }) {
  const W = 700;
  const H = 210;
  const pad = { top: 16, right: 16, bottom: 28, left: 48 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;
  if (data.length === 0) return null;

  const max = Math.max(...data, 1) * 1.1;
  const sx = (i: number) => pad.left + ((i + 1) / (data.length + 1)) * plotW;
  const sy = (v: number) => pad.top + (1 - v / max) * plotH;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img">
      {[0, 0.5, 1].map((f) => (
        <g key={f}>
          <line
            x1={pad.left}
            x2={W - pad.right}
            y1={pad.top + plotH * f}
            y2={pad.top + plotH * f}
            stroke="currentColor"
            strokeWidth={0.5}
            className="text-ink-faint/25"
          />
          <text x={pad.left - 7} y={pad.top + plotH * f + 3.5} textAnchor="end" className="fill-ink-faint text-[9px]">
            {Math.round(max - max * f)}
          </text>
        </g>
      ))}
      {data.map((v, i) => (
        <g key={i}>
          <path
            d={`M${sx(i) - 5},${sy(v) - 5} L${sx(i) + 5},${sy(v) + 5} M${sx(i) - 5},${sy(v) + 5} L${sx(i) + 5},${sy(v) - 5}`}
            stroke="#c00000"
            strokeWidth={1.8}
          />
          <text x={sx(i)} y={H - 9} textAnchor="middle" className="fill-ink-faint text-[9px]">
            {i + 1}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function ItLab2Page() {
  const [funcId, setFuncId] = useState(FUNCTIONS[0].id);
  const [from, setFrom] = useState(-10);
  const [to, setTo] = useState(10);
  const [step, setStep] = useState(0.1);
  const [arrayText, setArrayText] = useState(EXAMPLE_ARRAY.join(", "));
  const [workbook, setWorkbook] = useState("D:\\\\lab\\\\data.xlsx");
  const [rows, setRows] = useState("2");
  const [columns, setColumns] = useState("(1;3)");

  const func = FUNCTIONS.find((f) => f.id === funcId)!;
  const data = useMemo(
    () => arrayText.split(/[,;\s]+/).map(Number).filter((v) => Number.isFinite(v)),
    [arrayText]
  );

  const config: PlotConfig = { func, from, to, step, data, workbook, rows, columns };

  return (
    <div>
      <ModuleHeader module={mod} />
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        <InfoNote>
          Вариантов у этой работы нет: три задания одинаковы для всех, третье выполняется по
          желанию. Ниже — готовая запись для SMath или Mathcad под выбранные параметры и та же
          работа на Python, если Mathcad недоступен. Примеры в полях уже проставлены те, что
          приведены в задании.
        </InfoNote>

        <LabProcedure guide={procedure} accent={accent} />

        {/* --- Задание 1 ---------------------------------------------------- */}
        <Card>
          <CardBody className="pt-6 space-y-5">
            <div>
              <p className="text-xs text-ink-faint">Задание 1</p>
              <h2 className="mt-1 font-display text-xl font-semibold tracking-tight text-ink">
                График аналитически заданной функции
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-4">
              <SelectField label="Функция" value={funcId} onChange={(e) => setFuncId(e.target.value)}>
                {FUNCTIONS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </SelectField>
              <NumberField label="от" value={String(from)} onChange={(e) => setFrom(Number(e.target.value))} />
              <NumberField label="до" value={String(to)} onChange={(e) => setTo(Number(e.target.value))} />
              <NumberField
                label="шаг"
                step="0.1"
                value={String(step)}
                onChange={(e) => setStep(Number(e.target.value))}
              />
            </div>

            <FunctionPlot id={funcId} from={from} to={to} />

            <p className="text-sm leading-relaxed text-ink-dim">
              В примере задания построен <span className="font-mono text-xs text-ink">sin x</span> на
              отрезке [−10; 10]. Аргумент задаётся диапазоном с шагом, а не одним числом: именно
              шаг определяет, насколько гладкой выйдет кривая.
            </p>
          </CardBody>
        </Card>

        {/* --- Задание 2 ---------------------------------------------------- */}
        <Card>
          <CardBody className="pt-6 space-y-5">
            <div>
              <p className="text-xs text-ink-faint">Задание 2</p>
              <h2 className="mt-1 font-display text-xl font-semibold tracking-tight text-ink">
                График функции, заданной массивом данных
              </h2>
            </div>

            <TextField
              label="Массив Data"
              hint={`${data.length} значений`}
              value={arrayText}
              onChange={(e) => setArrayText(e.target.value)}
            />

            <ArrayPlot data={data} />

            <p className="text-sm leading-relaxed text-ink-dim">
              Линия между точками не проводится: функция задана дискретно, и линия означала бы
              интерполяцию, которой в данных нет. В Mathcad нумерация элементов вектора
              начинается с нуля, поэтому для совпадения с номерами точек задают{" "}
              <span className="font-mono text-xs text-ink">ORIGIN := 1</span> и диапазон{" "}
              <span className="font-mono text-xs text-ink">i := 1 .. last(Data)</span>.
            </p>
          </CardBody>
        </Card>

        {/* --- Задание 3 ---------------------------------------------------- */}
        <Card>
          <CardBody className="pt-6 space-y-5">
            <div>
              <p className="text-xs text-ink-faint">
                Задание 3 · по желанию
              </p>
              <h2 className="mt-1 font-display text-xl font-semibold tracking-tight text-ink">
                Импорт данных из Excel
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <TextField
                label="Путь к книге"
                value={workbook}
                onChange={(e) => setWorkbook(e.target.value)}
              />
              <TextField
                label="Диапазон строк"
                hint="число — все с него"
                value={rows}
                onChange={(e) => setRows(e.target.value)}
              />
              <TextField
                label="Диапазон столбцов"
                value={columns}
                onChange={(e) => setColumns(e.target.value)}
              />
            </div>

            <div className="overflow-x-auto rounded-[4px] border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-ink-faint">
                    <th className="px-3 py-2 text-left font-medium">Аргумент</th>
                    <th className="px-3 py-2 text-left font-medium">Что задаёт</th>
                  </tr>
                </thead>
                <tbody>
                  {READFILE_ARGS.map((a) => (
                    <tr key={a.arg} className="border-b border-border/50 last:border-b-0">
                      <td className="px-3 py-2 font-mono text-xs" style={{ color: accent }}>
                        {a.arg}
                      </td>
                      <td className="px-3 py-2 text-ink-dim">{a.meaning}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-medium text-ink">Чем способы импорта различаются</h3>
              <ul className="space-y-1.5 text-sm text-ink-dim">
                {IMPORT_WAYS.map((w) => (
                  <li key={w.way} className="flex gap-2 leading-relaxed">
                    <span className="font-mono text-xs" style={{ color: accent }}>
                      {w.way}
                    </span>
                    <span>— {w.note}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardBody>
        </Card>

        {/* --- Готовые записи ------------------------------------------------ */}
        <Card>
          <CardBody className="pt-6 space-y-5">
            <div>
              <h2 className="font-display text-xl font-semibold tracking-tight text-ink">
                Готовая запись
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-ink-dim">
                Собрана под выбранные выше функцию, отрезок, массив и параметры импорта.
              </p>
            </div>
            <OutputBlock label="SMath / Mathcad" value={mathcadListing(config)} wrap={false} />
          </CardBody>
        </Card>

        <Card>
          <CardBody className="pt-6 space-y-5">
            <div>
              <h2 className="font-display text-xl font-semibold tracking-tight text-ink">
                Та же работа на Python
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-ink-dim">
                Mathcad 15 снят с поддержки, Mathcad Prime коммерческий, а бесплатный
                Mathcad Express ставит на документы водяной знак. Если среды нет, все три
                задания выполняются этим файлом — нужны numpy, matplotlib и pandas.
              </p>
            </div>

            <div className="overflow-x-auto rounded-[4px] border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-ink-faint">
                    <th className="px-3 py-2 text-left font-medium">Действие</th>
                    <th className="px-3 py-2 text-left font-medium">SMath / Mathcad</th>
                    <th className="px-3 py-2 text-left font-medium">Python</th>
                  </tr>
                </thead>
                <tbody>
                  {MATHCAD_MAP.map((row) => (
                    <tr key={row.action} className="border-b border-border/50 last:border-b-0">
                      <td className="px-3 py-2 text-ink-dim">{row.action}</td>
                      <td className="whitespace-pre-line px-3 py-2 font-mono text-xs text-ink-faint">
                        {row.mathcad}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs" style={{ color: accent }}>
                        {row.python}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <OutputBlock label="plots.py" value={pythonListing(config)} wrap={false} />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

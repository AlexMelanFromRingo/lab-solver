"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Card, CardBody } from "@/components/ui/card";
import { NumberField } from "@/components/ui/field";
import { InfoNote } from "@/components/ui/info-note";
import { Segmented } from "@/components/ui/segmented";
import { DrawingView } from "@/components/drawing-view";
import { c, Grid, Section, type Tint } from "@/components/kfs-ui";
import { Lab5View, Lab6View, Lab7View } from "@/components/kfs-calc-57";
import { readXlsx } from "@/lib/algorithms/xlsx-read";
import {
  CMD,
  DEFAULT_TACTS,
  demoVariant,
  equipment,
  fmt,
  lab1,
  lab2,
  lab3,
  lab4,
  pairKey,
  parseVariant,
  type KfsVariant,
} from "@/lib/algorithms/kfs";
import { chain, square, structure, topology, treeEdges } from "@/lib/algorithms/kfs-figures";

// --- вариант: файл студента в localStorage, общий для четырёх работ ------------

const KEY = "kfs-variant";
interface Stored {
  fileName: string;
  variant: KfsVariant;
}
const listeners = new Set<() => void>();
let current: Stored | null | undefined;

function read(): Stored | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Stored) : null;
  } catch {
    return null;
  }
}
function subscribe(l: () => void) {
  listeners.add(l);
  const on = (e: StorageEvent) => {
    if (e.key === KEY) {
      current = read();
      l();
    }
  };
  window.addEventListener("storage", on);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", on);
  };
}
function snapshot(): Stored | null {
  if (current === undefined) current = read();
  return current;
}
function save(next: Stored | null) {
  current = next;
  try {
    if (next) window.localStorage.setItem(KEY, JSON.stringify(next));
    else window.localStorage.removeItem(KEY);
  } catch {
    // хранилище недоступно — вариант живёт до перезагрузки страницы
  }
  listeners.forEach((l) => l());
}

const DEMO = demoVariant();

// ЛР5–ЛР7 требуют полного файла варианта (λ, результаты заявок, массивы БД) — в
// методичках таких данных нет, поэтому пример для них — вариант 1 из файлов
// преподавателя (только значения ячеек, без метаданных файла)
let example: Promise<KfsVariant> | null = null;
function loadExample(): Promise<KfsVariant> {
  example ??= fetch("../../kfs/variant-1.json")
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json() as Promise<Record<string, Record<string, string | number>>>;
    })
    .then((raw) => parseVariant(Object.fromEntries(Object.entries(raw).map(([k, cells]) => [k, new Map(Object.entries(cells))])), "Вариант 1"));
  return example;
}

/** Матрица: под диагональю lower, над диагональю upper. */
function matrix(names: string[], xy: Record<string, [number, number]>, upper: Record<string, number> | null, lower: Record<string, number>, tintOf?: (a: string, b: string, up: boolean) => Tint | undefined) {
  return names.map((a, i) => [
    c(a, undefined, true),
    fmt(xy[a][0]),
    fmt(xy[a][1]),
    ...names.map((b, j) => {
      if (i === j) return c("", "diag");
      const up = j > i;
      const v = up ? upper?.[pairKey(a, b)] : lower[pairKey(a, b)];
      return c(v == null ? (up ? "" : "н/д") : fmt(v), tintOf?.(a, b, up));
    }),
  ]);
}

// --- виджет --------------------------------------------------------------------

export function KfsCalc({ lab, accent }: { lab: 1 | 2 | 3 | 4 | 5 | 6 | 7; accent: string }) {
  const stored = useSyncExternalStore(subscribe, snapshot, () => null);
  // «auto»: есть сохранённый файл — показываем его; иначе пример
  const [choice, setMode] = useState<"auto" | "demo" | "file">("auto");
  const mode = choice === "auto" ? (stored ? "file" : "demo") : choice;
  const [error, setError] = useState<string | null>(null);
  const full = lab >= 5;
  const [ex, setEx] = useState<KfsVariant | null>(null);
  useEffect(() => {
    if (full && mode === "demo" && !ex) loadExample().then(setEx, (e: Error) => setError(`Пример не загрузился: ${e.message}`));
  }, [full, mode, ex]);
  const v = mode === "file" && stored ? stored.variant : full ? ex : DEMO;

  async function onFile(f: File | undefined) {
    if (!f) return;
    setError(null);
    try {
      const variant = parseVariant(await readXlsx(await f.arrayBuffer()), f.name);
      save({ fileName: f.name, variant });
      setMode("file");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardBody className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <Segmented
              label="Дані"
              value={mode === "file" && stored ? "file" : "demo"}
              options={[
                { value: "demo", label: full ? "Пример: вариант 1" : "Пример из методичек" },
                { value: "file", label: stored ? `Свой вариант (${stored.fileName})` : "Свой вариант" },
              ]}
              onChange={(m) => (m === "file" && !stored ? document.getElementById("kfs-file")?.click() : setMode(m))}
              accent={accent}
            />
            <label className="cursor-pointer text-sm text-ink-dim underline decoration-dotted underline-offset-4 hover:text-ink">
              {stored ? "Загрузить другой файл" : "Загрузить файл варианта .xlsx"}
              <input id="kfs-file" type="file" accept=".xlsx" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            </label>
            {stored && (
              <button type="button" className="text-sm text-ink-faint hover:text-ink-dim" onClick={() => (save(null), setMode("demo"))}>
                Забыть файл
              </button>
            )}
          </div>
          <p className="text-sm leading-relaxed text-ink-faint">
            Файл варианта — тот, что выдаёт преподаватель (листы «Координати», «Ділянки», «ФПБ»). Он читается в браузере и
            никуда не отправляется; сайт запоминает его для всех семи работ.{" "}
            {full
              ? "Без файла показан вариант 1 из файлов преподавателя: для ЛР5–ЛР7 в методичках нет полных данных примера."
              : "Без файла показаны примеры из методичек — на них видно, что расчёт совпадает с таблицами методичек."}
          </p>
          {error && <InfoNote title="Файл не прочитан">{error}</InfoNote>}
        </CardBody>
      </Card>
      {!v && <p className="text-sm text-ink-faint">Загружается пример…</p>}
      {v && lab === 1 && <Lab1View v={v} />}
      {v && lab === 2 && <Lab2View v={v} />}
      {v && lab === 3 && <Lab3View v={v} />}
      {v && lab === 4 && <Lab4View v={v} accent={accent} />}
      {v && lab === 5 && <Lab5View v={v} />}
      {v && lab === 6 && <Lab6View v={v} />}
      {v && lab === 7 && <Lab7View v={v} />}
    </div>
  );
}

// --- ЛР1 -----------------------------------------------------------------------------

const WHY = { lt: "кабель коротший за пряму", big: "кабель у рази довший за пряму", none: "немає даних" } as const; // в отчёт — по-украински

function Lab1View({ v }: { v: KfsVariant }) {
  const [kText, setKText] = useState("");
  const kUser = kText.trim() ? Number(kText.replace(",", ".")) : undefined;
  const l1 = useMemo(() => lab1(v, kUser && kUser >= 1 ? kUser : undefined), [v, kUser]);
  const auto = useMemo(() => lab1(v), [v]);
  const tps = v.names.filter((n) => n.startsWith("ТП"));
  const dps = v.names.filter((n) => n.startsWith("ДП"));
  const head = ["ТО", "X", "Y", ...v.names];
  const headM = ["ТО", "X", "Y", ...l1.names];
  const fixed = new Set(l1.fixes.map((f) => pairKey(f.a, f.b)));
  const fig = topology(l1.names, l1.xy);
  return (
    <>
      <Section title="Характеристика объекта автоматизации">
        <p className="text-sm leading-relaxed text-ink-dim">
          {v.names.length} ТО: {tps.length} технологических процесса ({tps.join(", ")}) и {dps.length} диспетчерских
          пункта ({dps.join(", ")}).{" "}
          {Object.keys(v.struct).length > 0 &&
            `Структура ТП: ${Object.entries(v.struct)
              .map(([tp, s]) => `${tp} — ${Object.values(s).reduce((a, b) => a + b, 0)} участков`)
              .join(", ")}.`}
        </p>
        <Grid title="Таблиця 1. Координати ТО та кабельні відстані (під діагоналлю), км" head={head} rows={matrix(v.names, v.xy, null, v.cable)} />
      </Section>
      <Section title="Анализ координат и геометрические расстояния">
        {l1.groups.some((g) => g.length > 1) ? (
          <p className="text-sm leading-relaxed text-ink-dim">
            Координаты отличаются не больше чем на 1 м (0,001 км) — ТО в одном помещении, они объединяются в сложные:{" "}
            {l1.groups.filter((g) => g.length > 1).map((g) => g.join(" и ")).join("; ")}. Сложный ТО берёт координаты и кабельные
            расстояния своего ТП — так в методичке.
          </p>
        ) : (
          <p className="text-sm leading-relaxed text-ink-dim">
            ТО с разницей координат до 1 м нет, сложные ТО не образуются. Ближайшие пары:{" "}
            {l1.nearest.map((p) => `${p.a} і ${p.b} — ${Math.round(p.d * 1000)} м`).join(", ")}.
          </p>
        )}
        <p className="text-sm leading-relaxed text-ink-dim">
          Геометрическое расстояние — по Пифагору: l<sub>г</sub> = √((x₂ − x₁)² + (y₂ − y₁)²). Над диагональю — геометрические,
          под ней — кабельные расстояния; зелёные совпадают с точностью до метра (так сравнивают таблицы методички).
        </p>
        <Grid
          title="Таблиця 2. Кабельні та геометричні відстані між ТО, км"
          head={headM}
          rows={matrix(l1.names, l1.xy, l1.geom, l1.cable, (a, b) => {
            const k = pairKey(a, b);
            return l1.cable[k] != null && Math.round(l1.cable[k] * 1000) === Math.round(l1.geom[k] * 1000) ? "eq" : undefined;
          })}
        />
      </Section>
      <Section title="Уточнение кабельных расстояний">
        <p className="text-sm leading-relaxed text-ink-dim">
          Уточнять нужно, если l<sub>к</sub> &lt; l<sub>г</sub>, если кабель в разы длиннее прямой (п. 1.2.3 методички) и если
          кабельного расстояния нет. По методичке уточнённые длины даёт заказчик; пока ответа нет, сайт берёт l<sub>к</sub>* =
          ⌈k·l<sub>г</sub>⌉ до метра, где k — наибольшее отношение l<sub>к</sub>/l<sub>г</sub> среди прошедших проверку каналов
          {auto.kPair ? ` (${auto.kPair.join("–")}: k = ${fmt(auto.k)})` : ""}. Коэффициент можно задать свой.
        </p>
        <div className="max-w-xs">
          <NumberField label="Коэффициент k" hint={`пусто — ${fmt(auto.k)}`} step="0.001" min={1} value={kText} onChange={(e) => setKText(e.target.value)} />
        </div>
        {l1.fixes.length ? (
          <Grid
            title="Таблиця 3. Уточнені кабельні відстані"
            head={["Зв'язок", "кабельна lк, км", "геометрична lг, км", "уточнена lк*, км", "Причина"]}
            rows={l1.fixes.map((f) => [`${f.a} – ${f.b}`, f.lk == null ? "н/д" : fmt(f.lk), fmt(f.lg), c(fmt(f.fixed), "fix"), WHY[f.why]])}
          />
        ) : (
          <InfoNote title="Уточнять нечего">Все кабельные расстояния не меньше геометрических и не длиннее прямой в разы.</InfoNote>
        )}
        <Grid
          title="Таблиця 4. Координати ТО, геометричні та уточнені кабельні відстані, км"
          head={headM}
          rows={matrix(l1.names, l1.xy, l1.geom, l1.cableFixed, (a, b, up) => (!up && fixed.has(pairKey(a, b)) ? "fix" : undefined))}
        />
      </Section>
      <Section title="Схема размещения ТО">
        <DrawingView drawing={fig.main} title="Схема (діаграма) топології розміщення ТО на підприємстві" />
        {fig.zooms.map((z) => (
          <DrawingView key={z.title} drawing={z.drawing} title={z.title} />
        ))}
      </Section>
    </>
  );
}

// --- ЛР2 -----------------------------------------------------------------------------

function Lab2View({ v }: { v: KfsVariant }) {
  const l1 = useMemo(() => lab1(v), [v]);
  const trees = useMemo(() => lab2(l1), [l1]);
  const totals = Object.fromEntries(trees.map((t) => [t.key, t.total]));
  const full = topology(
    l1.names,
    l1.xy,
    l1.names.flatMap((a, i) => l1.names.slice(i + 1).map((b) => ({ a, b, label: fmt(l1.geom[pairKey(a, b)]) }))),
  );
  return (
    <>
      <Section title="Полный граф">
        <p className="text-sm leading-relaxed text-ink-dim">
          Вершины — {l1.names.length} ТО из ЛР1, рёбра — {(l1.names.length * (l1.names.length - 1)) / 2} связей с геометрическими
          длинами. Элитная связь — наибольшее геометрическое расстояние из ЛР1: {l1.longest.join("–")},{" "}
          {fmt(l1.geom[pairKey(...l1.longest)])} км. Кабельные расстояния — уточнённые в ЛР1 (k = {fmt(l1.k)}).
        </p>
        <DrawingView drawing={full.main} title="Повний граф" />
      </Section>
      {trees.map((t) => {
        const cable = t.key.startsWith("МКДк");
        const w = cable ? l1.cableFixed : l1.geom;
        const fig = topology(l1.names, l1.xy, treeEdges(t.edges, w, l1.geom, { elite: t.elite, cable }));
        return (
          <Section key={t.key} title={`Построение ${t.key}`}>
            <Grid
              title={`Упорядковані ${cable ? "кабельні" : "геометричні"} відстані (${t.key})`}
              head={["Зв'язок", "Довжина, км", "Підграф"]}
              rows={[
                ...t.rows.map((r) => [
                  `${r.a} – ${r.b}`,
                  c(fmt(r.w), t.elite && pairKey(r.a, r.b) === pairKey(...t.elite) ? "elite" : r.mark === t.key ? "tree" : undefined),
                  r.mark,
                ]),
                [c("Разом", undefined, true), c(fmt(t.total), undefined, true), c(String(t.edges.length), undefined, true)],
              ]}
              note={t.elite ? "Элитная связь включена первой (розовая), дальше — по возрастанию." : "Ребро, замыкающее цикл, помечено «-»; после n−1 рёбер дерево готово."}
            />
            <DrawingView drawing={fig.main} title={`${t.key}${cable ? ": кабель, довший за пряму, — дугою" : ""}${t.elite ? "; елітний зв'язок — пунктиром" : ""}`} />
            {fig.zooms.map((z) => (
              <DrawingView key={z.title} drawing={z.drawing} title={z.title} />
            ))}
          </Section>
        );
      })}
      <Section title="Квадрат расстояний">
        <DrawingView drawing={square(totals)} title="Квадрат відстаней" />
        <p className="text-sm leading-relaxed text-ink-dim">
          МКДг {fmt(totals["МКДг"])} км, МКДк {fmt(totals["МКДк"])} км, МКДге {fmt(totals["МКДге"])} км, МКДке {fmt(totals["МКДке"])} км.
          {trees[0].edges.map((e) => pairKey(...e)).sort().join() === trees[1].edges.map((e) => pairKey(...e)).sort().join()
            ? " У МКДг и МКДк одинаковые рёбра: сеть можно проложить по существующим кабельным каналам."
            : " Рёбра МКДг и МКДк различаются: существующие кабельные каналы идут не кратчайшими путями."}
        </p>
      </Section>
    </>
  );
}

// --- ЛР3 -----------------------------------------------------------------------------

function Lab3View({ v }: { v: KfsVariant }) {
  const l3 = useMemo(() => lab3(v), [v]);
  const [d, setD] = useState(v === DEMO ? 5 : 1);
  const [m, setM] = useState(v === DEMO ? 6 : 1);
  const nDp = v.names.filter((n) => n.startsWith("ДП")).length;
  const eq = equipment(nDp, Math.max(1, d), Math.max(1, m));
  const code = `2П${l3.idxS}2А`;
  return (
    <>
      <Section title="Условная информационная мощность и интенсивность">
        <DrawingView drawing={structure(v.structCells)} title="Структури технологічних процесів" />
        <div className="space-y-1 font-mono text-sm text-ink-dim">
          {l3.tps.map((tp) => (
            <div key={tp}>
              УІП({tp}) ={" "}
              {Object.entries(v.struct[tp]).sort(([a], [b]) => a.localeCompare(b, "uk", { numeric: true }))
                .map(([dd, k]) => (k > 1 ? `${k}×${dd}` : dd))
                .join(" + ")}
            </div>
          ))}
        </div>
        <p className="text-sm leading-relaxed text-ink-dim">
          УІП — число сигналов, поступающих в систему, то есть входных: в примере методички ТП1 = 3459 и ТП2 = 1816 сходятся
          именно так. Интенсивность — по тем же формулам.
        </p>
        <Grid
          title="Сигнали за дільницями і за ТП"
          head={["Вид", "Тип", "Заявка", ...v.sections.flatMap((s) => [`${s} λ`, `${s} N`]), ...l3.tps.map((t) => `λ ${t}`), ...l3.tps.map((t) => `N ${t}`)]}
          rows={[
            ...l3.rows.map((r) => [
              r.kind,
              r.func,
              c(r.name, undefined, true),
              ...v.sections.flatMap((s) => [r.per[s]?.[0] != null ? fmt(r.per[s][0]!, 2) : "–", r.per[s]?.[1] != null ? String(r.per[s][1]) : "–"]),
              ...l3.tps.map((t) => (r.lam ? fmt(r.lam[t], 2) : "–")),
              ...l3.tps.map((t) => (r.cnt ? String(r.cnt[t]) : "–")),
            ]),
            [
              c("Разом", undefined, true),
              "",
              "",
              ...v.sections.flatMap((s) => [c(fmt(l3.secLam[s], 2), undefined, true), c(String(l3.secCnt[s]), undefined, true)]),
              ...l3.tps.map((t) => c(fmt(l3.totLam[t], 2), undefined, true)),
              ...l3.tps.map((t) => c(String(l3.totCnt[t]), undefined, true)),
            ],
          ]}
          note={`По системі: УІП = ${l3.uipS}, сумарна інтенсивність ${fmt(l3.lamS, 2)}.`}
        />
      </Section>
      <Section title="Индекс системы">
        <Grid
          title="Індекс за УІП (ОРТМ: 1 — до 40, 2 — 41–160, 3 — 161–650, 4 — 651–2500, 5 — понад 2500)"
          head={["Об'єкт", "Сигналів", "Індекс"]}
          rows={[...l3.tps.map((t) => [t, String(l3.totCnt[t]), String(l3.idx[t])]), [c("Система", undefined, true), c(String(l3.uipS), undefined, true), c(String(l3.idxS), undefined, true)]]}
        />
        <p className="text-sm leading-relaxed text-ink-dim">
          Код системы <span className="font-mono text-ink">{code}</span>: 2 — АСУТП верхнего уровня, П — непрерывно-дискретный
          процесс, {l3.idxS} — информационная мощность, 2 — средняя надёжность, А — автоматический режим. Кроме мощности, эти признаки
          в варианте не заданы — взяты как в примере методички.
        </p>
      </Section>
      <Section title="Оборудование диспетчерских пунктов">
        <div className="grid max-w-md grid-cols-2 gap-4">
          <NumberField label="День рождения d" min={1} max={31} value={d} onChange={(e) => setD(Number(e.target.value))} />
          <NumberField label="Месяц рождения m" min={1} max={12} value={m} onChange={(e) => setM(Number(e.target.value))} />
        </div>
        <p className="text-sm leading-relaxed text-ink-dim">
          По методичке Кмон = ]d/m[ + i и Кприн = ]m/d[ + i, где ]x[ — её обозначение, названное «остатком от деления». Но
          в её же примере (d = 5, m = 6) ]5/6[ = 2 и ]6/5[ = 1: так выходит, если дробь перевернуть и округлить вверх — ⌈6/5⌉ = 2,
          ⌈5/6⌉ = 1. Так и считаем: ]{d}/{m}[ = ⌈{m}/{d}⌉ = {Math.ceil(m / Math.max(1, d))}, ]{m}/{d}[ = ⌈{d}/{m}⌉ ={" "}
          {Math.ceil(d / Math.max(1, m))}.
        </p>
        <Grid title="Склад периферійного обладнання на ДП" head={["ДП", "Монітори", "Принтери", "Табло"]} rows={eq.map((e) => [`ДП${e.i}`, String(e.mon), String(e.prn), "–"])} />
      </Section>
    </>
  );
}

// --- ЛР4 -----------------------------------------------------------------------------

function Lab4View({ v, accent }: { v: KfsVariant; accent: string }) {
  const [tacts, setTacts] = useState<number[][]>(DEFAULT_TACTS.map((r) => [...r]));
  const l4 = useMemo(() => lab4(v, tacts), [v, tacts]);
  const nf = v.fpbK[0].length;
  const oneBranch = l4.reqs.filter((q) => q.steps.filter((s) => s.kind !== "one").length === 1);
  const simplest = oneBranch.length ? Math.min(...oneBranch.map((q) => Math.max(...q.steps.map((s) => s.terms.length)))) : 0;
  const defaultIdx = Math.max(0, l4.reqs.indexOf(oneBranch.find((q) => Math.max(...q.steps.map((s) => s.terms.length)) === simplest) ?? l4.reqs[0]));
  const [sel, setSel] = useState<number | null>(null);
  const [mk, setMk] = useState<"0" | "1" | "2">(String(Math.min(2, v.mkp.length - 1)) as "0" | "1" | "2");
  const qi = sel != null && sel < l4.reqs.length ? sel : defaultIdx;
  const q = l4.reqs[qi];
  const mi = Number(mk);
  return (
    <>
      <Section title="Микропроцессоры и время команд">
        <p className="text-sm leading-relaxed text-ink-dim">
          Такты на команду для процессоров варианта не заданы — по умолчанию табл. 2 методички по номеру МКП. Если преподаватель
          дал другие такты, впишите их.
        </p>
        <div className="overflow-x-auto">
          <table className="font-mono text-sm text-ink-dim">
            <thead className="text-xs text-ink-faint">
              <tr>
                <th className="px-2 py-1 text-left font-normal">МКП</th>
                {CMD.map((cm) => (
                  <th key={cm} className="px-2 py-1 text-left font-normal">
                    {cm}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {v.mkp.map((p, i) => (
                <tr key={i}>
                  <td className="px-2 py-1">
                    {p.n}. {p.name}, {p.f} МГц
                  </td>
                  {CMD.map((_, ci) => (
                    <td key={ci} className="px-2 py-1">
                      <input
                        type="number"
                        min={0}
                        className="w-16 rounded-[3px] border border-border bg-transparent px-2 py-1 text-ink"
                        value={tacts[i]?.[ci] ?? 0}
                        onChange={(e) => setTacts((t) => t.map((r, ri) => (ri === i ? r.map((x, cj) => (cj === ci ? Number(e.target.value) : x)) : r)))}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Grid
          title="Час виконання команди t = N / F, мкс"
          head={["Команда", ...v.mkp.map((p) => `МКП ${p.n}`)]}
          rows={CMD.map((cm, ci) => [cm, ...v.mkp.map((_, i) => fmt(l4.t[i][ci], 6))])}
        />
      </Section>
      <Section title="ФПБ: время и объём">
        <Grid
          title="Кількість команд у ФПБ"
          head={["Команда", ...Array.from({ length: nf }, (_, b) => `Ф${b + 1}`)]}
          rows={[...CMD.map((cm, ci) => [cm, ...v.fpbK[ci].map(String)]), [c("усього", undefined, true), ...l4.cmds.map((n) => c(String(n), undefined, true))]]}
        />
        <Grid
          title="Час реалізації ФПБ T = Σ t·K, мкс, і обсяг пам'яті (2-байтні команди)"
          head={["ФПБ", ...v.mkp.map((p) => `МКП ${p.n}`), "Обсяг, Мбайт"]}
          rows={[
            ...Array.from({ length: nf }, (_, b) => [`Ф${b + 1}`, ...v.mkp.map((_, i) => fmt(l4.T[i][b], 1)), fmt(l4.Q[b])]),
            [c("Qсист", undefined, true), ...v.mkp.map(() => ""), c(fmt(l4.Qs), undefined, true)],
          ]}
          note="1 Мбайт = 2²⁰ байт — так посчитана табл. 6 методички."
        />
      </Section>
      <Section title="Время выполнения заявки">
        <div className="flex flex-wrap items-end gap-4">
          <label className="block text-sm text-ink-dim">
            <span className="mb-1 block text-xs text-ink-faint">Заявка</span>
            <select className="rounded-[3px] border border-border bg-transparent px-2 py-1.5 text-ink" value={qi} onChange={(e) => setSel(Number(e.target.value))}>
              {l4.reqs.map((r, i) => (
                <option key={i} value={i} className="bg-background">
                  {r.obj} · {r.name}
                </option>
              ))}
            </select>
          </label>
          <Segmented label="МКП" value={mk} options={v.mkp.map((p, i) => ({ value: String(i) as "0" | "1" | "2", label: `МКП ${p.n}` }))} onChange={setMk} accent={accent} />
        </div>
        {q && (
          <>
            <DrawingView drawing={chain(q.steps, l4.T[mi])} title={`Ланцюжок ФПБ заявки ${q.name}: у вузлі — час ФПБ на МКП ${v.mkp[mi].n}, мкс`} />
            <p className="font-mono text-sm leading-relaxed text-ink-dim">
              T = {q.steps.flatMap((s) => s.terms.map(([p, f]) => (p === 1 ? Math.round(l4.T[mi][f - 1]).toString() : `${fmt(p, 2)}×${Math.round(l4.T[mi][f - 1])}`))).join(" + ")} ={" "}
              <span className="text-ink">{fmt(q.time[mi], 2)} мкс</span>
            </p>
          </>
        )}
        <Grid
          title="Час виконання всіх заявок, мкс"
          head={["Об'єкт", "Заявка", ...v.mkp.map((p) => `МКП ${p.n}`)]}
          rows={l4.reqs.map((r) => [r.obj, r.name, ...r.time.map((t) => fmt(t, 1))])}
          note="Правила цепочки: Г — один ФПБ; Г1, Г2… с процентами — альтернативы (сумма p·T); Г1, Г2… с «--» — ветви, которые выполняются все (на одном МКП последовательно, сумма T); Г21, Г22… — альтернативы внутри ветви."
        />
      </Section>
    </>
  );
}

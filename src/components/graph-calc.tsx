"use client";

import { useState } from "react";
import { useLang } from "@/components/lang";
import { Card, CardBody } from "@/components/ui/card";
import { NumberField, TextAreaField } from "@/components/ui/field";
import { OutputBlock } from "@/components/ui/output-block";
import { Segmented } from "@/components/ui/segmented";
import { dijkstra, floyd, floydPath, ford, kruskal, parseEdges, predPath, prim, weightMatrix } from "@/lib/algorithms/graphs";

// Рис. 15 методички «Теорія графів»: ориентированный граф с отрицательными дугами.
// У дуги x1–x4 на рисунке нет стрелки — взято направление x1 → x4.
const FIG15 = `1 2 7
1 4 8
1 7 6
2 4 11
3 2 -14
4 3 10
4 5 8
5 3 6
3 6 19
6 5 -7
5 8 12
8 6 4
8 7 10
7 4 -5`;

// Рис. 15а (неориентированный) — только рёбра с однозначно подписанным весом;
// у x1–x5 и x7–x9 веса на рисунке нет, «11» у x1 стоит между x1–x4 и x2–x5.
const FIG15A = `1 2 6
2 3 15
2 4 18
2 7 11
3 4 8
3 8 18
3 9 6
4 7 7
7 8 9
8 9 14
5 7 9
4 6 10
5 6 15
4 11 17
7 11 12
6 11 3
11 12 7
8 12 5
7 10 13
9 10 19
12 10 2`;

const fmt = (v: number) => (v === Infinity ? "∞" : String(v));
const fmtMat = (m: number[][]) =>
  ["     " + m.map((_, j) => `x${j + 1}`.padStart(5)).join(""), ...m.map((r, i) => `x${i + 1}`.padEnd(5) + r.map((v) => fmt(v).padStart(5)).join(""))].join("\n");

function run<T>(fn: () => T): { ok: true; v: T } | { ok: false; error: string } {
  try {
    return { ok: true, v: fn() };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** Кратчайшие пути (Флойд, Форд, Дейкстра) и остовное дерево (Краскал, Прим). */
export function GraphCalc({ accent }: { accent: string }) {
  const { lang } = useLang();
  const t = (uk: string, ruText: string) => (lang === "uk" ? uk : ruText);
  const [mode, setMode] = useState<"paths" | "tree">("paths");
  const [paths, setPaths] = useState(FIG15);
  const [tree, setTree] = useState(FIG15A);
  const [from, setFrom] = useState(1);
  const [to, setTo] = useState(6);
  const [n, setN] = useState(0);

  const p = run(() => {
    const g = parseEdges(paths);
    const w = weightMatrix(g.n, g.edges, true);
    const f = floyd(w);
    const last = f.d.length - 1;
    const fo = ford(g.n, g.edges, from);
    const dj = run(() => dijkstra(w, from));
    return { g, w, f, last, path: floydPath(f.via[last], from, to), fo, dj };
  });

  // правило методички: к весам +n для нечётного номера, +n/2 для чётного
  const tv = run(() => {
    const g = parseEdges(tree);
    const add = n <= 0 ? 0 : n % 2 ? n : n / 2;
    const edges = g.edges.map((e) => ({ ...e, w: e.w + add }));
    return { add, k: kruskal(g.n, edges), pr: prim(g.n, edges) };
  });

  return (
    <Card>
      <CardBody className="space-y-5 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold text-ink">{t("Графи","Графы")}</h2>
          <Segmented
            label={t("Задача","Задача")}
            value={mode}
            accent={accent}
            onChange={setMode}
            options={[
              { value: "paths", label: t("Найкоротші шляхи","Кратчайшие пути") },
              { value: "tree", label: t("Кістякове дерево","Остовное дерево") },
            ]}
          />
        </div>

        {mode === "paths" ? (
          <>
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_14rem]">
              <TextAreaField label={t("Дуги «звідки куди вага» — за замовчуванням рис. 15","Дуги «откуда куда вес» — по умолчанию рис. 15")} value={paths} onChange={(e) => setPaths(e.target.value)} className="min-h-[14rem]" />
              <div className="space-y-4">
                <NumberField label={t("З вершини","Из вершины")} min={1} value={from} onChange={(e) => setFrom(Number(e.target.value))} />
                <NumberField label={t("У вершину (шлях Флойда)","В вершину (путь Флойда)")} min={1} value={to} onChange={(e) => setTo(Number(e.target.value))} />
              </div>
            </div>
            {p.ok ? (
              <div className="space-y-4">
                <OutputBlock label={t("Матриця ваг D⁽⁰⁾","Матрица весов D⁽⁰⁾")} value={fmtMat(p.v.w)} wrap={false} />
                <OutputBlock
                  label={t("Флойд: матриці після кожного k","Флойд: матрицы после каждого k")}
                  value={p.v.f.d.slice(1).map((d, k) => `k = ${k + 1}\n${fmtMat(d)}`).join("\n\n")}
                  wrap={false}
                />
                <OutputBlock
                  label={t(`Шлях x${from} → x${to} за матрицею маршрутів`,`Путь x${from} → x${to} по матрице маршрутов`)}
                  value={
                    p.v.f.negativeCycle
                      ? t("У графі є цикл від’ємної ваги — найкоротших шляхів немає","В графе есть цикл отрицательного веса — кратчайших путей нет")
                      : p.v.path
                        ? t(`${p.v.path.map((v) => `x${v}`).join(" → ")}, довжина ${p.v.f.d[p.v.last][from - 1][to - 1]}\nМатриця маршрутів (наступна вершина шляху):\n${fmtMat(p.v.f.via[p.v.last].map((r) => r.map((v) => (v < 0 ? Infinity : v + 1))))}`,`${p.v.path.map((v) => `x${v}`).join(" → ")}, длина ${p.v.f.d[p.v.last][from - 1][to - 1]}\nМатрица маршрутов (следующая вершина пути):\n${fmtMat(p.v.f.via[p.v.last].map((r) => r.map((v) => (v < 0 ? Infinity : v + 1))))}`)
                        : t(`x${to} недосяжна з x${from}`,`x${to} недостижима из x${from}`)
                  }
                  wrap={false}
                />
                <OutputBlock
                  label={t(`Форд: мітки l(x) від x${from} після кожного проходу по дугах`,`Форд: метки l(x) от x${from} после каждого прохода по дугам`)}
                  value={[
                    ...p.v.fo.passes.map((pass, i) => t(`прохід ${i}: ${pass.map(fmt).join("  ")}`,`проход ${i}: ${pass.map(fmt).join("  ")}`)),
                    p.v.fo.negativeCycle
                      ? t("мітки змінюються і на n-му проході — цикл від’ємної ваги","метки меняются и на n-м проходе — цикл отрицательного веса")
                      : p.v.fo.dist.map((d, i) => t(`x${i + 1}: ${fmt(d)}${d < Infinity && i !== from - 1 ? `, шлях ${predPath(p.v.fo.pred, i + 1).map((v) => `x${v}`).join("→")}` : ""}`,`x${i + 1}: ${fmt(d)}${d < Infinity && i !== from - 1 ? `, путь ${predPath(p.v.fo.pred, i + 1).map((v) => `x${v}`).join("→")}` : ""}`)).join("\n"),
                  ].join("\n")}
                  wrap={false}
                />
                <OutputBlock
                  label={t("Дейкстра","Дейкстра")}
                  value={
                    p.v.dj.ok
                      ? p.v.dj.v.steps.map((s) => t(`постійна мітка x${s.fixed}: ${s.labels.map(fmt).join("  ")}`,`постоянная метка x${s.fixed}: ${s.labels.map(fmt).join("  ")}`)).join("\n")
                      : p.v.dj.error
                  }
                  wrap={false}
                />
              </div>
            ) : (
              <p className="text-sm text-codes">{p.error}</p>
            )}
          </>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_14rem]">
              <TextAreaField label={t("Ребра «вершина вершина вага» — за замовчуванням рис. 15а","Рёбра «вершина вершина вес» — по умолчанию рис. 15а")} value={tree} onChange={(e) => setTree(e.target.value)} className="min-h-[14rem]" />
              <NumberField
                label={t("Номер за списком n","Номер по списку n")}
                hint={t("0 — без поправки","0 — без поправки")}
                min={0}
                value={n}
                onChange={(e) => setN(Number(e.target.value))}
              />
            </div>
            {tv.ok ? (
              <div className="space-y-4">
                {tv.v.add > 0 && <p className="text-sm text-ink-dim">{t("До всіх ваг додано","Ко всем весам добавлено")} {tv.v.add} ({n % 2 ? t("непарний номер: +n","нечётный номер: +n") : t("парний номер: +n/2","чётный номер: +n/2")}).</p>}
                <OutputBlock
                  label={t(`Краскал: вага дерева ${tv.v.k.weight}${tv.v.k.connected ? "" : " — граф незв’язний"}`,`Краскал: вес дерева ${tv.v.k.weight}${tv.v.k.connected ? "" : " — граф несвязный"}`)}
                  value={tv.v.k.steps.map((s) => `(x${s.edge.from}, x${s.edge.to}) = ${s.edge.w}${s.taken ? "" : t(" — утворює цикл"," — образует цикл")}`).join("\n")}
                  wrap={false}
                />
                <OutputBlock
                  label={t(`Прим від x1: вага дерева ${tv.v.pr.weight}`,`Прим от x1: вес дерева ${tv.v.pr.weight}`)}
                  value={tv.v.pr.steps.map((s) => `(x${s.edge.from}, x${s.edge.to}) = ${s.edge.w}; ${t("у дереві","в дереве")} {${s.inTree.map((v) => `x${v}`).join(", ")}}`).join("\n")}
                  wrap={false}
                />
              </div>
            ) : (
              <p className="text-sm text-codes">{tv.error}</p>
            )}
          </>
        )}
      </CardBody>
    </Card>
  );
}

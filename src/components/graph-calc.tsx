"use client";

import { useState } from "react";
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
  const t = run(() => {
    const g = parseEdges(tree);
    const add = n <= 0 ? 0 : n % 2 ? n : n / 2;
    const edges = g.edges.map((e) => ({ ...e, w: e.w + add }));
    return { add, k: kruskal(g.n, edges), pr: prim(g.n, edges) };
  });

  return (
    <Card>
      <CardBody className="space-y-5 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold text-ink">Графы</h2>
          <Segmented
            label="Задача"
            value={mode}
            accent={accent}
            onChange={setMode}
            options={[
              { value: "paths", label: "Кратчайшие пути" },
              { value: "tree", label: "Остовное дерево" },
            ]}
          />
        </div>

        {mode === "paths" ? (
          <>
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_14rem]">
              <TextAreaField label="Дуги «откуда куда вес» — по умолчанию рис. 15" value={paths} onChange={(e) => setPaths(e.target.value)} className="min-h-[14rem]" />
              <div className="space-y-4">
                <NumberField label="Из вершины" min={1} value={from} onChange={(e) => setFrom(Number(e.target.value))} />
                <NumberField label="В вершину (путь Флойда)" min={1} value={to} onChange={(e) => setTo(Number(e.target.value))} />
              </div>
            </div>
            {p.ok ? (
              <div className="space-y-4">
                <OutputBlock label="Матрица весов D⁽⁰⁾" value={fmtMat(p.v.w)} wrap={false} />
                <OutputBlock
                  label="Флойд: матрицы после каждого k"
                  value={p.v.f.d.slice(1).map((d, k) => `k = ${k + 1}\n${fmtMat(d)}`).join("\n\n")}
                  wrap={false}
                />
                <OutputBlock
                  label={`Путь x${from} → x${to} по матрице маршрутов`}
                  value={
                    p.v.f.negativeCycle
                      ? "В графе есть цикл отрицательного веса — кратчайших путей нет"
                      : p.v.path
                        ? `${p.v.path.map((v) => `x${v}`).join(" → ")}, длина ${p.v.f.d[p.v.last][from - 1][to - 1]}\nМатрица маршрутов (следующая вершина пути):\n${fmtMat(p.v.f.via[p.v.last].map((r) => r.map((v) => (v < 0 ? Infinity : v + 1))))}`
                        : `x${to} недостижима из x${from}`
                  }
                  wrap={false}
                />
                <OutputBlock
                  label={`Форд: метки l(x) от x${from} после каждого прохода по дугам`}
                  value={[
                    ...p.v.fo.passes.map((pass, i) => `проход ${i}: ${pass.map(fmt).join("  ")}`),
                    p.v.fo.negativeCycle
                      ? "метки меняются и на n-м проходе — цикл отрицательного веса"
                      : p.v.fo.dist.map((d, i) => `x${i + 1}: ${fmt(d)}${d < Infinity && i !== from - 1 ? `, путь ${predPath(p.v.fo.pred, i + 1).map((v) => `x${v}`).join("→")}` : ""}`).join("\n"),
                  ].join("\n")}
                  wrap={false}
                />
                <OutputBlock
                  label="Дейкстра"
                  value={
                    p.v.dj.ok
                      ? p.v.dj.v.steps.map((s) => `постоянная метка x${s.fixed}: ${s.labels.map(fmt).join("  ")}`).join("\n")
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
              <TextAreaField label="Рёбра «вершина вершина вес» — по умолчанию рис. 15а" value={tree} onChange={(e) => setTree(e.target.value)} className="min-h-[14rem]" />
              <NumberField
                label="Номер по списку n"
                hint="0 — без поправки"
                min={0}
                value={n}
                onChange={(e) => setN(Number(e.target.value))}
              />
            </div>
            {t.ok ? (
              <div className="space-y-4">
                {t.v.add > 0 && <p className="text-sm text-ink-dim">Ко всем весам добавлено {t.v.add} ({n % 2 ? "нечётный номер: +n" : "чётный номер: +n/2"}).</p>}
                <OutputBlock
                  label={`Краскал: вес дерева ${t.v.k.weight}${t.v.k.connected ? "" : " — граф несвязный"}`}
                  value={t.v.k.steps.map((s) => `(x${s.edge.from}, x${s.edge.to}) = ${s.edge.w}${s.taken ? "" : " — образует цикл"}`).join("\n")}
                  wrap={false}
                />
                <OutputBlock
                  label={`Прим от x1: вес дерева ${t.v.pr.weight}`}
                  value={t.v.pr.steps.map((s) => `(x${s.edge.from}, x${s.edge.to}) = ${s.edge.w}; в дереве {${s.inTree.map((v) => `x${v}`).join(", ")}}`).join("\n")}
                  wrap={false}
                />
              </div>
            ) : (
              <p className="text-sm text-codes">{t.error}</p>
            )}
          </>
        )}
      </CardBody>
    </Card>
  );
}

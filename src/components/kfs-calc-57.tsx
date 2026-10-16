"use client";

import { useMemo, useState } from "react";
import { NumberField } from "@/components/ui/field";
import { InfoNote } from "@/components/ui/info-note";
import { DrawingView } from "@/components/drawing-view";
import { c, Grid, Section } from "@/components/kfs-ui";
import { CMD, GIBSON3, KOK_DIST, fmt, intensities, lab1, lab2, lab3, lab4, lab5, lab6, lab7, pairKey, share, type KfsVariant } from "@/lib/algorithms/kfs";
import { bars, fan, finalStructure, flowGraph, fragment, kokTree, perRequest, rowsLayout, star, treeLayout } from "@/lib/algorithms/kfs-figures";

/** Расчёты ЛР4 и интенсивности заявок — общая основа ЛР5–ЛР7. */
function useBase(v: KfsVariant) {
  return useMemo(() => {
    const l1 = lab1(v);
    const l3 = lab3(v);
    const l4 = lab4(v);
    const lam = intensities(v, l3);
    return { l1, l3, l4, lam, missing: Object.entries(lam).filter(([, x]) => x == null).map(([k]) => k) };
  }, [v]);
}

function LamNote({ missing }: { missing: string[] }) {
  return (
    <>
      <p className="text-sm leading-relaxed text-ink-dim">
        Интенсивность заявок ДП задана в файле варианта. Для заявок ТП её в файле нет — берётся интенсивность сигнала из ЛР3:
        заявка ДІ11 — это сигнал ДІ1 технологического процесса ТП1, её λ — сумма интенсивностей ДІ1 на участках ТП1.
      </p>
      {missing.length > 0 && <InfoNote title="Нет интенсивности">Для заявок {missing.join(", ")} λ не найдена — они считаются с λ = 0.</InfoNote>}
    </>
  );
}

const mb = (x: number) => fmt(x, 2);

// --- ЛР5 -----------------------------------------------------------------------------

export function Lab5View({ v }: { v: KfsVariant }) {
  const { l4, lam, missing } = useBase(v);
  const l5 = useMemo(() => lab5(v, l4, lam), [v, l4, lam]);
  const ms = v.mkp.map((m) => `МКП ${m.n}`);
  return (
    <>
      <Section title="Номинальное быстродействие">
        <p className="text-sm leading-relaxed text-ink-dim">
          V<sub>ном</sub> = 1 / t: при времени команды в микросекундах (ЛР4, такты по табл. 2 методички ЛР4) — миллионы операций в
          секунду. Методичка требует две таблицы и семь диаграмм: по одной на каждый вид команды и на каждый МКП.
        </p>
        <Grid title="Час виконання команд мікропроцесорами t, мкс" head={["Команда", ...ms]} rows={CMD.map((cm, ci) => [cm, ...v.mkp.map((_, i) => fmt(l4.t[i][ci], 6))])} />
        <Grid title="Номінальна швидкодія мікропроцесорів V ном, млн оп/с" head={["Команда", ...ms]} rows={CMD.map((cm, ci) => [cm, ...v.mkp.map((_, i) => fmt(l5.vnom[i][ci], 1))])} />
        <div className="grid gap-4 lg:grid-cols-2">
          {CMD.map((cm, ci) => (
            <DrawingView key={cm} drawing={bars(v.mkp.map((m) => `МКП ${m.n}\n${m.name}`), v.mkp.map((_, i) => l5.vnom[i][ci]), "млн оп/с")} title={`Номінальна швидкодія МКП на команді «${cm}»`} />
          ))}
          {v.mkp.map((m, i) => (
            <DrawingView key={m.n} drawing={bars([...CMD], l5.vnom[i], "млн оп/с")} title={`Номінальна швидкодія МКП ${m.n} (${m.name}) на командах`} />
          ))}
        </div>
      </Section>
      <Section title="Смесь Гибсон-3 (для ознакомления)">
        <p className="text-sm leading-relaxed text-ink-dim">
          V<sub>mix</sub> = 1 / Σ w<sub>c</sub>·t<sub>c</sub>. Методичка требует только таблицу: время большинства команд смеси для
          процессоров варианта не задано.
        </p>
        <Grid title="Суміш команд Гібсон-3" head={["№", "Операція", "Вага, %"]} rows={[...GIBSON3.map(([n, w], i) => [String(i + 1), n, fmt(w, 1)]), [c("", undefined, true), c("Разом", undefined, true), c("100,0", undefined, true)]]} />
      </Section>
      <Section title="Быстродействие на смеси команд системы">
        <LamNote missing={missing} />
        <p className="text-sm leading-relaxed text-ink-dim">
          k<sub>cz</sub> — число команд вида c в заявке z по её цепочке ФПБ (альтернативы — с вероятностями, как время в ЛР4);
          p<sub>cz</sub> = k<sub>cz</sub> / Σk; V<sub>ком</sub> = 1 / Σ p<sub>cz</sub>·t<sub>c</sub>.
        </p>
        <Grid
          title="Вірогідність появи команд у заявках і швидкодія на суміші команд заявки, млн оп/с"
          head={["z", "Заявка", ...CMD.map((cm) => `p ${cm}`), ...ms]}
          rows={l5.rows.map((r, i) => [String(i + 1), r.name, ...r.p.map((x) => fmt(x, 3)), ...r.vcom.map((x) => fmt(x, 1))])}
          note={`Середня швидкодія на суміші команд системи: ${l5.vavg.map((x, i) => `${ms[i]} — ${fmt(x, 2)}`).join(", ")} млн оп/с.`}
        />
        <DrawingView drawing={perRequest(v.mkp.map((m, i) => ({ label: `МКП ${m.n}`, values: l5.rows.map((r) => r.vcom[i]) })), l5.vavg, "млн оп/с")} title="Швидкодія МКП на суміші команд заявок і середня швидкодія" />
      </Section>
      <Section title="Быстродействие на смеси транзакций">
        <p className="text-sm leading-relaxed text-ink-dim">
          V<sub>тр</sub> = Σλ<sub>z</sub> / Σλ<sub>z</sub>·t<sub>zm</sub> (t — в секундах). По формуле это заявок в секунду; в табл. 7
          методички единица подписана «млн оп/с».
        </p>
        <Grid
          title="Інтенсивність заявок, час виконання і добуток λ·t"
          head={["z", "Заявка", "λ, 1/с", ...ms.map((m) => `t ${m}, мкс`), ...ms.map((m) => `λt ${m}`)]}
          rows={[
            ...l5.rows.map((r, i) => [String(i + 1), r.name, fmt(r.lam, 3), ...r.time.map((t) => fmt(t, 1)), ...r.lt.map((x) => fmt(x, 4))]),
            [c("", undefined, true), c("Сума", undefined, true), c(fmt(l5.sumLam, 3), undefined, true), ...ms.map(() => ""), ...l5.sumLt.map((x) => c(fmt(x, 4), undefined, true))],
          ]}
          note={`Vтр: ${l5.vtr.map((x, i) => `${ms[i]} — ${fmt(x, 2)}`).join(", ")} заявок/с. Сумма λ·t — загрузка одного МКП всеми заявками: ${l5.sumLt.map((x) => fmt(x, 2)).join(", ")}${l5.sumLt[0] > 1 ? " — первый МКП один бы не справился, заявки распределяются по КОК (ЛР7)." : "."}`}
        />
        <DrawingView drawing={bars(ms, l5.vtr, "заявок/с")} title="Швидкодія МКП на суміші транзакцій" />
      </Section>
    </>
  );
}

// --- ЛР6 -----------------------------------------------------------------------------

export function Lab6View({ v }: { v: KfsVariant }) {
  const { l4, lam, missing } = useBase(v);
  const l6 = useMemo(() => lab6(v, l4, lam), [v, l4, lam]);
  const tps = v.names.filter((n) => n.startsWith("ТП"));
  const dps = v.names.filter((n) => n.startsWith("ДП"));
  const pos = rowsLayout(tps, dps);
  const nDb = (q: (typeof l4.reqs)[number]) => q.steps.reduce((s, st) => s + st.terms.reduce((a, [, f]) => a + (v.db ?? []).filter((d) => d.frac[f - 1]).length, 0), 0);
  // пример: заявка ТП с керуючим впливом и одним получателем, самая простая цепочка
  const cand = l4.reqs.filter((q) => q.obj.startsWith("ТП") && (q.ctrl ?? "").startsWith("ТАК") && !(q.to ?? "").includes(","));
  const auto = [...(cand.length ? cand : l4.reqs)].sort((a, b) => a.steps.filter((s) => s.terms.length > 1).length - b.steps.filter((s) => s.terms.length > 1).length || nDb(a) - nDb(b))[0];
  const [sel, setSel] = useState<string | null>(null);
  const q = l4.reqs.find((r) => r.name === sel) ?? auto;
  const lz = lam[q.name] ?? 0;
  const ctrlTo = (q.ctrl ?? "").startsWith("ТАК") ? (/\((ТП\d+)\)/.exec(q.ctrl ?? "")?.[1] ?? q.obj) : null;
  const first = q.steps.flatMap((st) => st.terms.map(([, f]) => f)).map((f) => ({ f, a: (v.db ?? []).find((d) => d.frac[f - 1]) })).find((x) => x.a);
  const flowsOf = (o: Record<string, number>) => Object.entries(o).map(([k, x]) => [...(k.split("→") as [string, string]), x] as [string, string, number]);
  if (!v.db?.length) return <InfoNote title="Нет массивов БД">В файле не найдены массивы БД (лист «ФПБ», строки «М1(…Мбайт)»). Если файл загружался до появления ЛР5–ЛР7, загрузите его заново.</InfoNote>;
  return (
    <>
      <Section title="Фрагмент информационно-функциональной структуры">
        <LamNote missing={missing} />
        <label className="block max-w-xs text-sm text-ink-dim">
          <span className="mb-1 block text-xs text-ink-faint">Заявка для примера</span>
          <select className="w-full rounded-[3px] border border-border bg-transparent px-2 py-1.5 text-ink" value={q.name} onChange={(e) => setSel(e.target.value)}>
            {l4.reqs.map((r) => (
              <option key={r.name} value={r.name} className="bg-background">
                {r.obj} · {r.name}
              </option>
            ))}
          </select>
        </label>
        <DrawingView
          drawing={fragment(q.steps, q.obj, ctrlTo, lz, (v.db ?? []).map((d) => [d.name, d.size]), (a, f) => v.db?.find((d) => d.name === a)?.frac[f - 1] ?? 0, (q.to ?? "").split(",").filter(Boolean).map((t) => [t, q.vol ?? 0]))}
          title={`Ланцюжок заявки ${q.name} зі звертанням до БД (перші два кроки), повідомленнями і керуючим впливом`}
        />
        <div className="space-y-1 font-mono text-sm text-ink-dim">
          <div>керуючий вплив: q = 2 × 8 × {fmt(lz, 3)} = {fmt(16 * lz, 1)} біт/с{ctrlTo ? ` (на ${ctrlTo})` : " — у цієї заявки впливу немає"}</div>
          <div>
            повідомлення: q = {q.vol ?? 0} × 8 × {fmt(lz, 3)} = {fmt(8 * (q.vol ?? 0) * lz, 1)} біт/с ({q.to ?? "—"})
          </div>
          {first?.a && (
            <div>
              БД: Ф{first.f} читає з {first.a.name} частку {share(first.a.frac[first.f - 1])}: {share(first.a.frac[first.f - 1])} × {fmt(lz, 3)} × {first.a.size} ={" "}
              {fmt(first.a.frac[first.f - 1] * lz * first.a.size, 3)} Мбайт/с; разом за ланцюжком {mb(l6.dbReq[q.name])} Мбайт/с
            </div>
          )}
        </div>
        <p className="text-sm leading-relaxed text-ink-dim">
          Формула потока к БД — с рис. 1 методички: на стрелках к массивам подписано «частка*λ*обсяг». Программы CSprj, которой
          методичка считает потоки к БД, у студентов нет. Все обращения считаются чтением, как в методичке.
        </p>
      </Section>
      <Section title="Потоки управляющих воздействий">
        <p className="text-sm leading-relaxed text-ink-dim">
          Воздействие кодируется 2 байтами: q = 16·λ бит/с. Для ТП воздействие идёт на тот ТП, откуда пришёл сигнал (петля), для ДП
          адрес указан в файле («ТАК(ТП2)»).
        </p>
        <Grid title="Інтенсивність потоків керуючих впливів, біт/с" head={["Відправник", ...tps.map((t) => `на ${t}`)]} rows={v.names.map((o) => [o, ...tps.map((t) => (l6.ctrl[`${o}→${t}`] != null ? String(Math.round(l6.ctrl[`${o}→${t}`])) : "–"))])} />
        <DrawingView drawing={flowGraph(pos, flowsOf(l6.ctrl))} title="Граф інформаційних потоків керуючих впливів, біт/с" />
      </Section>
      <Section title="Потоки сообщений">
        <p className="text-sm leading-relaxed text-ink-dim">q = λ·V·8 бит/с каждому получателю из столбца «Кому» (объём V — в байтах).</p>
        <Grid title="Інтенсивність потоків повідомлень, біт/с" head={["Відправник", ...dps.map((t) => `до ${t}`)]} rows={v.names.map((o) => [o, ...dps.map((t) => (l6.msg[`${o}→${t}`] != null ? String(Math.round(l6.msg[`${o}→${t}`])) : "–"))])} />
        <DrawingView drawing={flowGraph(pos, flowsOf(l6.msg))} title="Граф інформаційних потоків повідомлень, біт/с" />
      </Section>
      <Section title="Потоки к базе данных">
        <Grid
          title="Потоки заявок до масивів БД, Мбайт/с"
          head={["Заявка", ...(v.db ?? []).map((d) => `${d.name} (${d.size})`), "Разом"]}
          rows={l4.reqs.map((r) => [r.name, ...(v.db ?? []).map((d) => (l6.dbDetail[r.name][d.name] ? mb(l6.dbDetail[r.name][d.name]) : "–")), c(mb(l6.dbReq[r.name]), undefined, true)])}
        />
        <Grid title="Потоки до масивів БД за об'єктами, Мбайт/с" head={["Об'єкт", ...(v.db ?? []).map((d) => d.name), "Разом"]} rows={v.names.map((o) => [o, ...(v.db ?? []).map((d) => mb(l6.dbArr[`${o}→${d.name}`] ?? 0)), c(mb(l6.dbObj[o] ?? 0), undefined, true)])} />
        {(() => {
          const half = Math.ceil(l4.reqs.length / 2);
          const items = l4.reqs.map((r) => [r.name, l6.dbReq[r.name]] as [string, number]);
          return <DrawingView drawing={fan("БД", items.slice(0, half), items.slice(half), mb)} title="Граф інформаційних потоків до бази даних за заявками, Мбайт/с" />;
        })()}
        <DrawingView drawing={star("БД", v.names.map((o) => [o, l6.dbObj[o] ?? 0]), mb)} title="Узагальнена структура інформаційних потоків до бази даних, Мбайт/с" />
      </Section>
      <Section title="Обобщённая информационная структура">
        <p className="text-sm leading-relaxed text-ink-dim">
          Неориентированный граф: для каждой пары объектов сложены сообщения и управляющие воздействия в обе стороны. Петли не
          учитываются — это внутренний интерфейс КОК.
        </p>
        <Grid
          title="Узагальнені інформаційні потоки між об'єктами, біт/с"
          head={["Пара", "Повідомлення", "Керуючі впливи", "Разом"]}
          rows={Object.entries(l6.gen).map(([k, x]) => {
            const [a, b] = k.split("|");
            const m = (l6.msg[`${a}→${b}`] ?? 0) + (l6.msg[`${b}→${a}`] ?? 0);
            return [`${a} – ${b}`, String(Math.round(m)), String(Math.round(x - m)), c(String(Math.round(x)), undefined, true)];
          })}
        />
        <DrawingView drawing={flowGraph(pos, Object.entries(l6.gen).map(([k, x]) => [...(k.split("|") as [string, string]), x] as [string, string, number]), { directed: false })} title="Граф узагальненої структури інформаційних потоків, біт/с" />
      </Section>
    </>
  );
}

// --- ЛР7 -----------------------------------------------------------------------------

export function Lab7View({ v }: { v: KfsVariant }) {
  const { l1, l4, lam, missing } = useBase(v);
  const [dText, setDText] = useState("");
  const dUser = dText.trim() ? Number(dText.replace(",", ".")) : undefined;
  const kokDist = dUser != null && dUser >= 0 ? dUser : KOK_DIST;
  const data = useMemo(() => {
    const trees = lab2(l1);
    const l6 = lab6(v, l4, lam);
    return { l6, l7: lab7(v, l1, trees, l4, l6, lam, kokDist) };
  }, [v, l1, l4, lam, kokDist]);
  if (!v.db?.length) return <InfoNote title="Нет массивов БД">В файле не найдены массивы БД. Если файл загружался до появления ЛР5–ЛР7, загрузите его заново.</InfoNote>;
  const { l7 } = data;
  const nm = (id: string) => id.replace(/_/g, ", ");
  const names = Object.fromEntries(l7.ids.map((id) => [id, id.replace(/_/g, ",\n")]));
  // деревья — иерархией от вершины с наибольшей степенью: на схеме по координатам близкие кластеры налезают
  const hub = (edges: [string, string][]) => l7.ids.reduce((m, n) => (edges.filter((e) => e.includes(n)).length > edges.filter((e) => e.includes(m)).length ? n : m), l7.ids[0]);
  const posMax = treeLayout(l7.maxst, hub(l7.maxst), 130, 120);
  const posCab = treeLayout(l7.mkdke, hub(l7.mkdke), 130, 120);
  const kname = Object.fromEntries(l7.koks.map((k) => [k.id, k.name]));
  const removed = Object.entries(l7.flows).filter(([p]) => !l7.maxst.some((e) => pairKey(...e) === p));
  const near = [...v.names.flatMap((a, i) => v.names.slice(i + 1).map((b) => ({ a, b, d: Math.hypot(v.xy[a][0] - v.xy[b][0], v.xy[a][1] - v.xy[b][1]) })))].sort((p, q) => p.d - q.d).slice(0, 4);
  const cm = l7.cmp;
  const dl = cm.maxst.len - cm.mkdke.len;
  const dp = cm.mkdke.flow - cm.maxst.flow;
  const ms = [...v.mkp].sort((a, b) => a.f - b.f);
  const tpos = treeLayout(l7.final.map((e) => [e.a, e.b] as [string, string]), l7.central.id, 130, 120);
  const fpos = treeLayout(l7.final.map((e) => [e.a, e.b] as [string, string]), l7.central.id, 250, 175);
  return (
    <>
      <Section title="КОК и МаксКД информационных потоков">
        <LamNote missing={missing} />
        <p className="text-sm leading-relaxed text-ink-dim">
          ТО в одном здании (по методичке — ближе {fmt(KOK_DIST, 3)} км) обслуживает один КОК, их потоки складываются. Ближайшие пары:{" "}
          {near.map((p) => `${p.a}–${p.b} ${Math.round(p.d * 1000)} м`).join(", ")}. Если преподаватель считает, что ДП стоят в одном
          здании с ТП, задайте расстояние больше — например 0,07 км.
        </p>
        <div className="max-w-xs">
          <NumberField label="Расстояние объединения в КОК, км" hint={`пусто — ${fmt(KOK_DIST, 3)}`} step="0.001" min={0} value={dText} onChange={(e) => setDText(e.target.value)} />
        </div>
        <Grid
          title="Побудова МаксКД (Краскал за спаданням потоку)"
          head={["Ребро", "Потік, біт/с", "Рішення"]}
          rows={l7.rows.filter((r) => r.w > 0).map((r) => [`${nm(r.a)} – ${nm(r.b)}`, c(String(Math.round(r.w)), r.mark === "МаксКД" ? "tree" : undefined), r.mark === "МаксКД" ? "у дерево" : r.mark === "-" ? "цикл, потік перерозподіляється" : "дерево вже побудовано"])}
        />
        <Grid
          title="Перерозподіл потоків видалених ребер по МаксКД"
          head={["Видалене ребро", "Потік, біт/с", "Шлях у дереві"]}
          rows={removed.sort((p, q) => q[1] - p[1]).map(([p, x]) => {
            const [a, b] = p.split("|");
            return [`${nm(a)} – ${nm(b)}`, String(Math.round(x)), l7.pathNodes(l7.maxst, a, b).map(nm).join(" → ")];
          })}
        />
        <DrawingView drawing={kokTree(posMax, names, l7.maxst.map(([a, b]) => [a, b, String(Math.round(l7.loadMax[pairKey(a, b)]))]))} title="МаксКД інформаційних потоків (потоки після перерозподілу), біт/с" />
      </Section>
      <Section title="Сравнение с МКДке">
        <p className="text-sm leading-relaxed text-ink-dim">
          На структуру коммуникаций МКДке (ЛР2) накладываются потоки: каждый поток идёт к получателю по пути в дереве. Сравниваются
          суммарная длина каналов L и суммарный поток P по каналам.
        </p>
        <div className="grid gap-4 lg:grid-cols-2">
          <DrawingView drawing={kokTree(posCab, names, l7.mkdke.map(([a, b]) => [a, b, `${fmt(l7.cableLen(a, b))} км\n${Math.round(l7.loadCab[pairKey(a, b)])} біт/с`]))} title={`МКДке: L = ${fmt(cm.mkdke.len)} км, P = ${Math.round(cm.mkdke.flow)} біт/с`} />
          <DrawingView drawing={kokTree(posMax, names, l7.maxst.map(([a, b]) => [a, b, `${fmt(l7.cableLen(a, b))} км\n${Math.round(l7.loadMax[pairKey(a, b)])} біт/с`]))} title={`МаксКД: L = ${fmt(cm.maxst.len)} км, P = ${Math.round(cm.maxst.flow)} біт/с`} />
        </div>
        <p className="text-sm leading-relaxed text-ink-dim">
          {dl > 0 && dp > 0
            ? `Варианты не совпадают: МКДке короче на ${fmt(dl)} км, МаксКД несёт на ${Math.round(dp)} бит/с меньше. По методичке выбор согласуется с заказчиком; структура коммуникаций в методичке — МКДке, она и берётся дальше.`
            : dl <= 0 && dp >= 0
              ? "МаксКД не хуже МКДке по обоим показателям. Дальше сайт всё равно строит структуру на МКДке — так в методичке; при согласовании с заказчиком можно выбрать МаксКД."
              : "Дальше структура строится на МКДке — так в методичке."}
        </p>
      </Section>
      <Section title="КОК, микропроцессоры и загрузка">
        <p className="text-sm leading-relaxed text-ink-dim">
          МКП по правилу методички: только ДП — минимальная частота ({ms[0].name}), один ТП — средняя ({ms[Math.min(1, ms.length - 1)].name}), ТП с ДП —
          максимальная ({ms[ms.length - 1].name}). ρ = λ·T: если заявка или КОК загружает МКП больше 0,6 — берётся мощнее; если R КОК
          не больше 0,1 — слабее (как в примере методички, по R КОК).
        </p>
        <Grid title="Розподілення ТО по КОК, вибір МКП" head={["КОК", "ТО", "МКП", "Заявки"]} rows={l7.koks.map((k) => [k.name, k.to.join(", "), k.mkp.name, k.reqs.join(", ")])} />
        <Grid
          title="Завантаження процесорів КОК"
          head={["КОК", "Заявка", "λ, 1/с", "T, мкс", "ρ"]}
          rows={l7.koks.flatMap((k) => k.reqs.map((z) => [k.name, z, fmt(lam[z] ?? 0, 3), fmt(l4.reqs.find((r) => r.name === z)!.time[v.mkp.indexOf(k.mkp)], 1), fmt(k.rho[z], 4)]))}
        />
        <Grid title="Сумарне завантаження КОК" head={["КОК", "ТО", "МКП", "R"]} rows={l7.koks.map((k) => [k.name, k.to.join(", "), k.mkp.name, c(fmt(k.R, 4), undefined, true)])} />
      </Section>
      <Section title="Центральная база данных">
        <p className="text-sm leading-relaxed text-ink-dim">
          Центральная БД — в КОК с наибольшей интенсивностью обращений к БД: при актуализации по сети идут потоки остальных КОК, и
          их сумма тогда минимальна (на рис. 8 методички подписи «ЦБД в КОК-1» и «ЦБД в КОК-2» перепутаны, вывод верный).
        </p>
        <Grid title="Навантаження мережі при актуалізації, Мбайт/с" head={["ЦБД у", "Потік КОК до БД", "Сума потоків решти КОК"]} rows={l7.koks.map((k) => [k.name, mb(k.db), c(mb(l7.place[k.name]), k === l7.central ? "tree" : undefined)])} />
        <div className="grid gap-4 lg:grid-cols-2">
          <DrawingView drawing={star("БД", l7.koks.map((k) => [k.name, k.db]), mb)} title="Потоки від бази даних за КОК, Мбайт/с" />
          <DrawingView drawing={kokTree(tpos, Object.fromEntries(l7.ids.map((id) => [id, `${kname[id]}\n${nm(id)}`])), l7.final.map((e) => [e.a, e.b, mb(e.db)]), { r: 30, cbd: l7.central.id })} title={`Потоки актуалізації БД по каналах при ЦБД у ${l7.central.name}, Мбайт/с`} />
        </div>
      </Section>
      <Section title="Рациональная техническая структура">
        <DrawingView
          drawing={finalStructure(
            fpos,
            Object.fromEntries(l7.koks.map((k) => [k.id, [k.name, k.to.join(", "), k.mkp.name, `R = ${fmt(k.R, 3)}`]])),
            l7.final.map((e) => [e.a, e.b, [`Рраб = ${Math.round(e.work)} біт/с`, `Рбд = ${fmt(e.db, 1)} Мбайт/с`, `L = ${fmt(e.len)} км`]]),
            l7.central.id,
          )}
          title="Раціональний варіант структури КС керування підприємством"
        />
      </Section>
    </>
  );
}

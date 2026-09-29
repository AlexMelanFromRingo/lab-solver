"use client";

import { useMemo, useState } from "react";
import { Card, CardBody } from "@/components/ui/card";
import { SelectField } from "@/components/ui/field";
import { OutputBlock } from "@/components/ui/output-block";
import {
  FE_CABLE,
  FE_DIAMETER,
  FE_RULE_LABEL,
  SEG10,
  checkEthernet10,
  fastEthernetPdv,
  type FeCable,
  type FeMedia,
  type FeRule,
  type FeSegment,
  type Seg10,
  type Segment10,
} from "@/lib/algorithms/lan";

const inputClass =
  "w-24 rounded-[3px] border border-border bg-surface-2 px-2.5 py-2 font-mono text-sm text-ink focus:border-border-strong focus:outline-none";

function SegmentRow<T extends string>({
  index,
  type,
  types,
  length,
  onType,
  onLength,
  onRemove,
}: {
  index: number;
  type: T;
  types: T[];
  length: number;
  onType: (t: T) => void;
  onLength: (n: number) => void;
  onRemove?: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-6 font-mono text-xs text-ink-faint">{index + 1}</span>
      <select
        value={type}
        onChange={(e) => onType(e.target.value as T)}
        className="rounded-[3px] border border-border bg-surface-2 px-2.5 py-2 font-mono text-sm text-ink"
      >
        {types.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      <input type="number" min={0} value={length} onChange={(e) => onLength(Number(e.target.value))} className={inputClass} />
      <span className="text-xs text-ink-faint">м</span>
      {onRemove && (
        <button type="button" onClick={onRemove} className="text-xs text-ink-faint hover:text-ink-dim">
          убрать
        </button>
      )}
    </div>
  );
}

/** PDV и PVV сети Ethernet 10 Мбит/с (ЛР E1). */
export function Ethernet10Calc({ accent }: { accent: string }) {
  const [path, setPath] = useState<Segment10[]>([
    { type: "10Base-T", length: 11 },
    { type: "10Base-FL", length: 200 },
    { type: "10Base-FL", length: 200 },
    { type: "10Base-T", length: 11 },
  ]);
  const res = useMemo(() => {
    try {
      return { ok: true as const, c: checkEthernet10(path) };
    } catch (e) {
      return { ok: false as const, error: (e as Error).message };
    }
  }, [path]);
  const update = (i: number, patch: Partial<Segment10>) => setPath((p) => p.map((s, j) => (j === i ? { ...s, ...patch } : s)));

  return (
    <Card>
      <CardBody className="space-y-4 pt-6">
        <h2 className="font-display text-lg font-semibold text-ink">PDV и PVV: Ethernet 10 Мбит/с</h2>
        <p className="text-sm leading-relaxed text-ink-dim">
          Сегменты пути между двумя самыми удалёнными станциями — слева направо, от станции до станции через
          повторители и хабы. По умолчанию — пример варианта 43 из методички.
        </p>
        <div className="space-y-2">
          {path.map((s, i) => (
            <SegmentRow
              key={i}
              index={i}
              type={s.type}
              types={Object.keys(SEG10) as Seg10[]}
              length={s.length}
              onType={(type) => update(i, { type })}
              onLength={(length) => update(i, { length })}
              onRemove={path.length > 2 ? () => setPath((p) => p.filter((_, j) => j !== i)) : undefined}
            />
          ))}
          <button
            type="button"
            onClick={() => setPath((p) => [...p.slice(0, -1), { type: "10Base-FL", length: 100 }, p[p.length - 1]])}
            className="rounded-[3px] border px-3 py-1.5 text-sm text-ink hover:bg-white/5"
            style={{ borderColor: accent }}
          >
            Добавить промежуточный сегмент
          </button>
        </div>
        {res.ok ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <OutputBlock
              label={`PDV ${res.c.pdv.ok ? "≤" : ">"} 575 bt`}
              value={[
                ...res.c.pdv.terms.map((t) => `${t.segment} (${t.role}): ${t.expr} = ${t.value}`),
                `итого ${res.c.pdv.total} bt`,
                ...(res.c.pdv.reverse !== undefined ? [`справа налево ${res.c.pdv.reverse} bt — берётся большее`] : []),
              ].join("\n")}
            />
            <OutputBlock
              label={`PVV ${res.c.pvv.ok ? "≤" : ">"} 49 bt`}
              value={[
                ...res.c.pvv.terms.map((t) => `${t.segment} (${t.role}): ${t.value}`),
                `итого ${res.c.pvv.total} bt`,
                ...(res.c.pvv.reverse !== undefined ? [`справа налево ${res.c.pvv.reverse} bt — берётся большее`] : []),
              ].join("\n")}
            />
            <OutputBlock
              label="Длины и повторители"
              className="sm:col-span-2"
              value={[
                ...(res.c.lengthProblems.length ? res.c.lengthProblems : ["длины сегментов в пределах стандарта"]),
                `повторителей на пути: ${res.c.repeaters} (не больше 4)`,
              ].join("\n")}
            />
          </div>
        ) : (
          <p className="text-sm text-codes">{res.error}</p>
        )}
      </CardBody>
    </Card>
  );
}

/** Зона конфликта и PDV Fast Ethernet (ЛР E3, E4). */
export function FastEthernetCalc({ accent }: { accent: string }) {
  const [rule, setRule] = useState<FeRule>("class1");
  const [media, setMedia] = useState<FeMedia>("mixed");
  const [segs, setSegs] = useState<FeSegment[]>([{ cable: "UTP Cat 5", length: 22 }]);
  const diameter = FE_DIAMETER[rule][media];
  const pdv = fastEthernetPdv(segs, rule);
  const span = segs.reduce((a, s) => a + s.length, 0);
  const update = (i: number, patch: Partial<FeSegment>) => setSegs((p) => p.map((s, j) => (j === i ? { ...s, ...patch } : s)));

  return (
    <Card>
      <CardBody className="space-y-4 pt-6">
        <h2 className="font-display text-lg font-semibold text-ink">Зона конфликта и PDV: Fast Ethernet</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField label="Правило" value={rule} onChange={(e) => setRule(e.target.value as FeRule)}>
            {(Object.keys(FE_RULE_LABEL) as FeRule[]).map((r) => (
              <option key={r} value={r}>
                {FE_RULE_LABEL[r]}
              </option>
            ))}
          </SelectField>
          <SelectField label="Среда в зоне" value={media} onChange={(e) => setMedia(e.target.value as FeMedia)}>
            <option value="copper">только витая пара (TX)</option>
            <option value="fiber">только оптика (FX)</option>
            <option value="mixed">витая пара и оптика (TX и FX)</option>
          </SelectField>
        </div>
        <p className="text-sm text-ink-dim">
          Путь между самыми удалёнными станциями зоны конфликта — кабели по порядку:
        </p>
        <div className="space-y-2">
          {segs.map((s, i) => (
            <SegmentRow
              key={i}
              index={i}
              type={s.cable}
              types={Object.keys(FE_CABLE) as FeCable[]}
              length={s.length}
              onType={(cable) => update(i, { cable })}
              onLength={(length) => update(i, { length })}
              onRemove={segs.length > 1 ? () => setSegs((p) => p.filter((_, j) => j !== i)) : undefined}
            />
          ))}
          <button
            type="button"
            onClick={() => setSegs((p) => [...p, { cable: "Оптоволокно", length: 200 }])}
            className="rounded-[3px] border px-3 py-1.5 text-sm text-ink hover:bg-white/5"
            style={{ borderColor: accent }}
          >
            Добавить кабель
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <OutputBlock
            label="Диаметр зоны конфликта"
            value={
              diameter === null
                ? "для этого правила смешанной среды нет"
                : `${span} м ${span <= diameter ? "≤" : ">"} ${diameter} м — ${span <= diameter ? "допустимо" : "сеть так не построить"}`
            }
          />
          <OutputBlock label={`PDV ${pdv.ok ? "≤" : ">"} 512 bt`} value={`${pdv.expr} = ${pdv.total} bt`} />
        </div>
        <p className="text-xs leading-relaxed text-ink-faint">
          Задержки на метр (туда и обратно): Cat 3 и 4 — 1,14 bt, Cat 5 и STP — 1,112 bt, оптика — 1 bt; пара станций
          TX/FX — 100 bt; повторитель I класса — 140 bt, II класса — 92 bt.
        </p>
      </CardBody>
    </Card>
  );
}

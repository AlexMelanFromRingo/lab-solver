"use client";

import { useState } from "react";
import { Card, CardBody } from "@/components/ui/card";
import { SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { OutputBlock } from "@/components/ui/output-block";
import { DEFAULT_SCHEMA, lab3Ddl, lab4Dml, lab5Dql, lab6Complex, parseFields, type Schema } from "@/lib/algorithms/access-sql";
import { erRule, normalize, parseFds, type Cls, type Degree } from "@/lib/algorithms/normalize";

function run<T>(fn: () => T): { ok: true; v: T } | { ok: false; error: string } {
  try {
    return { ok: true, v: fn() };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

const rel = (name: string, attrs: string[], key: string[]) => `${name} (${attrs.map((a) => (key.includes(a) ? `«${a}»` : a)).join(", ")})`;

/** Метод нормальних форм: 1НФ → 2НФ → 3НФ, перевірка БКНФ. За замовчуванням — приклад ВИКЛАДАЧ методички. */
export function NormalizerCalc() {
  const [attrs, setAttrs] = useState("Предмет, ПІБ, Група, Вид заняття, Посада, Оклад, Стаж, Надб_ст, Кафедра");
  const [key, setKey] = useState("Предмет, ПІБ, Група");
  const [fds, setFds] = useState("Предмет, ПІБ, Група -> Вид заняття\nПІБ -> Посада, Стаж, Кафедра\nПосада -> Оклад\nСтаж -> Надб_ст");
  const r = run(() => {
    const a = attrs.split(",").map((s) => s.trim()).filter(Boolean);
    const k = key.split(",").map((s) => s.trim()).filter(Boolean);
    return normalize(a, parseFds(fds), k);
  });
  return (
    <Card>
      <CardBody className="space-y-5 pt-6">
        <h2 className="font-display text-lg font-semibold text-ink">Метод нормальних форм</h2>
        <TextField label="Атрибути початкового відношення (через кому)" value={attrs} onChange={(e) => setAttrs(e.target.value)} />
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_16rem]">
          <TextAreaField label="Функціональні залежності «A, B -> C»" value={fds} onChange={(e) => setFds(e.target.value)} className="min-h-[8rem]" />
          <TextField label="Первинний ключ" hint="порожньо — перший знайдений" value={key} onChange={(e) => setKey(e.target.value)} />
        </div>
        {r.ok ? (
          <div className="space-y-4">
            <OutputBlock label="Потенційні ключі" value={r.v.keys.map((k) => `(${k.join(", ")})`).join("; ")} />
            <OutputBlock
              label="1НФ → 2НФ: часткові залежності"
              value={[
                r.v.partial.length ? r.v.partial.map((p) => `${p.lhs.join(", ")} → ${p.rhs.join(", ")} (частина ключа)`).join("\n") : "часткових залежностей немає — відношення вже в 2НФ",
                "",
                ...r.v.nf2.map((x) => `${rel(x.name, x.attrs, x.key)} — ${x.note}`),
              ].join("\n")}
              wrap={false}
            />
            <OutputBlock
              label="2НФ → 3НФ: транзитивні залежності"
              value={[
                r.v.transitive.length ? r.v.transitive.map((t) => `${t.lhs.join(", ")} → ${t.rhs.join(", ")}`).join("\n") : "транзитивних залежностей немає",
                "",
                ...r.v.nf3.map((x) => `${rel(x.name, x.attrs, x.key)} — ${x.note}`),
              ].join("\n")}
              wrap={false}
            />
            <OutputBlock
              label="Перевірка БКНФ"
              value={r.v.bcnfViolations.length ? r.v.bcnfViolations.map((v) => `${v.rel}: ${v.fd.lhs.join(", ")} → ${v.fd.rhs.join(", ")} — детермінант не є потенційним ключем`).join("\n") : "усі відношення в БКНФ: кожен детермінант — потенційний ключ"}
              wrap={false}
            />
          </div>
        ) : (
          <p className="text-sm text-codes">{r.error}</p>
        )}
      </CardBody>
    </Card>
  );
}

/** Правила формування відношень методу «сутність — зв'язок». */
export function ErCalc() {
  const [deg, setDeg] = useState<Degree>("1:Б");
  const [e1, setE1] = useState({ name: "ВИКЛАДАЧ", key: "ПІБ", cls: "обов'язковий" as Cls });
  const [e2, setE2] = useState({ name: "СТАЖ", key: "Стаж", cls: "необов'язковий" as Cls });
  const [verb, setVerb] = useState("МАЄ");
  const r = erRule(deg, e1, e2, verb);
  const entity = (e: typeof e1, set: (v: typeof e1) => void, label: string) => (
    <div className="grid grid-cols-3 gap-3">
      <TextField label={`${label}: назва`} value={e.name} onChange={(x) => set({ ...e, name: x.target.value })} />
      <TextField label="ключ" value={e.key} onChange={(x) => set({ ...e, key: x.target.value })} />
      <SelectField label="клас належності" value={e.cls} onChange={(x) => set({ ...e, cls: x.target.value as Cls })}>
        <option value="обов'язковий">обов&apos;язковий</option>
        <option value="необов'язковий">необов&apos;язковий</option>
      </SelectField>
    </div>
  );
  return (
    <Card>
      <CardBody className="space-y-5 pt-6">
        <h2 className="font-display text-lg font-semibold text-ink">Метод «сутність — зв&apos;язок»: правило для зв&apos;язку</h2>
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Зв'язок (дієслово)" value={verb} onChange={(x) => setVerb(x.target.value)} />
          <SelectField label="Ступінь зв'язку" value={deg} onChange={(x) => setDeg(x.target.value as Degree)}>
            <option value="1:1">1:1</option>
            <option value="1:Б">Б:1 (перша сутність — «багато»)</option>
            <option value="Б:Б">Б:Б</option>
          </SelectField>
        </div>
        {entity(e1, setE1, "Сутність 1")}
        {entity(e2, setE2, "Сутність 2")}
        <OutputBlock label={`Правило ${r.rule}`} value={`${r.why}\n\n${r.relations.join("\n")}`} wrap={false} />
      </CardBody>
    </Card>
  );
}

/** SQL програми Access для ЛР 3–6 за власною схемою «ІМЕННИК1 — ДІЄСЛОВО — ІМЕННИК2». */
export function AccessSqlCalc({ lab }: { lab: 3 | 4 | 5 | 6 }) {
  const [s, setS] = useState(DEFAULT_SCHEMA);
  const set = (k: keyof typeof s, v: string) => setS((x) => ({ ...x, [k]: v }));
  const r = run(() => {
    const schema: Schema = { e1: s.e1.trim(), verb: s.verb.trim(), e2: s.e2.trim(), f1: parseFields(s.f1), f2: parseFields(s.f2), fr: parseFields(s.fr || "") };
    if (!schema.f1.some((f) => f.key) || !schema.f2.some((f) => f.key)) throw new Error("Позначте ключове поле кожної сутності зірочкою *");
    return lab === 3 ? lab3Ddl(schema) : lab === 4 ? lab4Dml(schema) : lab === 5 ? lab5Dql(schema) : lab6Complex(schema);
  });
  return (
    <Card>
      <CardBody className="space-y-5 pt-6">
        <h2 className="font-display text-lg font-semibold text-ink">SQL для своєї бази даних</h2>
        <div className="grid grid-cols-3 gap-3">
          <TextField label="ІМЕННИК1" value={s.e1} onChange={(e) => set("e1", e.target.value)} />
          <TextField label="ДІЄСЛОВО" value={s.verb} onChange={(e) => set("verb", e.target.value)} />
          <TextField label="ІМЕННИК2" value={s.e2} onChange={(e) => set("e2", e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <TextAreaField label="Поля ІМЕННИК1 «Назва ТИП», ключ — *" value={s.f1} onChange={(e) => set("f1", e.target.value)} className="min-h-[9rem]" />
          <TextAreaField label="Власні поля зв'язку" value={s.fr} onChange={(e) => set("fr", e.target.value)} className="min-h-[9rem]" />
          <TextAreaField label="Поля ІМЕННИК2, ключ — *" value={s.f2} onChange={(e) => set("f2", e.target.value)} className="min-h-[9rem]" />
        </div>
        {r.ok ? (
          <div className="space-y-4">
            {r.v.map((q) => (
              <OutputBlock key={q.title} label={q.title} value={q.sql} wrap={false} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-codes">{r.error}</p>
        )}
      </CardBody>
    </Card>
  );
}

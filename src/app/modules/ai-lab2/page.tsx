"use client";

import { useMemo, useState } from "react";
import { ModuleHeader } from "@/components/module-header";
import { LabProcedure } from "@/components/lab-procedure";
import { Card, CardBody } from "@/components/ui/card";
import { InfoNote } from "@/components/ui/info-note";
import { NumberField, SelectField } from "@/components/ui/field";
import { VariantDial } from "@/components/ui/variant-dial";
import { FuzzyInference } from "@/components/fuzzy-inference";
import { FlsDownload } from "@/components/fls-download";
import { TermChart } from "@/components/fuzzy-chart";
import { categories, modules } from "@/lib/modules";
import { useLang } from "@/components/lang";
import { tr, type Loc } from "@/lib/i18n";
import { AI_GUIDES } from "@/lib/data/ai-labs";
import { FUZZY_VARIANTS } from "@/lib/data/ai-fuzzy-systems";
import {
  INITIAL_METHODS,
  METHOD_LABELS,
  approximationError,
  formatTerm,
  humanName,
  type Defuzz,
  type Methods,
  type Norm,
  type Variable,
} from "@/lib/algorithms/fuzzy-mamdani";

const mod = modules.find((m) => m.slug === "ai-lab2")!;
const accent = categories.ai.accent;
const procedure = AI_GUIDES["ai-lab2"];

const NORMS: Norm[] = ["minimum", "maximum"];
const DEFUZZ: Defuzz[] = ["cog", "fimax", "mom"];

/** Пять выпадающих списков программы — в том же порядке, что в её окне. */
const METHOD_FIELDS: { key: keyof Methods; label: Loc; options: readonly string[] }[] = [
  { key: "conj", label: { uk: "Кон’юнкція посилок", ru: "Конъюнкция посылок" }, options: NORMS },
  { key: "disj", label: { uk: "Диз’юнкція посилок", ru: "Дизъюнкция посылок" }, options: NORMS },
  { key: "impl", label: { uk: "Імплікація", ru: "Импликация" }, options: NORMS },
  { key: "accum", label: { uk: "Акумуляція", ru: "Аккумуляция" }, options: NORMS },
  { key: "defuzz", label: { uk: "Дефазифікація", ru: "Дефазификация" }, options: DEFUZZ },
];

function VariableCard({ variable, output }: { variable: Variable; output?: boolean }) {
  const { lang } = useLang();
  return (
    <div className="rounded-[4px] border border-border bg-black/20 px-4 py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm text-ink">
          {output && <span className="text-ink-faint">{tr({ uk: "вихід · ", ru: "выход · " }, lang)}</span>}
          {tr(variable.label, lang)}
        </span>
        <span className="font-mono text-xs text-ink-faint">
          [{String(variable.universe[0]).replace(".", ",")};{" "}
          {String(variable.universe[1]).replace(".", ",")}]
          {variable.unit ? `, ${tr(variable.unit, lang)}` : ""}
        </span>
      </div>

      <ul className="mt-3 space-y-1.5">
        {variable.terms.map((term) => (
          <li key={term.name} className="text-xs leading-relaxed">
            <span className="font-mono text-ink-dim">
              {humanName(term.name)}
              {term.label ? ` (${term.label})` : ""} ={" "}
              {term.formula ?? formatTerm(term)}
            </span>
            {term.formula && (
              <div className="mt-0.5 pl-3 font-mono text-[0.6875rem] text-ink-faint">
                приближение по {term.points.length} узлам: {formatTerm(term)} · наибольшее
                расхождение {approximationError(term).toFixed(3).replace(".", ",")}
              </div>
            )}
          </li>
        ))}
      </ul>

      {/* Графики входных переменных показаны ниже, на этапе фазификации, и
          там на них отмечено введённое значение — здесь они были бы вторыми. */}
      {output && (
        <div className="mt-3">
          <TermChart variable={variable} />
        </div>
      )}
    </div>
  );
}

export default function AiLab2Page() {
  const { lang } = useLang();
  const [variantNum, setVariantNum] = useState(1);
  const task = FUZZY_VARIANTS.find((t) => t.variant === variantNum)!;

  const [edits, setEdits] = useState<Record<number, Record<string, number>>>({});
  const values = edits[variantNum] ?? task.cases[0].values;

  const [methods, setMethods] = useState<Methods>(INITIAL_METHODS);
  const initial = useMemo(
    () => METHOD_FIELDS.every((f) => methods[f.key] === INITIAL_METHODS[f.key]),
    [methods]
  );

  const setValue = (name: string, value: number) =>
    setEdits((prev) => ({ ...prev, [variantNum]: { ...values, [name]: value } }));

  return (
    <div>
      <ModuleHeader module={mod} />
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        <InfoNote>
          {lang === "uk"
            ? "Завдання — спроектувати логіко-лінгвістичну систему за своїм варіантом і дослідити її за різних способів побудови нечітких операцій. Тут зібрані всі десять систем розділу 4.3: терми, база правил і контрольні набори, які методичка пропонує порахувати. Вивід розкладений за етапами, методи перемикаються, а готова система вивантажується файлом для самої програми."
            : "Задание — спроектировать логико-лингвистическую систему по своему варианту и исследовать её при разных способах построения нечётких операций. Здесь собраны все десять систем раздела 4.3: термы, база правил и контрольные наборы, которые методичка предлагает посчитать. Вывод разложен по этапам, методы переключаются, а готовая система выгружается файлом для самой программы."}
        </InfoNote>

        <LabProcedure guide={procedure} accent={accent} />

        <VariantDial value={variantNum} min={1} max={10} onChange={setVariantNum} accent={accent} />

        {/* --- Описание системы -------------------------------------------- */}
        <Card>
          <CardBody className="pt-6 space-y-5">
            <div>
              <p className="text-xs text-ink-faint">
                {tr({ uk: "Завдання", ru: "Задание" }, lang)} {task.variant}
              </p>
              <h2 className="mt-1 font-display text-xl font-semibold tracking-tight text-ink">
                {tr(task.title, lang)}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-dim">{tr(task.summary, lang)}</p>
            </div>

            <div className="space-y-4">
              {task.system.inputs.map((variable) => (
                <VariableCard key={variable.name} variable={variable} />
              ))}
              <VariableCard variable={task.system.output} output />
            </div>

            <p className="text-sm text-ink-dim">
              {tr({ uk: "База правил", ru: "База правил" }, lang)}: {task.system.rules.length}{" "}
              {task.system.rules.length % 10 === 1 && task.system.rules.length !== 11
                ? tr({ uk: "правило", ru: "правило" }, lang)
                : [2, 3, 4].includes(task.system.rules.length % 10) &&
                    ![12, 13, 14].includes(task.system.rules.length)
                  ? tr({ uk: "правила", ru: "правила" }, lang)
                  : tr({ uk: "правил", ru: "правил" }, lang)}
              . {tr({ uk: "Нижче, на етапі агрегування, видно кожну посилку і силу кожного правила.", ru: "Ниже, на этапе агрегирования, видна каждая посылка и сила каждого правила." }, lang)}
            </p>
          </CardBody>
        </Card>

        {/* --- Входные значения и методы ------------------------------------ */}
        <Card>
          <CardBody className="pt-6 space-y-6">
            <div>
              <h2 className="font-display text-xl font-semibold tracking-tight text-ink">
                {tr({ uk: "Вхідні значення", ru: "Входные значения" }, lang)}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-ink-dim">
                {tr({ uk: "Кнопками підставляються набори, які методичка пропонує дослідити.", ru: "Кнопками подставляются наборы, которые методичка предлагает исследовать." }, lang)}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {task.system.inputs.map((variable) => (
                <NumberField
                  key={variable.name}
                  label={tr(variable.label, lang)}
                  hint={variable.unit ? tr(variable.unit, lang) : undefined}
                  value={String(values[variable.name] ?? "")}
                  onChange={(e) => setValue(variable.name, Number(e.target.value))}
                />
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {task.cases.map((c, ci) => (
                <button
                  key={ci}
                  type="button"
                  onClick={() => setEdits((prev) => ({ ...prev, [variantNum]: c.values }))}
                  className="rounded-[3px] border border-border px-3 py-1.5 text-xs text-ink-dim transition-colors hover:border-border-strong hover:text-ink"
                >
                  {tr(c.label, lang)}
                </button>
              ))}
            </div>

            <div className="border-t border-border pt-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-display text-base font-semibold tracking-tight text-ink">
                  Способы построения операций
                </h3>
                {!initial && (
                  <button
                    type="button"
                    onClick={() => setMethods(INITIAL_METHODS)}
                    className="text-xs text-ink-faint underline decoration-dotted underline-offset-2 hover:text-ink-dim"
                  >
                    вернуть исходный набор
                  </button>
                )}
              </div>
              <p className="mt-1 text-sm leading-relaxed text-ink-dim">
                Сравнение результатов при разных методах — обязательная часть отчёта, а не
                дополнение. Исходный набор — тот, с которого методичка предлагает начать.
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {METHOD_FIELDS.map((field) => (
                  <SelectField
                    key={field.key}
                    label={tr(field.label, lang)}
                    value={methods[field.key]}
                    onChange={(e) =>
                      setMethods((prev) => ({ ...prev, [field.key]: e.target.value }) as Methods)
                    }
                  >
                    {field.options.map((option) => (
                      <option key={option} value={option}>
                        {tr(METHOD_LABELS[option as Norm | Defuzz], lang)}
                      </option>
                    ))}
                  </SelectField>
                ))}
              </div>
            </div>
          </CardBody>
        </Card>

        {/* --- Ход вывода ---------------------------------------------------- */}
        <Card>
          <CardBody className="pt-6">
            <FuzzyInference
              system={task.system}
              values={values}
              methods={methods}
              accent={accent}
            />
          </CardBody>
        </Card>

        {/* --- Файл ---------------------------------------------------------- */}
        <Card>
          <CardBody className="pt-6 space-y-4">
            <div>
              <h2 className="font-display text-xl font-semibold tracking-tight text-ink">
                Система файлом .fls
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-ink-dim">
                Собирается с выбранными выше значениями и методами. Дизъюнктивная связка
                посылок при загрузке не восстанавливается — если она нужна, переключать
                придётся в редакторе каждого правила.
              </p>
            </div>
            <FlsDownload
              system={task.system}
              values={values}
              methods={methods}
              filename={`${task.id}.fls`}
              accent={accent}
            />
          </CardBody>
        </Card>

        {/* --- Расхождения в задании ------------------------------------------ */}
        {task.notes.length > 0 && (
          <Card>
            <CardBody className="pt-6 space-y-4">
              <div>
                <h2 className="font-display text-xl font-semibold tracking-tight text-ink">
                  Что расходится в тексте задания
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-ink-dim">
                  Ничего не исправлено молча: система собрана так, как напечатано, а
                  расхождения выписаны здесь вместе с принятым чтением.
                </p>
              </div>
              <ul className="space-y-2.5 text-sm text-ink-dim">
                {task.notes.map((note, ni) => (
                  <li key={ni} className="flex gap-2 leading-relaxed">
                    <span style={{ color: accent }}>·</span>
                    {tr(note, lang)}
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}

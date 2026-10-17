"use client";

import { useMemo, useState } from "react";
import { ModuleHeader } from "@/components/module-header";
import { LabProcedure } from "@/components/lab-procedure";
import { Card, CardBody } from "@/components/ui/card";
import { InfoNote } from "@/components/ui/info-note";
import { NumberField, TextAreaField } from "@/components/ui/field";
import { OutputBlock } from "@/components/ui/output-block";
import { categories, modules } from "@/lib/modules";
import { AI_GUIDES } from "@/lib/data/ai-labs";
import { runBpe, type BpeRun, type PairCount, type VocabEntry } from "@/lib/algorithms/bpe";
import { useLang } from "@/components/lang";

const mod = modules.find((m) => m.slug === "ai-bpe-demo")!;
const accent = categories.ai.accent;
const procedure = AI_GUIDES["ai-bpe-demo"];

/** Строки из зошита: начальный текст и заготовка student_text из п. 5. */
const BASE_TEXT = "low low low lower lower lowest newest newest";
const STUDENT_PLACEHOLDER = "play play player player playing replay replay";

const pairLabel = (p: PairCount) => `${p.a} + ${p.b}`;

/** Ячейка, которая сводит проходы в таблицу теми же функциями, что и зошит. */
const TRACE_CELL = `import pandas as pd


def bpe_trace(text, n_merges=5):
    """Проходи BPE тими самими функціями, що й вище, з рівночастотними парами."""
    freq = Counter(text.split())
    vocab = {w: list(w) for w in freq}
    rows = []
    for step in range(1, n_merges + 1):
        stats = get_pair_stats(vocab, freq)
        (a, b), best = stats.most_common(1)[0]
        ties = [f"{x}+{y}" for (x, y), f in stats.items() if f == best and (x, y) != (a, b)]
        vocab = merge_pair(vocab, (a, b))
        rows.append({
            "прохід": step,
            "пара": f"{a} + {b}",
            "частота": best,
            "новий токен": a + b,
            "рівночастотні пари": ", ".join(ties) or "–",
        })
    return pd.DataFrame(rows), vocab


pd.set_option("display.max_colwidth", None)
trace_base, vocab_base = bpe_trace(text)
trace_student, vocab_student = bpe_trace(student_text)
trace_base`;

/** Где стоит токен в словах после своего прохода: так видно, корень это или суффикс. */
function placement(token: string, vocab: VocabEntry[]): string[] {
  const where = new Set<string>();
  for (const e of vocab) {
    e.tokens.forEach((t, i) => {
      if (t !== token) return;
      const last = e.tokens.length - 1;
      if (last === 0) where.add("целое слово");
      else if (i === 0) where.add("начало");
      else if (i === last) where.add("конец");
      else where.add("середина");
    });
  }
  const order = ["целое слово", "начало", "середина", "конец"];
  return order.filter((w) => where.has(w));
}

function TraceTable({ run }: { run: BpeRun }) {
  const { lang } = useLang();
  const tx = (uk: string, ruText: string) => (lang === "uk" ? uk : ruText);
  return (
    <div className="overflow-x-auto rounded-[4px] border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-xs text-ink-faint">
            <th className="px-3 py-2 text-left font-medium">{tx("Прохід","Проход")}</th>
            <th className="px-3 py-2 text-left font-medium">{tx("Пара","Пара")}</th>
            <th className="px-3 py-2 text-right font-medium">{tx("Частота","Частота")}</th>
            <th className="px-3 py-2 text-left font-medium">{tx("Новий токен","Новый токен")}</th>
            <th className="px-3 py-2 text-left font-medium">{tx("З тією ж частотою","С той же частотой")}</th>
          </tr>
        </thead>
        <tbody>
          {run.steps.map((s) => (
            <tr key={s.step} className="border-b border-border/50 last:border-b-0">
              <td className="px-3 py-2 font-mono text-xs text-ink-faint">{s.step}</td>
              <td className="px-3 py-2 font-mono text-ink">{pairLabel(s.pair)}</td>
              <td className="px-3 py-2 text-right font-mono text-ink-dim">{s.pair.freq}</td>
              <td className="px-3 py-2 font-mono" style={{ color: accent }}>
                {s.token}
              </td>
              <td className="px-3 py-2 font-mono text-xs text-ink-dim">
                {s.ties.length > 0 ? s.ties.map(pairLabel).join(", ") : <span className="text-ink-faint">нет</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SplitTable({ vocab }: { vocab: VocabEntry[] }) {
  const { lang } = useLang();
  const tx = (uk: string, ruText: string) => (lang === "uk" ? uk : ruText);
  return (
    <div className="overflow-x-auto rounded-[4px] border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-xs text-ink-faint">
            <th className="px-3 py-2 text-left font-medium">{tx("Слово", "Слово")}</th>
            <th className="px-3 py-2 text-right font-medium">{tx("Разів у тексті", "Раз в тексте")}</th>
            <th className="px-3 py-2 text-left font-medium">{tx("Розбиття", "Разбиение")}</th>
            <th className="px-3 py-2 text-right font-medium">{tx("Символів", "Символов")}</th>
            <th className="px-3 py-2 text-right font-medium">{tx("Токенів", "Токенов")}</th>
          </tr>
        </thead>
        <tbody>
          {vocab.map((e) => (
            <tr key={e.word} className="border-b border-border/50 last:border-b-0">
              <td className="px-3 py-2 text-ink">{e.word}</td>
              <td className="px-3 py-2 text-right font-mono text-ink-faint">{e.freq}</td>
              <td className="px-3 py-2">
                <span className="inline-flex flex-wrap gap-1">
                  {e.tokens.map((t, i) => (
                    <span
                      key={i}
                      className="rounded-[3px] border border-border px-1.5 py-0.5 font-mono text-xs"
                      style={t.length > 1 ? { borderColor: `${accent}66`, color: accent } : undefined}
                    >
                      {t}
                    </span>
                  ))}
                </span>
              </td>
              <td className="px-3 py-2 text-right font-mono text-ink-faint">{Array.from(e.word).length}</td>
              <td className="px-3 py-2 text-right font-mono text-ink-dim">{e.tokens.length}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** То, что зошит печатает на каждом проходе: все пары и разбиение после объединения. */
function PassLog({ run }: { run: BpeRun }) {
  const { lang } = useLang();
  const tx = (uk: string, ruText: string) => (lang === "uk" ? uk : ruText);
  return (
    <div className="space-y-2">
      {run.steps.map((s) => (
        <details key={s.step} className="group rounded-[4px] border border-border bg-black/20">
          <summary className="cursor-pointer select-none px-4 py-2.5 text-sm text-ink-dim marker:text-ink-faint">
            Проход {s.step}: <span className="font-mono text-ink">{pairLabel(s.pair)}</span>
            <span className="text-ink-faint"> → </span>
            <span className="font-mono" style={{ color: accent }}>
              {s.token}
            </span>
          </summary>
          <div className="grid gap-4 border-t border-border px-4 py-3 sm:grid-cols-2">
            <div>
              <div className="mb-1 text-xs text-ink-faint">{tx("Частоти пар до об’єднання","Частоты пар до объединения")}</div>
              <pre className="font-mono text-xs leading-relaxed text-ink-dim">
                {s.stats.map((p) => `${pairLabel(p)} -> ${p.freq}`).join("\n")}
              </pre>
            </div>
            <div>
              <div className="mb-1 text-xs text-ink-faint">{tx("Розбиття після об’єднання","Разбиение после объединения")}</div>
              <pre className="font-mono text-xs leading-relaxed text-ink-dim">
                {s.after.map((e) => `${e.word.padEnd(10)} -> ${e.tokens.join(" ")}`).join("\n")}
              </pre>
            </div>
          </div>
        </details>
      ))}
    </div>
  );
}

function RunWarnings({ run }: { run: BpeRun }) {
  const { lang } = useLang();
  const tx = (uk: string, ruText: string) => (lang === "uk" ? uk : ruText);
  const notes: string[] = [];
  if (run.initial.length === 0) notes.push(tx("Текст порожній.","Текст пуст."));
  else if (run.steps.length > 0 && run.steps[0].pair.freq === 1)
    notes.push(
      tx("Жодна пара не трапляється двічі: у тексті немає повторів, і об’єднання вибираються просто за порядком літер. Для досліду потрібні повторювані слова або їх частини.","Ни одна пара не встречается дважды: в тексте нет повторов, и объединения выбираются просто по порядку букв. Для опыта нужны повторяющиеся слова или их части."),
    );
  if (run.exhaustedAt !== null)
    notes.push(
      tx(`На проході ${run.exhaustedAt} пар не лишилося — кожне слово вже один токен. Зошит у цьому місці впаде з IndexError на most_common(1)[0]: потрібен текст довший.`,`На проходе ${run.exhaustedAt} пар не осталось — каждое слово уже один токен. Зошит в этом месте упадёт с IndexError на most_common(1)[0]: нужен текст длиннее.`),
    );
  if (notes.length === 0) return null;
  return (
    <div className="space-y-1.5 rounded-[4px] border px-4 py-3 text-sm leading-relaxed" style={{ borderColor: "#fb718555" }}>
      {notes.map((n) => (
        <p key={n} className="text-ink-dim">
          {n}
        </p>
      ))}
    </div>
  );
}

function Order({ label, run }: { label: string; run: BpeRun }) {
  return (
    <div>
      <div className="mb-2 text-xs text-ink-faint">{label}</div>
      <ol className="space-y-1.5">
        {run.steps.map((s) => (
          <li key={s.step} className="flex flex-wrap items-baseline gap-x-3 text-sm">
            <span className="w-5 font-mono text-xs text-ink-faint">{s.step}</span>
            <span className="font-mono" style={{ color: accent }}>
              {s.token}
            </span>
            <span className="text-xs text-ink-faint">{placement(s.token, s.after).join(", ")}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function AiBpeDemoPage() {
  const { lang } = useLang();
  const tx = (uk: string, ruText: string) => (lang === "uk" ? uk : ruText);
  const [ownText, setOwnText] = useState(STUDENT_PLACEHOLDER);
  const [merges, setMerges] = useState(5);
  const n = Math.max(1, Math.min(30, Number.isFinite(merges) ? merges : 5));

  const base = useMemo(() => runBpe(BASE_TEXT, n), [n]);
  const own = useMemo(() => runBpe(ownText, n), [ownText, n]);
  const baseFinal = base.steps.at(-1)?.after ?? base.initial;
  const ownFinal = own.steps.at(-1)?.after ?? own.initial;
  const ownTies = own.steps.filter((s) => s.ties.length > 0).length;

  return (
    <div>
      <ModuleHeader module={mod} />
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        <InfoNote>
          {lang === "uk" ? "Розрахунок повторює функції get_pair_stats і merge_pair із зошита разом з порядком, у якому Python перебирає пари. Це важливо при рівних частотах: most_common віддає такі пари в порядку першої появи — слова по порядку в тексті, пари зліва направо, — і вибирає першу. Тому вибір тут той самий, що надрукує зошит." : "Расчёт повторяет функции get_pair_stats и merge_pair из зошита вместе с порядком, в котором Python перебирает пары. Это важно при равных частотах: most_common отдаёт такие пары в порядке первого появления — слова по порядку в тексте, пары слева направо, — и выбирает первую. Поэтому выбор здесь тот же, что напечатает зошит."}
        </InfoNote>

        <LabProcedure guide={procedure} accent={accent} />

        {/* --- Начальный текст ------------------------------------------------ */}
        <Card>
          <CardBody className="pt-6 space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-semibold tracking-tight text-ink">
                  {tx("Початковий текст зошита","Начальный текст зошита")}
                </h2>
                <p className="mt-1 font-mono text-sm text-ink-dim">{BASE_TEXT}</p>
              </div>
              <div className="w-36">
                <NumberField
                  label={tx("Проходів","Проходов")}
                  min={1}
                  max={30}
                  value={merges}
                  onChange={(e) => setMerges(parseInt(e.target.value, 10))}
                />
              </div>
            </div>
            <TraceTable run={base} />
            {n >= 5 && (
              <p className="text-sm leading-relaxed text-ink-dim">
                {lang === "uk" ? "Перші два проходи збирають «low» — ціле слово і спільний початок трьох слів. На першому, третьому і п’ятому проходах найкращу частоту ділять кілька пар; у п’ятому від правила вибору залежить, який токен потрапить у словник." : "Первые два прохода собирают «low» — целое слово и общее начало трёх слов. На первом, третьем и пятом проходах лучшую частоту делят несколько пар; в пятом от правила выбора зависит, какой токен попадёт в словарь."}
              </p>
            )}
            <SplitTable vocab={baseFinal} />
          </CardBody>
        </Card>

        {/* --- Свой текст ----------------------------------------------------- */}
        <Card>
          <CardBody className="pt-6 space-y-5">
            <div>
              <h2 className="font-display text-xl font-semibold tracking-tight text-ink">{tx("Свій текст","Свой текст")}</h2>
              <p className="mt-1 text-sm leading-relaxed text-ink-dim">
                {tx("Рядок для student_text у п. 5. У полі — заготовка із зошита; її потрібно замінити своєю.","Строка для student_text в п. 5. В поле — заготовка из зошита; её нужно заменить своей.")}
              </p>
            </div>
            <TextAreaField
              label="student_text"
              hint={tx(`${own.words} слів, різних ${own.initial.length}`,`${own.words} слов, разных ${own.initial.length}`)}
              value={ownText}
              onChange={(e) => setOwnText(e.target.value)}
              spellCheck={false}
              className="min-h-[4.5rem]"
            />
            <RunWarnings run={own} />
            {own.steps.length > 0 && (
              <>
                <TraceTable run={own} />
                {ownTies > 0 && (
                  <p className="text-sm leading-relaxed text-ink-dim">
                    {tx("На","На")} {ownTies} {tx("з","из")} {own.steps.length} {tx("проходів найкращу частоту ділять кілька пар — їх варто записати у звіт разом з вибраною.","проходов лучшую частоту делят несколько пар — их стоит записать в отчёт вместе с выбранной.")}
                  </p>
                )}
                <SplitTable vocab={ownFinal} />
                <div>
                  <div className="mb-2 text-xs text-ink-faint">{tx("Що друкує зошит на кожному проході","Что печатает зошит на каждом проходе")}</div>
                  <PassLog run={own} />
                </div>
              </>
            )}
          </CardBody>
        </Card>

        {/* --- Сравнение ------------------------------------------------------ */}
        {own.steps.length > 0 && (
          <Card>
            <CardBody className="pt-6 space-y-5">
              <div>
                <h2 className="font-display text-xl font-semibold tracking-tight text-ink">
                  {tx("Порядок утворення токенів","Порядок образования токенов")}
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-ink-dim">
                  {lang === "uk" ? "Поряд із токеном — де він стоїть у словах після свого проходу. За цим видно, що алгоритм збирає раніше: початок слова чи його кінець. Морфології він не знає, вирішує лише число входжень пари." : "Рядом с токеном — где он стоит в словах после своего прохода. По этому видно, что алгоритм собирает раньше: начало слова или его конец. Морфологии он не знает, решает только число вхождений пары."}
                </p>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <Order label={tx("Початковий текст","Начальный текст")} run={base} />
                <Order label={tx("Свій текст","Свой текст")} run={own} />
              </div>
            </CardBody>
          </Card>
        )}

        {/* --- Ячейка --------------------------------------------------------- */}
        <Card>
          <CardBody className="pt-6 space-y-4">
            <div>
              <h2 className="font-display text-xl font-semibold tracking-tight text-ink">
                {tx("Комірка для зведеної таблиці","Ячейка для сводной таблицы")}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-ink-dim">
                {tx("Вставляється в кінець зошита. Зошит друкує проходи довгим логом; ця комірка збирає їх у таблицю — пара, частота, новий токен, пари з тією ж частотою — для обох текстів. Використовує функції з комірок вище, нічого не змінює в розрахунку.","Вставляется в конец зошита. Зошит печатает проходы длинным логом; эта ячейка собирает их в таблицу — пара, частота, новый токен, пары с той же частотой — для обоих текстов. Использует функции из ячеек выше, ничего не меняет в расчёте.")}
              </p>
            </div>
            <OutputBlock label="cell.py" value={TRACE_CELL} wrap={false} />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

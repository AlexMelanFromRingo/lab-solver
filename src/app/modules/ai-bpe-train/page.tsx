"use client";

import { useMemo, useState } from "react";
import { ModuleHeader } from "@/components/module-header";
import { LabProcedure } from "@/components/lab-procedure";
import { Card, CardBody } from "@/components/ui/card";
import { InfoNote } from "@/components/ui/info-note";
import { NumberField, TextAreaField, TextField } from "@/components/ui/field";
import { OutputBlock } from "@/components/ui/output-block";
import { Segmented } from "@/components/ui/segmented";
import { categories, modules } from "@/lib/modules";
import { AI_GUIDES } from "@/lib/data/ai-labs";
import { CORPUS, SAMPLE_TOKENS, SIZES, TASK_CELLS, TEST_LINES, WORD_SPLITS } from "@/lib/data/ai-bpe-train";
import { useLang } from "@/components/lang";
import { tr, type Loc } from "@/lib/i18n";
import { byteSymbols, decodeLenient, hex, parseTokenList, tokenBytes, utf8 } from "@/lib/algorithms/byte-level";

const mod = modules.find((m) => m.slug === "ai-bpe-train")!;
const accent = categories.ai.accent;
const procedure = AI_GUIDES["ai-bpe-train"];

const nf = (n: number) => n.toLocaleString("ru-RU").replace(/ /g, " ");
const ff = (n: number, d = 3) => n.toFixed(d).replace(".", ",");

const TH = "px-3 py-2 font-medium";
const TD = "px-3 py-2";

function SectionTitle({ title, children }: { title: Loc; children?: React.ReactNode }) {
  const { lang } = useLang();
  return (
    <div>
      <h2 className="font-display text-xl font-semibold tracking-tight text-ink">{tr(title, lang)}</h2>
      {children && <p className="mt-1 text-sm leading-relaxed text-ink-dim">{children}</p>}
    </div>
  );
}

// --- Что выйдет на корпусе зошита ---------------------------------------------

function CorpusResults() {
  const { lang } = useLang();
  const tx = (uk: string, ruText: string) => (lang === "uk" ? uk : ruText);
  const mean = (k: "t300" | "t800") => TEST_LINES.reduce((a, l) => a + l[k], 0) / TEST_LINES.length;
  const meanBpt = (k: "t300" | "t800") => TEST_LINES.reduce((a, l) => a + l.bytes / l[k], 0) / TEST_LINES.length;
  return (
    <Card>
      <CardBody className="pt-6 space-y-5">
        <SectionTitle title={{ uk: "Що вийде на корпусі зошита", ru: "Что выйдет на корпусе зошита" }}>
          {lang === "uk" ? "Навчання детерміноване: на тому самому корпусі у всіх виходять ті самі числа. За ними зручно перевірити, що зошит відпрацював як треба, перш ніж писати звіт." : "Обучение детерминировано: на том же корпусе у всех получаются те же числа. По ним удобно проверить, что зошит отработал как надо, прежде чем писать отчёт."}
        </SectionTitle>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="overflow-x-auto rounded-[4px] border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-ink-faint">
                  <th className={`${TH} text-right`}>vocab_size</th>
                  <th className={`${TH} text-right`}>{tx("отримано","получено")}</th>
                  <th className={`${TH} text-right`}>{tx("слів корпусу цілим токеном","слов корпуса целым токеном")}</th>
                </tr>
              </thead>
              <tbody>
                {SIZES.map((s) => (
                  <tr key={s.asked} className="border-b border-border/50 last:border-b-0">
                    <td className={`${TD} text-right font-mono text-ink-dim`}>{nf(s.asked)}</td>
                    <td className={`${TD} text-right font-mono`} style={s.got < s.asked ? { color: accent } : undefined}>
                      {s.got}
                    </td>
                    <td className={`${TD} text-right font-mono text-ink-dim`}>
                      {s.whole} {tx("з","из")} {CORPUS.pretokens}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm leading-relaxed text-ink-dim">
            {lang === "uk" ? "Словник стартує з " : "Словарь стартует с "}{CORPUS.baseVocab}{lang === "uk" ? " одиниць: 256 байтів і чотири спеціальні токени. Після 517 об’єднань кожне слово корпусу разом із пробілом перед ним стає одним токеном, а через межі слів BPE пар не будує — об’єднувати більше нічого. Тому 800 дає 777, а 2000 дає рівно той самий словник. Навчений тільки на " : " единиц: 256 байтов и четыре специальных токена. После 517 объединений каждое слово корпуса вместе с пробелом перед ним становится одним токеном, а через границы слов BPE пар не строит — объединять больше нечего. Поэтому 800 даёт 777, а 2000 даёт ровно тот же словарь. Обученный только на "}{nf(CORPUS.englishLines)}{" "}
            {lang === "uk" ? "англійських рядках BPE-800 зупиняється на " : "английских строках BPE-800 останавливается на "}{CORPUS.englishVocab}.
          </p>
        </div>

        <div className="overflow-x-auto rounded-[4px] border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-ink-faint">
                <th className={`${TH} text-left`}>{tx("Тестовий рядок зошита","Тестовая строка зошита")}</th>
                <th className={`${TH} text-right`}>{tx("байтів","байтов")}</th>
                <th className={`${TH} text-right`}>BPE-300</th>
                <th className={`${TH} text-right`}>BPE-800</th>
                <th className={`${TH} text-right`}>байт/токен 800</th>
              </tr>
            </thead>
            <tbody>
              {TEST_LINES.map((l) => (
                <tr key={l.text} className="border-b border-border/50 last:border-b-0">
                  <td className={`${TD} text-ink-dim`}>{l.text}</td>
                  <td className={`${TD} text-right font-mono text-ink-faint`}>{l.bytes}</td>
                  <td className={`${TD} text-right font-mono text-ink-dim`}>{l.t300}</td>
                  <td className={`${TD} text-right font-mono text-ink`}>{l.t800}</td>
                  <td className={`${TD} text-right font-mono text-ink-faint`}>{ff(l.bytes / l.t800)}</td>
                </tr>
              ))}
              <tr className="text-xs text-ink-faint">
                <td className={TD}>{tx("середнє, як у п. 5 зошита","среднее, как в п. 5 зошита")}</td>
                <td className={TD} />
                <td className={`${TD} text-right font-mono`}>{ff(mean("t300"), 2)}</td>
                <td className={`${TD} text-right font-mono`}>{ff(mean("t800"), 2)}</td>
                <td className={`${TD} text-right font-mono`}>
                  {ff(meanBpt("t800"))} (300: {ff(meanBpt("t300"))})
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm leading-relaxed text-ink-dim">
          {lang === "uk" ? "Адреса і emoji кодуються по токену на байт обома токенізаторами: цифри в корпусі трапляються тільки поодинці, а байтів emoji в ньому немає зовсім. Невідомого токена при цьому не виникає — алфавіт побайтовий." : "Адрес и emoji кодуются по токену на байт обоими токенизаторами: цифры в корпусе встречаются только поодиночке, а байтов emoji в нём нет вовсе. Неизвестного токена при этом не возникает — алфавит побайтовый."}
        </p>
      </CardBody>
    </Card>
  );
}

// --- Токены из вывода зошита -> текст -------------------------------------------

function TokenDecoder() {
  const { lang } = useLang();
  const tx = (uk: string, ruText: string) => (lang === "uk" ? uk : ruText);
  const [src, setSrc] = useState(SAMPLE_TOKENS);
  const tokens = useMemo(() => parseTokenList(src), [src]);
  const rows = tokens.map((t) => {
    const b = tokenBytes(t);
    return { t, bytes: b, text: b ? decodeLenient(b) : null };
  });
  const all = rows.every((r) => r.bytes) ? decodeLenient(rows.flatMap((r) => r.bytes!)) : null;
  const cut = rows.filter((r) => r.text?.includes("\\x")).length;

  return (
    <Card>
      <CardBody className="pt-6 space-y-5">
        <SectionTitle title={{ uk: "Токени з виводу зошита — назад у текст", ru: "Токены из вывода зошита — обратно в текст" }}>
          {lang === "uk" ? <>Рядок TOKENS друкується байтовими символами: «Ġ» — пробіл, «Ð¨» — два байти літери «Ш». Вставте список як є, з лапками і дужками. Байт, який не складається в літеру, показано як \xd0 — так само, як bytes.decode(errors=&quot;backslashreplace&quot;).</> : <>Строка TOKENS печатается байтовыми символами: «Ġ» — пробел, «Ð¨» — два байта буквы «Ш». Вставьте список как есть, с кавычками и скобками. Байт, который не складывается в букву, показан как \xd0 — так же, как bytes.decode(errors=&quot;backslashreplace&quot;).</>}
        </SectionTitle>
        <TextAreaField
          label="TOKENS"
          hint={tx(`${tokens.length} токенів`,`${tokens.length} токенов`)}
          value={src}
          onChange={(e) => setSrc(e.target.value)}
          spellCheck={false}
        />
        {all !== null && <OutputBlock label={tx("Склеєно назад","Склеено обратно")} value={all} />}
        {cut > 0 && (
          <p className="text-sm leading-relaxed text-ink-dim">
            {lang === "uk" ? "У " : "У "}{cut}{lang === "uk" ? " токенів межа пройшла посередині літери: у словнику немає куска, який закрив би її цілком. На малому словнику так ріжеться майже вся кирилиця." : " токенов граница прошла посередине буквы: в словаре нет куска, который закрыл бы её целиком. На малом словаре так режется почти вся кириллица."}
          </p>
        )}
        <div className="overflow-x-auto rounded-[4px] border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-ink-faint">
                <th className={`${TH} text-right`}>№</th>
                <th className={`${TH} text-left`}>{tx("у зошиті","в зошите")}</th>
                <th className={`${TH} text-left`}>{tx("байти","байты")}</th>
                <th className={`${TH} text-left`}>{tx("текст","текст")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b border-border/50 last:border-b-0">
                  <td className={`${TD} text-right font-mono text-xs text-ink-faint`}>{i + 1}</td>
                  <td className={`${TD} font-mono text-ink-dim`}>{r.t}</td>
                  <td className={`${TD} font-mono text-xs text-ink-faint`}>
                    {r.bytes ? r.bytes.map(hex).join(" ") : tx("не з байтової таблиці","не из байтовой таблицы")}
                  </td>
                  <td className={`${TD} whitespace-pre font-mono`} style={r.text?.includes("\\x") ? { color: "#fb7185" } : { color: accent }}>
                    {r.text ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  );
}

// --- Байты и символы строки ---------------------------------------------------------

function StringMetrics() {
  const { lang } = useLang();
  const tx = (uk: string, ruText: string) => (lang === "uk" ? uk : ruText);
  const [text, setText] = useState("Маршрутизатор пересилає пакети між двома мережами.");
  const [tokens, setTokens] = useState(35);
  const chars = Array.from(text);
  const bytes = utf8(text);
  const t = Number.isFinite(tokens) && tokens > 0 ? tokens : null;

  return (
    <Card>
      <CardBody className="pt-6 space-y-5">
        <SectionTitle title={{ uk: "Байти, символи і токени рядка", ru: "Байты, символы и токены строки" }}>
          {lang === "uk" ? "До пункту 2. Число токенів береться із зошита, решта рахується тут. Байти на токен в українського тексту майже вдвічі вищі за англійський просто тому, що кирилична літера — два байти; порівнювати мови чесніше за символами на токен." : "К пункту 2. Число токенов берётся из зошита, остальное считается здесь. Байты на токен у украинского текста почти вдвое выше английского просто потому, что кириллическая буква — два байта; сравнивать языки честнее по символам на токен."}
        </SectionTitle>
        <div className="grid gap-4 sm:grid-cols-[1fr_9rem]">
          <TextField label={tx("Рядок","Строка")} value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} />
          <NumberField
            label={tx("Токенів","Токенов")}
            min={1}
            value={tokens}
            onChange={(e) => setTokens(parseInt(e.target.value, 10))}
          />
        </div>
        <div className="grid gap-x-8 sm:grid-cols-2">
          {[
            [tx("Символів","Символов"), nf(chars.length)],
            [tx("Байтів UTF-8","Байтов UTF-8"), nf(bytes.length)],
            [tx("Байтів на токен","Байтов на токен"), t ? ff(bytes.length / t) : "—"],
            [tx("Символів на токен","Символов на токен"), t ? ff(chars.length / t) : "—"],
          ].map(([k, v]) => (
            <div key={k} className="flex items-baseline justify-between gap-4 border-b border-border/50 py-1.5">
              <span className="text-sm text-ink-dim">{k}</span>
              <span className="font-mono text-sm text-ink">{v}</span>
            </div>
          ))}
        </div>
        <OutputBlock label={tx("Так рядок бачить ByteLevel","Так строку видит ByteLevel")} value={byteSymbols(bytes)} />
      </CardBody>
    </Card>
  );
}

// --- Цена словаря -----------------------------------------------------------------

const D_OPTIONS = [512, 768, 1024, 2048, 4096];

function VocabCost() {
  const { lang } = useLang();
  const tx = (uk: string, ruText: string) => (lang === "uk" ? uk : ruText);
  const [v, setV] = useState(777);
  const [d, setD] = useState(768);
  const [tied, setTied] = useState<"untied" | "tied">("untied");
  const k = tied === "tied" ? 1 : 2;
  const rows = [
    { name: tx("свій","свой"), vocab: Number.isFinite(v) && v > 0 ? v : 0 },
    { name: "BPE-300", vocab: 300 },
    { name: "BPE-800 (777)", vocab: 777 },
    { name: "GPT-2", vocab: 50257 },
    { name: "mT5", vocab: 250100 },
  ];
  const mb = (p: number, b: number) => ff((p * b) / 2 ** 20, 1);

  return (
    <Card>
      <CardBody className="pt-6 space-y-5">
        <SectionTitle title={{ uk: "Ціна словника", ru: "Цена словаря" }}>
          {lang === "uk" ? "До пункту 5. У кожного токена в моделі два рядки параметрів довжиною d: вхід (embedding) і вихід (LM head). Якщо матриці спільні, як у GPT-2, лишається одна. Пам’ять — чотири байти на параметр у fp32 і два у fp16; один мегабайт тут 2²⁰ байтів, як у комірці зошита." : "К пункту 5. У каждого токена в модели две строки параметров длиной d: вход (embedding) и выход (LM head). Если матрицы общие, как у GPT-2, остаётся одна. Память — четыре байта на параметр в fp32 и два в fp16; один мегабайт здесь 2²⁰ байтов, как в ячейке зошита."}
        </SectionTitle>
        <div className="flex flex-wrap items-end gap-4">
          <div className="w-40">
            <NumberField label="Свой V" min={1} value={v} onChange={(e) => setV(parseInt(e.target.value, 10))} />
          </div>
          <div>
            <div className="mb-1.5 text-sm font-medium text-ink-dim">d</div>
            <Segmented
              label="d"
              value={String(d)}
              options={D_OPTIONS.map((x) => ({ value: String(x), label: String(x) }))}
              onChange={(x) => setD(Number(x))}
              accent={accent}
            />
          </div>
          <div>
            <div className="mb-1.5 text-sm font-medium text-ink-dim">{tx("Матриці","Матрицы")}</div>
            <Segmented
              label="Матрицы"
              value={tied}
              options={[
                { value: "untied", label: tx("окремі","раздельные") },
                { value: "tied", label: tx("спільні","общие") },
              ]}
              onChange={setTied}
              accent={accent}
            />
          </div>
        </div>
        <div className="overflow-x-auto rounded-[4px] border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-ink-faint">
                <th className={`${TH} text-left`}>{tx("Словник","Словарь")}</th>
                <th className={`${TH} text-right`}>V</th>
                <th className={`${TH} text-right`}>{tx("параметрів","параметров")}</th>
                <th className={`${TH} text-right`}>fp32, МБ</th>
                <th className={`${TH} text-right`}>fp16, МБ</th>
                <th className={`${TH} text-right`}>{tx("множень виходу на токен","умножений выхода на токен")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const p = k * r.vocab * d;
                return (
                  <tr key={r.name} className="border-b border-border/50 last:border-b-0">
                    <td className={`${TD} text-ink-dim`}>{r.name}</td>
                    <td className={`${TD} text-right font-mono text-ink-faint`}>{nf(r.vocab)}</td>
                    <td className={`${TD} text-right font-mono`} style={r.name === tx("свій","свой") ? { color: accent } : undefined}>
                      {nf(p)}
                    </td>
                    <td className={`${TD} text-right font-mono text-ink-dim`}>{mb(p, 4)}</td>
                    <td className={`${TD} text-right font-mono text-ink-dim`}>{mb(p, 2)}</td>
                    <td className={`${TD} text-right font-mono text-ink-faint`}>{nf(r.vocab * d)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-sm leading-relaxed text-ink-dim">
          {lang === "uk" ? "Крім пам’яті, зростає рахунок: вихідний шар на кожен згенерований токен обчислює оцінку для всіх V токенів словника. І вектор токена оновлюється при навчанні тільки тоді, коли токен трапився в тексті, — у великого словника багато рідкісних токенів з погано навченими векторами. Зворотний бік — малий словник дає довгі послідовності, а увага зростає з довжиною квадратично." : "Кроме памяти, растёт счёт: выходной слой на каждый сгенерированный токен вычисляет оценку для всех V токенов словаря. И вектор токена обновляется при обучении только тогда, когда токен встретился в тексте, — у большого словаря много редких токенов с плохо обученными векторами. Обратная сторона — малый словарь даёт длинные последовательности, а внимание растёт с длиной квадратично."}
        </p>
      </CardBody>
    </Card>
  );
}

// --- Слова ---------------------------------------------------------------------

function WordSplits() {
  const { lang } = useLang();
  const tx = (uk: string, ruText: string) => (lang === "uk" ? uk : ruText);
  return (
    <Card>
      <CardBody className="pt-6 space-y-5">
        <SectionTitle title={{ uk: "Слова, які токенізатори ріжуть по-різному", ru: "Слова, которые токенизаторы режут по-разному" }}>
          {lang === "uk" ? "До пункту 3, на корпусі зошита. Слова подані окремо, без пробіла попереду; у корпусі вони стоять після пробіла, тому, наприклад, «Ġintelligence» у словнику BPE-800 є одним токеном, а «intelligence» без пробіла — ні. BPE-2000 ріже так само, як BPE-800." : "К пункту 3, на корпусе зошита. Слова поданы отдельно, без пробела впереди; в корпусе они стоят после пробела, поэтому, например, «Ġintelligence» в словаре BPE-800 есть одним токеном, а «intelligence» без пробела — нет. BPE-2000 режет так же, как BPE-800."}
        </SectionTitle>
        <div className="overflow-x-auto rounded-[4px] border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-ink-faint">
                <th className={`${TH} text-left`}>{tx("Слово","Слово")}</th>
                <th className={`${TH} text-left`}>BPE-300</th>
                <th className={`${TH} text-left`}>BPE-800</th>
              </tr>
            </thead>
            <tbody>
              {WORD_SPLITS.map((w) => (
                <tr key={w.word} className="border-b border-border/50 last:border-b-0">
                  <td className={`${TD} text-ink`}>{w.word}</td>
                  <td className={`${TD} font-mono text-xs text-ink-faint`}>
                    {w.s300} ({w.s300.split(" | ").length})
                  </td>
                  <td className={`${TD} font-mono text-xs text-ink-dim`}>
                    {w.s800} ({w.s800.split(" | ").length})
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  );
}

export default function AiBpeTrainPage() {
  const { lang } = useLang();
  const tx = (uk: string, ruText: string) => (lang === "uk" ? uk : ruText);
  return (
    <div>
      <ModuleHeader module={mod} />
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        <InfoNote>
          {lang === "uk" ? "Навчання йде в зошиті: бібліотеку tokenizers браузер не запустить. Тут — те, що виходить на корпусі зошита, інструменти до пунктів завдання і готові комірки на всі вісім пунктів. Комірки розраховані на те, що вище вже виконані комірки зошита." : "Обучение идёт в зошите: библиотеку tokenizers браузер не запустит. Здесь — то, что получается на корпусе зошита, инструменты к пунктам задания и готовые ячейки на все восемь пунктов. Ячейки рассчитаны на то, что выше уже выполнены ячейки зошита."}
        </InfoNote>

        <LabProcedure guide={procedure} accent={accent} />

        <CorpusResults />
        <TokenDecoder />
        <StringMetrics />
        <WordSplits />
        <VocabCost />

        <Card>
          <CardBody className="pt-6 space-y-5">
            <SectionTitle title={{ uk: "Готові комірки за пунктами", ru: "Готовые ячейки по пунктам" }}>
              {lang === "uk" ? "Вставляються після останньої комірки зошита по порядку: кожна користується тим, що оголосила попередня. Пари речень у пункті 2 варто замінити своїми — однакового змісту і хоча б одне зі словами, яких у корпусі немає." : "Вставляются после последней ячейки зошита по порядку: каждая пользуется тем, что объявила предыдущая. Пары предложений в пункте 2 стоит заменить своими — одинакового смысла и хотя бы одну со словами, которых в корпусе нет."}
            </SectionTitle>
            {TASK_CELLS.map((c) => (
              <OutputBlock key={c.item} label={`${c.item}. ${c.title}`} value={c.code} wrap={false} />
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

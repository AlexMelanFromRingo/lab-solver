"use client";

import { useMemo, useState } from "react";
import { ModuleHeader } from "@/components/module-header";
import { LabProcedure } from "@/components/lab-procedure";
import { Card, CardBody } from "@/components/ui/card";
import { InfoNote } from "@/components/ui/info-note";
import { OutputBlock } from "@/components/ui/output-block";
import { VariantDial } from "@/components/ui/variant-dial";
import { categories, modules } from "@/lib/modules";
import { AI_GUIDES } from "@/lib/data/ai-labs";
import { useLang } from "@/components/lang";
import {
  BASE_TOKENIZER,
  PROBE_TEXTS,
  TOKENIZER_VARIANTS,
  tokenizerFor,
  type TokenizerVariant,
} from "@/lib/data/ai-tokenizers";

const mod = modules.find((m) => m.slug === "ai-tokenizer")!;
const accent = categories.ai.accent;
const procedure = AI_GUIDES["ai-tokenizer"];

const nf = (n: number) => n.toLocaleString("ru-RU").replace(/ /g, " ");

/** Готовая ячейка зошита под выбранный вариант. */
function notebookCell(v: TokenizerVariant): string {
  return `from transformers import AutoTokenizer
import pandas as pd

BASE_MODEL = "gpt2"
VARIANT_MODEL = "${v.model}"

tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL, use_fast=True)
variant_tokenizer = AutoTokenizer.from_pretrained(VARIANT_MODEL, use_fast=True)


def analyze(text, tok):
    ids = tok.encode(text, add_special_tokens=False)
    decoded = tok.decode(ids, skip_special_tokens=True)
    utf8 = len(text.encode("utf-8"))

    return {
        "chars": len(text),
        "utf8_bytes": utf8,
        "tokens": len(ids),
        "bytes_per_token": round(utf8 / len(ids), 3) if ids else None,
        # Кирилиця займає два байти на символ, тому сам лише bytes/token
        # завищує оцінку покриття мови. Символи на токен від кодування не
        # залежать, і саме за ними мови можна порівнювати чесно.
        "chars_per_token": round(len(text) / len(ids), 3) if ids else None,
        "n_unk": sum(1 for i in ids if i == tok.unk_token_id),
        "roundtrip_ok": decoded == text,
        "ids": ids,
        "pieces": tok.convert_ids_to_tokens(ids),
    }


rows = []
for text in MY_TEXTS:
    base, variant = analyze(text, tokenizer), analyze(text, variant_tokenizer)
    rows.append({
        "text": text,
        "chars": base["chars"],
        "utf8_bytes": base["utf8_bytes"],
        "gpt2_tokens": base["tokens"],
        "variant_tokens": variant["tokens"],
        "gpt2_c/t": base["chars_per_token"],
        "variant_c/t": variant["chars_per_token"],
        "variant_unk": variant["n_unk"],
        "gpt2_rt": base["roundtrip_ok"],
        "variant_rt": variant["roundtrip_ok"],
    })

pd.DataFrame(rows)`;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border/50 py-1.5 last:border-b-0">
      <span className="text-sm text-ink-dim">{label}</span>
      <span className="font-mono text-sm text-ink">{value}</span>
    </div>
  );
}

export default function AiTokenizerPage() {
  const { lang } = useLang();
  const tx = (uk: string, ruText: string) => (lang === "uk" ? uk : ruText);
  const [variantNum, setVariantNum] = useState(1);
  const tok = useMemo(() => tokenizerFor(variantNum), [variantNum]);
  const normalised = ((variantNum - 1) % TOKENIZER_VARIANTS.length) + 1;

  const totals = useMemo(() => {
    const sum = (t: TokenizerVariant) =>
      PROBE_TEXTS.reduce((acc, p) => acc + (t.probes[p.key]?.tokens ?? 0), 0);
    return { base: sum(BASE_TOKENIZER), variant: sum(tok) };
  }, [tok]);

  return (
    <div>
      <ModuleHeader module={mod} />
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        <InfoNote>
          {lang === "uk" ? "Усі числа на цій сторінці виміряні запуском: кожен токенізатор завантажений і прогнаний на одному й тому самому наборі рядків. Браузер такі моделі не запускає — словники важать мегабайти, — тому тут виміряне і готова комірка зошита, а сам розрахунок виконується там, де й має: у Colab або на своїй машині." : "Все числа на этой странице измерены запуском: каждый токенизатор загружен и прогнан на одном и том же наборе строк. Браузер такие модели не запускает — словари весят мегабайты, — поэтому здесь измеренное и готовая ячейка зошита, а сам расчёт выполняется там, где и должен: в Colab или на своей машине."}
        </InfoNote>

        <LabProcedure guide={procedure} accent={accent} />

        <VariantDial value={variantNum} min={1} max={20} onChange={setVariantNum} accent={accent} />

        {variantNum > TOKENIZER_VARIANTS.length && (
          <p className="text-sm text-ink-dim">
            {tx("Варіант","Вариант")} {variantNum} {tx("зводиться остачею від ділення на десять до рядка","сводится остатком от деления на десять к строке")}{" "}
            <span style={{ color: accent }}>{normalised}</span> {tx("таблиці.","таблицы.")}
          </p>
        )}

        {/* --- Токенизатор варианта ----------------------------------------- */}
        <Card>
          <CardBody className="pt-6 space-y-5">
            <div>
              <p className="text-xs text-ink-faint">
                {tx("Варіант","Вариант")} {normalised}
              </p>
              <h2 className="mt-1 font-display text-xl font-semibold tracking-tight text-ink">
                {tok.model}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-dim">{tok.note}</p>
            </div>

            <div className="grid gap-x-8 gap-y-0 sm:grid-cols-2">
              <Row label={tx("Клас","Класс")} value={tok.cls} />
              <Row label={tx("Пристрій","Устройство")} value={tok.family} />
              <Row label={tx("Розмір словника","Размер словаря")} value={nf(tok.vocab)} />
              <Row
                label={tx("Довжина з доданими","Длина с добавленными")}
                value={tok.length === tok.vocab ? tx("та сама","та же") : nf(tok.length)}
              />
              <Row label={tx("Токен невідомого","Токен неизвестного")} value={tok.unkToken ?? tx("немає","нет")} />
              <Row
                label={tx("Токенів на наборі","Токенов на наборе")}
                value={tx(`${totals.variant} проти ${totals.base} у GPT-2`,`${totals.variant} против ${totals.base} у GPT-2`)}
              />
            </div>
          </CardBody>
        </Card>

        {/* --- Измерения ----------------------------------------------------- */}
        <Card>
          <CardBody className="pt-6 space-y-5">
            <div>
              <h2 className="font-display text-xl font-semibold tracking-tight text-ink">
                {tx("Що показав запуск","Что показал запуск")}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-ink-dim">
                {lang === "uk" ? "Один і той самий набір рядків на обох токенізаторах. Колонка «с/т» — символів на токен: на відміну від байтів, вона не залежить від кодування і годиться для порівняння мов." : "Один и тот же набор строк на обоих токенизаторах. Колонка «с/т» — символов на токен: в отличие от байтов, она не зависит от кодировки и годится для сравнения языков."}
              </p>
            </div>

            <div className="overflow-x-auto rounded-[4px] border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-ink-faint">
                    <th className="px-3 py-2 text-left font-medium">Строка</th>
                    <th className="px-3 py-2 text-right font-medium">GPT-2</th>
                    <th className="px-3 py-2 text-right font-medium">вариант</th>
                    <th className="px-3 py-2 text-right font-medium">GPT-2 с/т</th>
                    <th className="px-3 py-2 text-right font-medium">вариант с/т</th>
                    <th className="px-3 py-2 text-center font-medium">потери</th>
                  </tr>
                </thead>
                <tbody>
                  {PROBE_TEXTS.map((p) => {
                    const b = BASE_TOKENIZER.probes[p.key];
                    const v = tok.probes[p.key];
                    const better = v.tokens < b.tokens;
                    const loss = v.unk > 0 ? `${v.unk} неизв.` : !v.rt ? "не собрался" : "—";

                    return (
                      <tr key={p.key} className="border-b border-border/50 last:border-b-0">
                        <td className="px-3 py-2 text-ink-dim">{p.label}</td>
                        <td className="px-3 py-2 text-right font-mono text-ink-dim">{b.tokens}</td>
                        <td
                          className="px-3 py-2 text-right font-mono"
                          style={better ? { color: accent } : undefined}
                        >
                          {v.tokens}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-ink-faint">{b.cpt}</td>
                        <td className="px-3 py-2 text-right font-mono text-ink-faint">{v.cpt}</td>
                        <td
                          className="px-3 py-2 text-center text-xs"
                          style={loss === "—" ? undefined : { color: "#fb7185" }}
                        >
                          {loss}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[4px] border border-border bg-black/20 px-4 py-3">
                <div className="text-xs text-ink-faint">
                  Регистр: токен · Токен · ТОКЕН
                </div>
                <div className="mt-1 font-mono text-sm text-ink">
                  {tok.caseTokens.join(" · ")}
                  <span className="text-ink-faint">
                    {"  "}(GPT-2: {BASE_TOKENIZER.caseTokens.join(" · ")})
                  </span>
                </div>
              </div>
              <div className="rounded-[4px] border border-border bg-black/20 px-4 py-3">
                <div className="text-xs text-ink-faint">
                  {tx("Пробіли","Пробелы")}: world · ␣world · ␣␣world
                </div>
                <div className="mt-1 font-mono text-sm text-ink">
                  {tok.spaceTokens.join(" · ")}
                  <span className="text-ink-faint">
                    {"  "}(GPT-2: {BASE_TOKENIZER.spaceTokens.join(" · ")})
                  </span>
                </div>
                {tok.spaceTokens[0] === tok.spaceTokens[2] && (
                  <p className="mt-1.5 text-xs leading-relaxed text-ink-faint">
                    {tx("Кратні пробіли нормалізуються, тому вплив пробіла на цьому токенізаторі показати не можна — беріть регістр.","Кратные пробелы нормализуются, поэтому влияние пробела на этом токенизаторе показать нельзя — берите регистр.")}
                  </p>
                )}
              </div>
            </div>
          </CardBody>
        </Card>

        {/* --- Готовая ячейка ------------------------------------------------- */}
        <Card>
          <CardBody className="pt-6 space-y-4">
            <div>
              <h2 className="font-display text-xl font-semibold tracking-tight text-ink">
                {tx("Готова комірка зошита","Готовая ячейка зошита")}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-ink-dim">
                {tx("Вставляється після комірки, де оголошено власний набір рядків","Вставляется после ячейки, где объявлен собственный набор строк")}{" "}
                <code>MY_TEXTS</code>. {tx("Рахує метрики обома токенізаторами і складає в одну таблицю.","Считает метрики обоими токенизаторами и складывает в одну таблицу.")}
              </p>
            </div>
            <OutputBlock label="cell.py" value={notebookCell(tok)} wrap={false} />
          </CardBody>
        </Card>

        {/* --- Все варианты --------------------------------------------------- */}
        <Card>
          <CardBody className="pt-6 space-y-5">
            <div>
              <h2 className="font-display text-xl font-semibold tracking-tight text-ink">
                {tx("Усі десять, поряд","Все десять, рядом")}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-ink-dim">
                {lang === "uk" ? "Стовпці «укр» і «англ» — число токенів на двох реченнях однакового змісту. Одразу видно, який словник на яку мову розрахований." : "Столбцы «укр» и «англ» — число токенов на двух предложениях одинакового смысла. Сразу видно, какой словарь на какой язык рассчитан."}
              </p>
            </div>

            <div className="overflow-x-auto rounded-[4px] border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-ink-faint">
                    <th className="px-3 py-2 text-left font-medium">№</th>
                    <th className="px-3 py-2 text-left font-medium">Токенизатор</th>
                    <th className="px-3 py-2 text-right font-medium">Словарь</th>
                    <th className="px-3 py-2 text-right font-medium">укр</th>
                    <th className="px-3 py-2 text-right font-medium">англ</th>
                    <th className="px-3 py-2 text-center font-medium">emoji</th>
                    <th className="px-3 py-2 text-center font-medium">сборка назад</th>
                  </tr>
                </thead>
                <tbody>
                  {TOKENIZER_VARIANTS.map((v) => {
                    const broken = PROBE_TEXTS.filter((p) => !v.probes[p.key].rt).length;
                    const lostEmoji = v.probes.emoji.unk > 0 || v.probes.zwj.unk > 0;

                    return (
                      <tr
                        key={v.variant}
                        className="border-b border-border/50 last:border-b-0"
                        style={v.variant === normalised ? { background: `${accent}0d` } : undefined}
                      >
                        <td className="px-3 py-2 font-mono text-xs text-ink-faint">{v.variant}</td>
                        <td className="px-3 py-2 text-ink">{v.model.split("/").pop()}</td>
                        <td className="px-3 py-2 text-right font-mono text-ink-dim">
                          {nf(v.vocab)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-ink-dim">
                          {v.probes.uk.tokens}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-ink-dim">
                          {v.probes.en.tokens}
                        </td>
                        <td className="px-3 py-2 text-center text-xs">
                          {lostEmoji ? (
                            <span style={{ color: "#fb7185" }}>теряет</span>
                          ) : (
                            <span className="text-ink-faint">цел</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center text-xs">
                          {broken === 0 ? (
                            <span className="text-ink-faint">везде</span>
                          ) : (
                            <span style={{ color: "#fb7185" }}>{broken} из 6</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <p className="text-sm leading-relaxed text-ink-dim">
              {lang === "uk" ? "Два спостереження, яких в описах моделей немає. Перше: токен невідомого виникає тільки у двох токенізаторів — один втрачає кирилицю цілком, інший не знає emoji. Друге: там, де зворотне збирання ламається без жодного невідомого токена, справа не в символах, а в нормалізації — схлопуються кратні пробіли або зникає невидимий з’єднувач усередині складеного emoji." : "Два наблюдения, которых в описаниях моделей нет. Первое: токен неизвестного возникает только у двух токенизаторов — один теряет кириллицу целиком, другой не знает emoji. Второе: там, где обратная сборка ломается без единого неизвестного токена, дело не в символах, а в нормализации — схлопываются кратные пробелы либо пропадает невидимый соединитель внутри составного emoji."}
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

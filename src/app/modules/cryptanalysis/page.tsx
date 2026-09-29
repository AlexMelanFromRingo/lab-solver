"use client";

import { useMemo, useState } from "react";
import { ModuleHeader } from "@/components/module-header";
import { Card, CardBody } from "@/components/ui/card";
import { NumberField, SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { InfoNote } from "@/components/ui/info-note";
import { OutputBlock } from "@/components/ui/output-block";
import { Segmented } from "@/components/ui/segmented";
import { categories, modules } from "@/lib/modules";
import { cp1251Char, cp1251Decode, cp1251Encode } from "@/lib/algorithms/cp1251";
import {
  HYPOTHESES,
  N,
  acPeriod,
  autocorrelation,
  columnShifts,
  frequencies,
  kasiskiPeriod,
  kasiskiTrigrams,
  keyByte,
  n1Symbols,
  reduceKey,
  shiftGuesses,
  symbolCount,
  type Hypothesis,
} from "@/lib/algorithms/cryptanalysis";
import { caesar, passwordShifts, vigenere } from "@/lib/algorithms/classical-ciphers";

const mod = modules.find((m) => m.slug === "cryptanalysis")!;
const ACCENT = categories.pk.accent;

const SAMPLE =
  "Криптоаналіз — наука про розкриття шифрів без знання ключа. Перші систематичні методи з'явилися ще в дев'ятому столітті: " +
  "арабський учений аль-Кінді помітив, що в будь-якій мові одні літери трапляються частіше за інші, і запропонував порівнювати " +
  "частоти символів шифртексту з частотами відкритої мови. Так шифр простої заміни втратив стійкість: найчастіший символ " +
  "шифртексту майже завжди відповідає пробілу або літері «о». Багатоалфавітні шифри довго вважали нерозкриваними, адже кожна " +
  "літера тексту зсувається на своє значення, і частоти вирівнюються. Шифр Віженера навіть називали нерозгадним. Проте в " +
  "середині дев'ятнадцятого століття Фрідріх Казіскі показав, що однакові фрагменти відкритого тексту, які потрапили під " +
  "однакові літери ключа, дають однакові фрагменти шифртексту. Відстані між такими повтореннями кратні довжині ключа, тож їхній " +
  "найбільший спільний дільник видає період. Коли період відомий, шифртекст розрізають на стовпці, і кожен стовпець " +
  "розкривається як звичайний шифр зсуву. Автокореляційний метод приходить до того самого з іншого боку: якщо зсунути " +
  "шифртекст на довжину ключа, кількість збігів символів різко зростає. Отже, стійкість шифру визначає не складність " +
  "перетворення, а довжина і випадковість ключа.";

/** Символ N1 для таблиць: пробіл і невидимі — кодом. */
function sym(x1: number): string {
  const b = x1 + 32;
  if (b === 0x20) return "␣";
  if (b === 0x98 || b === 0xa0 || b === 0xad) return `${b.toString(16).toUpperCase()}h`;
  return cp1251Char(b);
}

const hex = (b: number) => `${b.toString(16).toUpperCase().padStart(2, "0")}h`;

function Table({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  return (
    <div className="overflow-x-auto rounded-[4px] border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-xs text-ink-faint">
            {head.map((h, i) => (
              <th key={i} className="px-3 py-2 text-left font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-border/50 last:border-b-0">
              {r.map((c, j) => (
                <td key={j} className="px-3 py-1.5 font-mono text-xs text-ink">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type Source = "sample" | "file" | "text";

export default function CryptanalysisPage() {
  const [source, setSource] = useState<Source>("sample");
  const [plain, setPlain] = useState(SAMPLE);
  const [method, setMethod] = useState<"vig" | "shift">("vig");
  const [shift, setShift] = useState(17);
  const [password, setPassword] = useState("ЗАХИСТ");
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
  const [fileName, setFileName] = useState("");
  const [pasted, setPasted] = useState("");
  const [tMax, setTMax] = useState(30);
  const [periodOverride, setPeriodOverride] = useState("");
  const [picks, setPicks] = useState<Hypothesis[]>([]);

  const cipher = useMemo<number[] | string>(() => {
    try {
      if (source === "file") return fileBytes ? Array.from(fileBytes) : "Оберіть зашифрований файл (CP1251)";
      if (source === "text") return pasted ? Array.from(cp1251Encode(pasted)) : "Вставте шифртекст";
      const p = cp1251Encode(plain);
      return method === "shift" ? caesar(p, ((shift % N) + N) % N) : vigenere(p, passwordShifts(cp1251Encode(password)));
    } catch (e) {
      return (e as Error).message;
    }
  }, [source, fileBytes, pasted, plain, method, shift, password]);

  const a = useMemo(() => {
    if (typeof cipher === "string") return null;
    const s = n1Symbols(cipher);
    if (symbolCount(s) < 4) return null;
    const ac = autocorrelation(s, tMax);
    const tris = kasiskiTrigrams(s);
    return { s, freq: frequencies(s), guesses: shiftGuesses(s), ac, acp: acPeriod(ac), tris, kp: kasiskiPeriod(tris) };
  }, [cipher, tMax]);

  const forced = parseInt(periodOverride, 10);
  const period = a ? (forced > 0 ? forced : (a.kp.period ?? a.acp.period ?? 1)) : 1;
  const cols = a ? columnShifts(a.s, period, picks) : [];
  const key = reduceKey(cols.map((c) => c.key));
  const keyBytes = key.map(keyByte);
  const decrypted = typeof cipher !== "string" && key.length ? cp1251Decode(vigenere(cipher, key, -1)) : "";

  const setPick = (c: number, h: Hypothesis) =>
    setPicks((p) => {
      const n = [...p];
      n[c] = h;
      return n;
    });

  return (
    <div>
      <ModuleHeader module={mod} />
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        <InfoNote title="Що робиться">
          Шифртекст — результат програм ЛР 1: алфавіт N1, позиція символу <code>X1 = Ord(C) − 32</code>, N = 224, керуючі
          символи 00h…1Fh не шифруються, але займають свою позицію ключа (як в еталоні викладача). Шифр зсуву розкривається частотним методом (2.1), шифр Віженера — автокореляційним
          методом або методом Казіскі (2.2, 2.3): спершу період ключа, потім частотний аналіз кожного стовпця.
        </InfoNote>

        <Card>
          <CardBody className="space-y-5 pt-6">
            <h2 className="font-display text-lg font-semibold text-ink">Шифртекст</h2>
            <Segmented<Source>
              label="Джерело"
              value={source}
              onChange={setSource}
              accent={ACCENT}
              options={[
                { value: "sample", label: "Зашифрувати приклад" },
                { value: "file", label: "Файл з ЛР 1" },
                { value: "text", label: "Вставити текст" },
              ]}
            />
            {source === "sample" && (
              <div className="space-y-4">
                <TextAreaField label="Відкритий текст" value={plain} onChange={(e) => setPlain(e.target.value)} className="min-h-[8rem]" />
                <div className="grid gap-4 sm:grid-cols-3">
                  <SelectField label="Шифр ЛР 1" value={method} onChange={(e) => setMethod(e.target.value as "vig" | "shift")}>
                    <option value="vig">Віженера з паролем</option>
                    <option value="shift">Цезаря (зсув)</option>
                  </SelectField>
                  {method === "shift" ? (
                    <NumberField label="Зсув k" value={shift} onChange={(e) => setShift(Number(e.target.value))} />
                  ) : (
                    <TextField label="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} />
                  )}
                </div>
              </div>
            )}
            {source === "file" && (
              <label className="block text-sm text-ink-dim">
                <span className="mb-2 block text-xs text-ink-faint">Зашифрований текстовий файл (байти читаються як є)</span>
                <input
                  type="file"
                  className="text-sm"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    setFileName(f.name);
                    setFileBytes(new Uint8Array(await f.arrayBuffer()));
                  }}
                />
                {fileName && <span className="ml-2 font-mono text-xs">{fileName}</span>}
              </label>
            )}
            {source === "text" && (
              <TextAreaField label="Шифртекст (буде закодований у CP1251)" value={pasted} onChange={(e) => setPasted(e.target.value)} className="min-h-[8rem]" />
            )}
            {typeof cipher === "string" ? (
              <p className="text-sm text-codes">{cipher}</p>
            ) : (
              <OutputBlock label={`Шифртекст у CP1251 · L = ${a?.s.length ?? 0} байт, з них ${a ? symbolCount(a.s) : 0} символів N1`} value={cp1251Decode(cipher)} />
            )}
          </CardBody>
        </Card>

        {a && (
          <>
            <Card>
              <CardBody className="space-y-5 pt-6">
                <h2 className="font-display text-lg font-semibold text-ink">2.1 Частотний метод (шифр зсуву)</h2>
                <Table
                  head={["№", "Символ", "Код", "X1", "Кількість", "Частота"]}
                  rows={a.freq.slice(0, 5).map((f, i) => [i + 1, sym(f.x1), hex(f.x1 + 32), f.x1, f.count, f.share.toFixed(4)])}
                />
                <Table
                  head={["Припущення", "Символ шифртексту", "Ключ k = (X1ш − X1в) mod 224", "Початок розшифрування"]}
                  rows={a.guesses.map((g) => [
                    `${g.assumed === "пробіл" ? "найчастіший" : "другий"} ↔ ${g.assumed === "пробіл" ? "␣ (X1 = 0)" : "«о» (X1 = 206)"}`,
                    `${sym(g.cipherX1)} (X1 = ${g.cipherX1})`,
                    g.key,
                    typeof cipher === "string" ? "" : cp1251Decode(caesar(cipher, g.key, -1)).slice(0, 48),
                  ])}
                />
                <p className="text-xs text-ink-faint">
                  Для шифру Віженера цей метод не працює: різні стовпці зсунуті на різні ключі, і частоти вирівнюються.
                </p>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="space-y-5 pt-6">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <h2 className="font-display text-lg font-semibold text-ink">2.2 Автокореляційний метод</h2>
                  <NumberField label="t до" value={tMax} onChange={(e) => setTMax(Math.max(2, Number(e.target.value)))} className="w-24" />
                </div>
                <Table
                  head={["t", "nₜ", "γₜ = nₜ/(L − t)", ""]}
                  rows={a.ac.map((r) => [
                    r.t,
                    r.n,
                    r.gamma.toFixed(4),
                    `${"█".repeat(Math.round((r.gamma / Math.max(1e-9, a.acp.threshold * 2)) * 24))}${a.acp.picked.includes(r.t) ? "  ◀" : ""}`,
                  ])}
                />
                <p className="text-sm text-ink-dim">
                  Відібрано t з γₜ &gt; {a.acp.threshold.toFixed(4)} (половина максимуму): {a.acp.picked.join(", ") || "—"}. Період —
                  мінімальне з них: <span className="font-mono text-ink">{a.acp.period ?? "—"}</span>.
                </p>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="space-y-5 pt-6">
                <h2 className="font-display text-lg font-semibold text-ink">2.3 Метод Казіскі</h2>
                <Table
                  head={["Три-грама", "Позиції", "Відстані", "НСД"]}
                  rows={a.tris.slice(0, 15).map((t) => [t.tri.map(sym).join(""), t.positions.join(", "), t.distances.join(", "), t.gcd])}
                />
                <p className="text-xs text-ink-faint">Повторюваних три-грам: {a.tris.length}{a.tris.length > 15 ? " (показано 15 найчастіших)" : ""}.</p>
                <Table
                  head={["d", "Частка відстаней, кратних d"]}
                  rows={a.kp.shares.filter((s) => s.share > 0).slice(0, 12).map((s) => [s.d, `${(s.share * 100).toFixed(0)} %${s.d === a.kp.period ? "  ◀ період" : ""}`])}
                />
                <p className="text-sm text-ink-dim">
                  Період за Казіскі: <span className="font-mono text-ink">{a.kp.period ?? "—"}</span>.
                </p>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="space-y-5 pt-6">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <h2 className="font-display text-lg font-semibold text-ink">Ключ: частотний аналіз стовпців</h2>
                  <TextField
                    label="Період"
                    hint={`порожньо — ${a.kp.period ? "за Казіскі" : "автокореляційний"}`}
                    value={periodOverride}
                    onChange={(e) => {
                      setPeriodOverride(e.target.value);
                      setPicks([]);
                    }}
                    className="w-28"
                  />
                </div>
                <div className="overflow-x-auto rounded-[4px] border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-xs text-ink-faint">
                        {["Стовпець", "Символів", "1-й / 2-й за частотою", "Гіпотеза", "Зсув", "Символ пароля"].map((h) => (
                          <th key={h} className="px-3 py-2 text-left font-medium">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {cols.map((c, i) => (
                        <tr key={c.col} className="border-b border-border/50 last:border-b-0">
                          <td className="px-3 py-1.5 font-mono text-xs text-ink">{c.col}</td>
                          <td className="px-3 py-1.5 font-mono text-xs text-ink">{c.length}</td>
                          <td className="px-3 py-1.5 font-mono text-xs text-ink">{c.top.map((t) => `${sym(t.x1)} ×${t.count}`).join(" / ")}</td>
                          <td className="px-3 py-1">
                            <select
                              value={picks[i] ?? "1-пробіл"}
                              onChange={(e) => setPick(i, e.target.value as Hypothesis)}
                              className="rounded-[3px] border border-border bg-transparent px-2 py-1 text-xs text-ink"
                            >
                              {HYPOTHESES.map((h) => (
                                <option key={h} value={h}>
                                  {h.startsWith("1") ? "1-й" : "2-й"} ↔ {h.endsWith("о") ? "«о»" : "пробіл"}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-1.5 font-mono text-xs text-ink">{c.key}</td>
                          <td className="px-3 py-1.5 font-mono text-xs text-ink">{sym(c.key)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <OutputBlock
                  label={key.length < cols.length ? `Пароль (ключ з ${cols.length} символів — повтор коротшого, період ${key.length})` : "Пароль"}
                  value={`${cp1251Decode(keyBytes)}   [${keyBytes.map(hex).join(" ")}]`}
                />
                <OutputBlock label="Розшифрований текст" value={decrypted} />
                <p className="text-xs text-ink-faint">
                  Якщо текст у якомусь стовпці безглуздий, для нього береться друга гіпотеза частотного методу — другий за частотою
                  символ ↔ «о» (або найчастіший — не пробіл).
                </p>
              </CardBody>
            </Card>

            <InfoNote title="Помилки методички">
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  Крок 4 автокореляційного методу: «відбираються t, для яких γₜ &gt; 0,5» — для природного тексту недосяжно: на
                  періоді γ ≈ 0,05…0,07, поза ним — у кілька разів менше. Тут поріг відносний — половина найбільшого γₜ.
                </li>
                <li>
                  Мінімальне з відібраних t може виявитися кратним періоду (коли в самому тексті мало збігів на відстані періоду):
                  тоді пароль вийде повтором коротшого — сторінка скорочує його сама, а Казіскі дає точний період.
                </li>
                <li>«Мінімальний з отриманих НСД» (крок 4 Казіскі) ламається на випадкових повтореннях три-грам — тому період тут — найбільше d, якому кратна більшість відстаней.</li>
              </ul>
            </InfoNote>
          </>
        )}
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { ModuleHeader } from "@/components/module-header";
import { Card, CardBody } from "@/components/ui/card";
import { TextField } from "@/components/ui/field";
import { InfoNote } from "@/components/ui/info-note";
import { modules } from "@/lib/modules";
import { bitsToString, encryptByte, decryptByte, type RoundTrace, type SdesFullTrace } from "@/lib/algorithms/sdes";
import { cp1251Char, cp1251Code } from "@/lib/algorithms/cp1251";
import { useLang } from "@/components/lang";

const mod = modules.find((m) => m.slug === "sdes")!;

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-4 py-2 border-b border-border/60 last:border-0 font-mono text-sm">
      <span className="text-ink-faint">{label}</span>
      <span className={strong ? "text-crypto" : "text-ink"}>{value}</span>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[4px] border border-border bg-black/30 overflow-hidden">
      <div className="border-b border-border px-4 py-2 text-xs font-medium text-ink-faint">{title}</div>
      {children}
    </div>
  );
}

/** Вкладка «Раунд» програми: L[i-1], R[i-1] → E/P → xor K[i] → S0, S1 → P4 → F[i]. */
function RoundPanel({ r, input, k, n }: { r: RoundTrace; input: number[]; k: number[]; n: 1 | 2 }) {
  return (
    <Panel title={`Раунд ${n}: F с ключом ${bitsToString(k)}`}>
      <Line label="L[i-1], R[i-1]" value={`${bitsToString(input.slice(0, 4))} ${bitsToString(input.slice(4))}`} />
      <Line label="E/P" value={bitsToString(r.ep)} />
      <Line label="K[i]" value={bitsToString(k)} />
      <Line label="SUM = E/P xor K[i]" value={bitsToString(r.sum)} />
      <Line label="S0, S1" value={`${bitsToString(r.s0Out)} ${bitsToString(r.s1Out)}`} />
      <Line label="P4" value={bitsToString(r.p4Out)} />
      <Line label="L[i] = L[i-1] xor P4, R[i]" value={`${bitsToString(r.li)} ${bitsToString(r.ri)}`} />
    </Panel>
  );
}

function Column({ t, from, to, byteIn }: { t: SdesFullTrace; from: string; to: string; byteIn: number[] }) {
  const out = t.output.reduce((a, b) => (a << 1) | b, 0);
  return (
    <Panel title={`${from} → ${to}`}>
      <Line label={from} value={bitsToString(byteIn)} />
      <Line label="IP" value={bitsToString(t.ip)} />
      <Line label="F[1]" value={bitsToString(t.round1.output)} />
      <Line label="SW" value={bitsToString(t.swapped)} />
      <Line label="F[2]" value={bitsToString(t.round2.output)} />
      <Line label="IP^" value={bitsToString(t.output)} />
      <Line label={to} value={`${bitsToString(t.output)} = ${out.toString(16).toUpperCase().padStart(2, "0")}h «${cp1251Char(out)}»`} strong />
    </Panel>
  );
}

const parseBits = (s: string, width: number) => (new RegExp(`^[01]{${width}}$`).test(s.trim()) ? parseInt(s.trim(), 2) : null);

export default function SdesPage() {
  const { lang } = useLang();
  const tx = (uk: string, ruText: string) => (lang === "uk" ? uk : ruText);
  // Режим «Тестирование» из демонстрации программы: ключ 1100110111, символ «v».
  const [symStr, setSymStr] = useState("v");
  const [keyStr, setKeyStr] = useState("1100110111");

  const byte = useMemo(() => {
    const s = symStr.trim();
    if (/^[01]{8}$/.test(s)) return parseInt(s, 2);
    return s.length === 1 ? (cp1251Code(s) ?? null) : null;
  }, [symStr]);
  const key = parseBits(keyStr, 10);

  const enc = byte !== null && key !== null ? encryptByte(byte, key) : null;
  const encByte = enc ? enc.output.reduce((a, b) => (a << 1) | b, 0) : 0;
  const dec = enc && key !== null ? decryptByte(encByte, key) : null;

  return (
    <div>
      <ModuleHeader module={mod} />
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        <InfoNote title={tx("Як у програмі S-DES","Как в программе S-DES")}>
          {lang === "uk" ? (<>Програма шифрує один символ (код CP1251, 8 біт) 10-бітовим ключем і в режимі «Тестування» просить ввести кожен проміжний результат, а сервер рахує помилки. Порядок виводу тут той самий: ключі (P10 → Shift&nbsp;&lt;&nbsp;1 → P8 = K[1] → Shift&nbsp;&lt;&nbsp;2 → P8 = K[2]), потім To → IP → F[1] → SW → F[2] → IP^ → Tз, а для кожного F — вкладка «Раунд». Таблиці перестановок — стандартні, а S-блоки — як у вікні програми: S0[3][3] = 1 і S1[0][0] = 1 (у підручнику Столлінгса 2 і 0).</>) : (<>Программа шифрует один символ (код CP1251, 8 бит) 10-битовым ключом и в режиме «Тестирование» просит ввести каждый промежуточный результат, а сервер считает ошибки. Порядок вывода здесь тот же: ключи (P10 → Shift&nbsp;&lt;&nbsp;1 → P8 = K[1] → Shift&nbsp;&lt;&nbsp;2 → P8 = K[2]), затем To → IP → F[1] → SW → F[2] → IP^ → Tз, а для каждого F — вкладка «Раунд». Таблицы перестановок — стандартные, а S-блоки — как в окне программы: S0[3][3] = 1 и S1[0][0] = 1 (в учебнике Столлингса 2 и 0).</>)}
        </InfoNote>

        <Card>
          <CardBody className="pt-6 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label={tx("Вихідний символ","Исходный символ")} hint={tx("один символ або 8 біт","один символ или 8 бит")} value={symStr} onChange={(e) => setSymStr(e.target.value)} />
              <TextField label={tx("10-бітовий ключ","10-битовый ключ")} value={keyStr} onChange={(e) => setKeyStr(e.target.value)} />
            </div>

            {enc && dec && byte !== null ? (
              <div className="space-y-4">
                <Panel title="Генерация ключей">
                  <Line label={tx("10-бітовий ключ","10-битовый ключ")} value={keyStr.trim()} />
                  <Line label="P10" value={bitsToString(enc.keys.p10)} />
                  <Line label="Shift < 1" value={bitsToString(enc.keys.shifted1)} />
                  <Line label="P8 → K[1]" value={bitsToString(enc.keys.k1)} strong />
                  <Line label="Shift < 2" value={bitsToString(enc.keys.shifted3)} />
                  <Line label="P8 → K[2]" value={bitsToString(enc.keys.k2)} strong />
                </Panel>
                <div className="grid gap-4 md:grid-cols-2">
                  <Column t={enc} from="To" to={tx("Tз · зашифрований символ","Tз · зашифрованный символ")} byteIn={Array.from({ length: 8 }, (_, i) => (byte >> (7 - i)) & 1)} />
                  <Column t={dec} from="Tз" to={tx("To · розшифрований символ","To · расшифрованный символ")} byteIn={enc.output} />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <RoundPanel r={enc.round1} input={enc.ip} k={enc.keys.k1} n={1} />
                  <RoundPanel r={enc.round2} input={enc.swapped} k={enc.keys.k2} n={2} />
                </div>
                <p className="text-xs text-ink-faint">
                  {tx("Розшифрування — ті самі кроки зі зворотним порядком ключів (K[2], потім K[1]); результат","Расшифрование — те же шаги с обратным порядком ключей (K[2], затем K[1]); результат")}{" "}
                  {dec.output.reduce((a, b) => (a << 1) | b, 0) === byte ? tx("збігається з вихідним символом ✓","совпадает с исходным символом ✓") : tx("не збігся","не совпал")}.
                </p>
              </div>
            ) : (
              <p className="text-sm text-codes">Символ — один знак из CP1251 или 8 бит (0/1), ключ — ровно 10 бит.</p>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { ModuleHeader } from "@/components/module-header";
import { Card, CardBody } from "@/components/ui/card";
import { NumberField, SelectField, TextField } from "@/components/ui/field";
import { InfoNote } from "@/components/ui/info-note";
import { OutputBlock } from "@/components/ui/output-block";
import { CodeBlock } from "@/components/ui/code-block";
import { modules } from "@/lib/modules";
import {
  type RsaKeys,
  decryptFileScheme,
  encryptFileScheme,
  generateKeys,
  keysFromPQE,
  signNumber,
  verifySignature,
} from "@/lib/algorithms/rsa";
import { generateRsaCpp, type PrimalityTestType, type PrngType, type RsaMode } from "@/lib/codegen/rsa-cpp";
import { useMounted } from "@/lib/use-mounted";

const mod = modules.find((m) => m.slug === "rsa")!;

export default function RsaPage() {
  const mounted = useMounted();
  const [mode, setMode] = useState<"auto" | "manual">("auto");
  const [bits, setBits] = useState(15);
  const [seedP, setSeedP] = useState("12345");
  const [seedQ, setSeedQ] = useState("67890");
  const [pStr, setPStr] = useState("61");
  const [qStr, setQStr] = useState("53");
  const [eStr, setEStr] = useState("17");
  const [text, setText] = useState("RSA из курсовой");
  const [signMsg, setSignMsg] = useState("42");

  const keys = useMemo((): { ok: true; data: RsaKeys } | { ok: false; error: string } => {
    try {
      if (mode === "auto") {
        return { ok: true, data: generateKeys(bits, BigInt(seedP), BigInt(seedQ)) };
      }
      return { ok: true, data: keysFromPQE(BigInt(pStr), BigInt(qStr), BigInt(eStr)) };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }, [mode, bits, seedP, seedQ, pStr, qStr, eStr]);

  const enc = useMemo((): { ok: true; b64: string } | { ok: false; error: string } | null => {
    if (!keys.ok) return null;
    try {
      return { ok: true, b64: encryptFileScheme(text, keys.data.e, keys.data.n) };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }, [keys, text]);

  const dec = useMemo(() => {
    if (!keys.ok || !enc || !enc.ok) return "";
    try {
      return decryptFileScheme(enc.b64, keys.data.d, keys.data.n);
    } catch {
      return "";
    }
  }, [keys, enc]);

  const signature = useMemo(() => {
    if (!keys.ok) return null;
    try {
      const m = BigInt(signMsg) % keys.data.n;
      const sig = signNumber(m, keys.data.d, keys.data.n);
      const valid = verifySignature(m, sig, keys.data.e, keys.data.n);
      return { m, sig, valid };
    } catch (e) {
      return { error: (e as Error).message };
    }
  }, [keys, signMsg]);

  const safe = mounted || mode === "manual";

  const [genPrng, setGenPrng] = useState<PrngType>("middle-square");
  const [genTest, setGenTest] = useState<PrimalityTestType>("miller-rabin");
  const [genMode, setGenMode] = useState<RsaMode>("file");
  const cppCode = useMemo(
    () => generateRsaCpp({ prng: genPrng, primalityTest: genTest, mode: genMode }),
    [genPrng, genTest, genMode]
  );

  return (
    <div>
      <ModuleHeader module={mod} />
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        <InfoNote>
          Курсовая требовала писать RSA <strong>с нуля</strong>: свой генератор простых чисел
          (проверка Миллером-Рабином, см. модуль «Тесты на простоту»), своё расширенное уравнение
          Евклида для <code>d = e⁻¹ mod φ(n)</code> и своё быстрое возведение в степень по модулю
          — отчёт подтверждает именно эту связку (mid-square ГПСЧ + Миллер-Рабин + e=65537 по
          умолчанию). Схема шифрования текста ниже — точно как в реальном файловом шифраторе
          (<code>rsa_encryptor/src/main.rs</code>): 20-битные блоки, Base64. По умолчанию
          битность простых — 15, как в оригинале (там был предел u32); при бо́льшей битности n
          не влезет в 4-байтную упаковку блока, и эта схема шифрования отключится.
        </InfoNote>

        <Card>
          <CardBody className="pt-6 space-y-5">
            <div className="flex gap-2">
              <button
                onClick={() => setMode("auto")}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${mode === "auto" ? "bg-crypto text-black" : "border border-border text-ink-dim hover:text-ink"}`}
              >
                Автогенерация p, q
              </button>
              <button
                onClick={() => setMode("manual")}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${mode === "manual" ? "bg-crypto text-black" : "border border-border text-ink-dim hover:text-ink"}`}
              >
                Свои p, q, e
              </button>
            </div>

            {mode === "auto" ? (
              <div className="grid gap-4 sm:grid-cols-3">
                <NumberField label="Битность каждого простого" value={bits} onChange={(e) => setBits(Number(e.target.value))} min={4} max={64} />
                <TextField label="Seed для p" value={seedP} onChange={(e) => setSeedP(e.target.value)} />
                <TextField label="Seed для q" value={seedQ} onChange={(e) => setSeedQ(e.target.value)} />
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-3">
                <TextField label="p (простое)" value={pStr} onChange={(e) => setPStr(e.target.value)} />
                <TextField label="q (простое)" value={qStr} onChange={(e) => setQStr(e.target.value)} />
                <TextField label="e" value={eStr} onChange={(e) => setEStr(e.target.value)} />
              </div>
            )}

            {!safe ? (
              <div className="h-24 rounded-xl border border-border bg-black/20 animate-pulse" />
            ) : keys.ok ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <OutputBlock label="p" value={keys.data.p.toString()} />
                <OutputBlock label="q" value={keys.data.q.toString()} />
                <OutputBlock label="n = p·q" value={keys.data.n.toString()} />
                <OutputBlock label="φ(n) = (p-1)(q-1)" value={keys.data.phi.toString()} />
                <OutputBlock label="e (открытая экспонента)" value={keys.data.e.toString()} />
                <OutputBlock label="d = e⁻¹ mod φ(n)" value={keys.data.d.toString()} />
              </div>
            ) : (
              <p className="text-sm text-codes">{keys.error}</p>
            )}
          </CardBody>
        </Card>

        {safe && keys.ok && (
          <Card>
            <CardBody className="pt-6 space-y-5">
              <h2 className="font-display text-lg font-semibold text-ink">Шифрование сообщения</h2>
              <p className="text-xs text-ink-faint">
                Точная схема файлового шифратора из курсовой: данные режутся на 20-битные блоки
                (не байтовые!), перед ними — 5-битный заголовок с длиной паддинга последнего
                блока, каждый зашифрованный блок — 4 байта (big-endian), всё вместе — в Base64
                (как содержимое зашифрованного файла в реальном инструменте).
              </p>
              <TextField label="Текст" value={text} onChange={(e) => setText(e.target.value)} />
              {enc && !enc.ok ? (
                <p className="text-sm text-codes">{enc.error}</p>
              ) : (
                <>
                  <OutputBlock label="Base64 (как содержимое .enc файла)" value={enc && enc.ok ? enc.b64 : ""} />
                  <OutputBlock label="Проверка расшифрования" value={dec} />
                </>
              )}
            </CardBody>
          </Card>
        )}

        {safe && keys.ok && (
          <Card>
            <CardBody className="pt-6 space-y-5">
              <h2 className="font-display text-lg font-semibold text-ink">Подпись (общая демонстрация, не из конкретного отчёта)</h2>
              <p className="text-xs text-ink-faint">
                sign(m) = mᵈ mod n; проверка: sig&#7497; mod n должно совпасть с m. В реальных схемах подписывают
                хеш сообщения, а не само сообщение — здесь для наглядности используется прямое число.
                Это общая демонстрация принципа RSA-подписи, а не портирование конкретного решателя.
              </p>
              <TextField label="Сообщение (число)" value={signMsg} onChange={(e) => setSignMsg(e.target.value)} />
              {signature && "error" in signature ? (
                <p className="text-sm text-codes">{signature.error}</p>
              ) : signature ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <OutputBlock label="Подпись" value={signature.sig.toString()} />
                  <OutputBlock label="Проверка" value={signature.valid ? "подпись верна ✓" : "подпись НЕ верна"} />
                </div>
              ) : null}
            </CardBody>
          </Card>
        )}

        <Card>
          <CardBody className="pt-6 space-y-5">
            <h2 className="font-display text-lg font-semibold text-ink">Конструктор: своя RSA-программа (C++)</h2>
            <p className="text-xs text-ink-faint">
              Курсовая требовала собрать RSA из своих частей — выберите, из каких: ГПСЧ для
              поиска простых, тест простоты, и режим (числа для проверки принципа или полное
              шифрование файла по схеме из реального инструмента). Каждая из 24 комбинаций
              скомпилирована и прогнана — шифрование/расшифрование сходится.
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              <SelectField label="ГПСЧ" value={genPrng} onChange={(e) => setGenPrng(e.target.value as PrngType)}>
                <option value="middle-square">Метод середины квадратов</option>
                <option value="lcg">Линейный конгруэнтный (LCG)</option>
                <option value="rand">Стандартный rand()</option>
              </SelectField>
              <SelectField label="Тест простоты" value={genTest} onChange={(e) => setGenTest(e.target.value as PrimalityTestType)}>
                <option value="trial">Пробное деление</option>
                <option value="fermat">Тест Ферма</option>
                <option value="miller-rabin">Миллер–Рабин</option>
                <option value="solovay-strassen">Соловей–Штрассен</option>
              </SelectField>
              <SelectField label="Режим" value={genMode} onChange={(e) => setGenMode(e.target.value as RsaMode)}>
                <option value="numbers">Числа (демонстрация принципа)</option>
                <option value="file">Файл/текст (20-битные блоки + Base64)</option>
              </SelectField>
            </div>
            <CodeBlock code={cppCode} filename={`rsa_${genPrng}_${genTest}_${genMode}.cpp`} />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

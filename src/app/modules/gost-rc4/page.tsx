"use client";

import { useMemo, useState } from "react";
import { ModuleHeader } from "@/components/module-header";
import { Card, CardBody } from "@/components/ui/card";
import { TextField } from "@/components/ui/field";
import { InfoNote } from "@/components/ui/info-note";
import { OutputBlock } from "@/components/ui/output-block";
import { FileSet } from "@/components/ui/file-set";
import { Segmented } from "@/components/ui/segmented";
import { useVhdlIndex } from "@/lib/vhdl-files";
import { categories, modules } from "@/lib/modules";
import { GOST_ROUND_KEYS, gostDecryptBlock, gostEncryptBlock, gostStdBlock, rc4Encrypt, type GostParamSet } from "@/lib/algorithms/gost-rc4";

const mod = modules.find((m) => m.slug === "gost-rc4")!;
const accent = categories.plis.accent;

function textToBytes(s: string): number[] {
  return Array.from(new TextEncoder().encode(s));
}
function bytesToHex(bytes: number[]): string {
  return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function GostRc4Page() {
  const vhdl = useVhdlIndex();
  // «std» — стандарт, как в показанном ниже gost_cipher.vhd; «lab» — учебный GOST.vhd из ЛР
  const [mode, setMode] = useState<"std" | "lab">("std");
  const [paramSet, setParamSet] = useState<GostParamSet>("TC26-Z");
  const [blockHex, setBlockHex] = useState("fedcba9876543210");
  const [keyHex, setKeyHex] = useState("ffeeddccbbaa99887766554433221100f0f1f2f3f4f5f6f7f8f9fafbfcfdfeff");

  const parse = (h: string) => {
    try {
      return BigInt("0x" + (h.trim() || "0"));
    } catch {
      return 0n;
    }
  };
  const block = useMemo(() => parse(blockHex), [blockHex]);
  const key = useMemo(() => parse(keyHex) & ((1n << 256n) - 1n), [keyHex]);

  const enc = useMemo(() => (mode === "lab" ? gostEncryptBlock(block).output : gostStdBlock(block, key, paramSet)), [mode, block, key, paramSet]);
  const dec = useMemo(() => (mode === "lab" ? gostDecryptBlock(enc).output : gostStdBlock(enc, key, paramSet, true)), [mode, enc, key, paramSet]);

  const [rc4Text, setRc4Text] = useState("Plaintext");
  const [rc4Key, setRc4Key] = useState("Key");

  const rc4Cipher = useMemo(() => rc4Encrypt(textToBytes(rc4Text), textToBytes(rc4Key || "\0")), [rc4Text, rc4Key]);
  const rc4Back = useMemo(() => {
    try {
      return new TextDecoder().decode(new Uint8Array(rc4Encrypt(rc4Cipher, textToBytes(rc4Key || "\0"))));
    } catch {
      return "";
    }
  }, [rc4Cipher, rc4Key]);

  return (
    <div>
      <ModuleHeader module={mod} />
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        <InfoNote>
          Два режима ГОСТ. «Стандарт» — то же, что VHDL ниже (gost_cipher.vhd): восемь разных узлов
          замены выбранного набора параметров, 256-битный ключ X0…X7, 24 раунда X0…X7 и 8 раундов
          X7…X0; по умолчанию — контрольный вектор RFC 8891 из gost_tb.vhd (результат 4ee901e5c2d8ca3d).
          «Учебный GOST.vhd» — схема из проекта ЛР: один 16-значный S-box на все 8 ниблов (к тому же не
          биективный) и восемь зашитых констант вместо ключа; обратимость держится на самой сети Фейстеля.
        </InfoNote>

        <Card>
          <CardBody className="pt-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-lg font-semibold text-ink">ГОСТ 28147-89</h2>
              <Segmented
                label="Режим"
                value={mode}
                accent={accent}
                onChange={setMode}
                options={[
                  { value: "std", label: "Стандарт (gost_cipher.vhd)" },
                  { value: "lab", label: "Учебный GOST.vhd" },
                ]}
              />
            </div>
            {mode === "std" && (
              <>
                <Segmented
                  label="Набор узлов замены"
                  value={paramSet}
                  accent={accent}
                  onChange={setParamSet}
                  options={[
                    { value: "TC26-Z", label: "TC26-Z" },
                    { value: "CryptoPro-A", label: "CryptoPro-A" },
                    { value: "Test", label: "Test" },
                  ]}
                />
                <TextField label="Ключ (64 hex-символа = 256 бит, X0 — старшие 32 бита)" value={keyHex} onChange={(e) => setKeyHex(e.target.value)} />
              </>
            )}
            <TextField label="Блок (16 hex-символов = 64 бита)" value={blockHex} onChange={(e) => setBlockHex(e.target.value)} />
            <div className="grid gap-4 sm:grid-cols-2">
              <OutputBlock label="Шифротекст" value={enc.toString(16).padStart(16, "0")} />
              <OutputBlock
                label="Проверка расшифрования"
                value={dec.toString(16).padStart(16, "0") + (dec === block ? " — совпадает ✓" : "")}
              />
            </div>
            {mode === "lab" && (
              <p className="text-xs text-ink-faint">
                Раундовые ключи: {GOST_ROUND_KEYS.map((k) => k.toString(16)).join(", ")}
              </p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody className="pt-6 space-y-5">
            <h2 className="font-display text-lg font-semibold text-ink">RC4</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Текст" value={rc4Text} onChange={(e) => setRc4Text(e.target.value)} />
              <TextField label="Ключ" value={rc4Key} onChange={(e) => setRc4Key(e.target.value)} />
            </div>
            <OutputBlock label="Шифротекст (hex)" value={bytesToHex(rc4Cipher)} />
            <p className="text-xs text-ink-faint">
              Контрольний вектор з rc4_tb.vhd: ключ «Key», текст «Plaintext» → bbf316e8d940af0ad3.
            </p>
            <OutputBlock label="Проверка расшифрования" value={rc4Back} />
          </CardBody>
        </Card>

        <Card>
          <CardBody className="pt-6 space-y-5">
            <div>
              <h2 className="font-display text-lg font-semibold text-ink">Схема на VHDL</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-dim">
                Сами схемы, а не пересказ: оба шифра с самопроверяющимися испытательными
                стендами по опубликованным контрольным векторам. Собираются и проверяются
                через GHDL одной командой{" "}
                <code className="text-ink">./sim/run_all.sh</code>. Общий пакет{" "}
                <code className="text-ink">crypto_util</code> нужен обоим — без него не
                соберётся.
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ink-dim">
                Здесь только те два шифра, о которых этот модуль. В{" "}
                <a
                  href="https://github.com/AlexMelanFromRingo/vhdl-rc4"
                  target="_blank"
                  rel="noreferrer"
                >
                  полном хранилище
                </a>{" "}
                их пять, включая Калину и Струмок по ДСТУ, с прогоном через синтез до
                количества вентилей.
              </p>
            </div>

            {vhdl ? (
              <FileSet
                base="../../vhdl"
                files={vhdl.files}
                archive={vhdl.archive}
                accent={accent}
              />
            ) : (
              <p className="text-sm text-ink-faint">Загрузка…</p>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

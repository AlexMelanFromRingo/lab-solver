"use client";

import { useMemo, useState } from "react";
import { ModuleHeader } from "@/components/module-header";
import { Card, CardBody } from "@/components/ui/card";
import { TextField } from "@/components/ui/field";
import { InfoNote } from "@/components/ui/info-note";
import { OutputBlock } from "@/components/ui/output-block";
import { modules } from "@/lib/modules";
import { GOST_ROUND_KEYS, gostDecryptBlock, gostEncryptBlock, rc4Encrypt } from "@/lib/algorithms/gost-rc4";

const mod = modules.find((m) => m.slug === "gost-rc4")!;

function textToBytes(s: string): number[] {
  return Array.from(new TextEncoder().encode(s));
}
function bytesToHex(bytes: number[]): string {
  return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function GostRc4Page() {
  const [blockHex, setBlockHex] = useState("0123456789abcdef");

  const block = useMemo(() => {
    try {
      return BigInt("0x" + (blockHex.trim() || "0"));
    } catch {
      return 0n;
    }
  }, [blockHex]);

  const enc = useMemo(() => gostEncryptBlock(block), [block]);
  const dec = useMemo(() => gostDecryptBlock(enc.output), [enc]);

  const [rc4Text, setRc4Text] = useState("Привет, RC4!");
  const [rc4Key, setRc4Key] = useState("secretkey");

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
          ГОСТ портирован с реальной VHDL-схемы (не из учебника): раунд — <code>S=(N1+X) mod 2³²</code>{" "}
          → замена (один и тот же 16-значный S-box на все 8 нибл, не восемь разных, как в
          «настоящем» ГОСТе) → циклический сдвиг на 11 бит → XOR со второй половиной блока.
          32 раунда: 24 прямых (X0..X7 ×3) + 8 обратных (X7..X0) при шифровании, зеркально при
          расшифровании. Раундовые ключи — те же 8 констант, что зашиты в GOST.vhd.
        </InfoNote>

        <Card>
          <CardBody className="pt-6 space-y-5">
            <h2 className="font-display text-lg font-semibold text-ink">ГОСТ 28147-89</h2>
            <TextField label="Блок (16 hex-символов = 64 бита)" value={blockHex} onChange={(e) => setBlockHex(e.target.value)} />
            <div className="grid gap-4 sm:grid-cols-2">
              <OutputBlock label="Шифротекст" value={enc.output.toString(16).padStart(16, "0")} />
              <OutputBlock
                label="Проверка расшифрования"
                value={dec.output.toString(16).padStart(16, "0") + (dec.output === block ? " — совпадает ✓" : "")}
              />
            </div>
            <p className="text-xs text-ink-faint">
              Раундовые ключи: {GOST_ROUND_KEYS.map((k) => k.toString(16)).join(", ")}
            </p>
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
            <OutputBlock label="Проверка расшифрования" value={rc4Back} />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

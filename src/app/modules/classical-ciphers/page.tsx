"use client";

import { useMemo, useState } from "react";
import { ModuleHeader } from "@/components/module-header";
import { Card, CardBody } from "@/components/ui/card";
import { NumberField, SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { InfoNote } from "@/components/ui/info-note";
import { OutputBlock } from "@/components/ui/output-block";
import { modules } from "@/lib/modules";
import { cp1251Decode, cp1251Encode } from "@/lib/algorithms/cp1251";
import {
  caesar,
  gamma,
  newControlChars,
  otp,
  otpKey,
  parseCryptTab,
  passwordShifts,
  permute,
  vigenere,
  vigenereRandomShifts,
} from "@/lib/algorithms/classical-ciphers";

const mod = modules.find((m) => m.slug === "classical-ciphers")!;

/** Тестовий source.txt, виданий до роботи: CP1251, CRLF і навмисні керуючі 05h 06h 07h у 4-му рядку. */
const SOURCE_TXT = [
  0x71, 0x77, 0x65, 0x72, 0x74, 0x79, 0x0d, 0x0a, 0x41, 0x53, 0x44, 0x46, 0x47, 0x48, 0x0d, 0x0a, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36,
  0x37, 0x38, 0x39, 0x30, 0x0d, 0x0a, 0xf4, 0xfb, 0xe2, 0xe0, 0xef, 0x20, 0x05, 0x06, 0x07, 0x20, 0x51, 0x51, 0x51, 0x0d, 0x0a, 0xc9,
  0xd6, 0xd3, 0xca, 0xc5, 0xcd, 0x0d, 0x0a, 0x21, 0x22, 0x25,
];

type Method = "perm" | "caesar" | "otp" | "vig" | "vigrnd" | "gamma";

/** Текст для показу: керуючі символи — знаками ␅ ␆ ␇ (CR/LF — переносом рядка). */
function show(bytes: number[]): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    if (b === 0x0d && bytes[i + 1] === 0x0a) continue;
    s += b === 0x0a ? "\n" : b < 0x20 ? String.fromCharCode(0x2400 + b) : cp1251Decode([b]);
  }
  return s;
}

const hexDump = (bytes: number[]) =>
  Array.from({ length: Math.ceil(bytes.length / 16) }, (_, r) =>
    bytes
      .slice(r * 16, r * 16 + 16)
      .map((b) => b.toString(16).toUpperCase().padStart(2, "0"))
      .join(" "),
  ).join("\n");

function download(bytes: number[], name: string) {
  const url = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: "application/octet-stream" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ClassicalCiphersPage() {
  const [src, setSrc] = useState<number[]>(SOURCE_TXT);
  const [srcName, setSrcName] = useState("source.txt");
  const [typed, setTyped] = useState("");
  const [method, setMethod] = useState<Method>("caesar");
  const [shift, setShift] = useState(3);
  const [tab, setTab] = useState("2 4 1 5 3");
  const [password, setPassword] = useState("трактор");
  const [seed, setSeed] = useState(12345);
  const [k, setK] = useState(8);
  const [pad, setPad] = useState<number[]>(() => otpKey(SOURCE_TXT.length));

  const r = useMemo(() => {
    try {
      let enc: number[], dec: number[], key: string;
      switch (method) {
        case "perm": {
          const t = parseCryptTab(tab);
          enc = permute(src, t);
          dec = permute(enc, t, true);
          key = `CryptTab = ${t.join(" ")}, блок K = ${t.length}`;
          break;
        }
        case "caesar":
          enc = caesar(src, shift);
          dec = caesar(enc, shift, -1);
          key = `Shift = ${shift}`;
          break;
        case "otp":
          enc = otp(src, pad);
          dec = otp(enc, pad, -1);
          key = pad.join(" ");
          break;
        case "vig": {
          const s = passwordShifts(cp1251Encode(password));
          enc = vigenere(src, s);
          dec = vigenere(enc, s, -1);
          key = `зсуви пароля: ${s.join(" ")}`;
          break;
        }
        case "vigrnd": {
          const s = vigenereRandomShifts(seed, k);
          enc = vigenere(src, s);
          dec = vigenere(enc, s, -1);
          key = `RandSeed = ${seed}, таблиця зсувів: ${s.join(" ")}`;
          break;
        }
        case "gamma":
          enc = gamma(src, seed);
          dec = gamma(enc, seed, -1);
          key = `RandSeed = ${seed}`;
          break;
      }
      const same = dec.length === src.length && dec.every((b, i) => b === src[i]);
      return { ok: true as const, enc, dec, key, same, extra: newControlChars(src, enc) };
    } catch (e) {
      return { ok: false as const, error: (e as Error).message };
    }
  }, [method, src, shift, tab, password, seed, k, pad]);

  return (
    <div>
      <ModuleHeader module={mod} />
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        <InfoNote title="Що робиться">
          Файл читається як байти (CP1251 — «розширений» ASCII: кирилиця в кодах C0h…FFh). Прийом методички — алфавіт N1:{" "}
          <code>X1 = Ord(C) − 32</code>, <code>Y1 = (X1 + зсув) mod 224</code>, <code>Y = Y1 + 32</code>. Кожен символ рядка
          обробляється однією формулою, без розгалужень, і результат завжди в 20h…FFh — керуючих кодів шифр не породжує. Керуючі
          символи, що вже є у файлі (CR/LF між рядками і 05h 06h 07h, навмисне вставлені в тестовий <code>source.txt</code>),
          обходяться. Ключ іде за позицією байта у файлі — CR/LF займають позицію ключа, як в еталоні викладача.
        </InfoNote>

        <Card>
          <CardBody className="space-y-5 pt-6">
            <h2 className="font-display text-lg font-semibold text-ink">Вихідний файл</h2>
            <div className="flex flex-wrap items-center gap-4 text-sm text-ink-dim">
              <button
                type="button"
                className="rounded-[3px] border border-border px-3 py-1.5 hover:text-ink"
                onClick={() => {
                  setSrc(SOURCE_TXT);
                  setSrcName("source.txt");
                  setPad(otpKey(SOURCE_TXT.length));
                }}
              >
                Тестовий source.txt
              </button>
              <label className="cursor-pointer rounded-[3px] border border-border px-3 py-1.5 hover:text-ink">
                Свій файл…
                <input
                  type="file"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const b = Array.from(new Uint8Array(await f.arrayBuffer()));
                    setSrc(b);
                    setSrcName(f.name);
                    setPad(otpKey(b.length));
                  }}
                />
              </label>
              <span className="font-mono text-xs">
                {srcName} · {src.length} байт
              </span>
            </div>
            <TextAreaField
              label="…або свій текст (буде закодований у CP1251, рядки — CRLF)"
              value={typed}
              onChange={(e) => {
                setTyped(e.target.value);
                const b = Array.from(cp1251Encode(e.target.value.replace(/\r?\n/g, "\r\n")));
                setSrc(b);
                setSrcName("текст");
                setPad(otpKey(b.length));
              }}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <OutputBlock label="Вміст (керуючі — ␅ ␆ ␇)" value={show(src)} />
              <OutputBlock label="Байти" value={hexDump(src)} wrap={false} />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-5 pt-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <SelectField label="Метод" value={method} onChange={(e) => setMethod(e.target.value as Method)}>
                <option value="perm">Перестановки</option>
                <option value="caesar">Цезаря</option>
                <option value="otp">Одноразового блокнота</option>
                <option value="vig">Віженера з паролем</option>
                <option value="vigrnd">Віженера з датчиком випадкових чисел</option>
                <option value="gamma">Гамування</option>
              </SelectField>
              {method === "perm" && <TextField label="CryptTab (місця символів у блоці)" hint="K = 5…10" value={tab} onChange={(e) => setTab(e.target.value)} />}
              {method === "caesar" && <NumberField label="Shift" value={shift} onChange={(e) => setShift(Number(e.target.value))} />}
              {method === "vig" && <TextField label="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} />}
              {(method === "vigrnd" || method === "gamma") && (
                <NumberField label="RandSeed (ключ)" value={seed} onChange={(e) => setSeed(Number(e.target.value))} />
              )}
              {method === "vigrnd" && <NumberField label="K — кількість таблиць" value={k} min={1} onChange={(e) => setK(Math.max(1, Number(e.target.value)))} />}
              {method === "otp" && (
                <button
                  type="button"
                  className="self-end rounded-[3px] border border-border px-3 py-2 text-sm text-ink-dim hover:text-ink"
                  onClick={() => setPad(otpKey(src.length))}
                >
                  Новий ключ блокнота
                </button>
              )}
            </div>

            {r.ok ? (
              <div className="space-y-4">
                <OutputBlock label="Ключ" value={r.key} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <OutputBlock label="Зашифрований файл" value={show(r.enc)} />
                  <OutputBlock label="Байти шифртексту" value={hexDump(r.enc)} wrap={false} />
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <button
                    type="button"
                    className="rounded-[3px] border border-border px-3 py-1.5 text-ink-dim hover:text-ink"
                    onClick={() => download(r.enc, "enc_" + (srcName.endsWith(".txt") ? srcName : "text.txt"))}
                  >
                    Завантажити шифртекст
                  </button>
                  <span className="text-xs text-ink-faint">
                    Нових керуючих символів: {r.extra}. Розшифрування {r.same ? "повертає вихідні байти ✓" : "не збіглося з вихідним"}.
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-codes">{r.error}</p>
            )}
          </CardBody>
        </Card>

        <InfoNote title="Помилки методички">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Пряме перетворення Цезаря надруковано як «X = Y + N (mod N)» — має бути <code>Y = X + Shift (mod N)</code>, зворотне
              — <code>X = Y + (N − Shift) (mod N)</code>.
            </li>
            <li>
              Діапазон «20h…Fh» у переході до алфавіту N1 — це 20h…FFh (224 символи), інакше N1 не мав би кодів 0…223.
            </li>
          </ul>
        </InfoNote>
      </div>
    </div>
  );
}

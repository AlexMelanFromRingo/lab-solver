"use client";

import { useEffect, useMemo, useState } from "react";
import { ModuleHeader } from "@/components/module-header";
import { Card, CardBody } from "@/components/ui/card";
import { NumberField, SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { InfoNote } from "@/components/ui/info-note";
import { OutputBlock } from "@/components/ui/output-block";
import { modules } from "@/lib/modules";
import {
  type Alphabet,
  caesarDecode,
  caesarEncode,
  gammaXorFromHex,
  gammaXorHex,
  otpDecodeFromHex,
  otpEncodeHex,
  otpGenerateKeyHex,
  vigenereDecode,
  vigenereEncode,
} from "@/lib/algorithms/classical-ciphers";

const mod = modules.find((m) => m.slug === "classical-ciphers")!;

function AlphabetPicker({ value, onChange }: { value: Alphabet; onChange: (v: Alphabet) => void }) {
  return (
    <SelectField label="Алфавит" value={value} onChange={(e) => onChange(e.target.value as Alphabet)}>
      <option value="bytes">Байтовый [32..255] (как в C++ версии)</option>
      <option value="ru33">Кириллица, 33 буквы (без ё)</option>
    </SelectField>
  );
}

function CaesarBlock() {
  const [text, setText] = useState("Привет, мир!");
  const [shift, setShift] = useState(3);
  const [alphabet, setAlphabet] = useState<Alphabet>("ru33");
  const encoded = useMemo(() => caesarEncode(text, shift, alphabet), [text, shift, alphabet]);
  const decoded = useMemo(() => caesarDecode(encoded, shift, alphabet), [encoded, shift, alphabet]);

  return (
    <Card>
      <CardBody className="pt-6 space-y-5">
        <h2 className="font-display text-lg font-semibold text-ink">Шифр Цезаря</h2>
        <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto]">
          <TextAreaField label="Текст" value={text} onChange={(e) => setText(e.target.value)} />
          <NumberField label="Сдвиг" value={shift} onChange={(e) => setShift(Number(e.target.value))} className="w-24" />
          <AlphabetPicker value={alphabet} onChange={setAlphabet} />
        </div>
        <OutputBlock label="Шифротекст" value={encoded} />
        <OutputBlock label="Проверка расшифрования" value={decoded} />
      </CardBody>
    </Card>
  );
}

function VigenereBlock() {
  const [text, setText] = useState("Прикладная криптология");
  const [key, setKey] = useState("КЛЮЧ");
  const [alphabet, setAlphabet] = useState<Alphabet>("ru33");
  const encoded = useMemo(() => vigenereEncode(text, key, alphabet), [text, key, alphabet]);
  const decoded = useMemo(() => vigenereDecode(encoded, key, alphabet), [encoded, key, alphabet]);

  return (
    <Card>
      <CardBody className="pt-6 space-y-5">
        <h2 className="font-display text-lg font-semibold text-ink">Шифр Виженера</h2>
        <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto]">
          <TextAreaField label="Текст" value={text} onChange={(e) => setText(e.target.value)} />
          <TextField label="Ключевое слово" value={key} onChange={(e) => setKey(e.target.value)} className="w-40" />
          <AlphabetPicker value={alphabet} onChange={setAlphabet} />
        </div>
        <OutputBlock label="Шифротекст" value={encoded} />
        <OutputBlock label="Проверка расшифрования" value={decoded} />
      </CardBody>
    </Card>
  );
}

function GammaBlock() {
  const [text, setText] = useState("Секретное сообщение");
  const [key, setKey] = useState("ключ-гаммы");
  const cipherHex = useMemo(() => gammaXorHex(text, key), [text, key]);
  const decoded = useMemo(() => gammaXorFromHex(cipherHex, key), [cipherHex, key]);

  return (
    <Card>
      <CardBody className="pt-6 space-y-5">
        <h2 className="font-display text-lg font-semibold text-ink">Гаммирование (XOR)</h2>
        <p className="text-sm text-ink-faint">
          Самообратная операция: применение той же функции к шифротексту с тем же ключом снова даёт исходный текст.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextAreaField label="Текст" value={text} onChange={(e) => setText(e.target.value)} />
          <TextField label="Ключ (повторяется по длине)" value={key} onChange={(e) => setKey(e.target.value)} />
        </div>
        <OutputBlock label="Шифротекст (hex)" value={cipherHex} />
        <OutputBlock label="Проверка расшифрования" value={decoded} />
      </CardBody>
    </Card>
  );
}

function OtpBlock() {
  const [text, setText] = useState("Одноразовый блокнот");
  // Детерминированный ключ по умолчанию — чтобы сервер и клиент отрисовали одно и то же
  // при гидратации; настоящий случайный ключ генерируется по клику или после монтирования.
  const [keyHex, setKeyHex] = useState(() => "00".repeat(new TextEncoder().encode("Одноразовый блокнот").length));
  useEffect(() => {
    setKeyHex(otpGenerateKeyHex(new TextEncoder().encode("Одноразовый блокнот").length));
  }, []);
  const cipherHex = useMemo(() => {
    try {
      return otpEncodeHex(text, keyHex);
    } catch {
      return "";
    }
  }, [text, keyHex]);
  const decoded = useMemo(() => {
    try {
      return otpDecodeFromHex(cipherHex, keyHex);
    } catch {
      return "";
    }
  }, [cipherHex, keyHex]);

  return (
    <Card>
      <CardBody className="pt-6 space-y-5">
        <h2 className="font-display text-lg font-semibold text-ink">Одноразовый блокнот (OTP)</h2>
        <p className="text-sm text-ink-faint">
          Ключ должен быть не короче сообщения и использоваться только один раз — это единственный шифр
          с доказуемой абсолютной стойкостью (при выполнении этого условия).
        </p>
        <TextAreaField label="Текст" value={text} onChange={(e) => setText(e.target.value)} />
        <div className="flex items-end gap-3">
          <TextField
            label="Ключ (hex, той же длины в байтах)"
            value={keyHex}
            onChange={(e) => setKeyHex(e.target.value)}
            className="flex-1"
          />
          <button
            onClick={() => setKeyHex(otpGenerateKeyHex(new TextEncoder().encode(text).length))}
            className="mb-0.5 rounded-lg border border-border px-3 py-2.5 text-xs font-medium text-ink-dim hover:text-ink hover:border-border-strong transition-colors"
          >
            Сгенерировать
          </button>
        </div>
        <OutputBlock label="Шифротекст (hex)" value={cipherHex} />
        <OutputBlock label="Проверка расшифрования" value={decoded} />
      </CardBody>
    </Card>
  );
}

export default function ClassicalCiphersPage() {
  return (
    <div>
      <ModuleHeader module={mod} />
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        <InfoNote>
          Все четыре шифра — Лаба 1. Байтовый алфавит воспроизводит оригинальную C++ логику
          (сдвиг в диапазоне символов 32..255 по модулю 224); кириллический — классический учебный
          вариант по 33 буквам. Гаммирование и одноразовый блокнот выводятся в hex, поскольку
          результат XOR — произвольные байты, не обязательно печатный текст.
        </InfoNote>
        <CaesarBlock />
        <VigenereBlock />
        <GammaBlock />
        <OtpBlock />
      </div>
    </div>
  );
}

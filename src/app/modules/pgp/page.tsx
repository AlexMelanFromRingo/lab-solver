"use client";

import { useState } from "react";
import { useLang } from "@/components/lang";
import { ModuleHeader } from "@/components/module-header";
import { Card, CardBody } from "@/components/ui/card";
import { TextAreaField } from "@/components/ui/field";
import { InfoNote } from "@/components/ui/info-note";
import { XYPlot } from "@/components/xy-plot";
import { modules } from "@/lib/modules";
import type { PlotFigure } from "@/lib/figures";

const mod = modules.find((m) => m.slug === "pgp")!;

const STEPS: { uk: string; ru: string }[] = [
  { uk: "Створити пару ключів з параметрами завдання: тип Diffie-Hellman/DSS, довжина 1024 біт; для графіка — ще RSA і DH/DSS інших довжин, засікаючи час генерації.", ru: "Создать пару ключей с параметрами задания: тип Diffie-Hellman/DSS, длина 1024 бит; для графика — ещё RSA и DH/DSS других длин, засекая время генерации." },
  { uk: "Експортувати відкритий ключ у файл (.asc) і імпортувати ключ іншого користувача; обмінятися відкритими ключами.", ru: "Экспортировать открытый ключ в файл (.asc) и импортировать ключ другого пользователя; обменяться открытыми ключами." },
  { uk: "Зашифрувати текстовий файл відкритим ключем адресата, розшифрувати отриманий файл своїм закритим.", ru: "Зашифровать текстовый файл открытым ключом адресата, расшифровать полученный файл своим закрытым." },
  { uk: "Підписати файл (ЕЦП), перевірити підпис; змінити файл і показати, що перевірка не проходить.", ru: "Подписать файл (ЭЦП), проверить подпись; изменить файл и показать, что проверка не проходит." },
  { uk: "Графік часу генерації ключів від довжини для RSA і Diffie-Hellman/DSS.", ru: "График времени генерации ключей от длины для RSA и Diffie-Hellman/DSS." },
  { uk: "Графік часу шифрування і створення ЕЦП від розміру файлу.", ru: "График времени шифрования и создания ЭЦП от размера файла." },
];

function parse(text: string, cols: number): number[][] {
  return text
    .trim()
    .split("\n")
    .map((l) => l.trim().split(/[\s;]+/).map((x) => Number(x.replace(",", "."))))
    .filter((r) => r.length >= cols && r.slice(0, cols).every(Number.isFinite));
}

export default function PgpPage() {
  const { lang } = useLang();
  const tx = (uk: string, ruText: string) => (lang === "uk" ? uk : ruText);
  const [keys, setKeys] = useState("1024 0.3 4.1\n2048 0.9 8.0\n3072 2.9 14.2\n4096 9.5 22.8");
  const [files, setFiles] = useState("50 0.7 0.5 1.8 1.4\n100 0.9 0.5 3.0 2.7\n200 1.4 0.6 5.4 4.6\n300 1.9 0.7 7.7 6.6\n400 2.4 0.6 10.1 8.6\n500 2.9 0.7 12.4 10.5");
  const k = parse(keys, 3);
  const f = parse(files, 5);
  const keyPlot: PlotFigure = {
    x: { label: "Довжина ключа", unit: "біт", zero: false },
    y: { label: "t", unit: "с" },
    series: [
      { label: "RSA", points: k.map((r) => [r[0], r[1]] as [number, number]) },
      { label: "Diffie-Hellman/DSS", points: k.map((r) => [r[0], r[2]] as [number, number]), dashed: true },
    ],
  };
  const filePlot: PlotFigure = {
    x: { label: "Розмір файлу", unit: "МБ" },
    y: { label: "t", unit: "с" },
    series: [
      { label: "RSA: шифрування", points: f.map((r) => [r[0], r[1]] as [number, number]) },
      { label: "RSA: ЕЦП", points: f.map((r) => [r[0], r[2]] as [number, number]) },
      { label: "DH/DSS: шифрування", points: f.map((r) => [r[0], r[3]] as [number, number]), dashed: true },
      { label: "DH/DSS: ЕЦП", points: f.map((r) => [r[0], r[4]] as [number, number]), dashed: true },
    ],
  };

  return (
    <div>
      <ModuleHeader module={mod} />
      <div className="mx-auto max-w-5xl space-y-8 px-6 py-10">
        <InfoNote>
          Робота виконується в програмі PGP, розрахунків у ній немає. Сторінка — порядок за завданням і побудова двох
          графіків із ваших вимірювань (числа за замовчуванням — приклад). Ключ за завданням — Diffie-Hellman/DSS
          1024 біт, а не RSA 2048.
        </InfoNote>
        <Card>
          <CardBody className="space-y-3 pt-6">
            <h2 className="font-display text-lg font-semibold text-ink">{tx("Порядок роботи", "Порядок работы")}</h2>
            <ol className="list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-ink-dim">
              {STEPS.map((s) => (
                <li key={s.uk}>{tx(s.uk, s.ru)}</li>
              ))}
            </ol>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="space-y-5 pt-6">
            <h2 className="font-display text-lg font-semibold text-ink">{tx("Час генерації ключів", "Время генерации ключей")}</h2>
            <TextAreaField label={tx("Рядки: довжина, біт · RSA, с · DH/DSS, с", "Строки: длина, бит · RSA, с · DH/DSS, с")} value={keys} onChange={(e) => setKeys(e.target.value)} />
            {k.length > 1 && <XYPlot fig={keyPlot} title={tx("Залежність часу генерації ключа від його довжини", "Зависимость времени генерации ключа от его длины")} />}
          </CardBody>
        </Card>
        <Card>
          <CardBody className="space-y-5 pt-6">
            <h2 className="font-display text-lg font-semibold text-ink">{tx("Час шифрування і створення ЕЦП", "Время шифрования и создания ЭЦП")}</h2>
            <TextAreaField label={tx("Рядки: розмір, МБ · RSA шифр., с · RSA ЕЦП, с · DH/DSS шифр., с · DH/DSS ЕЦП, с", "Строки: размер, МБ · RSA шифр., с · RSA ЭЦП, с · DH/DSS шифр., с · DH/DSS ЭЦП, с")} value={files} onChange={(e) => setFiles(e.target.value)} />
            {f.length > 1 && <XYPlot fig={filePlot} title={tx("Залежність часу шифрування і створення ЕЦП від розміру файлу", "Зависимость времени шифрования и создания ЭЦП от размера файла")} />}
            <p className="text-xs leading-relaxed text-ink-faint">
              Шифрування в PGP гібридне: файл шифрується симетричним алгоритмом, асиметричним — лише сеансовий ключ, тому час
              росте лінійно з розміром файлу. ЕЦП — геш файлу і одна операція із закритим ключем: з розміром росте лише гешування.
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

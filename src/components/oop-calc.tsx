"use client";

import { useState } from "react";
import { Card, CardBody } from "@/components/ui/card";
import { SelectField, TextField } from "@/components/ui/field";
import { OutputBlock } from "@/components/ui/output-block";
import { XYPlot } from "@/components/xy-plot";
import { lightPlot } from "@/lib/algorithms/oop-figures";

// Таблица 5 методички ЛР3 (ДБН В.2.5-28:2018): КПО eн, % при верхнем/комбинированном и боковом освещении.
const ROOMS = [
  { name: "Кабинеты и рабочие комнаты", top: 3.0, side: 1.0 },
  { name: "Аналитические лаборатории", top: 4.0, side: 1.5 },
  { name: "Кабинеты технического черчения и рисования", top: 4.0, side: 1.5 },
  { name: "Аудитории, учебные кабинеты, лаборатории вузов", top: 3.5, side: 1.2 },
];
const M = { I: 1.2, II: 1.1, III: 1.0, IV: 0.9, V: 0.8 } as const;
// Таблица 4: коэффициент солнечности c при боковом освещении
const C = {
  north: { s: 0.75, ew: 0.8, n: 1 },
  south: { s: 0.7, ew: 0.75, n: 0.95 },
} as const;

/** ЛР3: КПО e = Eвн/Eзовн·100 % по точкам и нормированное eнорм = eн·m·c. */
export function LightCalc() {
  const [points, setPoints] = useState("520 310 190 120 90");
  const [outside, setOutside] = useState("13000");
  const [room, setRoom] = useState("3");
  const [kind, setKind] = useState<"side" | "top">("side");
  const [zone, setZone] = useState<keyof typeof M>("III");
  const [lat, setLat] = useState<keyof typeof C>("south");
  const [az, setAz] = useState<"s" | "ew" | "n">("ew");
  const e = points.trim().split(/[\s;,]+/).map((x) => Number(x.replace(",", ".")));
  const eo = Number(outside);
  const r = ROOMS[Number(room)];
  const en = kind === "side" ? r.side : r.top;
  const c = kind === "side" ? C[lat][az] : 1;
  const norm = en * M[zone] * c;
  const ok = e.every(Number.isFinite) && eo > 0;
  return (
    <Card>
      <CardBody className="space-y-5 pt-6">
        <h2 className="font-display text-lg font-semibold text-ink">КПО по замерам</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField label="Eвн по точкам 1, 2, 3… м от окна, лк" value={points} onChange={(ev) => setPoints(ev.target.value)} />
          <TextField label="Eзовн, лк (Додаток 1 по дате и времени)" value={outside} onChange={(ev) => setOutside(ev.target.value)} />
          <SelectField label="Помещение (табл. 5)" value={room} onChange={(ev) => setRoom(ev.target.value)}>
            {ROOMS.map((x, i) => (
              <option key={x.name} value={i}>
                {x.name}
              </option>
            ))}
          </SelectField>
          <SelectField label="Освещение" value={kind} onChange={(ev) => setKind(ev.target.value as "side" | "top")}>
            <option value="side">боковое</option>
            <option value="top">верхнее или комбинированное</option>
          </SelectField>
          <SelectField label="Пояс светового климата (табл. 3)" value={zone} onChange={(ev) => setZone(ev.target.value as keyof typeof M)}>
            {Object.keys(M).map((z) => (
              <option key={z} value={z}>
                {z} — m = {M[z as keyof typeof M]}
              </option>
            ))}
          </SelectField>
          {kind === "side" && (
            <>
              <SelectField label="Широта (табл. 4)" value={lat} onChange={(ev) => setLat(ev.target.value as keyof typeof C)}>
                <option value="north">севернее 50° с. ш.</option>
                <option value="south">50° с. ш. и южнее (Днепр — 48,5°)</option>
              </SelectField>
              <SelectField label="Азимут окон (от севера)" value={az} onChange={(ev) => setAz(ev.target.value as "s" | "ew" | "n")}>
                <option value="s">136–225° (юг)</option>
                <option value="ew">46–135° и 226–315° (восток, запад)</option>
                <option value="n">316–45° (север)</option>
              </SelectField>
            </>
          )}
        </div>
        {ok ? (
          <OutputBlock
            label={`eнорм = ${en} · ${M[zone]} · ${c} = ${norm.toFixed(2)} %`}
            value={[
              ...e.map((v, i) => `точка ${i + 1} (${i + 1} м): e = ${v}/${eo}·100 = ${((v / eo) * 100).toFixed(2)} %${(v / eo) * 100 >= norm ? "" : " — ниже нормы"}`),
              "",
              `Нормируется минимальное значение в точке в 1 м от стены, наиболее удалённой от окна (при боковом одностороннем освещении): ${((e[e.length - 1] / eo) * 100).toFixed(2)} % ${(e[e.length - 1] / eo) * 100 >= norm ? "≥" : "<"} ${norm.toFixed(2)} %`,
            ].join("\n")}
            wrap={false}
          />
        ) : null}
        {ok ? (
          <XYPlot fig={lightPlot(e.map((v) => (v / eo) * 100), norm)} title="Залежність фактичного КПО від відстані до вікна та нормоване значення" />
        ) : (
          <p className="text-sm text-codes">Введите освещённости числами через пробел и Eзовн больше нуля.</p>
        )}
      </CardBody>
    </Card>
  );
}

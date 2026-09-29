"use client";

import { useState } from "react";
import { Card, CardBody } from "@/components/ui/card";
import { SelectField, TextField } from "@/components/ui/field";
import { OutputBlock } from "@/components/ui/output-block";
import { asmHex, hx, ppiBsr, ppiControlWord, ppiHandshake, ppiScheme, type Dir, type PpiConfig, type PortMode } from "@/lib/algorithms/i8080";
import { DrawingView } from "@/components/drawing-view";
import { mpsStructure, type Channel } from "@/lib/algorithms/mps-structure";

const dirLabel = (d: Dir) => (d === "in" ? "ввод" : "вивід");

/** Управляющее слово 8255A по режимам портов, адреса регистров и заготовка программы на асемблері 8080. */
export function PpiCalc() {
  const [base, setBase] = useState("0580");
  const [c, setC] = useState<PpiConfig>({ aMode: "bidir", aDir: "in", bMode: "sync", bDir: "in", cUpper: "out", cLower: "out" });
  const set = <K extends keyof PpiConfig>(k: K, v: PpiConfig[K]) => setC((x) => ({ ...x, [k]: v }));
  const b = parseInt(base, 16) || 0;
  const cw = ppiControlWord(c);
  const hs = ppiHandshake(c);
  const addr = (i: number) => asmHex((b + i) & 0xffff, 4);
  const used = new Set(hs.lines.map((l) => l.bit));
  const bits = [7, 6, 5, 4, 3, 2, 1, 0].map((i) => (cw >> i) & 1).join("");
  const program = [
    "; налаштування ППА",
    `MVI A, ${asmHex(cw)}       ; керуюче слово ${bits}b`,
    `STA ${addr(3)}        ; регістр керування (РУС)`,
    ...hs.inte.flatMap((x) => [`MVI A, ${asmHex(ppiBsr(x.bit, true))}        ; BSR: встановити PC${x.bit} — дозвіл ${x.name}`, `STA ${addr(3)}`]),
    ...(c.aMode === "sync" ? [c.aDir === "in" ? `LDA ${addr(0)}        ; синхронний ввод з порту A` : `MVI A, 55h\nSTA ${addr(0)}        ; синхронний вивід у порт A`] : []),
    ...(c.bMode === "sync" ? [c.bDir === "in" ? `LDA ${addr(1)}        ; синхронний ввод з порту B` : `MVI A, 55h\nSTA ${addr(1)}        ; синхронний вивід у порт B`] : []),
    ...(c.aMode !== "sync" || c.bMode === "async"
      ? [
          "",
          "; підпрограма обслуговування переривання INTR",
          "INT_ROUTINE:",
          "PUSH PSW              ; зберегти A і прапорці",
          ...(c.aMode === "bidir" ? [`LDA ${addr(0)}        ; прочитати байт з порту A (скидає IBFA)`, "; … обробка …", `MVI A, 0AAh`, `STA ${addr(0)}        ; видати байт у порт A (встановлює OBFA̅)`] : []),
          ...(c.aMode === "async" ? [c.aDir === "in" ? `LDA ${addr(0)}        ; прийняти байт з порту A` : `MVI A, 0AAh\nSTA ${addr(0)}        ; видати байт у порт A`] : []),
          ...(c.bMode === "async" ? [c.bDir === "in" ? `LDA ${addr(1)}        ; прийняти байт з порту B` : `MVI A, 0AAh\nSTA ${addr(1)}        ; видати байт у порт B`] : []),
          "POP PSW",
          "EI                    ; 8080 забороняє переривання на вході в обробник",
          "RET",
        ]
      : []),
  ].join("\n");
  return (
    <Card>
      <CardBody className="space-y-5 pt-6">
        <h2 className="font-display text-lg font-semibold text-ink">Керуюче слово ППА 8255A</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField label="Базова адреса (hex)" value={base} onChange={(e) => setBase(e.target.value.replace(/[^0-9a-fA-F]/g, ""))} />
          <SelectField label="Порт A" value={c.aMode} onChange={(e) => set("aMode", e.target.value as PortMode)}>
            <option value="sync">синхронний (режим 0)</option>
            <option value="async">асинхронний (режим 1)</option>
            <option value="bidir">асинхронний ввод/вивід (режим 2)</option>
          </SelectField>
          <SelectField label="Напрям A" value={c.aDir} onChange={(e) => set("aDir", e.target.value as Dir)} disabled={c.aMode === "bidir"}>
            <option value="in">ввод</option>
            <option value="out">вивід</option>
          </SelectField>
          <SelectField label="Порт B" value={c.bMode} onChange={(e) => set("bMode", e.target.value as "sync" | "async")}>
            <option value="sync">синхронний (режим 0)</option>
            <option value="async">асинхронний (режим 1)</option>
          </SelectField>
          <SelectField label="Напрям B" value={c.bDir} onChange={(e) => set("bDir", e.target.value as Dir)}>
            <option value="in">ввод</option>
            <option value="out">вивід</option>
          </SelectField>
          <div className="grid grid-cols-2 gap-3">
            <SelectField label="PC7–PC4" value={c.cUpper} onChange={(e) => set("cUpper", e.target.value as Dir)}>
              <option value="in">ввод</option>
              <option value="out">вивід</option>
            </SelectField>
            <SelectField label="PC3–PC0" value={c.cLower} onChange={(e) => set("cLower", e.target.value as Dir)}>
              <option value="in">ввод</option>
              <option value="out">вивід</option>
            </SelectField>
          </div>
        </div>
        {(b & 3) !== 0 && (
          <p className="text-sm text-codes">
            База {hx(b, 4)}h не кратна 4: при прямому підключенні A0, A1 до входів ППА адреса {hx(b, 4)}h вибере не порт A, а {["порт A", "порт B", "порт C", "РУС"][b & 3]}. Потрібна база з двома молодшими нулями або інше підключення A0/A1.
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <OutputBlock label="Керуюче слово" value={`${bits}b = ${hx(cw)}h`} />
          <OutputBlock label="Адреси" value={`порт A ${addr(0)}, порт B ${addr(1)}, порт C ${addr(2)}, РУС ${addr(3)}`} />
        </div>
        <OutputBlock
          label="Порт C"
          value={[7, 6, 5, 4, 3, 2, 1, 0]
            .map((i) => {
              const l = hs.lines.find((x) => x.bit === i);
              return `PC${i}: ${l ? `${l.name} — ${l.role}` : `вільний, ${dirLabel(i >= 4 ? c.cUpper : c.cLower)}`}`;
            })
            .join("\n")}
          wrap={false}
        />
        {used.size > 0 && (
          <p className="text-sm text-ink-dim">
            Лінії квитування формує сам ППА; командою BSR для них перемикаються лише тригери дозволу переривань INTE: {hs.inte.map((x) => `PC${x.bit} — ${x.name} (${hx(ppiBsr(x.bit, true))}h встановити, ${hx(ppiBsr(x.bit, false))}h скинути)`).join("; ")}.
          </p>
        )}
        <DrawingView drawing={ppiScheme(b, c)} title={`Схема підключення ППА 8255A (адреси ${addr(0)}–${addr(3)})`} />
        <OutputBlock label="Заготовка програми (асемблер 8080)" value={program} wrap={false} />
      </CardBody>
    </Card>
  );
}

const CHANNELS: { key: string; group: string; label: string; ch: Channel }[] = [
  { key: "in-ps", group: "ввід", label: "пар. синхр.", ch: { kind: "par", sync: true, dir: "in" } },
  { key: "in-pa", group: "ввід", label: "пар. асинхр.", ch: { kind: "par", sync: false, dir: "in" } },
  { key: "in-ss", group: "ввід", label: "посл. синхр.", ch: { kind: "ser", sync: true, dir: "in" } },
  { key: "in-sa", group: "ввід", label: "посл. асинхр.", ch: { kind: "ser", sync: false, dir: "in" } },
  { key: "in-an", group: "ввід", label: "аналог", ch: { kind: "analog", sync: true, dir: "in" } },
  { key: "io-sa", group: "ввід/вивід", label: "посл. дупл. асинхр.", ch: { kind: "ser", sync: false, dir: "io" } },
  { key: "io-ss", group: "ввід/вивід", label: "посл. дупл. синхр.", ch: { kind: "ser", sync: true, dir: "io" } },
  { key: "io-pa", group: "ввід/вивід", label: "пар. напівдупл. асинхр.", ch: { kind: "par", sync: false, dir: "io" } },
  { key: "out-ps", group: "вивід", label: "пар. синхр.", ch: { kind: "par", sync: true, dir: "out" } },
  { key: "out-pa", group: "вивід", label: "пар. асинхр.", ch: { kind: "par", sync: false, dir: "out" } },
  { key: "out-ss", group: "вивід", label: "посл. синхр.", ch: { kind: "ser", sync: true, dir: "out" } },
  { key: "out-sa", group: "вивід", label: "посл. асинхр.", ch: { kind: "ser", sync: false, dir: "out" } },
  { key: "out-an", group: "вивід", label: "аналог", ch: { kind: "analog", sync: true, dir: "out" } },
];

/** Курсова ПМС: канали завдання → структурна схема. */
export function MpsStructureCalc() {
  const [sel, setSel] = useState<string[]>(["in-pa", "io-sa", "out-ps"]);
  const [sensors, setSensors] = useState("2");
  const [speed, setSpeed] = useState("3600");
  const [addr, setAddr] = useState("16");
  const channels = CHANNELS.filter((c) => sel.includes(c.key)).map((c) => c.ch);
  const toggle = (k: string) => setSel((s) => (s.includes(k) ? s.filter((x) => x !== k) : [...s, k]));
  return (
    <Card>
      <CardBody className="space-y-5 pt-6">
        <h2 className="font-display text-lg font-semibold text-ink">Структурна схема за завданням</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {["ввід", "ввід/вивід", "вивід"].map((g) => (
            <fieldset key={g} className="space-y-1.5">
              <legend className="mb-1 text-xs font-medium text-ink-dim">{g}</legend>
              {CHANNELS.filter((c) => c.group === g).map((c) => (
                <label key={c.key} className="flex items-center gap-2 text-sm text-ink">
                  <input type="checkbox" checked={sel.includes(c.key)} onChange={() => toggle(c.key)} />
                  {c.label}
                </label>
              ))}
            </fieldset>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField label="Двійкових датчиків" value={sensors} onChange={(e) => setSensors(e.target.value.replace(/\D/g, ""))} />
          <TextField label="Швидкість послідовних каналів, біт/с" value={speed} onChange={(e) => setSpeed(e.target.value.replace(/\D/g, ""))} />
          <SelectField label="Шина адреси" value={addr} onChange={(e) => setAddr(e.target.value)}>
            <option value="8">8 розрядів</option>
            <option value="12">12 розрядів</option>
            <option value="16">16 розрядів</option>
          </SelectField>
        </div>
        {channels.length > 0 ? (
          <DrawingView drawing={mpsStructure({ addrBits: Number(addr), channels, sensors: Number(sensors) || 0, speed: Number(speed) || 0 })} title="Структурна схема мікропроцесорної системи" />
        ) : (
          <p className="text-sm text-ink-dim">Позначте канали із завдання.</p>
        )}
        <p className="text-xs leading-relaxed text-ink-faint">
          Асинхронні канали і датчики подають запити на контролер переривань (у 8051 лише два входи INT0/INT1, тому КП),
          синхронні опитуються програмою. Генератор G задає швидкість ІРПС (таймер 8253 або кварц — розрахунок нижче).
        </p>
      </CardBody>
    </Card>
  );
}

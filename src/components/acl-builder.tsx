"use client";

import { useMemo, useState } from "react";
import { useLang } from "@/components/lang";
import { Card, CardBody } from "@/components/ui/card";
import { NumberField, SelectField, TextField } from "@/components/ui/field";
import { OutputBlock } from "@/components/ui/output-block";
import { Segmented } from "@/components/ui/segmented";
import {
  aclCommand,
  placement,
  type AclAction,
  type AclKind,
  type AclProtocol,
  type Endpoint,
} from "@/lib/algorithms/acl";

type EndKind = Endpoint["kind"];

interface Draft {
  action: AclAction;
  protocol: AclProtocol;
  srcKind: EndKind;
  srcAddr: string;
  srcMask: string;
  dstKind: EndKind;
  dstAddr: string;
  dstMask: string;
  port: string;
}

const EMPTY: Draft = {
  action: "deny",
  protocol: "tcp",
  srcKind: "network",
  srcAddr: "10.1.1.0",
  srcMask: "255.255.255.0",
  dstKind: "host",
  dstAddr: "210.10.1.2",
  dstMask: "255.255.255.0",
  port: "www",
};

function toEndpoint(kind: EndKind, address: string, mask: string): Endpoint {
  if (kind === "any") return { kind };
  if (kind === "host") return { kind, address };
  return { kind, address, mask };
}

function EndpointFields({
  label,
  kind,
  addr,
  mask,
  onKind,
  onAddr,
  onMask,
}: {
  label: string;
  kind: EndKind;
  addr: string;
  mask: string;
  onKind: (k: EndKind) => void;
  onAddr: (v: string) => void;
  onMask: (v: string) => void;
}) {
  const { lang } = useLang();
  const tx = (uk: string, ruText: string) => (lang === "uk" ? uk : ruText);
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <SelectField label={label} value={kind} onChange={(e) => onKind(e.target.value as EndKind)}>
        <option value="any">{tx("any — будь-яка адреса","any — любой адрес")}</option>
        <option value="host">{tx("host — один вузол","host — один узел")}</option>
        <option value="network">{tx("мережа з маскою","сеть с маской")}</option>
      </SelectField>
      {kind !== "any" && <TextField label={tx("Адреса","Адрес")} value={addr} onChange={(e) => onAddr(e.target.value)} />}
      {kind === "network" && <TextField label={tx("Звичайна маска","Обычная маска")} value={mask} onChange={(e) => onMask(e.target.value)} />}
    </div>
  );
}

function build(x: Draft, kind: AclKind, number: string): string {
  return aclCommand({
    kind,
    number: Number(number),
    action: x.action,
    protocol: x.protocol,
    source: toEndpoint(x.srcKind, x.srcAddr, x.srcMask),
    destination: toEndpoint(x.dstKind, x.dstAddr, x.dstMask),
    port: x.port,
  });
}

/** Конструктор списка доступа для индивидуального задания (п. 1.6.5). */
export function AclBuilder({ accent }: { accent: string }) {
  const { lang } = useLang();
  const tx = (uk: string, ruText: string) => (lang === "uk" ? uk : ruText);
  const [kind, setKind] = useState<AclKind>("extended");
  const [number, setNumber] = useState("110");
  const [iface, setIface] = useState("FastEthernet0/0");
  const [d, setD] = useState<Draft>(EMPTY);
  const [rules, setRules] = useState<Draft[]>([]);
  const [permitRest, setPermitRest] = useState(true);
  const set = (patch: Partial<Draft>) => setD((x) => ({ ...x, ...patch }));

  const current = useMemo(() => {
    try {
      return { ok: true as const, cmd: build(d, kind, number) };
    } catch (e) {
      return { ok: false as const, error: (e as Error).message };
    }
  }, [d, kind, number]);

  const script = useMemo(() => {
    try {
      const lines = rules.map((r) => build(r, kind, number));
      if (lines.length === 0) return "";
      const onlyDeny = rules.every((r) => r.action === "deny");
      if (permitRest && onlyDeny) {
        lines.push(kind === "standard" ? `access-list ${number} permit any` : `access-list ${number} permit ip any any`);
      }
      const p = placement(kind);
      return [
        "configure terminal",
        ...lines,
        `interface ${iface}`,
        ` ip access-group ${number} ${p.direction}`,
        "end",
        "show ip access-lists",
      ].join("\n");
    } catch (e) {
      return `! ${(e as Error).message}`;
    }
  }, [rules, kind, number, iface, permitRest]);

  const p = placement(kind);

  return (
    <Card>
      <CardBody className="space-y-5 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold text-ink">{tx("Конструктор списку доступу","Конструктор списка доступа")}</h2>
          <Segmented
            label={tx("Тип списку","Тип списка")}
            value={kind}
            accent={accent}
            onChange={(k) => {
              setKind(k);
              setNumber(k === "standard" ? "10" : "110");
            }}
            options={[
              { value: "standard", label: tx("Стандартний 1–99","Стандартный 1–99") },
              { value: "extended", label: tx("Розширений 100–199","Расширенный 100–199") },
            ]}
          />
        </div>
        <p className="text-sm leading-relaxed text-ink-dim">
          {tx("Для індивідуального завдання з п. 1.6.5: правило збирається за полями, звичайна маска переводиться в шаблонну. Стандартний список дивиться тільки на джерело і ставиться ближче до отримувача (out), розширений — ближче до джерела (in).","Для индивидуального задания из п. 1.6.5: правило собирается по полям, обычная маска переводится в шаблонную. Стандартный список смотрит только на источник и ставится ближе к получателю (out), расширенный — ближе к источнику (in).")}
        </p>

        <div className="grid gap-3 sm:grid-cols-3">
          <NumberField label={tx("Номер списку","Номер списка")} value={number} onChange={(e) => setNumber(e.target.value)} />
          <SelectField label={tx("Дія","Действие")} value={d.action} onChange={(e) => set({ action: e.target.value as AclAction })}>
            <option value="deny">{tx("deny — заборонити","deny — запретить")}</option>
            <option value="permit">{tx("permit — дозволити","permit — разрешить")}</option>
          </SelectField>
          {kind === "extended" && (
            <SelectField label="Протокол" value={d.protocol} onChange={(e) => set({ protocol: e.target.value as AclProtocol })}>
              <option value="ip">{tx("ip — будь-який","ip — любой")}</option>
              <option value="tcp">tcp</option>
              <option value="udp">udp</option>
              <option value="icmp">icmp (ping)</option>
            </SelectField>
          )}
        </div>

        <EndpointFields
          label={tx("Джерело","Источник")}
          kind={d.srcKind}
          addr={d.srcAddr}
          mask={d.srcMask}
          onKind={(k) => set({ srcKind: k })}
          onAddr={(v) => set({ srcAddr: v })}
          onMask={(v) => set({ srcMask: v })}
        />
        {kind === "extended" && (
          <>
            <EndpointFields
              label={tx("Отримувач","Получатель")}
              kind={d.dstKind}
              addr={d.dstAddr}
              mask={d.dstMask}
              onKind={(k) => set({ dstKind: k })}
              onAddr={(v) => set({ dstAddr: v })}
              onMask={(v) => set({ dstMask: v })}
            />
            {(d.protocol === "tcp" || d.protocol === "udp") && (
              <TextField
                label={tx("Порт отримувача (eq)","Порт получателя (eq)")}
                hint="www = 80, ftp = 21, telnet = 23, domain = 53"
                value={d.port}
                onChange={(e) => set({ port: e.target.value })}
              />
            )}
          </>
        )}

        {current.ok ? (
          <div className="flex flex-wrap items-center gap-3">
            <code className="rounded-[3px] border border-border bg-black/40 px-3 py-2 font-mono text-sm text-ink">{current.cmd}</code>
            <button
              type="button"
              onClick={() => setRules((r) => [...r, d])}
              className="rounded-[3px] border px-3.5 py-2 text-sm text-ink transition-colors hover:bg-white/5"
              style={{ borderColor: accent }}
            >
              {tx("Додати в список","Добавить в список")}
            </button>
            {rules.length > 0 && (
              <button type="button" onClick={() => setRules([])} className="text-sm text-ink-faint hover:text-ink-dim">
                {tx("Очистити список","Очистить список")}
              </button>
            )}
          </div>
        ) : (
          <p className="text-sm text-codes">{current.error}</p>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <TextField label={tx("Інтерфейс","Интерфейс")} hint={p.where} value={iface} onChange={(e) => setIface(e.target.value)} />
          <label className="flex items-end gap-2 pb-2.5 text-sm text-ink-dim">
            <input type="checkbox" checked={permitRest} onChange={(e) => setPermitRest(e.target.checked)} />
            {tx("Якщо в списку лише заборони — дописати дозвіл решти (інакше неявний deny any закриє все)","Если в списке только запреты — дописать разрешение остального (иначе неявный deny any закроет всё)")}
          </label>
        </div>

        {script && <OutputBlock label={tx("Команди в глобальному контексті","Команды в глобальном контексте")} value={script} wrap={false} />}
      </CardBody>
    </Card>
  );
}

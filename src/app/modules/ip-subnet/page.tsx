"use client";

import { useMemo, useState } from "react";
import { ModuleHeader } from "@/components/module-header";
import { Card, CardBody } from "@/components/ui/card";
import { NumberField, TextField } from "@/components/ui/field";
import { InfoNote } from "@/components/ui/info-note";
import { OutputBlock } from "@/components/ui/output-block";
import { Segmented } from "@/components/ui/segmented";
import { VariantDial } from "@/components/ui/variant-dial";
import { categories, modules } from "@/lib/modules";
import {
  KM_LAB4_VARIANTS,
  addressClass,
  addressKind,
  ipToInt,
  isPrivate,
  maskFromPrefix,
  parseMask,
  subnetInfo,
  toBinary,
  type SubnetInfo,
} from "@/lib/algorithms/ip-subnet";

const mod = modules.find((m) => m.slug === "ip-subnet")!;
const accent = categories.networks.accent;

const KIND_LABEL = {
  host: "адреса вузла",
  network: "адреса мережі",
  broadcast: "широкомовна розсилка",
} as const;

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2 text-left align-bottom font-normal">{children}</th>;
}

function Td({ children, answer }: { children: React.ReactNode; answer?: boolean }) {
  return (
    <td className="px-3 py-1.5 whitespace-nowrap" style={answer ? { color: accent } : undefined}>
      {children}
    </td>
  );
}

/** Строка таблицы 4.2: для первого хоста, последнего и широкомовной — с префиксом. */
function Row42({ label, info }: { label: string; info: SubnetInfo }) {
  const p = `/${info.prefix}`;
  return (
    <tr className="border-b border-border/50 last:border-0">
      <Td>{label}</Td>
      <Td answer>{info.network + p}</Td>
      <Td answer>{info.hostPart}</Td>
      <Td answer>{info.firstHost + p}</Td>
      <Td answer>{info.lastHost + p}</Td>
      <Td answer>{info.broadcast + p}</Td>
      <Td answer>{info.hostCount}</Td>
    </tr>
  );
}

/** Двоичная запись с чертой по границе префикса — как на рис. 4.4 методички. */
function Bits({ label, value, prefix }: { label: string; value: number; prefix: number }) {
  const bits = toBinary(value).replace(/\./g, "");
  const cells: React.ReactNode[] = [];
  for (let i = 0; i < 32; i++) {
    if (i > 0 && i % 8 === 0) cells.push(<span key={`d${i}`} className="text-ink-faint">.</span>);
    cells.push(
      <span
        key={i}
        className={i < prefix ? "text-ink" : "text-ink-faint"}
        style={i === prefix ? { boxShadow: `inset 1px 0 0 ${accent}` } : undefined}
      >
        {bits[i]}
      </span>,
    );
  }
  return (
    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 font-mono text-sm">
      <span className="w-52 shrink-0 text-xs text-ink-faint">{label}</span>
      <span className="tracking-[0.12em]">{cells}</span>
    </div>
  );
}

export default function IpSubnetPage() {
  const [variantNum, setVariantNum] = useState(1);
  const v = KM_LAB4_VARIANTS[variantNum];
  const prefix1 = parseMask(v.mask1);
  const mask2 = subnetInfo(v.ip2, v.prefix2).mask;
  const net1 = subnetInfo(v.ip1, prefix1);
  const net2 = subnetInfo(v.ip2, v.prefix2);
  const cls1 = addressClass(v.ip1);

  const [ip, setIp] = useState("60.255.110.21");
  const [mode, setMode] = useState<"mask" | "prefix">("mask");
  const [maskText, setMaskText] = useState("255.255.192.0");
  const [prefixText, setPrefixText] = useState("18");

  const free = useMemo(() => {
    try {
      let prefix: number;
      if (mode === "mask") {
        prefix = parseMask(maskText);
      } else {
        prefix = Number(prefixText.replace("/", ""));
        if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
          throw new Error("Префикс — целое число от 0 до 32");
        }
      }
      const info = subnetInfo(ip, prefix);
      return {
        ok: true as const,
        info,
        kind: addressKind(ip, prefix),
        priv: isPrivate(ip),
        cls: addressClass(ip),
      };
    } catch (e) {
      return { ok: false as const, error: (e as Error).message };
    }
  }, [ip, mode, maskText, prefixText]);

  return (
    <div>
      <ModuleHeader module={mod} />
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        <InfoNote>
          По п. 4.2 методички: в таблице 4.1 найти префикс по маске (задание 1) и маску по префиксу
          (задание 2), затем операцией «І» заполнить таблицу 4.2 для адресов обоих заданий. Сеть ={" "}
          <code>IP AND маска</code>, адрес хоста = <code>IP AND NOT маска</code>, первый хост = сеть + 1,
          последний = широкомовный − 1, широкомовный = <code>сеть OR NOT маска</code>, число узлов ={" "}
          <code>2^(32−M) − 2</code>. Вариант 0 — пример заполнения из методички; по нему видно, что
          расчёт сходится с её таблицей 4.2.
        </InfoNote>

        <div className="flex flex-wrap items-center gap-4">
          <VariantDial value={variantNum} min={0} max={25} onChange={setVariantNum} accent={accent} />
          {variantNum === 0 && (
            <p className="max-w-md text-sm text-ink-faint">
              Пример из методички. В её таблице 4.1 здесь напечатана маска 255.255.252.0, но префикс 18
              и строка таблицы 4.2 посчитаны для 255.255.192.0 — взята она.
            </p>
          )}
        </div>

        <Card>
          <CardBody className="pt-6 space-y-6">
            <div>
              <h2 className="mb-2 text-sm font-medium text-ink-dim">Таблиця 4.1 — Варіанти завдань</h2>
              <div className="overflow-x-auto rounded-[4px] border border-border">
                <table className="w-full font-mono text-sm">
                  <thead className="border-b border-border text-xs text-ink-faint">
                    <tr>
                      <Th>№ вар.</Th>
                      <Th>Завдання 1: повна ІР-адреса</Th>
                      <Th>Маска</Th>
                      <Th>Префікс</Th>
                      <Th>Завдання 2: повна ІР-адреса</Th>
                      <Th>Префікс</Th>
                      <Th>Маска</Th>
                    </tr>
                  </thead>
                  <tbody className="text-ink-dim">
                    <tr>
                      <Td>{v.n}</Td>
                      <Td>{v.ip1}</Td>
                      <Td>{v.mask1}</Td>
                      <Td answer>/{prefix1}</Td>
                      <Td>{v.ip2}</Td>
                      <Td>/{v.prefix2}</Td>
                      <Td answer>{mask2}</Td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h2 className="mb-2 text-sm font-medium text-ink-dim">Таблиця 4.2 — Відомості про мережі</h2>
              <div className="overflow-x-auto rounded-[4px] border border-border">
                <table className="w-full font-mono text-sm">
                  <thead className="border-b border-border text-xs text-ink-faint">
                    <tr>
                      <Th>№ вар.</Th>
                      <Th>ІР-адреса мережі</Th>
                      <Th>IP-адреса хоста</Th>
                      <Th>Адреса першого хоста мережі</Th>
                      <Th>Адреса останнього хоста мережі</Th>
                      <Th>Широкомовна адреса мережі</Th>
                      <Th>Кількість вузлів мережі</Th>
                    </tr>
                  </thead>
                  <tbody className="text-ink-dim">
                    <Row42 label={`${v.n} (1)`} info={net1} />
                    <Row42 label={`${v.n} (2)`} info={net2} />
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-xs text-ink-faint">
                Адрес хоста методичка разрешает записывать и короче, без ведущих нулей: 0.0.46.21 или 46.21.
              </p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="pt-6 space-y-3">
            <h2 className="font-display text-lg font-semibold text-ink">Операция «І» для задания 1</h2>
            <p className="text-sm text-ink-dim">
              Как в додатку 1 методички: единицы маски отмечают сетевые биты адреса (слева от черты),
              нули — биты хоста.
            </p>
            <div className="space-y-1.5 overflow-x-auto rounded-[4px] border border-border bg-black/30 px-4 py-3">
              <Bits label={`${v.ip1}`} value={ipToInt(v.ip1)} prefix={prefix1} />
              <Bits label={`маска /${prefix1}`} value={maskFromPrefix(prefix1)} prefix={prefix1} />
              <Bits label={`мережа ${net1.network}`} value={ipToInt(net1.network)} prefix={prefix1} />
              <Bits label={`хост ${net1.hostPart}`} value={ipToInt(net1.hostPart)} prefix={prefix1} />
              <Bits label={`широкомовна ${net1.broadcast}`} value={ipToInt(net1.broadcast)} prefix={prefix1} />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="pt-6 space-y-4">
            <h2 className="font-display text-lg font-semibold text-ink">Сеть в Cisco Packet Tracer</h2>
            <p className="text-sm text-ink-dim">
              Рис. 4.2: коммутатор 2950T-24 и три ПК, адреса — по наименьшему номеру варианта своего
              задания (задание 1). Маска у всех трёх — {net1.mask}. В отчёт идут IP- и MAC-адреса
              каждого ПК на схеме.
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              <OutputBlock label="PC0 — полный адрес из табл. 4.1" value={`${v.ip1}/${prefix1}`} />
              <OutputBlock label="PC1 — последний хост сети" value={`${net1.lastHost}/${prefix1}`} />
              <OutputBlock label="PC2 — первый хост сети" value={`${net1.firstHost}/${prefix1}`} />
            </div>
            <OutputBlock
              label="Командная строка PC0: пинг двух других ПК (п. 5) и широкомовный пинг (п. 6)"
              value={`ping ${net1.lastHost}\nping ${net1.firstHost}\nping ${net1.broadcast}`}
            />
            <p className="text-sm text-ink-dim">
              П. 7 — тот же широкомовный пинг в режиме Simulation: в списке событий один ICMP-запрос и
              ответы от обоих ПК; в отчёт — подробности запроса на первом шаге и ответа на двух последних.
            </p>
            {(cls1 === "D" || cls1 === "E") && (
              <p className="text-sm text-codes">
                {v.ip1} — адрес класса {cls1} ({cls1 === "D" ? "групповые адреса 224–239" : "резерв 240–255"}).
                Узлу такой адрес по стандарту не назначается; если Packet Tracer его не примет, дело не в
                расчёте — стоит уточнить у преподавателя, каким адресом его заменить.
              </p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody className="pt-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-lg font-semibold text-ink">Свой адрес</h2>
              <Segmented
                label="Как задана маска"
                value={mode}
                onChange={setMode}
                accent={accent}
                options={[
                  { value: "mask", label: "Маска 255.255.x.x" },
                  { value: "prefix", label: "Префикс /M" },
                ]}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Полный IP-адрес" value={ip} onChange={(e) => setIp(e.target.value)} />
              {mode === "mask" ? (
                <TextField
                  label="Маска подсети"
                  hint="как в задании 1"
                  value={maskText}
                  onChange={(e) => setMaskText(e.target.value)}
                />
              ) : (
                <NumberField
                  label="Префикс"
                  hint="как в задании 2"
                  value={prefixText}
                  min={0}
                  max={32}
                  onChange={(e) => setPrefixText(e.target.value)}
                />
              )}
            </div>

            {free.ok ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <OutputBlock
                  label={mode === "mask" ? "Префикс по маске" : "Маска по префиксу"}
                  value={mode === "mask" ? `/${free.info.prefix}` : free.info.mask}
                />
                <OutputBlock label="Адрес сети" value={`${free.info.network}/${free.info.prefix}`} />
                <OutputBlock label="Адрес хоста (хостовая часть)" value={free.info.hostPart} />
                <OutputBlock label="Число узлов" value={String(free.info.hostCount)} />
                <OutputBlock label="Первый хост" value={`${free.info.firstHost}/${free.info.prefix}`} />
                <OutputBlock label="Последний хост" value={`${free.info.lastHost}/${free.info.prefix}`} />
                <OutputBlock label="Широковещательный адрес" value={`${free.info.broadcast}/${free.info.prefix}`} />
                <OutputBlock
                  label="Тип адреса (контрольные вопросы 2 и 3)"
                  value={`${KIND_LABEL[free.kind]}, ${free.priv ? "приватна" : "загальна"}, клас ${free.cls}`}
                />
              </div>
            ) : (
              <p className="text-sm text-codes">{free.error}</p>
            )}
            <p className="text-xs text-ink-faint">
              Приватные диапазоны — 10.0.0.0/8, 172.16.0.0/12 и 192.168.0.0/16. В методичке третий
              напечатан как 192.168.0.0/24; это опечатка, по RFC 1918 диапазон /16.
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

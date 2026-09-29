/**
 * Статическая маршрутизация — ЛР7 «Комп'ютерні мережі» (л.р.7v5.pdf).
 *
 * Полигон рис. 7.2: Department (Net-1 и Net-3), Router0 (Net-2 и Net-4),
 * Central (Net-3, Net-4, Net-5) и ISP (Net-5 и петля lo0). Адреса сетей — из
 * таблицы 7.1, тип линий зависит от чётности варианта. Команда ip route берётся
 * в той форме, которую методичка рекомендует для линии: адрес следующего
 * маршрутизатора для Ethernet, свой выходной интерфейс для Serial (п. 7.1.1).
 * Маршрут по умолчанию — там, где у маршрутизатора единственный путь (п. 7.2.3).
 */

import { intToIp, ipToInt, maskFromPrefix } from "./ip-subnet";

export type LinkKind = "FastEthernet" | "Serial";
export type RouterName = "Department" | "Router0" | "Central" | "ISP";

export interface Net {
  name: string;
  network: string;
  prefix: number;
  kind: LinkKind;
}

export interface Iface {
  router: RouterName;
  port: string;
  net: string;
  address: string;
  prefix: number;
  /** Сторона DCE задаёт частоту синхронизации (clock rate). */
  dce?: boolean;
}

export interface Route {
  network: string;
  mask: string;
  /** Адрес следующего маршрутизатора или свой выходной интерфейс. */
  via: string;
  isDefault: boolean;
}

export interface Host {
  name: string;
  address: string;
  prefix: number;
  gateway: string;
  net: string;
}

export interface RoutingPlan {
  variant: number;
  odd: boolean;
  nets: Net[];
  ifaces: Iface[];
  loopback: { address: string; prefix: number; network: string };
  routes: Record<RouterName, Route[]>;
  hosts: Host[];
  /** Маршрутизатор, из которого по п. 7.2.5 делается trace до ISP. */
  traceFrom: RouterName;
}

/** Петля lo0 на ISP — как на рис. 7.3; в таблицу вариантов она не входит. */
export const LOOPBACK = { address: "136.12.12.12", prefix: 24 };

const host = (network: string, n: number) => intToIp((ipToInt(network) + n) >>> 0);
const dotted = (prefix: number) => intToIp(maskFromPrefix(prefix));

export function routingPlan(v: number): RoutingPlan {
  if (!Number.isInteger(v) || v < 0 || v > 255) {
    throw new Error("Номер варианта входит в адрес сети, поэтому он от 0 до 255");
  }
  const odd = v % 2 === 1;
  const net1: Net = { name: "Net-1", network: `132.16.${v}.0`, prefix: 24, kind: "FastEthernet" };
  const net2: Net = { name: "Net-2", network: `216.${v}.17.0`, prefix: 24, kind: "FastEthernet" };
  const net3: Net = { name: "Net-3", network: `172.${v}.201.32`, prefix: 30, kind: odd ? "FastEthernet" : "Serial" };
  const net4: Net = { name: "Net-4", network: `92.17.${v}.0`, prefix: 30, kind: odd ? "Serial" : "FastEthernet" };
  const net5: Net = { name: "Net-5", network: `211.17.${v}.0`, prefix: 24, kind: "Serial" };

  // Порты Router-PT в Packet Tracer: FastEthernet0/0, 1/0; Serial2/0, 3/0.
  const port = (kind: LinkKind, fe: string, se: string) => (kind === "Serial" ? se : fe);

  const dep1: Iface = { router: "Department", port: "FastEthernet0/0", net: "Net-1", address: host(net1.network, 1), prefix: 24 };
  const dep3: Iface = { router: "Department", port: port(net3.kind, "FastEthernet1/0", "Serial2/0"), net: "Net-3", address: host(net3.network, 1), prefix: 30 };
  const r02: Iface = { router: "Router0", port: "FastEthernet0/0", net: "Net-2", address: host(net2.network, 1), prefix: 24 };
  const r04: Iface = { router: "Router0", port: port(net4.kind, "FastEthernet1/0", "Serial2/0"), net: "Net-4", address: host(net4.network, 1), prefix: 30 };
  const cen3: Iface = {
    router: "Central",
    port: port(net3.kind, "FastEthernet0/0", "Serial2/0"),
    net: "Net-3",
    address: host(net3.network, 2),
    prefix: 30,
    dce: net3.kind === "Serial",
  };
  const cen4: Iface = {
    router: "Central",
    port: port(net4.kind, "FastEthernet0/0", "Serial2/0"),
    net: "Net-4",
    address: host(net4.network, 2),
    prefix: 30,
    dce: net4.kind === "Serial",
  };
  const cen5: Iface = { router: "Central", port: "Serial3/0", net: "Net-5", address: host(net5.network, 1), prefix: 24 };
  const isp5: Iface = { router: "ISP", port: "Serial2/0", net: "Net-5", address: host(net5.network, 2), prefix: 24, dce: true };

  const loNet = intToIp((ipToInt(LOOPBACK.address) & maskFromPrefix(LOOPBACK.prefix)) >>> 0);

  // Следующий шаг: для Ethernet — адрес соседа, для Serial — свой порт.
  const via = (own: Iface, peer: Iface, kind: LinkKind) => (kind === "Serial" ? own.port : peer.address);
  const route = (network: string, prefix: number, v: string): Route => ({
    network,
    mask: dotted(prefix),
    via: v,
    isDefault: false,
  });
  const byDefault = (v: string): Route => ({ network: "0.0.0.0", mask: "0.0.0.0", via: v, isDefault: true });

  const routes: Record<RouterName, Route[]> = {
    Department: [byDefault(via(dep3, cen3, net3.kind))],
    Router0: [byDefault(via(r04, cen4, net4.kind))],
    Central: [
      route(net1.network, 24, via(cen3, dep3, net3.kind)),
      route(net2.network, 24, via(cen4, r04, net4.kind)),
      route(loNet, LOOPBACK.prefix, via(cen5, isp5, net5.kind)),
    ],
    ISP: [byDefault(via(isp5, cen5, net5.kind))],
  };

  const hosts: Host[] = [
    { name: "PC0", address: host(net1.network, 2), prefix: 24, gateway: dep1.address, net: "Net-1" },
    { name: "PC1", address: host(net1.network, 3), prefix: 24, gateway: dep1.address, net: "Net-1" },
    { name: "PC2", address: host(net2.network, 2), prefix: 24, gateway: r02.address, net: "Net-2" },
    { name: "PC5", address: host(net2.network, 3), prefix: 24, gateway: r02.address, net: "Net-2" },
  ];

  return {
    variant: v,
    odd,
    nets: [net1, net2, net3, net4, net5],
    ifaces: [dep1, dep3, r02, r04, cen3, cen4, cen5, isp5],
    loopback: { ...LOOPBACK, network: loNet },
    routes,
    hosts,
    traceFrom: odd ? "Router0" : "Department",
  };
}

/** Команды IOS для одного маршрутизатора — от входа в enable до записи маршрутов. */
export function routerConfig(plan: RoutingPlan, router: RouterName): string {
  const lines = ["enable", "configure terminal", `hostname ${router}`];
  for (const i of plan.ifaces.filter((x) => x.router === router)) {
    lines.push(`interface ${i.port}`, ` ip address ${i.address} ${dotted(i.prefix)}`);
    if (i.dce) lines.push(" clock rate 128000");
    lines.push(" no shutdown", " exit");
  }
  if (router === "ISP") {
    lines.push("interface loopback 0", ` ip address ${plan.loopback.address} ${dotted(plan.loopback.prefix)}`, " exit");
  }
  for (const r of plan.routes[router]) lines.push(`ip route ${r.network} ${r.mask} ${r.via}`);
  lines.push("no cdp run", "end", "show ip route");
  return lines.join("\n");
}

/**
 * Узлы, которые ответят на tracert: адреса маршрутизаторов по пути и сама цель.
 * Промежуточный узел отвечает с интерфейса, через который пришёл пакет.
 */
export function traceHops(plan: RoutingPlan, from: "PC2" | "PC5" | RouterName, target: Iface | "lo0"): string[] {
  const addr = (router: RouterName, net: string) =>
    plan.ifaces.find((i) => i.router === router && i.net === net)!.address;
  const targetAddr = target === "lo0" ? plan.loopback.address : target.address;
  const targetRouter: RouterName = target === "lo0" ? "ISP" : target.router;

  const hops: string[] = [];
  if (from === "PC2" || from === "PC5") {
    hops.push(addr("Router0", "Net-2"));
    if (targetRouter === "Router0") return [targetAddr];
    if (targetRouter === "Central") return [...hops, targetAddr];
    hops.push(addr("Central", "Net-4"));
    return [...hops, targetAddr];
  }
  // трассировка из маршрутизатора до интерфейсов ISP
  if (targetRouter !== "ISP") return [targetAddr];
  hops.push(from === "Department" ? addr("Central", "Net-3") : addr("Central", "Net-4"));
  return [...hops, targetAddr];
}

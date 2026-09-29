/**
 * Списки доступа Cisco IOS — ЗІКМ, ЛР1 (Lr1_ACL_ua.pdf, п. 1.2–1.4).
 *
 * Стандартный список (1–99) проверяет только адрес источника, расширенный
 * (100–199) — источник, получателя, протокол и порт. Маска в правилах —
 * шаблонная: байт = 255 − байт обычной маски. Стандартный список ставят как
 * можно ближе к получателю, расширенный — как можно ближе к источнику.
 */

import { intToIp, ipToInt, maskFromPrefix, parseMask } from "./ip-subnet";

export type AclKind = "standard" | "extended";
export type AclAction = "permit" | "deny";
export type AclProtocol = "ip" | "tcp" | "udp" | "icmp";

export type Endpoint =
  | { kind: "any" }
  | { kind: "host"; address: string }
  | { kind: "network"; address: string; mask: string };

export interface AclRule {
  kind: AclKind;
  number: number;
  action: AclAction;
  protocol: AclProtocol;
  source: Endpoint;
  destination: Endpoint;
  /** Порт получателя для tcp/udp: число или имя (www, ftp, telnet…). */
  port?: string;
}

/** Шаблонная (инверсная) маска: 255.255.192.0 → 0.0.63.255. */
export function wildcard(mask: string): string {
  const prefix = parseMask(mask);
  return intToIp(~maskFromPrefix(prefix) >>> 0);
}

function endpoint(e: Endpoint): string {
  if (e.kind === "any") return "any";
  ipToInt(e.address);
  if (e.kind === "host") return `host ${e.address}`;
  const net = intToIp((ipToInt(e.address) & maskFromPrefix(parseMask(e.mask))) >>> 0);
  return `${net} ${wildcard(e.mask)}`;
}

export function aclCommand(r: AclRule): string {
  if (r.kind === "standard") {
    if (r.number < 1 || r.number > 99) throw new Error("Номер стандартного списка — от 1 до 99");
    return `access-list ${r.number} ${r.action} ${endpoint(r.source)}`;
  }
  if (r.number < 100 || r.number > 199) throw new Error("Номер расширенного списка — от 100 до 199");
  const port = (r.protocol === "tcp" || r.protocol === "udp") && r.port?.trim() ? ` eq ${r.port.trim()}` : "";
  return `access-list ${r.number} ${r.action} ${r.protocol} ${endpoint(r.source)} ${endpoint(r.destination)}${port}`;
}

/** Куда прикреплять: из п. 1.4 методички. */
export function placement(kind: AclKind): { where: string; direction: "in" | "out" } {
  return kind === "standard"
    ? { where: "интерфейс маршрутизатора, ближайший к получателю", direction: "out" }
    : { where: "интерфейс маршрутизатора, ближайший к источнику", direction: "in" };
}

/**
 * Калькулятор подсети (IPv4) — Лаба 4, курс "Компьютерні мережі".
 * Источник: Универ/Третий курс/Второй семестр/КМ (Компьютерные сети)/Лаба 4 и файлы
 * для неё/Таблица вариантов.xlsx — формулы сверены на реальном примере из отчёта:
 * 107.214.175.68 / 255.255.224.0 (=/19) → сеть 107.214.160.0/19, адрес хоста 0.0.15.68,
 * первый хост 107.214.160.1, последний 107.214.191.254, broadcast 107.214.191.255,
 * количество узлов 8190 — всё совпало.
 */

export function ipToInt(ip: string): number {
  const parts = ip.trim().split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p) || p < 0 || p > 255)) {
    throw new Error("Некорректный IPv4-адрес");
  }
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

export function intToIp(n: number): string {
  return [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff].join(".");
}

export function maskFromPrefix(prefix: number): number {
  if (prefix < 0 || prefix > 32) throw new Error("Префикс должен быть в диапазоне 0..32");
  return prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
}

export function prefixFromMask(mask: number): number {
  let prefix = 0;
  let m = mask >>> 0;
  for (let i = 31; i >= 0; i--) {
    if ((m >>> i) & 1) prefix++;
    else break;
  }
  return prefix;
}

export interface SubnetInfo {
  ip: string;
  mask: string;
  prefix: number;
  network: string;
  hostPart: string;
  firstHost: string;
  lastHost: string;
  broadcast: string;
  hostCount: number;
}

export function subnetInfo(ipStr: string, prefix: number): SubnetInfo {
  const ip = ipToInt(ipStr);
  const mask = maskFromPrefix(prefix);
  const network = ip & mask;
  const hostPartInt = ip & ~mask;
  const broadcast = (network | ~mask) >>> 0;
  const hostBits = 32 - prefix;
  const hostCount = hostBits <= 1 ? 0 : 2 ** hostBits - 2;

  return {
    ip: intToIp(ip),
    mask: intToIp(mask),
    prefix,
    network: intToIp(network),
    hostPart: intToIp(hostPartInt >>> 0),
    firstHost: hostCount > 0 ? intToIp((network + 1) >>> 0) : intToIp(network),
    lastHost: hostCount > 0 ? intToIp((broadcast - 1) >>> 0) : intToIp(broadcast),
    broadcast: intToIp(broadcast),
    hostCount,
  };
}

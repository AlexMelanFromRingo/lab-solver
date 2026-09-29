/**
 * Маски и префиксы IPv4 — ЛР4 «Комп'ютерні мережі» (л.р.4v6.pdf).
 *
 * Задание 1 даёт адрес с маской (префикс ищется по маске), задание 2 — адрес с
 * префиксом (маска ищется по префиксу); таблица 4.2 заполняется для обоих
 * адресов. Пример из методички (вариант 0): 60.255.110.21/18 → сеть
 * 60.255.64.0/18, хост 0.0.46.21, первый 60.255.64.1/18, последний
 * 60.255.127.254/18, широкомовный 60.255.127.255/18, 16382 узла.
 */

export function ipToInt(ip: string): number {
  const raw = ip.trim().split(".");
  if (raw.length !== 4 || raw.some((p) => !/^\d{1,3}$/.test(p) || Number(p) > 255)) {
    throw new Error("Некорректный IPv4-адрес");
  }
  const parts = raw.map(Number);
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
  const m = mask >>> 0;
  for (let i = 31; i >= 0; i--) {
    if ((m >>> i) & 1) prefix++;
    else break;
  }
  return prefix;
}

/** Маска в точечной записи → префикс; единицы маски должны идти подряд. */
export function parseMask(mask: string): number {
  let value: number;
  try {
    value = ipToInt(mask.replace(/\s+/g, ""));
  } catch {
    throw new Error("Маска записывается как IPv4-адрес: четыре числа 0..255 через точку");
  }
  const prefix = prefixFromMask(value);
  if (maskFromPrefix(prefix) !== value) {
    throw new Error("В маске единицы должны идти подряд слева, а нули — справа");
  }
  return prefix;
}

export function toBinary(n: number): string {
  return [24, 16, 8, 0].map((sh) => ((n >>> sh) & 0xff).toString(2).padStart(8, "0")).join(".");
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

/** Строка таблицы 4.1: задание 1 (адрес и маска), задание 2 (адрес и префикс). */
export interface Km4Variant {
  n: number;
  ip1: string;
  mask1: string;
  ip2: string;
  prefix2: number;
}

// Таблица 4.1 методички дословно. У варианта 0 (пример заполнения) там напечатана
// маска 255.255.252.0 при префиксе 18 и таблице 4.2 для /18 — маска исправлена на
// 255.255.192.0, иначе пример противоречит сам себе.
const T41: [string, string, string, number][] = [
  ["60.255.110.21", "255.255.192.0", "10.211.17.16", 8],
  ["72.60.124.23", "255.255.224.0", "13.165.140.153", 10],
  ["238.78.57.116", "255.248.0.0", "59.3.115.89", 11],
  ["60.255.110.21", "255.255.192.0", "112.231.164.30", 12],
  ["12.211.92.185", "255.128.0.0", "123.210.206.234", 13],
  ["165.114.253.9", "255.255.252.0", "220.24.105.100", 14],
  ["253.171.224.98", "255.255.240.0", "3.174.130.238", 15],
  ["225.194.116.5", "255.240.0.0", "79.80.159.149", 20],
  ["92.159.7.53", "255.255.252.0", "112.37.195.31", 17],
  ["43.117.230.183", "255.255.192.0", "98.107.124.156", 18],
  ["146.247.87.2", "255.255.240.0", "55.160.113.10", 19],
  ["188.233.122.101", "255.255.224.0", "56.211.33.164", 21],
  ["192.19.3.8", "255.255.254.0", "53.119.203.221", 22],
  ["84.6.223.106", "255.255.252.0", "67.200.116.39", 23],
  ["216.45.42.190", "255.255.248.0", "243.162.237.152", 22],
  ["138.46.140.94", "255.248.0.0", "4.82.38.2", 21],
  ["152.205.232.105", "255.255.192.0", "144.112.213.91", 20],
  ["107.214.175.68", "255.255.224.0", "210.254.11.42", 19],
  ["57.198.77.193", "255.255.240.0", "11.104.213.125", 18],
  ["122.227.157.232", "255.255.128.0", "201.24.249.88", 17],
  ["228.219.147.134", "255.255.252.0", "17.124.16.162", 18],
  ["151.22.163.204", "255.248.0.0", "55.174.76.242", 19],
  ["37.128.54.52", "255.255.192.0", "72.96.79.110", 20],
  ["59.145.202.91", "255.255.224.0", "92.9.234.56", 21],
  ["162.202.242.90", "255.255.240.0", "144.186.231.149", 22],
  ["159.25.94.89", "255.255.252.0", "178.15.86.139", 25],
];

export const KM_LAB4_VARIANTS: Km4Variant[] = T41.map(([ip1, mask1, ip2, prefix2], n) => ({
  n,
  ip1,
  mask1,
  ip2,
  prefix2,
}));

/** Класс адреса по первому октету: D (224–239) — групповые, E (240–255) — резерв. */
export function addressClass(ip: string): "A" | "B" | "C" | "D" | "E" {
  const first = ipToInt(ip) >>> 24;
  if (first < 128) return "A";
  if (first < 192) return "B";
  if (first < 224) return "C";
  if (first < 240) return "D";
  return "E";
}

export type AddressKind = "host" | "network" | "broadcast";

/** Контрольный вопрос 2: адрес узла, адрес сети или широковещательная рассылка. */
export function addressKind(ip: string, prefix: number): AddressKind {
  const info = subnetInfo(ip, prefix);
  if (prefix < 31 && info.ip === info.network) return "network";
  if (prefix < 31 && info.ip === info.broadcast) return "broadcast";
  return "host";
}

/**
 * Контрольный вопрос 3: частный или общий адрес. Частные диапазоны по RFC 1918 —
 * 10.0.0.0/8, 172.16.0.0/12 и 192.168.0.0/16 (в методичке у последнего опечатка: /24).
 */
export function isPrivate(ip: string): boolean {
  const n = ipToInt(ip);
  const inNet = (net: string, prefix: number) =>
    ((n & maskFromPrefix(prefix)) >>> 0) === ipToInt(net);
  return inNet("10.0.0.0", 8) || inNet("172.16.0.0", 12) || inNet("192.168.0.0", 16);
}

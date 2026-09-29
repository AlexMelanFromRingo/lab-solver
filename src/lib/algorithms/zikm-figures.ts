/**
 * Схемы полигонов ЗІКМ с адресами варианта: расширенный полигон ЛР1–ЛР2
 * (рис. 1.5), сети с туннелем GRE (ЛР3), VLAN на одном и двух коммутаторах
 * (ЛР4, рис. 5 и 8). Адресация — та же, что в таблицах страниц.
 */

import { netDrawing, type Drawing, type NetLink, type NetNode } from "@/lib/drawing";

/** ЛР1, найпростіший полігон (рис. 1.1, таблиця 1.1). */
export function simpleFigure(v: number): Drawing {
  return netDrawing(
    [
      { id: "r", kind: "router", x: 300, y: 110, name: "Router0 (1841)", above: true },
      { id: "s", kind: "switch", x: 130, y: 110, name: "Switch0", above: true },
      { id: "pc0", kind: "pc", x: 70, y: 210, name: "PC0", lines: [`200.200.${v}.2/24`] },
      { id: "pc2", kind: "pc", x: 190, y: 210, name: "PC2 (консоль)", lines: [`200.200.${v}.3/24`] },
      { id: "pc1", kind: "pc", x: 480, y: 110, name: "PC1", lines: [`200.210.${v}.2/24`] },
    ],
    [
      { a: "r", b: "s", aLabel: `f0/0\n200.200.${v}.1`, label: "Net1" },
      { a: "r", b: "pc1", aLabel: `f1/0\n200.210.${v}.1`, label: "Net2" },
      { a: "s", b: "pc0" },
      { a: "s", b: "pc2" },
    ],
    560,
    260,
  );
}

export function extendedFigure(v: number, withPc3 = false): Drawing {
  const nodes: NetNode[] = [
    { id: "c", kind: "router", x: 270, y: 220, name: "Central" },
    { id: "i", kind: "router", x: 530, y: 220, name: "ISP" },
    { id: "s0", kind: "switch", x: 130, y: 140, name: "Switch0", side: "left" },
    { id: "s1", kind: "switch", x: 130, y: 300, name: "Switch1", side: "left" },
    { id: "s2", kind: "switch", x: 670, y: 140, name: "Switch2", side: "right" },
    { id: "s3", kind: "switch", x: 670, y: 300, name: "Switch3", side: "right" },
    { id: "pc0", kind: "pc", x: 70, y: 72, name: "PC0", lines: [`10.${v}.1.2/24`], above: true },
    { id: "pc1", kind: "pc", x: 190, y: 72, name: "PC1", lines: [`10.${v}.1.3/24`], above: true },
    { id: "pc2", kind: "pc", x: 60, y: 380, name: "PC2", lines: [`10.${v}.2.2/24`] },
    { id: "pc5", kind: "pc", x: 140, y: 380, name: "PC5", lines: [`10.${v}.2.3/24`] },
    { id: "dns", kind: "server", x: 610, y: 72, name: "Server-DNS", lines: [`200.10.${v}.2/24`], above: true },
    { id: "pc4", kind: "pc", x: 730, y: 72, name: "PC4", lines: [`200.10.${v}.3/24`], above: true },
    { id: "http", kind: "server", x: 670, y: 380, name: "ServerHTTP", lines: [`210.10.${v}.2/24`] },
  ];
  const links: NetLink[] = [
    { a: "c", b: "s0", aLabel: `Fa0/0\n10.${v}.1.1`, label: "Net1" },
    { a: "c", b: "s1", aLabel: `Fa1/0\n10.${v}.2.1`, label: "Net2" },
    { a: "c", b: "i", serial: true, aLabel: `S2/0\n212.${v}.211.17/30`, bLabel: `S2/0 (DCE)\n212.${v}.211.18/30`, label: "Net3" },
    { a: "i", b: "s2", aLabel: `Fa0/0\n200.10.${v}.1`, label: "Net4" },
    { a: "i", b: "s3", aLabel: `Fa1/0\n210.10.${v}.1`, label: "Net5" },
    { a: "s0", b: "pc0" },
    { a: "s0", b: "pc1" },
    { a: "s1", b: "pc2" },
    { a: "s1", b: "pc5" },
    { a: "s2", b: "dns" },
    { a: "s2", b: "pc4" },
    { a: "s3", b: "http" },
  ];
  if (withPc3) {
    nodes.push({ id: "pc3", kind: "pc", x: 220, y: 380, name: "PC3", lines: [`10.${v}.2.4/24`] });
    links.push({ a: "s1", b: "pc3" });
  }
  return netDrawing(nodes, links, 800, 440);
}

export function greFigure(v: number): Drawing {
  const nodes: NetNode[] = [
    { id: "p1", kind: "pc", x: 40, y: 130, name: "PC1", lines: [`192.168.${v}.2/24`] },
    { id: "r3", kind: "router", x: 190, y: 130, name: "Router3" },
    { id: "r4", kind: "router", x: 390, y: 130, name: "Router4" },
    { id: "r5", kind: "router", x: 590, y: 130, name: "Router5" },
    { id: "p2", kind: "pc", x: 740, y: 130, name: "PC2", lines: [`10.${v}.1.2/24`] },
  ];
  const links: NetLink[] = [
    { a: "r3", b: "p1", aLabel: `Fa0/0\n192.168.${v}.1`, label: "Net-1" },
    { a: "r3", b: "r4", aLabel: `Fa0/1\n200.10.${v}.1`, bLabel: `Fa0/0\n200.10.${v}.2`, label: "Net-3" },
    { a: "r4", b: "r5", aLabel: `Fa0/1\n200.20.${v}.1`, bLabel: `Fa0/0\n200.20.${v}.2`, label: "Net-4" },
    { a: "r5", b: "p2", aLabel: `Fa0/1\n10.${v}.1.1`, label: "Net-2" },
  ];
  const d = netDrawing(nodes, links, 790, 200);
  d.items.unshift({ k: "line", pts: [[190, 115], [190, 40], [590, 40], [590, 115]], dashed: true });
  d.items.push({ k: "text", x: 390, y: 34, text: `Tunnel0: 100.10.${v}.1/24 ↔ 100.10.${v}.2/24 (GRE)`, anchor: "middle", size: 10.5, plain: true });
  return d;
}

const ip = (n: number, k: number) => `192.168.0.${2 * n + k}/24`;

export function vlanOneFigure(n: number): Drawing {
  const pcs = [1, 2, 3, 4].map((k, i) => ({ id: `p${k}`, kind: "pc" as const, x: 90 + i * 150, y: 190, name: `PC${k}`, lines: [ip(n, i), `VLAN ${k <= 2 ? n + 1 : n + 2}`] }));
  return netDrawing(
    [{ id: "s", kind: "switch", x: 315, y: 60, name: "Switch0 (2950-24)", above: true }, ...pcs],
    pcs.map((p, i) => ({ a: "s", b: p.id, aLabel: `fa0/${i + 1}`, at: 0.5 })),
    630,
    260,
  );
}

export function vlanTwoFigure(n: number): Drawing {
  const v1 = n + 1;
  const v2 = n + 2;
  const nodes: NetNode[] = [
    { id: "s0", kind: "switch", x: 190, y: 70, name: "Sw0", above: true },
    { id: "s1", kind: "switch", x: 500, y: 70, name: "Sw1", above: true },
    { id: "sv0", kind: "server", x: 110, y: 200, name: "Server0", lines: [ip(n, 1), `VLAN ${v1}`] },
    { id: "sv1", kind: "server", x: 260, y: 200, name: "Server1", lines: [ip(n, 2), `VLAN ${v2}`] },
    ...[0, 1, 2, 3].map((k) => ({ id: `p${k}`, kind: "pc" as const, x: 380 + k * 90, y: 200, name: `PC${k}`, lines: [ip(n, 3 + k), `VLAN ${k < 2 ? v1 : v2}`] })),
  ];
  const links: NetLink[] = [
    { a: "s0", b: "s1", aLabel: "g1/1", bLabel: "g1/1", label: `trunk 802.1Q (${v1}, ${v2})` },
    { a: "s0", b: "sv0", aLabel: "fa0/1", at: 0.5 },
    { a: "s0", b: "sv1", aLabel: "fa0/2", at: 0.5 },
    ...[0, 1, 2, 3].map((k) => ({ a: "s1", b: `p${k}`, aLabel: `fa0/${k + 1}`, at: 0.55 })),
  ];
  return netDrawing(nodes, links, 700, 270);
}

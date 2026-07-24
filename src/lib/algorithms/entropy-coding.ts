/**
 * Энтропия, код Шеннона-Фано, код Хаффмана — Лаба 2 "Теории информации".
 * Формулы подтверждены отчётными шаблонами Entropy.xlsx/Shennon.xlsx/Huffman.xlsx:
 * H = -Σ p·log2(p); Шеннон-Фано — рекурсивное деление по накопленной вероятности;
 * Хаффман — классическое объединение двух наименьших вероятностей снизу вверх.
 */

export interface SymbolProb {
  symbol: string;
  p: number;
}

export function entropy(probs: number[]): number {
  return probs.reduce((acc, p) => (p > 0 ? acc - p * Math.log2(p) : acc), 0);
}

export interface CodeTable {
  [symbol: string]: string;
}

/** Код Шеннона-Фано: сортируем по убыванию вероятности, делим пополам по накопленной сумме. */
export function shannonFano(items: SymbolProb[]): CodeTable {
  const sorted = [...items].sort((a, b) => b.p - a.p);
  const codes: CodeTable = {};
  sorted.forEach((s) => (codes[s.symbol] = ""));

  function split(group: SymbolProb[]) {
    if (group.length <= 1) return;
    const total = group.reduce((acc, s) => acc + s.p, 0);
    let acc = 0;
    let splitIdx = 1;
    let bestDiff = Infinity;
    for (let i = 1; i < group.length; i++) {
      acc += group[i - 1].p;
      const diff = Math.abs(acc - (total - acc));
      if (diff < bestDiff) {
        bestDiff = diff;
        splitIdx = i;
      }
    }
    const left = group.slice(0, splitIdx);
    const right = group.slice(splitIdx);
    left.forEach((s) => (codes[s.symbol] += "0"));
    right.forEach((s) => (codes[s.symbol] += "1"));
    split(left);
    split(right);
  }

  split(sorted);
  return codes;
}

interface HuffmanNode {
  symbol?: string;
  p: number;
  left?: HuffmanNode;
  right?: HuffmanNode;
}

export function huffman(items: SymbolProb[]): CodeTable {
  let nodes: HuffmanNode[] = items.map((s) => ({ symbol: s.symbol, p: s.p }));
  if (nodes.length === 1) return { [nodes[0].symbol!]: "0" };

  while (nodes.length > 1) {
    nodes.sort((a, b) => a.p - b.p);
    const [a, b] = nodes;
    const merged: HuffmanNode = { p: a.p + b.p, left: a, right: b };
    nodes = [merged, ...nodes.slice(2)];
  }

  const codes: CodeTable = {};
  function walk(node: HuffmanNode, prefix: string) {
    if (node.symbol !== undefined) {
      codes[node.symbol] = prefix || "0";
      return;
    }
    if (node.left) walk(node.left, prefix + "0");
    if (node.right) walk(node.right, prefix + "1");
  }
  walk(nodes[0], "");
  return codes;
}

export function averageLength(items: SymbolProb[], codes: CodeTable): number {
  return items.reduce((acc, s) => acc + s.p * codes[s.symbol].length, 0);
}

export function encodeSequence(sequence: string[], codes: CodeTable): string {
  return sequence.map((s) => codes[s] ?? "?").join("");
}

export interface CodingReport {
  H: number;
  shannonFanoCodes: CodeTable;
  shannonFanoAvgLength: number;
  shannonFanoRedundancy: number;
  huffmanCodes: CodeTable;
  huffmanAvgLength: number;
  huffmanRedundancy: number;
}

export function buildReport(items: SymbolProb[]): CodingReport {
  const H = entropy(items.map((s) => s.p));
  const sf = shannonFano(items);
  const hf = huffman(items);
  const sfLen = averageLength(items, sf);
  const hfLen = averageLength(items, hf);
  return {
    H,
    shannonFanoCodes: sf,
    shannonFanoAvgLength: sfLen,
    shannonFanoRedundancy: sfLen - H,
    huffmanCodes: hf,
    huffmanAvgLength: hfLen,
    huffmanRedundancy: hfLen - H,
  };
}

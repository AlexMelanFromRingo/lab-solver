/**
 * Полярные коды — портировано из вашего же Angular-приложения error-codes-explorer/
 * src/app/pages/polar/polar.ts (чистые функции вынесены как есть).
 */

function kronecker(a: number[][], b: number[][]): number[][] {
  const am = a.length,
    an = a[0].length;
  const bm = b.length,
    bn = b[0].length;
  const result: number[][] = [];
  for (let i = 0; i < am * bm; i++) {
    result[i] = [];
    for (let j = 0; j < an * bn; j++) {
      result[i][j] = a[Math.floor(i / bm)][Math.floor(j / bn)] * b[i % bm][j % bn];
    }
  }
  return result;
}

export function generateG(n: number): number[][] {
  const F = [
    [1, 0],
    [1, 1],
  ];
  let G = F;
  for (let i = 1; i < n; i++) G = kronecker(G, F);
  return G.map((row) => row.map((v) => v % 2));
}

/** Параметры Батачария для двоичного канала стирания (BEC) с вероятностью стирания eps. */
export function bhattacharyya(n: number, eps: number): number[] {
  if (n === 1) return [eps];
  const half = bhattacharyya(n / 2, eps);
  const result: number[] = [];
  for (let i = 0; i < half.length; i++) {
    result.push(Math.min(2 * half[i] - half[i] * half[i], 1)); // W- (плохой)
    result.push(half[i] * half[i]); // W+ (хороший)
  }
  return result;
}

export function scDecode(received: number[], frozenBits: Set<number>, N: number): number[] {
  const decoded: number[] = new Array(N).fill(0);
  const reliability = 6.0;

  function f(a: number, b: number): number {
    const sign = (a >= 0 ? 1 : -1) * (b >= 0 ? 1 : -1);
    return sign * Math.min(Math.abs(a), Math.abs(b));
  }
  function g(a: number, b: number, u: number): number {
    return b + (1 - 2 * u) * a;
  }

  function decode(llr: number[], offset: number, size: number): number[] {
    if (size === 1) {
      decoded[offset] = frozenBits.has(offset) ? 0 : llr[0] < 0 ? 1 : 0;
      return [decoded[offset]];
    }
    const half = size / 2;
    const fLlr: number[] = new Array(half);
    for (let i = 0; i < half; i++) fLlr[i] = f(llr[i], llr[half + i]);
    const upperEnc = decode(fLlr, offset, half);

    const gLlr: number[] = new Array(half);
    for (let i = 0; i < half; i++) gLlr[i] = g(llr[i], llr[half + i], upperEnc[i]);
    const lowerEnc = decode(gLlr, offset + half, half);

    const combined: number[] = new Array(size);
    for (let i = 0; i < half; i++) {
      combined[i] = upperEnc[i] ^ lowerEnc[i];
      combined[half + i] = lowerEnc[i];
    }
    return combined;
  }

  const initialLlr = received.map((bit) => (bit === 0 ? reliability : -reliability));
  decode(initialLlr, 0, N);
  return decoded;
}

/** ML-декодирование полным перебором — годится только для коротких кодов (N ≤ 16). */
export function mlDecode(received: number[], infoIndices: number[], G: number[][], N: number, K: number): number[] {
  let bestDist = N + 1;
  let bestU: number[] = new Array(N).fill(0);

  for (let mask = 0; mask < 1 << K; mask++) {
    const u = new Array(N).fill(0);
    for (let k = 0; k < K; k++) u[infoIndices[k]] = (mask >> k) & 1;

    const x: number[] = new Array(N).fill(0);
    for (let j = 0; j < N; j++) {
      let sum = 0;
      for (let i = 0; i < N; i++) sum += u[i] * G[i][j];
      x[j] = sum % 2;
    }
    let dist = 0;
    for (let j = 0; j < N; j++) if (x[j] !== received[j]) dist++;
    if (dist < bestDist) {
      bestDist = dist;
      bestU = u;
    }
  }
  return bestU;
}

export interface PolarChannel {
  index: number;
  bhattacharyya: number;
  type: "frozen" | "info";
  reliability: number;
}

export function computeChannels(N: number, K: number, erasureProb: number): PolarChannel[] {
  const params = bhattacharyya(N, erasureProb);
  const sorted = params.map((z, i) => ({ index: i, z })).sort((a, b) => a.z - b.z);
  const infoSet = new Set(sorted.slice(0, K).map((c) => c.index));
  return params.map((z, i) => ({ index: i, bhattacharyya: z, type: infoSet.has(i) ? "info" : "frozen", reliability: 1 - z }));
}

export function encodePolar(infoBits: number[], channels: PolarChannel[], G: number[][], N: number): number[] {
  const infoIndices = channels.filter((c) => c.type === "info").map((c) => c.index).sort((a, b) => a - b);
  const u = new Array(N).fill(0);
  for (let i = 0; i < Math.min(infoIndices.length, infoBits.length); i++) u[infoIndices[i]] = infoBits[i];

  const x: number[] = new Array(N).fill(0);
  for (let j = 0; j < N; j++) {
    let sum = 0;
    for (let i = 0; i < N; i++) sum += u[i] * G[i][j];
    x[j] = sum % 2;
  }
  return x;
}

export function infoIndicesOf(channels: PolarChannel[]): number[] {
  return channels.filter((c) => c.type === "info").map((c) => c.index).sort((a, b) => a - b);
}

export function frozenSetOf(channels: PolarChannel[]): Set<number> {
  return new Set(channels.filter((c) => c.type === "frozen").map((c) => c.index));
}

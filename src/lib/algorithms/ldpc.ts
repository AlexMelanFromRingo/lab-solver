/**
 * LDPC-коды (Low-Density Parity-Check) — портировано из вашего же Angular-приложения
 * error-codes-explorer/src/app/pages/ldpc/ldpc.ts (вычислительное ядро; интерактивная
 * панорама/зум графа Таннера — чисто UI-часть Angular, не переносится).
 */

// Демонстрационная разреженная проверочная матрица H — код [8,4,3]: 8 переменных, 4 проверки.
export const DEFAULT_H: number[][] = [
  [0, 1, 1, 1, 0, 1, 0, 1],
  [0, 1, 1, 0, 1, 0, 1, 1],
  [1, 0, 0, 1, 0, 1, 1, 1],
  [1, 0, 1, 1, 1, 0, 1, 0],
];

export interface GeneratorResult {
  G: number[][];
  pivotCols: number[];
  freeCols: number[];
}

/** Порождающая матрица G из H гауссовым исключением над GF(2): H·Gᵀ = 0, кодовое слово = data·G. */
export function computeGenerator(h: number[][]): GeneratorResult {
  const m = h.length;
  const n = h[0]?.length || 0;
  const k = n - m;
  if (k <= 0 || n === 0) return { G: [], pivotCols: [], freeCols: [] };

  const aug = h.map((r) => [...r]);
  const pivotCols: number[] = [];

  let pivotRow = 0;
  for (let col = 0; col < n && pivotRow < m; col++) {
    let found = -1;
    for (let row = pivotRow; row < m; row++) {
      if (aug[row][col] === 1) {
        found = row;
        break;
      }
    }
    if (found === -1) continue;

    [aug[pivotRow], aug[found]] = [aug[found], aug[pivotRow]];
    pivotCols.push(col);

    for (let row = 0; row < m; row++) {
      if (row !== pivotRow && aug[row][col] === 1) {
        for (let j = 0; j < n; j++) aug[row][j] ^= aug[pivotRow][j];
      }
    }
    pivotRow++;
  }

  const pivotSet = new Set(pivotCols);
  const freeCols: number[] = [];
  for (let j = 0; j < n; j++) if (!pivotSet.has(j)) freeCols.push(j);

  const G: number[][] = [];
  for (const f of freeCols) {
    const row = new Array(n).fill(0);
    row[f] = 1;
    for (let i = 0; i < pivotCols.length; i++) row[pivotCols[i]] = aug[i][f];
    G.push(row);
  }
  return { G, pivotCols, freeCols };
}

export function ldpcEncode(dataBits: number[], G: number[][], n: number): number[] {
  if (G.length === 0) return new Array(n).fill(0);
  const c = new Array(n).fill(0);
  for (let i = 0; i < Math.min(G.length, dataBits.length); i++) {
    if (dataBits[i] === 1) for (let j = 0; j < n; j++) c[j] ^= G[i][j];
  }
  return c;
}

export function channelLLR(received: number[], flipProb: number): number[] {
  const llr0 = Math.log((1 - flipProb) / flipProb);
  return received.map((bit) => (bit === 0 ? llr0 : -llr0));
}

export interface BpIteration {
  iteration: number;
  beliefs: number[];
  decoded: number[];
  syndromeOk: boolean;
}

/** Belief propagation (min-sum approximация) с проверкой синдрома после каждой итерации. */
export function beliefPropagation(h: number[][], llr: number[], maxIter: number): BpIteration[] {
  const m = h.length;
  const n = h[0]?.length || 0;
  const iterations: BpIteration[] = [];

  let varToCheck: number[][] = [];
  for (let i = 0; i < m; i++) {
    varToCheck[i] = [];
    for (let j = 0; j < n; j++) varToCheck[i][j] = h[i][j] === 1 ? llr[j] : 0;
  }

  for (let iter = 0; iter < maxIter; iter++) {
    const checkToVar: number[][] = [];
    for (let i = 0; i < m; i++) {
      checkToVar[i] = [];
      for (let j = 0; j < n; j++) {
        if (h[i][j] === 0) {
          checkToVar[i][j] = 0;
          continue;
        }
        let sign = 1;
        let minAbs = Infinity;
        for (let jj = 0; jj < n; jj++) {
          if (jj === j || h[i][jj] === 0) continue;
          const msg = varToCheck[i][jj];
          sign *= msg >= 0 ? 1 : -1;
          minAbs = Math.min(minAbs, Math.abs(msg));
        }
        checkToVar[i][j] = sign * minAbs * 0.9;
      }
    }

    const beliefs: number[] = [];
    for (let j = 0; j < n; j++) {
      let total = llr[j];
      for (let i = 0; i < m; i++) if (h[i][j] === 1) total += checkToVar[i][j];
      beliefs[j] = total;
    }

    const newVarToCheck: number[][] = [];
    for (let i = 0; i < m; i++) {
      newVarToCheck[i] = [];
      for (let j = 0; j < n; j++) newVarToCheck[i][j] = h[i][j] === 0 ? 0 : beliefs[j] - checkToVar[i][j];
    }

    const decoded = beliefs.map((b) => (b < 0 ? 1 : 0));

    let syndromeOk = true;
    for (let i = 0; i < m; i++) {
      let s = 0;
      for (let j = 0; j < n; j++) if (h[i][j] === 1) s ^= decoded[j];
      if (s !== 0) {
        syndromeOk = false;
        break;
      }
    }

    iterations.push({ iteration: iter + 1, beliefs: [...beliefs], decoded: [...decoded], syndromeOk });
    varToCheck = newVarToCheck;
    if (syndromeOk) break;
  }

  return iterations;
}

export function syndromeOf(h: number[][], codeword: number[]): number[] {
  return h.map((row) => {
    let s = 0;
    for (let j = 0; j < row.length; j++) if (row[j] === 1) s ^= codeword[j];
    return s;
  });
}

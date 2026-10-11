/**
 * BPE так, как его считает зошит ЛР1 частини 2.
 *
 * Функции повторяют get_pair_stats и merge_pair из зошита вместе с порядком,
 * в котором Python перебирает пары. Это важно при равных частотах: Counter
 * помнит порядок первого появления ключа, а most_common сортирует устойчиво,
 * поэтому из нескольких одинаково частых пар выбирается та, что встретилась
 * раньше. Слова идут в порядке первого появления в тексте, пары внутри
 * слова — слева направо.
 */

export interface VocabEntry {
  word: string;
  freq: number;
  tokens: string[];
}

export interface PairCount {
  a: string;
  b: string;
  freq: number;
}

export interface BpeStep {
  step: number;
  pair: PairCount;
  token: string;
  /** Пары с той же частотой, что у выбранной, в порядке most_common. */
  ties: PairCount[];
  /** Все пары до объединения, как их печатает most_common(). */
  stats: PairCount[];
  /** Разбиение слов после объединения. */
  after: VocabEntry[];
}

export interface BpeRun {
  words: number;
  initial: VocabEntry[];
  steps: BpeStep[];
  /** Пар не осталось раньше, чем закончились проходы: в зошите здесь IndexError. */
  exhaustedAt: number | null;
}

/** text.split() и Counter(words): частоты в порядке первого появления слова. */
export function initialVocab(text: string): { words: number; vocab: VocabEntry[] } {
  const words = text.split(/\s+/).filter(Boolean);
  const freq = new Map<string, number>();
  for (const w of words) freq.set(w, (freq.get(w) ?? 0) + 1);
  // list(word) в Python делит по кодовым точкам, Array.from — тоже.
  const vocab = [...freq].map(([word, f]) => ({ word, freq: f, tokens: Array.from(word) }));
  return { words: words.length, vocab };
}

/** get_pair_stats: частота пары — сумма частот слов, в которых она есть. */
export function pairStats(vocab: VocabEntry[]): PairCount[] {
  const stats = new Map<string, PairCount>();
  for (const { tokens, freq } of vocab) {
    for (let i = 0; i < tokens.length - 1; i++) {
      const key = `${tokens[i]}\u0000${tokens[i + 1]}`;
      const cur = stats.get(key);
      if (cur) cur.freq += freq;
      else stats.set(key, { a: tokens[i], b: tokens[i + 1], freq });
    }
  }
  return [...stats.values()];
}

/** Counter.most_common(): по убыванию частоты, равные — в порядке появления. */
export function mostCommon(stats: PairCount[]): PairCount[] {
  return stats
    .map((p, i) => ({ p, i }))
    .sort((x, y) => y.p.freq - x.p.freq || x.i - y.i)
    .map(({ p }) => p);
}

/** merge_pair: каждое вхождение пары слева направо заменяется новым токеном. */
export function mergePair(vocab: VocabEntry[], a: string, b: string): VocabEntry[] {
  const merged = a + b;
  return vocab.map((e) => {
    const out: string[] = [];
    let i = 0;
    while (i < e.tokens.length) {
      if (i < e.tokens.length - 1 && e.tokens[i] === a && e.tokens[i + 1] === b) {
        out.push(merged);
        i += 2;
      } else {
        out.push(e.tokens[i]);
        i += 1;
      }
    }
    return { ...e, tokens: out };
  });
}

export function runBpe(text: string, merges: number): BpeRun {
  const { words, vocab: initial } = initialVocab(text);
  let vocab = initial;
  const steps: BpeStep[] = [];
  let exhaustedAt: number | null = null;

  for (let step = 1; step <= merges; step++) {
    const stats = mostCommon(pairStats(vocab));
    if (stats.length === 0) {
      exhaustedAt = step;
      break;
    }
    const pair = stats[0];
    vocab = mergePair(vocab, pair.a, pair.b);
    steps.push({
      step,
      pair,
      token: pair.a + pair.b,
      ties: stats.slice(1).filter((p) => p.freq === pair.freq),
      stats,
      after: vocab,
    });
  }
  return { words, initial, steps, exhaustedAt };
}

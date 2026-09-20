/**
 * Токенізатори за варіантами лабораторної роботи.
 *
 * Усі числа тут виміряні запуском, а не взяті з описів моделей: кожен
 * токенізатор завантажено й прогнано на тому самому наборі рядків. Тому й
 * видно те, про що в описах не пишуть – наприклад, що складене emoji
 * розпадається не через відсутність символів у словнику, а через втрачений
 * невидимий з'єднувач.
 *
 * Браузер такі моделі не запускає: словники важать мегабайти. Тому сторінка
 * показує виміряне й видає готову клітинку зошита, а сам розрахунок
 * виконується там, де й має – у Colab або на своїй машині.
 */

export interface ProbeResult {
  tokens: number;
  /** Символів на токен: на відміну від байтів, від кодування не залежить. */
  cpt: number;
  unk: number;
  /** Чи збігся текст після зворотного декодування. */
  rt: boolean;
}

export interface TokenizerVariant {
  variant: number;
  model: string;
  cls: string;
  family: string;
  vocab: number;
  length: number;
  unkToken: string | null;
  note: string;
  probes: Record<string, ProbeResult>;
  /** Токенів у «токен», «Токен», «ТОКЕН». */
  caseTokens: number[];
  /** Токенів у «world», « world», «  world». */
  spaceTokens: number[];
}

/** Рядки, на яких виміряно всі токенізатори. */
export const PROBE_TEXTS: { key: string; label: string; text: string }[] = [
  { key: "en", label: "англійський текст", text: "Artificial intelligence is used in computer systems and networks." },
  { key: "uk", label: "український текст", text: "Штучний інтелект використовується у комп'ютерних системах і мережах." },
  { key: "spaces", label: "кратні пробіли", text: "Hello   world!" },
  { key: "emoji", label: "emoji", text: "🙂" },
  { key: "zwj", label: "складене emoji", text: "👨\u200d💻" },
  { key: "code", label: "фрагмент коду", text: "def tokenize(text: str) -> list[int]: return tok.encode(text)" },
];

/** Базовий токенізатор, з яким порівнюється варіант. */
export const BASE_TOKENIZER: TokenizerVariant = {
  variant: 0,
  model: "gpt2",
  cls: "GPT2Tokenizer",
  family: "побайтовий BPE",
  vocab: 50257,
  length: 50257,
  unkToken: "<|endoftext|>",
  note: "Працює з байтами подання UTF-8, тому розкладає будь-який текст без залишку й токена невідомого не має в принципі.",
  probes: { en: { tokens: 11, cpt: 5.91, unk: 0, rt: true }, uk: { tokens: 80, cpt: 0.85, unk: 0, rt: true }, spaces: { tokens: 5, cpt: 2.8, unk: 0, rt: true }, emoji: { tokens: 2, cpt: 0.5, unk: 0, rt: true }, zwj: { tokens: 7, cpt: 0.43, unk: 0, rt: true }, code: { tokens: 22, cpt: 2.77, unk: 0, rt: true } },
  caseTokens: [5, 6, 10],
  spaceTokens: [1, 1, 2],
};

export const TOKENIZER_VARIANTS: TokenizerVariant[] = [
  {
    variant: 1,
    model: "Qwen/Qwen2.5-0.5B",
    cls: "Qwen2Tokenizer",
    family: "побайтовий BPE",
    vocab: 151643,
    length: 151665,
    unkToken: null,
    note: "Кирилиця покрита цілими шматками, зворотне декодування точне, emoji зберігаються повністю.",
    probes: { en: { tokens: 11, cpt: 5.91, unk: 0, rt: true }, uk: { tokens: 29, cpt: 2.34, unk: 0, rt: true }, spaces: { tokens: 4, cpt: 3.5, unk: 0, rt: true }, emoji: { tokens: 1, cpt: 1.0, unk: 0, rt: true }, zwj: { tokens: 4, cpt: 0.75, unk: 0, rt: true }, code: { tokens: 15, cpt: 4.07, unk: 0, rt: true } },
    caseTokens: [2, 3, 3],
    spaceTokens: [1, 1, 2],
  },
  {
    variant: 2,
    model: "mistralai/Mistral-7B-v0.1",
    cls: "TokenizersBackend",
    family: "SentencePiece з побайтовим запасом",
    vocab: 32000,
    length: 32000,
    unkToken: "<unk>",
    note: "Словник невеликий і переважно англійський, тому український текст розсипається сильніше за інші.",
    probes: { en: { tokens: 11, cpt: 5.91, unk: 0, rt: true }, uk: { tokens: 25, cpt: 2.72, unk: 0, rt: true }, spaces: { tokens: 4, cpt: 3.5, unk: 0, rt: true }, emoji: { tokens: 2, cpt: 0.5, unk: 0, rt: true }, zwj: { tokens: 10, cpt: 0.3, unk: 0, rt: true }, code: { tokens: 20, cpt: 3.05, unk: 0, rt: true } },
    caseTokens: [3, 3, 5],
    spaceTokens: [1, 1, 2],
  },
  {
    variant: 3,
    model: "TinyLlama/TinyLlama-1.1B-Chat-v1.0",
    cls: "LlamaTokenizer",
    family: "SentencePiece з побайтовим запасом",
    vocab: 32000,
    length: 32000,
    unkToken: "<unk>",
    note: "Той самий словник на 32 тисячі, що й у Mistral: на кирилиці поводиться схоже.",
    probes: { en: { tokens: 12, cpt: 5.42, unk: 0, rt: true }, uk: { tokens: 22, cpt: 3.09, unk: 0, rt: true }, spaces: { tokens: 4, cpt: 3.5, unk: 0, rt: true }, emoji: { tokens: 5, cpt: 0.2, unk: 0, rt: true }, zwj: { tokens: 10, cpt: 0.3, unk: 0, rt: true }, code: { tokens: 21, cpt: 2.9, unk: 0, rt: true } },
    caseTokens: [3, 3, 5],
    spaceTokens: [1, 1, 2],
  },
  {
    variant: 4,
    model: "EleutherAI/pythia-70m",
    cls: "GPTNeoXTokenizer",
    family: "побайтовий BPE",
    vocab: 50254,
    length: 50277,
    unkToken: "<|endoftext|>",
    note: "Влаштований як GPT-2 і на кирилиці показує майже те саме.",
    probes: { en: { tokens: 11, cpt: 5.91, unk: 0, rt: true }, uk: { tokens: 38, cpt: 1.79, unk: 0, rt: true }, spaces: { tokens: 4, cpt: 3.5, unk: 0, rt: true }, emoji: { tokens: 2, cpt: 0.5, unk: 0, rt: true }, zwj: { tokens: 8, cpt: 0.38, unk: 0, rt: true }, code: { tokens: 20, cpt: 3.05, unk: 0, rt: true } },
    caseTokens: [3, 3, 5],
    spaceTokens: [1, 1, 2],
  },
  {
    variant: 5,
    model: "bigscience/bloom-560m",
    cls: "TokenizersBackend",
    family: "побайтовий BPE",
    vocab: 250680,
    length: 250680,
    unkToken: "<unk>",
    note: "Словник великий, але української в корпусі навчання не було, тому кирилиця все одно йде майже побайтово.",
    probes: { en: { tokens: 11, cpt: 5.91, unk: 0, rt: true }, uk: { tokens: 38, cpt: 1.79, unk: 0, rt: true }, spaces: { tokens: 4, cpt: 3.5, unk: 0, rt: true }, emoji: { tokens: 3, cpt: 0.33, unk: 0, rt: true }, zwj: { tokens: 6, cpt: 0.5, unk: 0, rt: true }, code: { tokens: 19, cpt: 3.21, unk: 0, rt: true } },
    caseTokens: [3, 3, 5],
    spaceTokens: [1, 1, 2],
  },
  {
    variant: 6,
    model: "google/flan-t5-small",
    cls: "T5Tokenizer",
    family: "SentencePiece Unigram",
    vocab: 32100,
    length: 32100,
    unkToken: "<unk>",
    note: "Словник англійський: український текст майже цілком перетворюється на токени невідомого, тобто втрачається.",
    probes: { en: { tokens: 10, cpt: 6.5, unk: 0, rt: true }, uk: { tokens: 53, cpt: 1.28, unk: 14, rt: false }, spaces: { tokens: 3, cpt: 4.67, unk: 0, rt: false }, emoji: { tokens: 2, cpt: 0.5, unk: 1, rt: false }, zwj: { tokens: 4, cpt: 0.75, unk: 2, rt: false }, code: { tokens: 26, cpt: 2.35, unk: 0, rt: true } },
    caseTokens: [4, 5, 2],
    spaceTokens: [1, 1, 1],
  },
  {
    variant: 7,
    model: "google/mt5-small",
    cls: "T5Tokenizer",
    family: "SentencePiece Unigram",
    vocab: 250100,
    length: 250100,
    unkToken: "<unk>",
    note: "Навчений на 101 мові, українську знає добре. Кратні пробіли нормалізує, а складене emoji втрачає з'єднувач.",
    probes: { en: { tokens: 12, cpt: 5.42, unk: 0, rt: true }, uk: { tokens: 21, cpt: 3.24, unk: 0, rt: true }, spaces: { tokens: 3, cpt: 4.67, unk: 0, rt: false }, emoji: { tokens: 2, cpt: 0.5, unk: 0, rt: true }, zwj: { tokens: 4, cpt: 0.75, unk: 0, rt: false }, code: { tokens: 23, cpt: 2.65, unk: 0, rt: true } },
    caseTokens: [2, 2, 3],
    spaceTokens: [1, 1, 1],
  },
  {
    variant: 8,
    model: "FacebookAI/xlm-roberta-base",
    cls: "XLMRobertaTokenizer",
    family: "SentencePiece Unigram",
    vocab: 250002,
    length: 250002,
    unkToken: "<unk>",
    note: "Так само багатомовний і на кирилиці найощадливіший із набору.",
    probes: { en: { tokens: 12, cpt: 5.42, unk: 0, rt: true }, uk: { tokens: 18, cpt: 3.78, unk: 0, rt: true }, spaces: { tokens: 3, cpt: 4.67, unk: 0, rt: false }, emoji: { tokens: 1, cpt: 1.0, unk: 0, rt: true }, zwj: { tokens: 4, cpt: 0.75, unk: 0, rt: false }, code: { tokens: 24, cpt: 2.54, unk: 0, rt: true } },
    caseTokens: [2, 2, 3],
    spaceTokens: [1, 1, 1],
  },
  {
    variant: 9,
    model: "google-bert/bert-base-multilingual-cased",
    cls: "BertTokenizer",
    family: "WordPiece",
    vocab: 119547,
    length: 119547,
    unkToken: "[UNK]",
    note: "Emoji не знає зовсім, а при декодуванні розставляє пробіли навколо розділових знаків, тому текст назад не збирається.",
    probes: { en: { tokens: 11, cpt: 5.91, unk: 0, rt: true }, uk: { tokens: 20, cpt: 3.4, unk: 0, rt: false }, spaces: { tokens: 3, cpt: 4.67, unk: 0, rt: false }, emoji: { tokens: 1, cpt: 1.0, unk: 1, rt: false }, zwj: { tokens: 1, cpt: 3.0, unk: 1, rt: false }, code: { tokens: 24, cpt: 2.54, unk: 0, rt: false } },
    caseTokens: [2, 2, 5],
    spaceTokens: [1, 1, 1],
  },
  {
    variant: 10,
    model: "google/byt5-small",
    cls: "ByT5Tokenizer",
    family: "побайтовий",
    vocab: 256,
    length: 384,
    unkToken: "<unk>",
    note: "Словник у 256 байтів: кількість токенів дорівнює кількості байтів завжди. Вироджений, але зручний як контрольний випадок.",
    probes: { en: { tokens: 65, cpt: 1.0, unk: 0, rt: true }, uk: { tokens: 127, cpt: 0.54, unk: 0, rt: true }, spaces: { tokens: 14, cpt: 1.0, unk: 0, rt: true }, emoji: { tokens: 4, cpt: 0.25, unk: 0, rt: true }, zwj: { tokens: 11, cpt: 0.27, unk: 0, rt: true }, code: { tokens: 61, cpt: 1.0, unk: 0, rt: true } },
    caseTokens: [10, 10, 10],
    spaceTokens: [5, 6, 7],
  },
];

/**
 * Токенізатор за номером варіанта.
 *
 * Номер більший за десять зводиться остачею від ділення: варіант 11 – це
 * рядок 1 таблиці, варіант 20 – рядок 10.
 */
export function tokenizerFor(variant: number): TokenizerVariant {
  const index = ((variant - 1) % TOKENIZER_VARIANTS.length + TOKENIZER_VARIANTS.length)
    % TOKENIZER_VARIANTS.length;
  return TOKENIZER_VARIANTS[index];
}

/**
 * ЛР1.3: что получается на корпусе зошита. Всё измерено запуском зошита
 * (tokenizers 0.23.3): обучение детерминировано, поэтому на том же корпусе
 * у каждого выйдут те же числа.
 */

export const CORPUS = {
  sentences: 14,
  lines: 2800,
  /** Разных слов по пробелам, вместе со знаками препинания. */
  words: 125,
  /** Разных единиц после предразбиения ByteLevel: слово с пробелом перед ним, знак препинания. */
  pretokens: 134,
  englishLines: 1400,
  /** Словарь BPE-800, обученного только на английской половине. */
  englishVocab: 493,
  /** 256 байтов алфавита и четыре специальных токена. */
  baseVocab: 260,
} as const;

export const SIZES = [
  { asked: 300, got: 300, whole: 6 },
  { asked: 800, got: 777, whole: 134 },
  { asked: 2000, got: 777, whole: 134 },
] as const;

/** Тестовые строки из ячейки метрик зошита: байты UTF-8 и токены. */
export const TEST_LINES = [
  { text: "Artificial intelligence is used in computer systems and networks.", bytes: 65, t300: 58, t800: 10 },
  { text: "Large language models process sequences of tokens.", bytes: 50, t300: 46, t800: 8 },
  { text: "Штучний інтелект використовується у комп'ютерних системах і мережах.", bytes: 127, t300: 69, t800: 11 },
  { text: "Великі мовні моделі обробляють послідовності токенів.", bytes: 100, t300: 49, t800: 7 },
  { text: "transformer_attention", bytes: 21, t300: 16, t800: 6 },
  { text: "192.168.1.100", bytes: 13, t300: 13, t800: 13 },
  { text: "🙂", bytes: 4, t300: 4, t800: 4 },
] as const;

/** Слова без пробела впереди: так их режет токенизатор, если подать отдельно. */
export const WORD_SPLITS = [
  { word: "intelligence", s300: "in | t | e | l | l | i | g | en | c | e", s800: "in | tell | igence" },
  { word: "tokenization", s300: "t | o | k | en | i | z | at | i | on", s800: "t | oken | ization" },
  { word: "мережах", s300: "\\xd0 | \\xbc | ер | е\\xd0 | \\xb6 | а | х", s800: "м | ере\\xd0 | \\xb6 | ах" },
  { word: "токенізація", s300: "т | о\\xd0 | \\xba | е | ні | \\xd0 | \\xb7 | а | \\xd1 | \\x86 | і | я", s800: "т | окені | зація" },
  { word: "transformer_attention", s300: "t | r | an | s | f | or | m | e | r | _ | at | t | en | t | i | on", s800: "t | ran | sformer | _ | at | tention" },
  { word: "192.168.1.100", s300: "1 | 9 | 2 | . | 1 | 6 | 8 | . | 1 | . | 1 | 0 | 0", s800: "1 | 9 | 2 | . | 1 | 6 | 8 | . | 1 | . | 1 | 0 | 0" },
] as const;

/** Вывод TOKENS из ячейки encode/decode зошита для BPE-800. */
export const SAMPLE_TOKENS =
  "['Ð¨ÑĤÑĥÑĩÐ½Ð¸Ð¹', 'ĠÑĸÐ½ÑĤÐµÐ»ÐµÐºÑĤ', 'ĠÐ¿', 'ÑĢ', 'Ð°', 'ÑĨ', 'Ñİ', 'ÑĶ', 'ĠÐ·', " +
  "'ĠÑĤÐµÐºÑģÑĤ', 'Ð¾Ð¼', '.', 'Ġ', 'Artificial', 'Ġintelligence', 'Ġ', 'w', 'or', 'ks', " +
  "'Ġ', 'w', 'ith', 'Ġtext', '.']";

/** Готовые ячейки по пунктам «Завдання для студента»; вставляются после ячеек зошита. */
export const TASK_CELLS: { item: number; title: string; code: string }[] = [
  {
    item: 1,
    title: "Не меньше двух размеров словаря",
    code: `# Третій розмір більший за кількість об'єднань, які корпус узагалі може дати.
tokenizer_2000 = train_hf_bpe(corpus_lines, vocab_size=2000)
pd.set_option("display.max_colwidth", None)

TOKENIZERS = [("BPE-300", tokenizer_300), ("BPE-800", tokenizer_800), ("BPE-2000", tokenizer_2000)]
for name, tok in TOKENIZERS:
    print(f"{name:9s} задано {int(name.split('-')[1]):5d}, отримано {tok.get_vocab_size():5d}")

# Чому зупинилося раніше: чи кожне слово корпусу після попереднього розбиття
# вже є цілим токеном словника.
pre = pre_tokenizers.ByteLevel(add_prefix_space=False)
pretokens = {w for line in corpus_lines for w, _ in pre.pre_tokenize_str(line)}
for name, tok in TOKENIZERS:
    whole = sum(tok.token_to_id(w) is not None for w in pretokens)
    print(f"{name:9s} слів корпусу, що стали одним токеном: {whole} з {len(pretokens)}")`,
  },
  {
    item: 2,
    title: "Английский и украинский текст",
    code: `# Пари речень ОДНАКОВОГО змісту – інакше різницю не можна віднести до мови.
# Замініть на свої; одну пару варто взяти зі словами, яких у корпусі немає.
PAIRS = [
    ("Artificial intelligence is used in computer systems and networks.",
     "Штучний інтелект використовується у комп'ютерних системах і мережах."),
    ("The router forwards packets between two networks.",
     "Маршрутизатор пересилає пакети між двома мережами."),
]

rows = []
for name, tok in TOKENIZERS:
    for en, uk in PAIRS:
        for lang, text in (("англ.", en), ("укр.", uk)):
            rows.append({"tokenizer": name, "мова": lang, "chars": len(text),
                         "utf8_bytes": len(text.encode("utf-8")),
                         "tokens": len(tok.encode(text).ids)})
lang_df = pd.DataFrame(rows)
lang_df.groupby(["tokenizer", "мова"], as_index=False)[["tokens", "utf8_bytes", "chars"]].sum().assign(
    bytes_per_token=lambda d: (d.utf8_bytes / d.tokens).round(3),
    chars_per_token=lambda d: (d.chars / d.tokens).round(3),
)`,
  },
  {
    item: 3,
    title: "Слова, которые токенизаторы режут по-разному",
    code: `def bytes_to_unicode():
    """Таблиця byte-level BPE (як у GPT-2): кожен байт – окремий символ."""
    bs = list(range(ord("!"), ord("~") + 1)) + list(range(ord("¡"), ord("¬") + 1)) + list(range(ord("®"), ord("ÿ") + 1))
    cs = bs[:]
    n = 0
    for b in range(256):
        if b not in bs:
            bs.append(b)
            cs.append(256 + n)
            n += 1
    return dict(zip(bs, map(chr, cs)))


BYTE_OF = {c: b for b, c in bytes_to_unicode().items()}


def pieces(tok, text):
    """Токени як текст; неповний байт розрізаної літери – як \\\\xd0."""
    return [bytes(BYTE_OF[c] for c in t).decode("utf-8", errors="backslashreplace")
            for t in tok.encode(text).tokens]


WORDS = ["intelligence", "tokenization", "мережах", "токенізація", "transformer_attention"]
pd.DataFrame([{"слово": w, **{name: " | ".join(pieces(tok, w)) for name, tok in TOKENIZERS}}
              for w in WORDS])`,
  },
  {
    item: 4,
    title: "Больший словарь — меньше токенов",
    code: `pd.DataFrame([{"tokenizer": name, "vocab": tok.get_vocab_size(),
               "tokens_on_pairs": sum(len(tok.encode(t).ids) for pair in PAIRS for t in pair)}
              for name, tok in TOKENIZERS])`,
  },
  {
    item: 5,
    title: "Цена большого словаря",
    code: `# Матриця вкладень і вихідний шар: по V x d параметрів кожен.
D_MODEL = 768   # прихований розмір GPT-2 small
vocabs = [(name, tok.get_vocab_size()) for name, tok in TOKENIZERS] + [("GPT-2", 50257)]
pd.DataFrame([{
    "tokenizer": name, "vocab": v,
    "embedding_params": v * D_MODEL,
    "embedding+lm_head_params": 2 * v * D_MODEL,
    "fp32_MB_untied": round(2 * v * D_MODEL * 4 / 2**20, 1),
    "fp16_MB_untied": round(2 * v * D_MODEL * 2 / 2**20, 1),
} for name, v in vocabs])`,
  },
  {
    item: 6,
    title: "Свои специальные токены",
    code: `MY_SPECIAL = ["<user>", "<assistant>", "<sep>"]
print("Додано:", tokenizer_800.add_special_tokens(MY_SPECIAL))
for t in SPECIAL_TOKENS + MY_SPECIAL:
    print(f"  {t:12s} id = {tokenizer_800.token_to_id(t)}")

dialog = "<user> Що таке токен? <sep> <assistant> Одиниця словника моделі."
enc = tokenizer_800.encode(dialog)
print("Токени:", enc.tokens)
print("ID:    ", enc.ids)
print("Назад: ", tokenizer_800.decode(enc.ids, skip_special_tokens=False))`,
  },
  {
    item: 7,
    title: "Сохранить в JSON и загрузить обратно",
    code: `path = save_dir / "bpe_800_special.json"
tokenizer_800.save(str(path))
reloaded = Tokenizer.from_file(str(path))

checks = [t for pair in PAIRS for t in pair] + [dialog] + test_texts
print("Файл:", path, f"({path.stat().st_size} байтів)")
print("<assistant> після завантаження: id =", reloaded.token_to_id("<assistant>"))
print("Кодування збігається:",
      all(reloaded.encode(t).ids == tokenizer_800.encode(t).ids for t in checks))`,
  },
  {
    item: 8,
    title: "Состав корпуса против размера словаря",
    code: `# Той самий розмір 800, але корпус лише з англійської половини.
english_lines = [l for l in corpus_lines if l.isascii()]
tokenizer_en_800 = train_hf_bpe(english_lines, vocab_size=800)
print("Словник англійського BPE-800:", tokenizer_en_800.get_vocab_size())

rows = []
for name, tok in (("двомовний", tokenizer_800), ("англійський", tokenizer_en_800)):
    for lang, idx in (("англ.", 0), ("укр.", 1)):
        texts = [pair[idx] for pair in PAIRS]
        tokens = sum(len(tok.encode(t).ids) for t in texts)
        nbytes = sum(len(t.encode("utf-8")) for t in texts)
        rows.append({"корпус": name, "мова": lang, "tokens": tokens,
                     "bytes_per_token": round(nbytes / tokens, 3)})
pd.DataFrame(rows)`,
  },
];

import type { GuideModule } from "./types";

/**
 * Штучний інтелект в комп'ютерних системах та мережах (Дзюба В.В.), ЛР2 чинної
 * програми: навчання малої Transformer-моделі з нуля на TinyStories з
 * токенізатором GPT-2. Робота виконується в Colab або локально (GPU);
 * результати у findings отримано запуском (RTX 4080, 3,32 млн параметрів).
 */

const SRC = "Штучний інтелект в комп'ютерних системах та мережах, ЛР2 (Дзюба В.В.)";

export const AI_GUIDES: GuideModule[] = [
  {
    slug: "ai-transformer",
    intro:
      { uk: "ЛР2 чинної програми: побудувати й навчити малу Transformer-модель з нуля на корпусі коротких історій TinyStories (токенізатор GPT-2). Сторінка дає порядок виконання, готові комірки коду, склад звіту і результати, отримані запуском, щоб було з чим звірити свій прогін.", ru: "ЛР2 действующей программы: построить и обучить малую Transformer-модель с нуля на корпусе коротких историй TinyStories (токенизатор GPT-2). Страница даёт порядок выполнения, готовые ячейки кода, состав отчёта и результаты, полученные запуском, чтобы было с чем сверить свой прогон." },
    guide: {
      source: `${SRC}`,
      goals: [
        "Побудувати малу Transformer-модель з нуля (ембединги, шари уваги з причинною маскою, вихідна проєкція).",
        "Навчити її на TinyStories з токенізатором GPT-2 і простежити Train loss, Eval loss, Perplexity, Learning rate.",
        "Порівняти генерацію тексту до і після навчання.",
        "Змінити один параметр навчання і коротко порівняти результати (п.5 завдання).",
      ],
      steps: [
        { title: "1. Бібліотеки", commands: ["%pip -q install -U transformers datasets accelerate safetensors"], body: "У Colab GPU увімкнути в Runtime > Change runtime type > GPU. Локально потрібен torch з CUDA." },
        { title: "2. Токенізатор і дані", commands: ['tokenizer = AutoTokenizer.from_pretrained("gpt2")', 'tokenizer.pad_token = tokenizer.eos_token', 'stream = load_dataset("roneneldan/TinyStories", split="train", streaming=True)', 'raw = Dataset.from_list(list(stream.take(600)))', 'split = raw.train_test_split(test_size=0.1, seed=42)'], body: "600 історій потоково, поділ 9:1 - 540 на навчання, 60 на перевірку. Переглянути 1-2 приклади TinyStories (п.1 завдання)." },
        { title: "3. Токенізація", body: "Довжина MAX_LEN = 64. padding='max_length', truncation=True. У labels позиції доповнення замінити на -100, щоб вони не враховувались у втратах." },
        { title: "4. Модель", body: "TinyConfig: vocab = розмір словника токенізатора, max_len 64, d_model 64, 4 голови уваги, 2 шари. Два TransformerEncoderLayer (norm_first, GELU, dim_feedforward 256), причинна (трикутна) маска уваги, маска доповнення, вихідний Linear зі спільною вагою з матрицею ембедингів (weight tying). Виходить близько 3,32 млн параметрів." },
        { title: "5. Генерація до навчання", commands: ['print(generate_text(model, tokenizer, prompt="Once upon a time"))'], body: "З ненавченою моделлю (випадкові ваги) - на виході безладний набір токенів (п.2 завдання)." },
        { title: "6. Параметри навчання", commands: ["LEARNING_RATE = 3e-4", "BATCH_SIZE = 16", "MAX_STEPS = 1750", "WEIGHT_DECAY = 0.01", "WARMUP_STEPS = 15", 'LR_SCHEDULER = "cosine"', "EVAL_STEPS = 30"] },
        { title: "7. Навчання", commands: ["trainer = Trainer(model=model, args=args, train_dataset=train_ds, eval_dataset=eval_ds)", "train_result = trainer.train()", "metrics = trainer.evaluate()", 'perplexity = math.exp(metrics["eval_loss"])'], body: "Оптимізатор AdamW, розклад cosine з розігрівом. Perplexity = exp(eval_loss)." },
        { title: "8. Графіки", body: "Побудувати три графіки з trainer.state.log_history: Train і Eval loss від кроку; Learning rate від кроку; Perplexity від кроку (п.3 завдання)." },
        { title: "9. Генерація після навчання", commands: ['print(generate_text(model, tokenizer, prompt="He quickly ran out of"))'], body: "Текст усе ще недосконалий, але вже впізнавано схожий на прості історії корпусу (п.4 завдання)." },
        { title: "10. Збереження моделі", commands: ['model.save_pretrained("TinyTransformerModel", safe_serialization=True)', 'tokenizer.save_pretrained("TinyTransformerModel")'], body: "Зберігаються config.json, model.safetensors і файли токенізатора. Окремим ноутбуком модель можна завантажити назад і генерувати." },
        { title: "11. Зміна параметра навчання (п.5)", commands: ["# повторити навчання зі зміненим одним параметром, напр.", "learning_rate = 1e-3", "# порівняти Perplexity і криву Eval loss двох прогонів"], body: "Змінюється рівно один параметр навчання (швидкість навчання). Порівнюються перплексія і криві перевірних втрат." },
      ],
      report: [
        "Постановка задачі і склад даних (TinyStories, 540/60, довжина 64).",
        "Опис архітектури моделі (ембединги, 2 шари уваги, причинна маска, weight tying, число параметрів).",
        "Параметри навчання (таблиця) і графіки Train/Eval loss, Learning rate, Perplexity.",
        "Генерація до і після навчання (приклади тексту).",
        "Порівняння зі зміною одного параметра навчання (таблиця + графік перевірних втрат).",
        "Повні висновки за кожним пунктом.",
      ],
      screenshots: [
        { what: "Приклади TinyStories і повідомлення про розмір train/validation", how: "Вивід комірки завантаження даних." },
        { what: "Генерація до навчання (безладний текст)", how: "Вивід комірки генерації з ненавченою моделлю." },
        { what: "Графіки Train/Eval loss, Learning rate, Perplexity", how: "Вивід комірки з matplotlib." },
        { what: "Генерація після навчання", how: "Вивід комірки генерації з навченою моделлю." },
        { what: "Порівняння двох швидкостей навчання", how: "Графік перевірних втрат двох прогонів." },
      ],
      questions: [
        "З яких частин складається Transformer-модель і за що відповідає причинна маска?",
        "Що таке Perplexity і як вона пов'язана з Eval loss?",
        "Чому до навчання модель видає безладний текст?",
        "Як зміна швидкості навчання впливає на перенавчання?",
      ],
    },
    findings: [
      { title: "Модель", body: "3 320 640 параметрів: ембединги 50257 x 64, позиційні 64 x 64, два шари TransformerEncoderLayer (norm_first, 4 голови, FFN 256), вихідний Linear зі спільною вагою. Корпус TinyStories: 540 історій на навчання, 60 на перевірку, довжина 64 токени." },
      { title: "Базовий прогін (LR = 3e-4)", body: "Після 1750 кроків: втрати на навчанні 4,79, перевірні втрати 4,53, перплексія 93,0. Перевірні втрати плавно спадають з ~10 до 4,53 і виходять на полицю - перенавчання немає." },
      { title: "Генерація до і після", body: "До навчання - безладний набір токенів («Once upon a time perennlington Prosigning protagonist receiveboarding ...»). Після навчання - упізнавано схоже на TinyStories: короткі речення, прості слова й мотиви (woods, sky, adventure, play), звороти «One day», «She was very excited», хоча зв'язного сюжету модель ще не будує." },
      { title: "Зміна параметра навчання (п.5)", body: "Збільшення швидкості навчання з 3e-4 до 1e-3: втрати на навчанні падають сильніше (3,22 проти 4,79), але перевірні втрати гіршають (4,86 проти 4,53), а перплексія зростає з 93 до 129. Крива перевірних втрат за LR = 1e-3 досягає мінімуму (~4,4) за перші ~450 кроків, а потім зростає - ознака перенавчання. Висновок: менша швидкість навчання дає краще узагальнення." },
      { title: "Середовище", body: "Навчання на GPU (CUDA), ~20-24 с на прогін для цієї моделі. Потрібні torch з CUDA, transformers, datasets, accelerate і доступ до Hugging Face Hub (датасет TinyStories, токенізатор GPT-2)." },
    ],
  },
];

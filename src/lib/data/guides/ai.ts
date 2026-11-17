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
  {
    slug: "ai-stentor",
    intro:
      { uk: "ЛР4 чинної програми (зошит LR4_Stentor12M_pretrain_for_Unsloth_Studio, у самому зошиті - «ЛР3»): модель Llama з конфігурації StentorLabs/Stentor-12M з випадковими вагами, pretraining на TinyStories, чекпойнт Hugging Face і повне донавчання на рецептах (Alpaca) в Unsloth Studio. Сторінка дає порядок виконання, параметри, підводні камені Studio і результати, отримані запуском.", ru: "ЛР4 действующей программы (зошит LR4_Stentor12M_pretrain_for_Unsloth_Studio, в самом зошите - «ЛР3»): модель Llama из конфигурации StentorLabs/Stentor-12M со случайными весами, pretraining на TinyStories, чекпойнт Hugging Face и полное дообучение на рецептах (Alpaca) в Unsloth Studio. Страница даёт порядок выполнения, параметры, подводные камни Studio и результаты, полученные запуском." },
    guide: {
      source: "Штучний інтелект в комп'ютерних системах та мережах, ЛР4 (Дзюба В.В.)",
      goals: [
        "Створити модель Llama з конфігурації Stentor-12M з випадковими вагами (from_config, без готових ваг).",
        "Виконати pretraining на TinyStories, оцінити Train/Eval loss і Perplexity, порівняти генерацію до і після.",
        "Зберегти стандартний чекпойнт Hugging Face і перевірити повторне завантаження.",
        "Підготувати SFT-набір рецептів у форматі Alpaca (JSONL).",
        "Завантажити чекпойнт в Unsloth Studio і виконати повне донавчання (Full fine-tune) на рецептах.",
        "Перевірити генерацію рецептів і підказку «Once upon a time» після SFT, зберегти фінальну модель для ЛР з RAG.",
      ],
      steps: [
        { title: "1. Версії бібліотек", commands: ["%pip -q install accelerate safetensors sentencepiece matplotlib", '%pip install -q --upgrade "transformers==4.57.1" "datasets==4.8.5" "pyarrow>=21,<24" "protobuf==6.33.6" "sentencepiece==0.2.2"'], body: "Версії закріплені не випадково: у transformers 5.x у режимі Jupyter trainer.evaluate() після trainer.train() падає з «on_train_begin must be called before on_evaluate» (NotebookProgressCallback). Локально - окреме середовище саме з цими версіями." },
        { title: "2. Config і токенізатор", commands: ['BASE_MODEL = "StentorLabs/Stentor-12M"', "tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL)", "config = AutoConfig.from_pretrained(BASE_MODEL)", "model = AutoModelForCausalLM.from_config(config)"], body: "LlamaForCausalLM: словник 32 768, hidden 192, MLP 576, 12 шарів, 3 голови (3 KV), контекст 512. Реально 12 047 040 параметрів (46,0 МіБ у FP32); матриця ембедингів 32 768 x 192 спільна з вихідним шаром і становить понад половину моделі." },
        { title: "3. TinyStories і токенізація", commands: ['stream = load_dataset("roneneldan/TinyStories", split="train", streaming=True)', "raw = Dataset.from_list(list(stream.take(2500)))", "split = raw.train_test_split(test_size=0.10, seed=42)"], body: "2250 історій на навчання, 250 на перевірку. MAX_LEN = 128, до тексту додається EOS, позиції доповнення в labels = -100." },
        { title: "4. Генерація до навчання", body: "Випадкові ваги - випадкові токени словника, серед них і кириличні (словник багатомовний)." },
        { title: "5. Pretraining", commands: ["BATCH_SIZE = 16", "MAX_STEPS = 1500   # у markdown: 100 для тесту, 500 рекомендовано", "LEARNING_RATE = 8e-4", "WARMUP_STEPS = 20", "EVAL_STEPS = 100", 'lr_scheduler_type="cosine", weight_decay=0.01, bf16 якщо GPU >= 8.0'], body: "На RTX 4080 SUPER 1500 кроків - близько 90 с. Після кроку ~800 перевірні втрати починають рости (понад 10 проходів по 2250 історіях) - для звіту варто прокоментувати як перенавчання." },
        { title: "6. Чекпойнт і повторне завантаження", commands: ['model.save_pretrained(MODEL_DIR, safe_serialization=True)', "tokenizer.save_pretrained(MODEL_DIR)", "test_model = AutoModelForCausalLM.from_pretrained(MODEL_DIR)"], body: "У теці: model.safetensors (46 МБ), config.json, generation_config.json, tokenizer.json, tokenizer.model, tokenizer_config.json, special_tokens_map.json, chat_template.jinja. ZIP ~45 МБ." },
        { title: "7. Рецепти в Alpaca", commands: ['recipes_raw = load_dataset("Shengtao/recipe", split="train[:1500]")', '{"instruction": f"How do I make {title}?", "input": "", "output": "Recipe: ...\\n\\nIngredients:\\n...\\n\\nDirections:\\n..."}'], body: "Поділ 0,10 (seed 42): recipes_train.jsonl - 1350 рядків, recipes_eval.jsonl - 150." },
        { title: "8. Unsloth Studio: встановлення", commands: ["curl -fsSL https://unsloth.ai/install.sh | sh", "unsloth studio -p 8888   # http://127.0.0.1:8888, пароль задається при першому вході"], body: "Встановлюється в ~/.unsloth/studio (свою теку - змінною UNSLOTH_STUDIO_HOME після пайпа). Потрібна відеокарта NVIDIA; на WSL драйвер ставиться у Windows." },
        { title: "9. Studio: модель і дані", body: "Train > Model: у пошуку видно StentorLabs/Stentor-12M (вкладка Hugging Face), але для SFT на вкладці On Device вставити шлях до своєї теки Stentor12M_Stories_Pretrained > «Use as local path». Method: Full fine-tune. Dataset: завантажити recipes_train.jsonl, Eval dataset: recipes_eval.jsonl; Advanced > Target Format: Alpaca." },
        { title: "10. Studio: параметри SFT", commands: ["Context 256 (ввести вручну, у списку мінімум 512)", "Epochs 3", "Learning Rate 5e-5", "Batch Size 8, Grad Accum Steps 1", "Weight Decay 0.01"], body: "Обов'язково: Training Hyperparameters > Memory > зняти «Assistant completions only». Інакше навчання падає з «train_on_responses_only masked every label to -100 ... '### Response:' was not found»: токенізатор SentencePiece усередині тексту ріже маркер інакше, ніж окремо. Кнопка Save YAML зберігає конфігурацію для звіту." },
        { title: "11. Studio: чат", body: "Compare in Chat або New chat з дообученою моделлю. Вимкнути Search, Tools і Skills (вони додають у запит ~1400 токенів опису інструментів), Run settings: Max Seq Length 512 (потім Reload model), Max Tokens ~200 - інакше «input length + max_new_tokens 4096 exceeds the maximum sequence length». Кожен запит - у новому чаті: історія швидко вичерпує 512 токенів." },
        { title: "12. Експорт фінальної моделі", body: "Export > Fine-tuned > Training run і checkpoint > Merged Model, 16-bit > Save Locally (шлях до своєї теки) > Start Export. Виходить model.safetensors ~23 МБ (FP16) + токенізатор: модель для наступної ЛР з RAG." },
      ],
      report: [
        "Параметри архітектури Stentor-12M і реальна кількість параметрів.",
        "Генерація до навчання.",
        "Pretraining на TinyStories: параметри, графіки Train/Eval loss і Perplexity.",
        "Генерація після pretraining.",
        "Структура чекпойнта Hugging Face і повторне завантаження.",
        "Завантаження чекпойнта в Unsloth Studio, Full fine-tuning на рецептах (знімки Studio).",
        "Генерація рецептів після SFT і повторна перевірка «Once upon a time».",
        "Збереження фінальної моделі для ЛР з RAG; висновки.",
      ],
      screenshots: [
        { what: "Пошук StentorLabs/Stentor-12M і вибір локальної теки в Studio", how: "Train > Model > Hugging Face / On Device." },
        { what: "Метод, набори даних і параметри SFT", how: "Train > Configure (Full fine-tune, Alpaca, 256, 3 epochs, 5e-5, 8, 1, 0.01)." },
        { what: "Завершене навчання з кривими loss", how: "Train > Current Run після «Training completed»." },
        { what: "Відповіді на «How do I make pancakes?», «How do I make tomato soup?», «Once upon a time»", how: "Chat, кожен запит у новому чаті." },
        { what: "Експорт моделі", how: "Export > Merged Model > Export finished successfully." },
      ],
      questions: [],
    },
    findings: [
      { title: "Pretraining", body: "12 047 040 параметрів. 1500 кроків за 90 с (RTX 4080 SUPER, bf16): втрати на навчанні з 10,0 до ~1,6, перевірні - мінімум 2,98 на кроці 800, наприкінці 3,16; перплексія 23,7 (мінімум 19,8). Генерація після: «Once upon a time there was a boy named Joe. He was three years old and loved to explore. One day, Andy decided to explore a big, pretty garden...»." },
      { title: "SFT з параметрами зошита (LR 5e-5)", body: "507 кроків за ~1,5 хв. Стартові втрати на рецептах 9,8 - це не помилка завантаження: модель на TinyStories не бачила ні «###», ні кулінарної лексики (та сама модель на казках дає 3,19). Наприкінці train 5,2, eval Studio 5,06. Рецептів модель не пише: відповідь - історія з окремими словами bowl, butter, cups." },
      { title: "SFT з LR 5e-4 (додатковий дослід)", body: "Втрати 1,62 (train і eval Studio). Відповідь у структурі набору: «Recipe: ... Ingredients: 1 cup butter, softened; ... Directions: ... Preheat oven to 350 degrees F (175 degrees C).» Зміст ще не відповідає назві страви - 12 млн параметрів вистачає на форму рецепта, а не на зв'язок назви з інгредієнтами." },
      { title: "Катастрофічне забування", body: "Втрати на перевірній частині TinyStories (loss / перплексія): після pretraining 3,19 / 24,3; SFT 5e-5 - 3,32 / 27,7; SFT 5e-4 - 4,99 / 147. На рецептах: 9,88 / 19 450; 5,22 / 185; 1,77 / 5,9. На «Once upon a time» модель після SFT 5e-4 пише рецепт або шаблон Alpaca. Зменшують забування суміш старих і нових даних або LoRA замість повного донавчання." },
      { title: "Чат Studio і шаблон", body: "Studio навчає на шаблоні Alpaca («Below is an instruction ... ### Instruction: ... ### Input: ... ### Response:»), а в чаті обгортає запит у chat template токенізатора, тому відповіді в чаті слабші, ніж при подачі запиту в шаблоні Alpaca через transformers." },
    ],
  },
];

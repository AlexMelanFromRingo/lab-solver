/**
 * ЛР3 по ИТ в управлении: обучение классификатора изображений в Lobe.
 *
 * Все пути ниже пройдены на самом деле: Lobe 0.11.714.2 — в Windows Sandbox
 * (штатно, с GPU) и под wine в WSL (с латками, на процессоре), PyTorch и
 * TensorFlow — на том же наборе из 360 изображений. Цифры результатов берутся
 * не отсюда, а из public/it/index.json: его собирает скрипт выгрузки из
 * рабочего репозитория курса по результатам прогонов.
 */

import type { LabStep } from "@/components/lab-steps";
import type { Loc } from "@/lib/i18n";

export interface LobeGuide {
  id: string;
  title: Loc;
  summary: Loc;
  steps: LabStep[];
  pitfalls: Loc[];
}

export const DATASET = {
  source: { uk: "Imagenette (fast.ai) — підмножина ImageNet, менша сторона 160 пікселів", ru: "Imagenette (fast.ai) — подмножина ImageNet, меньшая сторона 160 пикселей" },
  classes: ["собака", "церква", "сміттєвоз", "парашут"],
  splits: [
    { name: "навчання", perClass: 40, role: { uk: "перше навчання", ru: "первое обучение" } },
    { name: "доповнення", perClass: 40, role: { uk: "поліпшення моделі (п. 5.4)", ru: "улучшение модели (п. 5.4)" } },
    { name: "перевірка", perClass: 10, role: { uk: "перевірка на нових зображеннях (п. 5.3)", ru: "проверка на новых изображениях (п. 5.3)" } },
  ],
};

export const GUIDES: LobeGuide[] = [
  {
    id: "windows",
    title: { uk: "Lobe у Windows", ru: "Lobe в Windows" },
    summary:
      { uk: "Основний шлях: так і зроблено звіт. Перевірявся у Windows Sandbox на Windows 11 — усередині це звичайна Windows, тому кроки ті самі, що на своєму комп'ютері.", ru: "Основной путь: так и сделан отчёт. Проверялся в Windows Sandbox на Windows 11 — внутри это обычная Windows, поэтому шаги те же, что на своём компьютере." },
    steps: [
      {
        title: { uk: "Встановити Lobe", ru: "Установить Lobe" },
        body:
          { uk: "Запустити Lobe.exe з архіву викладача (файл підписаний Microsoft Corporation) і пройти майстер: папка установки, копіювання, заразом ставиться Microsoft Visual C++ Runtime. На останньому кроці лишити галочку Run Lobe.", ru: "Запустить Lobe.exe из архива преподавателя (файл подписан Microsoft Corporation) и пройти мастер: папка установки, копирование, заодно ставится Microsoft Visual C++ Runtime. На последнем шаге оставить галочку Run Lobe." },
      },
      {
        title: { uk: "Перший запуск", ru: "Первый запуск" },
        body:
          { uk: "Continue — згода з ліцензією, Don't Share — відмова від надсилання аналітики, Get Started. Брандмауер Windows двічі спитає доступ до мережі для Lobe і Lobe Backend — дозволити: програма працює через локальний сервер.", ru: "Continue — согласие с лицензией, Don't Share — отказ от отправки аналитики, Get Started. Брандмауэр Windows дважды спросит доступ к сети для Lobe и Lobe Backend — разрешить: программа работает через локальный сервер." },
      },
      {
        title: { uk: "Імпортувати розмічений набір", ru: "Импортировать размеченный набор" },
        body:
          { uk: "Клацнути по Untitled і назвати проєкт. Import → Dataset → папка «навчання» → Label Using Folder Name: мітки беруться з назв підпапок. Навчання починається саме і займає секунди.", ru: "Щёлкнуть по Untitled и назвать проект. Import → Dataset → папка «навчання» → Label Using Folder Name: метки берутся из названий подпапок. Обучение начинается само и занимает секунды." },
      },
      {
        title: { uk: "Перевірити на нових зображеннях", ru: "Проверить на новых изображениях" },
        body:
          { uk: "Use → Images → import, картинка з папки «перевірка». Під картинкою — прогноз і дві кнопки. ⊘ і правильна мітка додають картинку в набір, і модель донавчається. Усі 40 картинок разом перевіряє lr3_validate.ps1 через локальний API.", ru: "Use → Images → import, картинка из папки «перевірка». Под картинкой — прогноз и две кнопки. ⊘ и правильная метка добавляют картинку в набор, и модель дообучается. Все 40 картинок разом проверяет lr3_validate.ps1 через локальный API." },
      },
      {
        title: { uk: "Перейти на режим точності", ru: "Перейти на режим точности" },
        body:
          { uk: "Меню ☰ → Project Settings → Optimize for Accuracy → Reset Training. Замість MobileNetV2 Lobe бере ResNet50V2 і навчає модель заново.", ru: "Меню ☰ → Project Settings → Optimize for Accuracy → Reset Training. Вместо MobileNetV2 Lobe берёт ResNet50V2 и обучает модель заново." },
      },
      {
        title: { uk: "Поліпшити модель", ru: "Улучшить модель" },
        body:
          { uk: "Import → Dataset → папка «доповнення», потім меню ☰ → Optimize Model — довше навчання (на відеокарті — секунди).", ru: "Import → Dataset → папка «доповнення», затем меню ☰ → Optimize Model — более длинное обучение (на видеокарте — секунды)." },
      },
      {
        title: { uk: "Експортувати", ru: "Экспортировать" },
        body:
          { uk: "Use → Export. Нижче шаблонів застосунків — Model Files: TensorFlow (SavedModel), TensorFlow Lite, TensorFlow.js, ONNX. Lobe Connect — локальний API, поки відкритий Lobe.", ru: "Use → Export. Ниже шаблонов приложений — Model Files: TensorFlow (SavedModel), TensorFlow Lite, TensorFlow.js, ONNX. Lobe Connect — локальный API, пока открыт Lobe." },
        commands: [
          "# локальний API: POST, тіло — JSON",
          'http://localhost:38101/v1/predict/<id проєкту>   {"image": "<base64>"}',
        ],
      },
    ],
    pitfalls: [
      { uk: "У режимі Optimize for Speed донавчання після виправлення однієї мітки ламає модель: 91 % → 34 % на навчальних картинках і 14 з 40 на перевірці, майже все йде у «сміттєвоз». Лікується переходом на Optimize for Accuracy — модель навчається заново.", ru: "В режиме Optimize for Speed дообучение после исправления одной метки ломает модель: 91 % → 34 % на обучающих картинках и 14 из 40 на проверке, почти всё уходит в «сміттєвоз». Лечится переходом на Optimize for Accuracy — модель обучается заново." },
      { uk: "Після додавання папки «доповнення» Lobe зупиняє навчання надто рано: 89 % і 37 з 40. Повертає 99 % і 40 з 40 команда Optimize Model.", ru: "После добавления папки «доповнення» Lobe останавливает обучение слишком рано: 89 % и 37 из 40. Возвращает 99 % и 40 из 40 команда Optimize Model." },
      { uk: "Відсоток на лівій панелі рахується за навчальними картинками. Оцінювати модель потрібно на картинках, яких вона не бачила, — для цього папка «перевірка».", ru: "Процент на левой панели считается по обучающим картинкам. Оценивать модель нужно на картинках, которых она не видела, — для этого папка «перевірка»." },
      { uk: "Мітку при виправленні краще вибирати з підказки: при введенні з клавіатури і натисканні ADD одного разу збереглася мітка без останньої літери, і в наборі з'явився зайвий клас.", ru: "Метку при исправлении лучше выбирать из подсказки: при вводе с клавиатуры и нажатии ADD однажды сохранилась метка без последней буквы, и в наборе появился лишний класс." },
      { uk: "У вкладці Use кнопка import є тільки на порожньому екрані: щоб відкрити наступну картинку, переключитися на Label і назад.", ru: "Во вкладке Use кнопка import есть только на пустом экране: чтобы открыть следующую картинку, переключиться на Label и обратно." },
      { uk: "Графіків точності і втрат, про які пише методичка, у Lobe 0.11 немає — тільки частка правильно розпізнаних зображень.", ru: "Графиков точности и потерь, о которых пишет методичка, в Lobe 0.11 нет — только доля верно распознанных изображений." },
    ],
  },
  {
    id: "sandbox",
    title: { uk: "Lobe у Windows Sandbox", ru: "Lobe в Windows Sandbox" },
    summary:
      { uk: "Щоб не ставити Lobe в основну систему: одноразова Windows, яка стирається при закритті вікна. Є в Windows 10/11 Pro, Enterprise і Education. Відеокарта пробрасується, Lobe рахує на ній через DirectML.", ru: "Чтобы не ставить Lobe в основную систему: одноразовая Windows, которая стирается при закрытии окна. Есть в Windows 10/11 Pro, Enterprise и Education. Видеокарта пробрасывается, Lobe считает на ней через DirectML." },
    steps: [
      {
        title: { uk: "Увімкнути компонент", ru: "Включить компонент" },
        body: { uk: "Від адміністратора, потім перезавантаження.", ru: "От администратора, затем перезагрузка." },
        commands: ["dism /online /enable-feature /featurename:Containers-DisposableClientVM /all"],
      },
      {
        title: { uk: "Підготувати спільну папку", ru: "Подготовить общую папку" },
        body:
          { uk: "Інсталятор, картинки, місце під скриншоти й експорт. Усе, що лишиться тільки всередині пісочниці, зникне при її закритті.", ru: "Установщик, картинки, место под скриншоты и экспорт. Всё, что останется только внутри песочницы, пропадёт при её закрытии." },
      },
      {
        title: { uk: "Запустити Lobe.wsb", ru: "Запустить Lobe.wsb" },
        body:
          { uk: "У файлі: vGPU Enable, 12 ГБ пам'яті, спільна папка. Далі — як у звичайній Windows. У журналі Lobe Backend видно «DirectML: creating device on adapter 0» з іменем відеокарти.", ru: "В файле: vGPU Enable, 12 ГБ памяти, общая папка. Дальше — как в обычной Windows. В журнале Lobe Backend видно «DirectML: creating device on adapter 0» с именем видеокарты." },
      },
      {
        title: { uk: "Вимкнути компонент, коли не потрібен", ru: "Выключить компонент, когда не нужен" },
        commands: ["dism /online /disable-feature /featurename:Containers-DisposableClientVM"],
      },
    ],
    pitfalls: [
      { uk: "У Windows Home пісочниці немає — лишається звичайна установка або wine.", ru: "В Windows Home песочницы нет — остаётся обычная установка или wine." },
      { uk: "Файли, збережені не в спільну папку, зникають разом із пісочницею: експорт моделі і скриншоти одразу складати туди.", ru: "Файлы, сохранённые не в общую папку, исчезают вместе с песочницей: экспорт модели и скриншоты сразу складывать туда." },
    ],
  },
  {
    id: "wine",
    title: { uk: "Lobe під wine (Linux, WSL)", ru: "Lobe под wine (Linux, WSL)" },
    summary:
      { uk: "Працює, але не штатно: три правки у файлах програми і тільки процесор. Детальна інструкція з правками — lobe-wine.md у файлах роботи.", ru: "Работает, но не штатно: три правки в файлах программы и только процессор. Подробная инструкция с правками — lobe-wine.md в файлах работы." },
    steps: [
      {
        title: { uk: "Поставити wine", ru: "Поставить wine" },
        commands: [
          "sudo dpkg --add-architecture i386 && sudo apt update",
          "sudo apt install --install-recommends wine64 wine32:i386",
        ],
      },
      {
        title: { uk: "Встановити Lobe в окремий префікс", ru: "Установить Lobe в отдельный префикс" },
        commands: ["export WINEPREFIX=$HOME/.wine-lobe", "wineboot -u && wine Lobe.exe"],
      },
      {
        title: { uk: "Виправити три файли і шрифти", ru: "Поправить три файла и шрифты" },
        body:
          { uk: "Вимкнути телеметрію, не вважати EPIPE фатальною помилкою, не чекати сигналу ready від дочірніх процесів довше 20 с. Для кирилиці — Segoe UI і Arial з Windows і підміна шрифтів у реєстрі.", ru: "Отключить телеметрию, не считать EPIPE фатальной ошибкой, не ждать сигнала ready от дочерних процессов дольше 20 с. Для кириллицы — Segoe UI и Arial из Windows и подмена шрифтов в реестре." },
      },
      {
        title: { uk: "Запускати без GPU", ru: "Запускать без GPU" },
        commands: [
          'export WINEDLLOVERRIDES="nvcuda=d;d3d12=d;d3d12core=d"',
          "export CUDA_VISIBLE_DEVICES=-1 DML_VISIBLE_DEVICES=-1",
          'cd "$WINEPREFIX/drive_c/Program Files/Lobe" && wine Lobe.exe --disable-gpu --no-sandbox',
        ],
      },
    ],
    pitfalls: [
      { uk: "Одразу після запуску вікно «Unexpected exception … write EPIPE»: рвуться канали між процесами Node — потрібні перші дві правки.", ru: "Сразу после запуска окно «Unexpected exception … write EPIPE»: рвутся каналы между процессами Node — нужны первые две правки." },
      { uk: "Заставка висить, у журналі «Start: Timed out» — сигнал ready від серверної частини не доходить, потрібна третя правка.", ru: "Заставка висит, в журнале «Start: Timed out» — сигнал ready от серверной части не доходит, нужна третья правка." },
      { uk: "Lobe.backend.exe падає з «divide by zero» у directml.dll — DirectML під wine не працює, його і CUDA потрібно вимкнути.", ru: "Lobe.backend.exe падает с «divide by zero» в directml.dll — DirectML под wine не работает, его и CUDA нужно отключить." },
      { uk: "Пакет wine перехоплює запуск exe-файлів, і з WSL перестають запускатися програми Windows (powershell.exe та інші) з «Exec format error». Реєстрацію WSLInterop потрібно повернути.", ru: "Пакет wine перехватывает запуск exe-файлов, и из WSL перестают запускаться программы Windows (powershell.exe и другие) с «Exec format error». Регистрацию WSLInterop нужно вернуть." },
    ],
  },
  {
    id: "pytorch",
    title: "PyTorch",
    summary:
      { uk: "Та сама робота кодом: ті самі папки й етапи. Основа з вагами ImageNet заморожена, навчається тільки новий вихідний шар на чотири класи — рівно те, що робить Lobe.", ru: "Та же работа кодом: те же папки и этапы. Основа с весами ImageNet заморожена, обучается только новый выходной слой на четыре класса — ровно то, что делает Lobe." },
    steps: [
      {
        title: { uk: "Оточення", ru: "Окружение" },
        commands: [
          "python3 -m venv .venv",
          ".venv/bin/pip install -r pytorch/requirements.txt",
        ],
      },
      {
        title: { uk: "Зібрати набір зображень", ru: "Собрать набор изображений" },
        body: { uk: "Завантажує архів Imagenette (близько 94 МБ) і розкладає 360 потрібних файлів по папках.", ru: "Скачивает архив Imagenette (около 94 МБ) и раскладывает 360 нужных файлов по папкам." },
        commands: [".venv/bin/python make_dataset.py"],
      },
      {
        title: { uk: "Запустити", ru: "Запустить" },
        body:
          { uk: "Чотири етапи: MobileNetV2 на «навчання»; ResNet50 на «навчання»; ResNet50 на «навчання» і «доповнення»; донавчання останнього блока ResNet50. Після кожного — перевірка на «перевірка». Результати — results.json, модель — export/model.pt (TorchScript).", ru: "Четыре этапа: MobileNetV2 на «навчання»; ResNet50 на «навчання»; ResNet50 на «навчання» и «доповнення»; дообучение последнего блока ResNet50. После каждого — проверка на «перевірка». Результаты — results.json, модель — export/model.pt (TorchScript)." },
        commands: [".venv/bin/python pytorch/lr3_pytorch.py"],
      },
    ],
    pitfalls: [
      { uk: "У torchvision немає ResNet50V2, яку Lobe бере в режимі точності, — замість неї ResNet50.", ru: "В torchvision нет ResNet50V2, которую Lobe берёт в режиме точности, — вместо неё ResNet50." },
      { uk: "Поки навчається вихідний шар, нормалізація пакетів основи лишається в режимі eval, щоб її статистика з ImageNet не збивалася на маленьких пакетах.", ru: "Пока обучается выходной слой, нормализация пакетов основы остаётся в режиме eval, чтобы её статистика с ImageNet не сбивалась на маленьких пакетах." },
      { uk: "Без відеокарти все працює на процесорі, тільки довше.", ru: "Без видеокарты всё работает на процессоре, только дольше." },
    ],
  },
  {
    id: "tensorflow",
    title: "TensorFlow",
    summary:
      { uk: "Та сама робота на Keras з тими самими основами, що в Lobe: MobileNetV2 і ResNet50V2. Модель вивантажується так само, як із Lobe: SavedModel і TensorFlow Lite.", ru: "Та же работа на Keras с теми же основами, что у Lobe: MobileNetV2 и ResNet50V2. Модель выгружается так же, как из Lobe: SavedModel и TensorFlow Lite." },
    steps: [
      {
        title: { uk: "Оточення", ru: "Окружение" },
        body: { uk: "tensorflow[and-cuda] підтягує бібліотеки CUDA сам, окремо їх ставити не потрібно.", ru: "tensorflow[and-cuda] подтягивает библиотеки CUDA сам, отдельно их ставить не нужно." },
        commands: [
          "python3 -m venv .venv",
          ".venv/bin/pip install -r tensorflow/requirements.txt",
        ],
      },
      {
        title: { uk: "Зібрати набір зображень", ru: "Собрать набор изображений" },
        commands: [".venv/bin/python make_dataset.py"],
      },
      {
        title: { uk: "Запустити", ru: "Запустить" },
        body:
          { uk: "Етапи ті самі, що в PyTorch, тільки з ResNet50V2. Результати — results.json, модель — export/saved_model і export/model.tflite.", ru: "Этапы те же, что в PyTorch, только с ResNet50V2. Результаты — results.json, модель — export/saved_model и export/model.tflite." },
        commands: [".venv/bin/python tensorflow/lr3_tensorflow.py"],
      },
    ],
    pitfalls: [
      { uk: "Основи Keras чекають значення від −1 до 1: нормалізацію робить preprocess_input відповідної мережі, її не можна пропускати.", ru: "Основы Keras ждут значения от −1 до 1: нормализацию делает preprocess_input соответствующей сети, её нельзя пропускать." },
      { uk: "Шари випадкових викривлень (RandomFlip, RandomZoom) не можна лишати у вивантажуваній моделі: у конвертера TFLite немає їх операцій (StatelessRandomUniformV2, ImageProjectiveTransformV3). Вивантажується окрема модель без них з тими самими вагами.", ru: "Слои случайных искажений (RandomFlip, RandomZoom) нельзя оставлять в выгружаемой модели: у конвертера TFLite нет их операций (StatelessRandomUniformV2, ImageProjectiveTransformV3). Выгружается отдельная модель без них с теми же весами." },
      { uk: "Якщо в системі стоять пакети CUDA з репозиторію Ubuntu, TensorFlow з [and-cuda] мовчки рахує на процесорі: «Cannot dlopen some GPU libraries», а в докладному журналі — libcusparse не знаходить символ у старій системній libnvJitLink. Скрипт заздалегідь завантажує libnvJitLink з pip, до імпорту TensorFlow.", ru: "Если в системе стоят пакеты CUDA из репозитория Ubuntu, TensorFlow с [and-cuda] молча считает на процессоре: «Cannot dlopen some GPU libraries», а в подробном журнале — libcusparse не находит символ в старой системной libnvJitLink. Скрипт заранее загружает libnvJitLink из pip, до импорта TensorFlow." },
    ],
  },
];

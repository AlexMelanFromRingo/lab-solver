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

export interface LobeGuide {
  id: string;
  title: string;
  summary: string;
  steps: LabStep[];
  pitfalls: string[];
}

export const DATASET = {
  source: "Imagenette (fast.ai) — подмножина ImageNet, меньшая сторона 160 пикселей",
  classes: ["собака", "церква", "сміттєвоз", "парашут"],
  splits: [
    { name: "навчання", perClass: 40, role: "первое обучение" },
    { name: "доповнення", perClass: 40, role: "улучшение модели (п. 5.4)" },
    { name: "перевірка", perClass: 10, role: "проверка на новых изображениях (п. 5.3)" },
  ],
};

export const GUIDES: LobeGuide[] = [
  {
    id: "windows",
    title: "Lobe в Windows",
    summary:
      "Основной путь: так и сделан отчёт. Проверялся в Windows Sandbox на Windows 11 — " +
      "внутри это обычная Windows, поэтому шаги те же, что на своём компьютере.",
    steps: [
      {
        title: "Установить Lobe",
        body:
          "Запустить Lobe.exe из архива преподавателя (файл подписан Microsoft Corporation) " +
          "и пройти мастер: папка установки, копирование, заодно ставится Microsoft Visual C++ " +
          "Runtime. На последнем шаге оставить галочку Run Lobe.",
      },
      {
        title: "Первый запуск",
        body:
          "Continue — согласие с лицензией, Don't Share — отказ от отправки аналитики, " +
          "Get Started. Брандмауэр Windows дважды спросит доступ к сети для Lobe и Lobe " +
          "Backend — разрешить: программа работает через локальный сервер.",
      },
      {
        title: "Импортировать размеченный набор",
        body:
          "Щёлкнуть по Untitled и назвать проект. Import → Dataset → папка «навчання» → " +
          "Label Using Folder Name: метки берутся из названий подпапок. Обучение начинается " +
          "само и занимает секунды.",
      },
      {
        title: "Проверить на новых изображениях",
        body:
          "Use → Images → import, картинка из папки «перевірка». Под картинкой — прогноз и " +
          "две кнопки. ⊘ и правильная метка добавляют картинку в набор, и модель " +
          "дообучается. Все 40 картинок разом проверяет lr3_validate.ps1 через локальный API.",
      },
      {
        title: "Перейти на режим точности",
        body:
          "Меню ☰ → Project Settings → Optimize for Accuracy → Reset Training. Вместо " +
          "MobileNetV2 Lobe берёт ResNet50V2 и обучает модель заново.",
      },
      {
        title: "Улучшить модель",
        body:
          "Import → Dataset → папка «доповнення», затем меню ☰ → Optimize Model — более " +
          "длинное обучение (на видеокарте — секунды).",
      },
      {
        title: "Экспортировать",
        body:
          "Use → Export. Ниже шаблонов приложений — Model Files: TensorFlow (SavedModel), " +
          "TensorFlow Lite, TensorFlow.js, ONNX. Lobe Connect — локальный API, пока открыт Lobe.",
        commands: [
          "# локальный API: POST, тело — JSON",
          'http://localhost:38101/v1/predict/<id проекта>   {"image": "<base64>"}',
        ],
      },
    ],
    pitfalls: [
      "В режиме Optimize for Speed дообучение после исправления одной метки ломает модель: " +
        "91 % → 34 % на обучающих картинках и 14 из 40 на проверке, почти всё уходит в " +
        "«сміттєвоз». Лечится переходом на Optimize for Accuracy — модель обучается заново.",
      "После добавления папки «доповнення» Lobe останавливает обучение слишком рано: " +
        "89 % и 37 из 40. Возвращает 99 % и 40 из 40 команда Optimize Model.",
      "Процент на левой панели считается по обучающим картинкам. Оценивать модель нужно на " +
        "картинках, которых она не видела, — для этого папка «перевірка».",
      "Метку при исправлении лучше выбирать из подсказки: при вводе с клавиатуры и нажатии " +
        "ADD однажды сохранилась метка без последней буквы, и в наборе появился лишний класс.",
      "Во вкладке Use кнопка import есть только на пустом экране: чтобы открыть следующую " +
        "картинку, переключиться на Label и обратно.",
      "Графиков точности и потерь, о которых пишет методичка, в Lobe 0.11 нет — только доля " +
        "верно распознанных изображений.",
    ],
  },
  {
    id: "sandbox",
    title: "Lobe в Windows Sandbox",
    summary:
      "Чтобы не ставить Lobe в основную систему: одноразовая Windows, которая стирается при " +
      "закрытии окна. Есть в Windows 10/11 Pro, Enterprise и Education. Видеокарта " +
      "пробрасывается, Lobe считает на ней через DirectML.",
    steps: [
      {
        title: "Включить компонент",
        body: "От администратора, затем перезагрузка.",
        commands: ["dism /online /enable-feature /featurename:Containers-DisposableClientVM /all"],
      },
      {
        title: "Подготовить общую папку",
        body:
          "Установщик, картинки, место под скриншоты и экспорт. Всё, что останется только " +
          "внутри песочницы, пропадёт при её закрытии.",
      },
      {
        title: "Запустить Lobe.wsb",
        body:
          "В файле: vGPU Enable, 12 ГБ памяти, общая папка. Дальше — как в обычной Windows. " +
          "В журнале Lobe Backend видно «DirectML: creating device on adapter 0» с именем " +
          "видеокарты.",
      },
      {
        title: "Выключить компонент, когда не нужен",
        commands: ["dism /online /disable-feature /featurename:Containers-DisposableClientVM"],
      },
    ],
    pitfalls: [
      "В Windows Home песочницы нет — остаётся обычная установка или wine.",
      "Файлы, сохранённые не в общую папку, исчезают вместе с песочницей: экспорт модели и " +
        "скриншоты сразу складывать туда.",
    ],
  },
  {
    id: "wine",
    title: "Lobe под wine (Linux, WSL)",
    summary:
      "Работает, но не штатно: три правки в файлах программы и только процессор. Подробная " +
      "инструкция с правками — lobe-wine.md в файлах работы.",
    steps: [
      {
        title: "Поставить wine",
        commands: [
          "sudo dpkg --add-architecture i386 && sudo apt update",
          "sudo apt install --install-recommends wine64 wine32:i386",
        ],
      },
      {
        title: "Установить Lobe в отдельный префикс",
        commands: ["export WINEPREFIX=$HOME/.wine-lobe", "wineboot -u && wine Lobe.exe"],
      },
      {
        title: "Поправить три файла и шрифты",
        body:
          "Отключить телеметрию, не считать EPIPE фатальной ошибкой, не ждать сигнала ready " +
          "от дочерних процессов дольше 20 с. Для кириллицы — Segoe UI и Arial из Windows и " +
          "подмена шрифтов в реестре.",
      },
      {
        title: "Запускать без GPU",
        commands: [
          'export WINEDLLOVERRIDES="nvcuda=d;d3d12=d;d3d12core=d"',
          "export CUDA_VISIBLE_DEVICES=-1 DML_VISIBLE_DEVICES=-1",
          'cd "$WINEPREFIX/drive_c/Program Files/Lobe" && wine Lobe.exe --disable-gpu --no-sandbox',
        ],
      },
    ],
    pitfalls: [
      "Сразу после запуска окно «Unexpected exception … write EPIPE»: рвутся каналы между " +
        "процессами Node — нужны первые две правки.",
      "Заставка висит, в журнале «Start: Timed out» — сигнал ready от серверной части не " +
        "доходит, нужна третья правка.",
      "Lobe.backend.exe падает с «divide by zero» в directml.dll — DirectML под wine не " +
        "работает, его и CUDA нужно отключить.",
      "Пакет wine перехватывает запуск exe-файлов, и из WSL перестают запускаться программы " +
        "Windows (powershell.exe и другие) с «Exec format error». Регистрацию WSLInterop " +
        "нужно вернуть.",
    ],
  },
  {
    id: "pytorch",
    title: "PyTorch",
    summary:
      "Та же работа кодом: те же папки и этапы. Основа с весами ImageNet заморожена, " +
      "обучается только новый выходной слой на четыре класса — ровно то, что делает Lobe.",
    steps: [
      {
        title: "Окружение",
        commands: [
          "python3 -m venv .venv",
          ".venv/bin/pip install -r pytorch/requirements.txt",
        ],
      },
      {
        title: "Собрать набор изображений",
        body: "Скачивает архив Imagenette (около 94 МБ) и раскладывает 360 нужных файлов по папкам.",
        commands: [".venv/bin/python make_dataset.py"],
      },
      {
        title: "Запустить",
        body:
          "Четыре этапа: MobileNetV2 на «навчання»; ResNet50 на «навчання»; ResNet50 на " +
          "«навчання» и «доповнення»; дообучение последнего блока ResNet50. После каждого — " +
          "проверка на «перевірка». Результаты — results.json, модель — export/model.pt " +
          "(TorchScript).",
        commands: [".venv/bin/python pytorch/lr3_pytorch.py"],
      },
    ],
    pitfalls: [
      "В torchvision нет ResNet50V2, которую Lobe берёт в режиме точности, — вместо неё ResNet50.",
      "Пока обучается выходной слой, нормализация пакетов основы остаётся в режиме eval, " +
        "чтобы её статистика с ImageNet не сбивалась на маленьких пакетах.",
      "Без видеокарты всё работает на процессоре, только дольше.",
    ],
  },
  {
    id: "tensorflow",
    title: "TensorFlow",
    summary:
      "Та же работа на Keras с теми же основами, что у Lobe: MobileNetV2 и ResNet50V2. Модель " +
      "выгружается так же, как из Lobe: SavedModel и TensorFlow Lite.",
    steps: [
      {
        title: "Окружение",
        body: "tensorflow[and-cuda] подтягивает библиотеки CUDA сам, отдельно их ставить не нужно.",
        commands: [
          "python3 -m venv .venv",
          ".venv/bin/pip install -r tensorflow/requirements.txt",
        ],
      },
      {
        title: "Собрать набор изображений",
        commands: [".venv/bin/python make_dataset.py"],
      },
      {
        title: "Запустить",
        body:
          "Этапы те же, что в PyTorch, только с ResNet50V2. Результаты — results.json, " +
          "модель — export/saved_model и export/model.tflite.",
        commands: [".venv/bin/python tensorflow/lr3_tensorflow.py"],
      },
    ],
    pitfalls: [
      "Основы Keras ждут значения от −1 до 1: нормализацию делает preprocess_input " +
        "соответствующей сети, её нельзя пропускать.",
      "Слои случайных искажений (RandomFlip, RandomZoom) нельзя оставлять в выгружаемой " +
        "модели: у конвертера TFLite нет их операций (StatelessRandomUniformV2, " +
        "ImageProjectiveTransformV3). Выгружается отдельная модель без них с теми же весами.",
      "Если в системе стоят пакеты CUDA из репозитория Ubuntu, TensorFlow с [and-cuda] молча " +
        "считает на процессоре: «Cannot dlopen some GPU libraries», а в подробном журнале — " +
        "libcusparse не находит символ в старой системной libnvJitLink. Скрипт заранее " +
        "загружает libnvJitLink из pip, до импорта TensorFlow.",
    ],
  },
];

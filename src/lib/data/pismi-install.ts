import type { Loc } from "@/lib/i18n";
/**
 * Установка Docker для лабораторной 1 «Проектування інформаційних систем в
 * мережах Інтернет».
 *
 * Методичка описывает один путь — VirtualBox с Ubuntu внутри. На практике
 * лаба одинаково выполняется на любой из четырёх конфигураций ниже: Docker
 * работает с ядром Linux, а откуда это ядро взялось — из виртуальной машины,
 * из WSL или из самой системы — ни на файл окружения, ни на команды не
 * влияет.
 *
 * Команды для Ubuntu взяты из официальной инструкции Docker, на которую
 * ссылается сама методичка; остальные — из документации соответствующих
 * систем. Ничего не выдумано: где шаг зависит от версии или железа, это
 * сказано прямо.
 */

export interface InstallStep {
  title: Loc;
  /** Пояснение: зачем шаг нужен и что пойдёт не так без него. */
  body?: Loc;
  /** Команды или действия; для графических шагов — пусто. */
  commands?: string[];
}

export interface InstallGuide {
  id: string;
  system: Loc;
  summary: Loc;
  /** Чего требует сама система, до установки. */
  requirements: Loc[];
  steps: InstallStep[];
  /** Грабли, на которые наступают именно здесь. */
  pitfalls: Loc[];
}

export const INSTALL_GUIDES: InstallGuide[] = [
  {
    id: "wsl",
    system: { uk: "Windows · WSL 2 без Docker Desktop", ru: "Windows · WSL 2 без Docker Desktop" },
    summary:
      { uk: "Docker Engine ставиться всередину підсистеми Linux. Так зроблено еталонну роботу: Docker Desktop не потрібен, ліцензія на нього — теж.", ru: "Docker Engine ставится внутрь подсистемы Linux. Так сделана эталонная работа: Docker Desktop не нужен, лицензия на него — тоже." },
    requirements: [
      { uk: "Windows 10 версії 2004 і новіше або Windows 11", ru: "Windows 10 версии 2004 и новее или Windows 11" },
      { uk: "Увімкнені компоненти «Підсистема Windows для Linux» і «Платформа віртуальної машини»", ru: "Включённые компоненты «Подсистема Windows для Linux» и «Платформа виртуальной машины»" },
      { uk: "Віртуалізація, дозволена в UEFI (Intel VT-x або AMD-V)", ru: "Виртуализация, разрешённая в UEFI (Intel VT-x или AMD-V)" },
    ],
    steps: [
      {
        title: { uk: "Поставити WSL 2 і Ubuntu", ru: "Поставить WSL 2 и Ubuntu" },
        body: { uk: "Команда ставить підсистему, ядро і дистрибутив одним заходом. Потрібен перезапуск.", ru: "Команда ставит подсистему, ядро и дистрибутив одним заходом. Нужен перезапуск." },
        commands: ["wsl --install -d Ubuntu-24.04", "wsl --set-default-version 2"],
      },
      {
        title: { uk: "Оновити пакети всередині Ubuntu", ru: "Обновить пакеты внутри Ubuntu" },
        commands: ["sudo apt update && sudo apt upgrade -y"],
      },
      {
        title: { uk: "Підключити репозиторій Docker", ru: "Подключить репозиторий Docker" },
        body:
          { uk: "Docker з репозиторію Ubuntu старий і називається docker.io. Ставимо офіційний: інакше docker compose (без дефіса) може бути відсутнім.", ru: "Docker из репозитория Ubuntu старый и называется docker.io. Ставим официальный: иначе docker compose (без дефиса) может отсутствовать." },
        commands: [
          "sudo apt-get install -y ca-certificates curl",
          "sudo install -m 0755 -d /etc/apt/keyrings",
          "sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc",
          "sudo chmod a+r /etc/apt/keyrings/docker.asc",
          'echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null',
          "sudo apt-get update",
        ],
      },
      {
        title: { uk: "Встановити Docker Engine", ru: "Установить Docker Engine" },
        commands: [
          "sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin",
        ],
      },
      {
        title: { uk: "Запустити службу і дозволити роботу без sudo", ru: "Запустить службу и разрешить работу без sudo" },
        body:
          { uk: "У WSL немає systemd за замовчуванням — або увімкніть його в /etc/wsl.conf, або запускайте службу вручну. Членство в групі docker набуває чинності після перезаходу в сесію.", ru: "В WSL нет systemd по умолчанию — либо включите его в /etc/wsl.conf, либо запускайте службу вручную. Членство в группе docker вступает в силу после перезахода в сессию." },
        commands: [
          "sudo usermod -aG docker $USER",
          "printf '[boot]\\nsystemd=true\\n' | sudo tee /etc/wsl.conf",
          "# вийти з Ubuntu, потім у PowerShell: wsl --shutdown",
        ],
      },
      {
        title: { uk: "Перевірити", ru: "Проверить" },
        commands: ["docker --version", "docker compose version", "docker run --rm hello-world"],
      },
    ],
    pitfalls: [
      { uk: "Без systemd служба не піднімається сама: або увімкнути його в /etc/wsl.conf, або запускати sudo service docker start при кожному старті.", ru: "Без systemd служба не поднимается сама: либо включить его в /etc/wsl.conf, либо запускать sudo service docker start при каждом старте." },
      { uk: "Група docker починає діяти тільки після wsl --shutdown, перезапуску термінала недостатньо.", ru: "Группа docker начинает действовать только после wsl --shutdown, перезапуска терминала недостаточно." },
      { uk: "Проєкт краще тримати всередині файлової системи Linux (/home/...), а не в /mnt/c: на змонтованому диску Windows збірка йде в рази повільніше.", ru: "Проект лучше держать внутри файловой системы Linux (/home/...), а не в /mnt/c: на смонтированном диске Windows сборка идёт в разы медленнее." },
    ],
  },
  {
    id: "windows",
    system: "Windows · Docker Desktop",
    summary:
      { uk: "Готовий інсталятор з графічним інтерфейсом. Найпростіше, але вимагає згоди з ліцензією Docker Desktop — для великих організацій вона платна.", ru: "Готовый установщик с графическим интерфейсом. Проще всего, но требует согласия с лицензией Docker Desktop — для крупных организаций она платная." },
    requirements: [
      { uk: "Windows 10 версії 22H2 і новіше або Windows 11", ru: "Windows 10 версии 22H2 и новее или Windows 11" },
      { uk: "WSL 2 (інсталятор запропонує увімкнути сам)", ru: "WSL 2 (установщик предложит включить сам)" },
      { uk: "Віртуалізація в UEFI", ru: "Виртуализация в UEFI" },
    ],
    steps: [
      {
        title: { uk: "Завантажити і встановити", ru: "Скачать и установить" },
        body:
          { uk: "Взяти інсталятор з docker.com/products/docker-desktop, при установці лишити увімкненим «Use WSL 2 instead of Hyper-V».", ru: "Взять установщик с docker.com/products/docker-desktop, при установке оставить включённым «Use WSL 2 instead of Hyper-V»." },
      },
      {
        title: { uk: "Перезавантажитися і запустити Docker Desktop", ru: "Перезагрузиться и запустить Docker Desktop" },
        body: { uk: "Кит запускається у фоні; значок у треї має стати зеленим.", ru: "Кит запускается в фоне; значок в трее должен стать зелёным." },
      },
      {
        title: { uk: "Перевірити в PowerShell", ru: "Проверить в PowerShell" },
        commands: ["docker --version", "docker compose version", "docker run --rm hello-world"],
      },
    ],
    pitfalls: [
      { uk: "Docker Desktop має бути запущений: без нього docker у консолі відповідає «cannot connect to the Docker daemon».", ru: "Docker Desktop должен быть запущен: без него docker в консоли отвечает «cannot connect to the Docker daemon»." },
      { uk: "Шляхи в volumes пишуться через прямий слеш; підключення каталогу з диска C уперше вимагає підтвердження доступу.", ru: "Пути в volumes пишутся через прямой слэш; подключение каталога с диска C впервые требует подтверждения доступа." },
      { uk: "Перенесення рядка CRLF у файлах, що потрапляють у контейнер, ламає shell-скрипти — у редакторі виставити LF.", ru: "Перенос строки CRLF в файлах, которые попадают в контейнер, ломает shell-скрипты — в редакторе выставить LF." },
    ],
  },
  {
    id: "macos",
    system: "macOS",
    summary:
      { uk: "Docker Desktop або colima — другий варіант без графічного інтерфейсу і без ліцензійних обмежень.", ru: "Docker Desktop либо colima — второй вариант без графического интерфейса и без лицензионных ограничений." },
    requirements: [{ uk: "macOS 13 і новіше", ru: "macOS 13 и новее" }, { uk: "Apple silicon або Intel", ru: "Apple silicon или Intel" }],
    steps: [
      {
        title: { uk: "Варіант A — Docker Desktop", ru: "Вариант A — Docker Desktop" },
        body: { uk: "Завантажити dmg під свій процесор з docker.com і перенести в «Програми».", ru: "Скачать dmg под свой процессор с docker.com и перенести в «Программы»." },
      },
      {
        title: { uk: "Варіант B — colima через Homebrew", ru: "Вариант B — colima через Homebrew" },
        body: { uk: "Легка віртуальна машина з Docker всередині; керується з термінала.", ru: "Лёгкая виртуальная машина с Docker внутри; управляется из терминала." },
        commands: ["brew install colima docker docker-compose", "colima start --cpu 2 --memory 4"],
      },
      {
        title: { uk: "Перевірити", ru: "Проверить" },
        commands: ["docker --version", "docker compose version", "docker run --rm hello-world"],
      },
    ],
    pitfalls: [
      { uk: "На Apple silicon частина образів зібрана тільки під amd64 — вони запустяться через емуляцію і помітно повільніше. Образ php:8.2-apache цієї проблеми не має.", ru: "На Apple silicon часть образов собрана только под amd64 — они запустятся через эмуляцию и заметно медленнее. Образ php:8.2-apache этой проблемы не имеет." },
      { uk: "colima після перезавантаження не стартує сама: colima start потрібно повторювати або додати в автозапуск.", ru: "colima после перезагрузки не стартует сама: colima start нужно повторять или добавить в автозапуск." },
    ],
  },
  {
    id: "ubuntu",
    system: { uk: "Ubuntu та інші Linux", ru: "Ubuntu и другие Linux" },
    summary:
      { uk: "Docker ставиться прямо в систему, без віртуальної машини. Саме ці команди наводить методичка з посиланням на документацію Docker.", ru: "Docker ставится прямо в систему, без виртуальной машины. Именно эти команды приводит методичка со ссылкой на документацию Docker." },
    requirements: [{ uk: "Ubuntu 22.04, 24.04 або сумісний дистрибутив", ru: "Ubuntu 22.04, 24.04 или совместимый дистрибутив" }, { uk: "Права sudo", ru: "Права sudo" }],
    steps: [
      {
        title: { uk: "Підключити репозиторій Docker", ru: "Подключить репозиторий Docker" },
        commands: [
          "sudo apt-get update",
          "sudo apt-get install -y ca-certificates curl",
          "sudo install -m 0755 -d /etc/apt/keyrings",
          "sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc",
          "sudo chmod a+r /etc/apt/keyrings/docker.asc",
          'echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null',
          "sudo apt-get update",
        ],
      },
      {
        title: { uk: "Встановити пакети", ru: "Установить пакеты" },
        commands: [
          "sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin",
        ],
      },
      {
        title: { uk: "Дозволити роботу без sudo", ru: "Разрешить работу без sudo" },
        body: { uk: "Зміна набуває чинності після перезаходу в сесію.", ru: "Изменение вступает в силу после перезахода в сессию." },
        commands: ["sudo usermod -aG docker $USER", "newgrp docker"],
      },
      {
        title: { uk: "Перевірити", ru: "Проверить" },
        commands: ["sudo docker run hello-world", "docker compose version"],
      },
    ],
    pitfalls: [
      { uk: "Пакет docker.io з репозиторію дистрибутива не містить плагіна compose: docker compose працювати не буде, тільки застарілий docker-compose.", ru: "Пакет docker.io из репозитория дистрибутива не содержит плагина compose: docker compose работать не будет, только устаревший docker-compose." },
      { uk: "Якщо порт уже зайнятий іншою службою, контейнер не підніметься: перевіряти ss -tln перед запуском.", ru: "Если порт уже занят другой службой, контейнер не поднимется: проверять ss -tln перед запуском." },
    ],
  },
];

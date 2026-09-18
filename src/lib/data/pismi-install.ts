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
  title: string;
  /** Пояснение: зачем шаг нужен и что пойдёт не так без него. */
  body?: string;
  /** Команды или действия; для графических шагов — пусто. */
  commands?: string[];
}

export interface InstallGuide {
  id: string;
  system: string;
  summary: string;
  /** Чего требует сама система, до установки. */
  requirements: string[];
  steps: InstallStep[];
  /** Грабли, на которые наступают именно здесь. */
  pitfalls: string[];
}

export const INSTALL_GUIDES: InstallGuide[] = [
  {
    id: "wsl",
    system: "Windows · WSL 2 без Docker Desktop",
    summary:
      "Docker Engine ставится внутрь подсистемы Linux. Так сделана эталонная работа: " +
      "Docker Desktop не нужен, лицензия на него — тоже.",
    requirements: [
      "Windows 10 версии 2004 и новее или Windows 11",
      "Включённые компоненты «Подсистема Windows для Linux» и «Платформа виртуальной машины»",
      "Виртуализация, разрешённая в UEFI (Intel VT-x или AMD-V)",
    ],
    steps: [
      {
        title: "Поставить WSL 2 и Ubuntu",
        body: "Команда ставит подсистему, ядро и дистрибутив одним заходом. Нужен перезапуск.",
        commands: ["wsl --install -d Ubuntu-24.04", "wsl --set-default-version 2"],
      },
      {
        title: "Обновить пакеты внутри Ubuntu",
        commands: ["sudo apt update && sudo apt upgrade -y"],
      },
      {
        title: "Подключить репозиторий Docker",
        body:
          "Docker из репозитория Ubuntu старый и называется docker.io. Ставим официальный: " +
          "иначе docker compose (без дефиса) может отсутствовать.",
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
        title: "Установить Docker Engine",
        commands: [
          "sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin",
        ],
      },
      {
        title: "Запустить службу и разрешить работу без sudo",
        body:
          "В WSL нет systemd по умолчанию — либо включите его в /etc/wsl.conf, либо " +
          "запускайте службу вручную. Членство в группе docker вступает в силу после " +
          "перезахода в сессию.",
        commands: [
          "sudo usermod -aG docker $USER",
          "printf '[boot]\\nsystemd=true\\n' | sudo tee /etc/wsl.conf",
          "# выйти из Ubuntu, затем в PowerShell: wsl --shutdown",
        ],
      },
      {
        title: "Проверить",
        commands: ["docker --version", "docker compose version", "docker run --rm hello-world"],
      },
    ],
    pitfalls: [
      "Без systemd служба не поднимается сама: либо включить его в /etc/wsl.conf, либо запускать sudo service docker start при каждом старте.",
      "Группа docker начинает действовать только после wsl --shutdown, перезапуска терминала недостаточно.",
      "Проект лучше держать внутри файловой системы Linux (/home/...), а не в /mnt/c: на смонтированном диске Windows сборка идёт в разы медленнее.",
    ],
  },
  {
    id: "windows",
    system: "Windows · Docker Desktop",
    summary:
      "Готовый установщик с графическим интерфейсом. Проще всего, но требует согласия с " +
      "лицензией Docker Desktop — для крупных организаций она платная.",
    requirements: [
      "Windows 10 версии 22H2 и новее или Windows 11",
      "WSL 2 (установщик предложит включить сам)",
      "Виртуализация в UEFI",
    ],
    steps: [
      {
        title: "Скачать и установить",
        body:
          "Взять установщик с docker.com/products/docker-desktop, при установке оставить " +
          "включённым «Use WSL 2 instead of Hyper-V».",
      },
      {
        title: "Перезагрузиться и запустить Docker Desktop",
        body: "Кит запускается в фоне; значок в трее должен стать зелёным.",
      },
      {
        title: "Проверить в PowerShell",
        commands: ["docker --version", "docker compose version", "docker run --rm hello-world"],
      },
    ],
    pitfalls: [
      "Docker Desktop должен быть запущен: без него docker в консоли отвечает «cannot connect to the Docker daemon».",
      "Пути в volumes пишутся через прямой слэш; подключение каталога с диска C впервые требует подтверждения доступа.",
      "Перенос строки CRLF в файлах, которые попадают в контейнер, ломает shell-скрипты — в редакторе выставить LF.",
    ],
  },
  {
    id: "macos",
    system: "macOS",
    summary:
      "Docker Desktop либо colima — второй вариант без графического интерфейса и без " +
      "лицензионных ограничений.",
    requirements: ["macOS 13 и новее", "Apple silicon или Intel"],
    steps: [
      {
        title: "Вариант A — Docker Desktop",
        body: "Скачать dmg под свой процессор с docker.com и перенести в «Программы».",
      },
      {
        title: "Вариант B — colima через Homebrew",
        body: "Лёгкая виртуальная машина с Docker внутри; управляется из терминала.",
        commands: ["brew install colima docker docker-compose", "colima start --cpu 2 --memory 4"],
      },
      {
        title: "Проверить",
        commands: ["docker --version", "docker compose version", "docker run --rm hello-world"],
      },
    ],
    pitfalls: [
      "На Apple silicon часть образов собрана только под amd64 — они запустятся через эмуляцию и заметно медленнее. Образ php:8.2-apache этой проблемы не имеет.",
      "colima после перезагрузки не стартует сама: colima start нужно повторять или добавить в автозапуск.",
    ],
  },
  {
    id: "ubuntu",
    system: "Ubuntu и другие Linux",
    summary:
      "Docker ставится прямо в систему, без виртуальной машины. Именно эти команды " +
      "приводит методичка со ссылкой на документацию Docker.",
    requirements: ["Ubuntu 22.04, 24.04 или совместимый дистрибутив", "Права sudo"],
    steps: [
      {
        title: "Подключить репозиторий Docker",
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
        title: "Установить пакеты",
        commands: [
          "sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin",
        ],
      },
      {
        title: "Разрешить работу без sudo",
        body: "Изменение вступает в силу после перезахода в сессию.",
        commands: ["sudo usermod -aG docker $USER", "newgrp docker"],
      },
      {
        title: "Проверить",
        commands: ["sudo docker run hello-world", "docker compose version"],
      },
    ],
    pitfalls: [
      "Пакет docker.io из репозитория дистрибутива не содержит плагина compose: docker compose работать не будет, только устаревший docker-compose.",
      "Если порт уже занят другой службой, контейнер не поднимется: проверять ss -tln перед запуском.",
    ],
  },
];

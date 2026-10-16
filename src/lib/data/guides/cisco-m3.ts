import type { GuideModule } from "./types";

/**
 * Cisco CyberOps Associate, модуль 3 (операційна система Windows): робота в
 * аудиторії 3.0.3 і лабораторні 3.2.11, 3.3.10–3.3.13. Виконувались у Windows 11
 * Enterprise у віртуальній машині (англійський інтерфейс), а методички писані під
 * Windows 10 — розбіжності зібрані в errata.
 */

const SRC = "Cisco CyberOps Associate (NetAcad)";
const VM = "Робиться у віртуальній машині з Windows, а не на основному комп'ютері: робота завершує процеси, змінює реєстр і облікові записи.";

export const CISCO_M3: GuideModule[] = [
  {
    slug: "cisco-3-0-3",
    intro:
      "TCPView из Sysinternals Suite: какие процессы Windows держат сетевые соединения, что такое lsass.exe и как меняется " +
      "список, когда открываешь и закрываешь браузер.",
    guide: {
      source: `${SRC}, Class Activity 3.0.3 «Identify Running Processes»`,
      goals: ["Навчитися визначати процеси, запущені на комп'ютері з Windows, і їхні мережеві з'єднання за допомогою TCPView."],
      steps: [
        { title: "Завантажити Sysinternals Suite", body: `Посилання з методички веде на сторінку Sysinternals Suite на Microsoft Learn. Архів розпакувати через Extract All... у теку за замовчуванням. ${VM}` },
        { title: "Запустити TCPView", body: "tcpview.exe з теки SysinternalsSuite; він просить права адміністратора (UAC) і прийняти ліцензію. Закрити інші програми; фонові процеси Edge лишаються після закриття вікна — їх завершити окремо." },
        { title: "Дослідити процеси", body: "Подвійне клацання на lsass.exe — властивості процесу; для порівняння spoolsv.exe." },
        { title: "Браузер", body: "Відкрити браузер, подивитися нові рядки (зелені — нові, жовті — змінені), закрити, подивитися ще раз. Options > Resolve Addresses показує імена вузлів." },
      ],
      report: [],
      screenshots: [
        { what: "TCPView після закриття програм", how: "Лишаються процеси Windows і служби на портах 135, 139, 49664+." },
        { what: "Властивості lsass.exe", how: "Подвійне клацання на процесі." },
        { what: "TCPView з відкритим браузером і після його закриття", how: "Рядки msedge.exe Established на 443, потім [Time Wait]." },
      ],
      questions: ["Що таке lsass.exe і в якій теці розташовано цей файл?", "Що можна побачити у вікні TCPView, коли браузер відкрито?", "Що можна побачити у вікні TCPView, коли браузер закрито?"],
    },
    findings: [
      { title: "lsass.exe", body: "Local Security Authority Subsystem Service: перевіряє облікові дані під час входу, змінює паролі, створює маркери доступу, застосовує політику безпеки й аудиту. Файл — C:\\Windows\\System32, підписаний Microsoft. У пам'яті lsass зберігаються облікові дані, тому його атакують або маскують шкідливі програми під його ім'я в іншій теці; у Windows 11 процес захищений від читання пам'яті." },
      { title: "Браузер відкрито", body: "Десятки рядків msedge.exe зі станом Established до віддалених адрес на порту 443: сторінка вантажиться з багатьох серверів сайту й CDN. З Resolve Addresses видно імена вузлів Akamai, Amazon, Google." },
      { title: "Браузер закрито", body: "Рядки втрачають ім'я процесу і переходять у [Time Wait], потім зникають. Edge у Windows 11 лишає фоновий процес з кількома з'єднаннями, доки цю функцію не вимкнути в налаштуваннях." },
    ],
  },
  {
    slug: "cisco-3-2-11",
    intro:
      "Process Explorer: найти процесс по окну, завершить его вместе с дочерними, проверить файл на VirusTotal, посмотреть " +
      "потоки и дескрипторы conhost.exe, а потом поменять EulaAccepted в реестре и увидеть лицензию снова.",
    guide: {
      source: `${SRC}, Lab 3.2.11 «Exploring Processes, Threads, Handles, and Windows Registry»`,
      goals: ["Досліджувати процеси, потоки й дескриптори за допомогою Process Explorer.", "Змінювати налаштування програм через реєстр Windows."],
      steps: [
        { title: "Активний процес", body: `Відкрити procexp.exe з Sysinternals Suite (на 64-бітній системі він запускає procexp64.exe дочірнім процесом). Перетягнути приціл Find Window's Process на вікно браузера, Kill Process. ${VM}` },
        { title: "Інший процес", body: "Відкрити cmd, знайти його прицілом, виконати ping; для conhost.exe — Check VirusTotal.com (з'явиться стовпець VirusTotal), потім Kill Process для cmd.exe.", commands: ["ping www.cisco.com"] },
        { title: "Потоки", body: "Properties... для conhost.exe, вкладка Threads (попередження про Dbghelp.dll і сервер символів закрити)." },
        { title: "Дескриптори", body: "View > Lower Pane View > Handles для conhost.exe." },
        { title: "Реєстр", body: "regedit: HKEY_CURRENT_USER\\Software\\Sysinternals\\Process Explorer, параметр EulaAccepted змінити з 1 на 0 і знову запустити Process Explorer." },
      ],
      report: [],
      screenshots: [
        { what: "Процес браузера, знайдений прицілом, і підтвердження Kill Process", how: "Process Explorer з виділеним msedge.exe." },
        { what: "PING.EXE дочірнім процесом cmd.exe і стовпець VirusTotal", how: "Під час виконання ping; після згоди на умови VirusTotal." },
        { what: "Вкладка Threads і нижня панель Handles", how: "Властивості conhost.exe." },
        { what: "EulaAccepted у реєстрі і ліцензійна угода після зміни", how: "regedit; повторний запуск procexp." },
      ],
      questions: [
        "Що сталося з вікном веб-браузера, коли процес був знищений?",
        "Що відбулося під час процесу ping?",
        "Що сталося з дочірнім процесом conhost.exe?",
        "Який тип інформації доступний у вікні Properties на вкладці Threads?",
        "На що вказують дескриптори?",
        "Яке значення має ключ EulaAccepted у стовпці Data?",
        "Що ви бачили, коли відкривали Process Explorer?",
      ],
    },
    findings: [
      { title: "Знищений процес браузера", body: "Вікно закривається без запиту, зникають msedge.exe і всі дочірні процеси вкладок і служб." },
      { title: "ping", body: "Під cmd.exe з'являється дочірній PING.EXE, який зникає після завершення команди: cmd запускає кожну зовнішню програму окремим процесом." },
      { title: "conhost.exe після Kill cmd.exe", body: "Завершується разом з cmd.exe: Console Window Host обслуговує вікно консолі свого клієнта. VirusTotal для системного conhost.exe — 0 спрацювань." },
      { title: "Threads", body: "Кількість потоків і таблиця: TID, CPU, цикли, лічильник призупинень, адреса початку (модуль+зміщення без символів); для вибраного потоку — стан (наприклад Wait:UserRequest), час ядра/користувача, перемикання контексту, пріоритети; кнопки Stack, Module, Permissions, Kill, Suspend." },
      { title: "Handles", body: "На об'єкти ядра, відкриті процесом: тип і ім'я — порти ALPC, Desktop, каталоги об'єктів, файли (зокрема \\Device\\ConDrv), ключі реєстру, події, секції, семафори, потоки." },
      { title: "EulaAccepted", body: "Після зміни — 0x00000000 (0); при запуску знову з'являється ліцензійна угода, а після Agree значення знову 1." },
    ],
    errata: [
      "Методичка каже, що EulaAccepted = 0 означає прийняту угоду. Навпаки: 1 — прийнято, 0 — ні, тому угода й з'являється знову.",
      "Параметри в regedit упорядковано за абеткою, тому EulaAccepted не внизу списку, а на початку.",
      "Якщо ping пише, що вузол не знайдено, — не відповідає DNS-сервер мережі; допомагають публічні DNS 8.8.8.8 і 1.1.1.1 у налаштуваннях адаптера.",
    ],
  },
  {
    slug: "cisco-3-3-10",
    intro:
      "Локальные учётные записи Windows: создать User1, войти под ним, сравнить права на папки профилей, посмотреть группы " +
      "в Управлении компьютером, сделать администратором, вернуть и удалить.",
    guide: {
      source: `${SRC}, Lab 3.3.10 «Create User Accounts»`,
      goals: ["Створювати, переглядати, змінювати й видаляти локальні облікові записи Windows.", "Розібратися з правами доступу до тек профілів."],
      steps: [
        { title: "Створити User1", body: "Панель керування > User Accounts > Manage another account > Add a new user in PC settings > Add account > I don't have this person's sign-in information > Add a user without a Microsoft account. Windows 11 вимагає ще три контрольні запитання для пароля." },
        { title: "Перевірити доступ", body: "Увійти як User1; у C:\\Users подивитися Properties > Security своєї теки, спробувати відкрити теку адміністратора (UAC попросить пароль адміністратора — відмовити). Потім під адміністратором — Security теки C:\\Users." },
        { title: "Групи", body: "Windows Tools > Computer Management > Local Users and Groups > Users: вкладка Member Of для User1 і адміністратора." },
        { title: "Змінити й видалити", body: "Change the account type > Administrator, потім прибрати групу Administrators на Member Of, видалити User1 у Computer Management.", commands: ["net user User1 /delete"] },
      ],
      report: [],
      screenshots: [
        { what: "Новий локальний обліковий запис у списку", how: "Параметри > Accounts > Other users." },
        { what: "Security теки User1 і C:\\Users", how: "Properties теки." },
        { what: "Відмова в доступі до чужого профілю", how: "Спроба відкрити теку адміністратора під User1." },
        { what: "Member Of для User1 до і після зміни типу", how: "Computer Management." },
      ],
      questions: [
        "Який тип профілю користувача ви щойно створили?",
        "Які групи або користувачі повністю контролюють теку User1?",
        "Чи вдалося отримати доступ до теки адміністратора?",
        "Які групи або користувачі повністю контролюють теку C:\\Users?",
        "До якої групи входить User1? До якої — обліковий запис адміністратора?",
        "До яких груп належить User1 після зміни типу?",
        "Як ще можна видалити обліковий запис користувача?",
        "Чому важливо захистити всі облікові записи сильними паролями?",
        "Навіщо створювати користувача зі стандартними привілеями?",
      ],
    },
    findings: [
      { title: "Тип профілю", body: "Локальний обліковий запис стандартного користувача: лише на цьому комп'ютері, без облікового запису Microsoft, за замовчуванням тільки в групі Users." },
      { title: "Тека User1", body: "Full control: SYSTEM, User1 і Administrators. Запис Account Unknown(S-1-15-3-…) — SID можливості для застосунків AppContainer, не обліковий запис." },
      { title: "Тека адміністратора", body: "Немає доступу: потрібен пароль адміністратора; тека профілю доступна лише власнику, SYSTEM і адміністраторам." },
      { title: "C:\\Users", body: "Full control — SYSTEM і Administrators; Everyone і Users — лише Read & execute, List folder contents, Read." },
      { title: "Групи", body: "User1 — Users; адміністратор — Administrators і Users. Після зміни типу User1 — Administrators і Users (Users лишається)." },
      { title: "Інші способи видалення", body: "Панель керування > Delete the account (питає Keep Files / Delete Files), Параметри > Other users > Remove, net user User1 /delete, Active Directory для доменних записів. Тека профілю після Computer Management лишається — прибирається в System Properties > Advanced > User Profiles." },
      { title: "Сильні паролі", body: "Слабкий пароль підбирають, і нападник отримує всі права запису, а з адміністратора — усю систему; довгий складний пароль разом з блокуванням після невдалих спроб робить підбір практично неможливим." },
      { title: "Стандартні привілеї", body: "Принцип найменших привілеїв: стандартний користувач не змінює систему й не читає чужі профілі, тож зламаний запис або обман дають нападнику лише обмежені права." },
    ],
    errata: ["Обліковий запис CyberOpsUser з методички — це будь-який обліковий запис адміністратора; розділ «Адміністрування» у Windows 11 називається Windows Tools."],
  },
  {
    slug: "cisco-3-3-11",
    intro:
      "Windows PowerShell против командной строки: dir, ipconfig, ping, какой командлет стоит за dir, netstat с привязкой к " +
      "процессам и очистка корзины командлетом.",
    guide: {
      source: `${SRC}, Lab 3.3.11 «Using Windows PowerShell»`,
      goals: ["Ознайомитися з консоллю PowerShell і порівняти її з командним рядком.", "Дослідити командлети, netstat і очищення кошика засобами PowerShell."],
      steps: [
        { title: "Обидві оболонки", body: "PowerShell відкривається в system32 — перейти в домашній каталог, щоб порівнювати однакові дані.", commands: ["cd ~", "dir", "ipconfig", "cd ..", "ping www.cisco.com"] },
        { title: "Командлети", body: "Знайти командлет за dir і ознайомитися з довідником командлетів Microsoft Learn.", commands: ["Get-Alias dir", "Get-Command", "Get-Help Get-ChildItem"] },
        { title: "netstat", body: "Довідка, таблиця маршрутизації, потім консоль з правами адміністратора (Run as administrator) і зв'язок портів з процесами; PID знайти в Диспетчері завдань на вкладці Details.", commands: ["netstat /? | more", "netstat -r", "netstat -abno"] },
        { title: "Кошик", body: "Видалити кілька файлів у кошик, потім:", commands: ["clear-recyclebin"] },
      ],
      report: [],
      screenshots: [
        { what: "dir у PowerShell і в cmd поруч", how: "Два вікна поруч." },
        { what: "netstat -r і netstat -abno", how: "Консоль адміністратора для -b." },
        { what: "Процес за PID на вкладці Details і його Properties", how: "Ctrl+Shift+Esc, впорядкувати за PID." },
        { what: "Підтвердження Clear-RecycleBin і порожній кошик", how: "Ввести y." },
      ],
      questions: [
        "Які вихідні дані команди dir?",
        "Які результати ви отримали від ipconfig, cd .. і ping в обох оболонках?",
        "Яка команда PowerShell відповідає dir?",
        "Яка адреса шлюзу IPv4?",
        "Яку інформацію можна отримати на вкладці Details і у вікні Properties вибраного PID?",
        "Що сталося з файлами в кошику?",
        "Які команди PowerShell можуть спростити завдання аналітика безпеки?",
      ],
    },
    findings: [
      { title: "dir", body: "Однаковий вміст каталогу, різний формат: cmd — мітка тому, записи . і .., <DIR>, підсумок і вільне місце; PowerShell — Directory: і таблиця Mode, LastWriteTime, Length, Name." },
      { title: "ipconfig, cd .., ping", body: "Однакові результати: це окремі програми (ipconfig.exe, PING.EXE), а cd у PowerShell — псевдонім Set-Location." },
      { title: "dir у PowerShell", body: "Псевдонім командлета Get-ChildItem (як і ls, gci). Назви командлетів — дієслово-іменник; вивід — об'єкти .NET." },
      { title: "Шлюз IPv4", body: "За замовчуванням у NAT VirtualBox — 10.0.2.2 (маршрут 0.0.0.0/0)." },
      { title: "Details і Properties", body: "Ім'я образу, PID, стан, обліковий запис (наприклад NETWORK SERVICE для svchost), CPU, пам'ять, архітектура, опис; Go to service(s). Properties файлу: розташування, розмір, дати, версія, цифровий підпис і дозволи — за PID з netstat можна перевірити, що файл справжній." },
      { title: "Кошик", body: "Clear-RecycleBin з підтвердженням видаляє файли остаточно: This folder is empty, засобами Windows їх не відновити." },
      { title: "Корисні командлети", body: "Get-Process, Get-Service, Get-NetTCPConnection, Get-ScheduledTask, Get-LocalUser, Get-LocalGroupMember Administrators, Get-WinEvent (наприклад подія 4625), Get-FileHash, Get-AuthenticodeSignature, Test-NetConnection, Get-MpThreatDetection; Where-Object, Export-Csv, Invoke-Command для багатьох машин." },
    ],
    errata: [
      "У свіжих збірках Windows 11 netstat -h — новий параметр (кількість дескрипторів сокетів), довідку дає netstat /?; додалися параметри -c, -d, -i, -q, -x, -y.",
      "Для -b потрібна консоль з правами адміністратора; для System і захищених процесів netstat пише Can not obtain ownership information.",
    ],
  },
  {
    slug: "cisco-3-3-12",
    intro:
      "Диспетчер задач Windows: категории процессов, Console Window Host, сортировка по памяти и проценты, завершение " +
      "браузера, службы и вкладка производительности с Монитором ресурсов. В Windows 11 вкладки слева и кое-что переехало.",
    guide: {
      source: `${SRC}, Lab 3.3.12 «Windows Task Manager»`,
      goals: ["Вивчити Диспетчер завдань: керування процесами, служби, продуктивність."],
      steps: [
        { title: "Процеси", body: "Відкрити cmd і браузер; Диспетчер завдань — з контекстного меню панелі завдань або Ctrl+Shift+Esc. Розгорнути Windows Command Processor, Properties для Console Window Host, закрити cmd командою exit, двічі натиснути Memory, Resource values > Memory > Percents, розгорнути групу браузера, End task." },
        { title: "Служби", body: "Вкладка Services: стан служб, PID, кнопки Start/Stop/Restart, Open Services." },
        { title: "Продуктивність", body: "CPU (процеси, потоки), Memory (усього, доступно, використано), Ethernet (IPv4). Resource Monitor — у меню «...» вкладки Performance." },
      ],
      report: [],
      screenshots: [
        { what: "Три категорії процесів і розгорнутий Windows Command Processor", how: "Вкладка Processes." },
        { what: "Сортування за пам'яттю у відсотках", how: "Контекстне меню заголовка Memory." },
        { what: "Services, CPU, Memory, Ethernet", how: "Відповідні вкладки." },
        { what: "Монітор ресурсів", how: "«...» > Resource Monitor." },
      ],
      questions: [
        "Що перелічено під заголовком Windows Command Processor?",
        "Яке місце розташування файлу і процесу Console Window Host?",
        "Що відбувається з Windows Command Processor і Console Window Host, коли вікно командного рядка закрито?",
        "Як подвійне натискання заголовка Memory впливає на стовпці?",
        "Як показ пам'яті у відсотках впливає на стовпець і чому це корисно?",
        "Що відбувається після подвійного натискання на браузері? Що стається з його вікнами після End task?",
        "Які статуси служб вказані?",
        "Скільки потоків і процесів? Скільки фізичної пам'яті усього, доступно й використовується?",
        "Яка швидкість з'єднання і IPv4-адреса ПК?",
        "Чому адміністратору важливо розуміти, як працювати в Диспетчері завдань?",
      ],
    },
    findings: [
      { title: "Категорії й Command Processor", body: "Apps — відкриті програми, Background processes — фонові, Windows processes — система й служби. Під Windows Command Processor — вікно Command Prompt, що належить cmd.exe." },
      { title: "Console Window Host", body: "C:\\Windows\\System32\\conhost.exe; після exit обидва процеси завершуються." },
      { title: "Memory", body: "Перше натискання — за спаданням без поділу на категорії, друге — за зростанням. У відсотках видно частку фізичної пам'яті незалежно від обсягу ОЗП — легко знайти найвимогливіший процес." },
      { title: "Браузер", body: "Група розгортається на процеси Browser, GPU, Utility, Renderer, Subframe, Tab — збій вкладки не валить інші. End task закриває всі вікна без запиту." },
      { title: "Служби", body: "Running і Stopped (у служб, що підтримують, — ще Paused); у тих, що працюють, є PID." },
      { title: "Продуктивність", body: "Числа залежать від машини: CPU показує процеси, потоки й дескриптори; Memory — усього, Available, In use, Committed, кеш; Ethernet — IPv4 (у NAT VirtualBox 10.0.2.15) і графік." },
      { title: "Навіщо адміністратору", body: "Найшвидший вбудований інструмент: які процеси й скільки ресурсів споживають, завершення зависання, стан служб, перевірка файлу процесу через Details/Properties — перший крок до незнайомого процесу чи процесу з системною назвою в незвичній теці." },
    ],
    errata: [
      "У Windows 11 Диспетчер одразу відкривається повним, кнопки «Докладніше» немає; вкладки — на панелі ліворуч, є пошук процесів.",
      "Сторінка Ethernet у Windows 11 швидкості з'єднання не показує (адаптер VirtualBox Intel PRO/1000 — 1 Гбіт/с).",
      "Кнопку Open Resource Monitor перенесено в меню «...» вкладки Performance.",
    ],
  },
  {
    slug: "cisco-3-3-13",
    intro:
      "Инструменты администрирования Windows: запуск и остановка службы маршрутизации и удалённого доступа с наблюдением в " +
      "Сетевых подключениях и Мониторе производительности, события в журнале System и набор сборщика данных с CSV.",
    guide: {
      source: `${SRC}, Lab 3.3.13 «Monitor and Manage System Resources in Windows»`,
      goals: ["Використовувати інструменти адміністрування: служби, монітор продуктивності, журнали подій, набори збирачів даних."],
      steps: [
        { title: "Служба RRAS", body: "Network Connections (Change adapter settings) лишити відкритим; Performance Monitor: Freeze Display, Clear. У Services для Routing and Remote Access тип запуску Disabled → Manual, Apply; Unfreeze, Start, F5. Потім Stop (якщо кнопка неактивна — закрити й знову відкрити властивості), Freeze, тип графіка Report, тип запуску знову Disabled." },
        { title: "Журнал System", body: "Computer Management > Event Viewer > Windows Logs > System: чотири найновіші події служби." },
        { title: "Набір збирача даних", body: "Performance Monitor > Data Collector Sets > User Defined > New > Data Collector Set: Memory Logs, Create manually (Advanced), Performance counter, Memory\\Available MBytes, інтервал 4 с, корінь C:\\PerfLogs. Формат DataCollector01 — Comma Separated. Запустити, відкрити й закрити браузер, зупинити, відкрити CSV, видалити набір і теку." },
      ],
      report: [],
      screenshots: [
        { what: "Incoming Connections у Network Connections під час роботи служби", how: "Після Start." },
        { what: "Графік і подання Report Performance Monitor", how: "Freeze Display; Change graph type > Report." },
        { what: "Чотири події служби в журналі System", how: "Event Viewer." },
        { what: "Налаштування набору Memory Logs і CSV у Блокноті", how: "Майстер набору; файл у C:\\PerfLogs." },
      ],
      questions: [
        "Які зміни з'являються у вікні після запуску служби? Після зупинки?",
        "Який лічильник найбільше записується на графіку? Які значення відображаються в поданні Report?",
        "Який статус і тип запуску служби після зміни на Disabled?",
        "Як описати кожну з чотирьох подій?",
        "Який повний шлях до файлу в прикладі?",
        "Які зміни ви помітите на значку Memory Logs?",
        "Що показано в найдальшому стовпці праворуч?",
      ],
    },
    findings: [
      { title: "Запуск і зупинка", body: "Після Start у Network Connections з'являється Incoming Connections (No clients connected) — служба створює вхідне підключення; після Stop воно зникає. На графіку — лише короткі сплески завантаження процесора." },
      { title: "Лічильник і Report", body: "% Processor Time (_Total) — лічильник за замовчуванням; Report показує комп'ютер, об'єкт Processor Information, екземпляр _Total і останнє значення графіка." },
      { title: "Після Disabled", body: "Status порожній (зупинена), Startup Type — Disabled: не запуститься, доки адміністратор не змінить тип." },
      { title: "Чотири події (Windows 11)", body: "7040 — тип запуску disabled → demand start; дві 20063 RemoteAccess під час старту (не знайдено rasgreeng.dll для GRE, IKEv2 не підтримується) — так у журналі видно запуск; 7040 — demand start → disabled." },
      { title: "Шлях і CSV", body: "C:\\PerfLogs\\<ІМ'Я-ПК>_<дата>-000001\\DataCollector01.csv. Під час збору на значку набору зелена стрілка, після зупинки зникає. Правий стовпець — \\\\<ПК>\\Memory\\Available MBytes: доступна пам'ять у кожну вибірку; відкритий браузер помітно її зменшує." },
    ],
    errata: [
      "Windows 11 не пише в журнал System подію 7036 про запуск і зупинку служби — замість четвірки з методички видно дві 7040 і помилки 20063 під час старту.",
      "Кнопка Stop у вікні властивостей після Start може лишатися неактивною — методичка це передбачає: закрити вікно й відкрити знову.",
      "Excel у машині немає — CSV відкривається Блокнотом (Just once); видалення теки в Windows 11 не питає підтвердження.",
    ],
  },
];

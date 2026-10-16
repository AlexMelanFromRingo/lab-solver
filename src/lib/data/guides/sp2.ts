import type { GuideModule } from "./types";
import { KERNELS, divisionSchemes, lab1Program, splitCode } from "@/lib/algorithms/sp-kernels";

/**
 * «Системне програмування» — методичні рекомендації до чотирьох лабораторних
 * робіт (МЕТОДРЕК_СП, LIDER). Усі чотири виконуються над однією задачею: номер
 * варіанта — порядковий номер у списку групи, обчислювальне ядро (табл. 7)
 * супроводжує курс до кінця. На сайті за замовчуванням варіант 1. ЛР1 збирає
 * консольну програму з ядром і WinAPI, ЛР2 ділить діапазон між потоками,
 * ЛР3 відтворює й усуває гонку даних, ЛР4 керує віртуальною пам'яттю і правами.
 */

const SRC = "Системне програмування, методичні рекомендації до лабораторних робіт (МЕТОДРЕК_СП, LIDER)";
const V = (hint: string) => ({ label: "варіанта", min: 1, max: 20, hint });
const kern = (v: number) => KERNELS[v - 1];

// ЛР3, табл. 10
const L3: Record<number, [string, string]> = {
  1: ["кількість оброблених елементів", "межі діапазону"],
  2: ["кількість знайдених простих чисел", "межі діапазону і крок"],
  3: ["кількість точок усередині чверті кола", "межі діапазону"],
  4: ["кількість доданків, більших за задане значення", "межі діапазону і поріг"],
  5: ["кількість обчислених доданків ряду", "межі діапазону і значення x"],
  6: ["суму кількостей дільників", "межі діапазону"],
  7: ["кількість чисел із сумою цифр, кратною трьом", "межі діапазону"],
  8: ["кількість ненульових добутків", "межі діапазону"],
  9: ["кількість елементів, більших за середнє", "межі діапазону і середнє"],
  10: ["кількість елементів у заданому відрі", "межі діапазону і межі відра"],
  11: ["кількість обчислених прямокутників", "межі діапазону і крок"],
  12: ["кількість нульових залишків", "межі діапазону і модуль"],
  13: ["кількість оброблених байтів", "межі діапазону"],
  14: ["кількість перевірених чисел", "межі діапазону"],
  15: ["кількість знайдених паліндромів", "межі діапазону"],
  16: ["кількість доданків, більших за одиницю", "межі діапазону"],
  17: ["кількість обчислених доданків ряду", "межі діапазону і значення x"],
  18: ["кількість оновлень поточного максимуму", "межі діапазону"],
  19: ["кількість елементів, менших за задане значення", "межі діапазону і поріг"],
  20: ["кількість взаємно простих пар", "межі діапазону"],
};

// ЛР4, табл. 11
const L4: Record<number, [string, string, string]> = {
  1: ["64 МБ", "чверть", "читання даних"], 2: ["128 МБ", "восьма частина", "читання даних"],
  3: ["32 МБ", "половина", "запис даних"], 4: ["256 МБ", "шістнадцята частина", "читання атрибутів"],
  5: ["64 МБ", "половина", "запис даних"], 6: ["128 МБ", "чверть", "читання даних"],
  7: ["32 МБ", "чверть", "видалення"], 8: ["96 МБ", "третина", "читання даних"],
  9: ["64 МБ", "восьма частина", "запис даних"], 10: ["192 МБ", "шістнадцята частина", "читання даних"],
  11: ["48 МБ", "половина", "читання атрибутів"], 12: ["128 МБ", "третина", "запис даних"],
  13: ["64 МБ", "чверть", "читання даних"], 14: ["256 МБ", "восьма частина", "видалення"],
  15: ["32 МБ", "третина", "читання даних"], 16: ["96 МБ", "чверть", "запис даних"],
  17: ["160 МБ", "восьма частина", "читання даних"], 18: ["64 МБ", "третина", "читання атрибутів"],
  19: ["128 МБ", "половина", "запис даних"], 20: ["48 МБ", "чверть", "читання даних"],
};

const RIGHT_FLAG: Record<string, string> = {
  "читання даних": "FILE_READ_DATA", "запис даних": "FILE_WRITE_DATA",
  "читання атрибутів": "FILE_READ_ATTRIBUTES", видалення: "DELETE",
};
const FRACTION: Record<string, string> = {
  чверть: "1/4", половина: "1/2", третина: "1/3", "восьма частина": "1/8",
  "шістнадцята частина": "1/16",
};

export const SP2_GUIDES: GuideModule[] = [
  {
    slug: "sp2-lab1",
    intro:
      { uk: "Збірка консольної C++-програми у Debug і Release, виклик функцій WinAPI і спостереження за своїм процесом. Нижче — готове обчислювальне ядро compute(from, to) під ваш варіант (його ж використовують роботи 2–4), замір часу QueryPerformanceCounter, виклики WinAPI і як відтворити невдалий виклик з кодом помилки.", ru: "Сборка консольной C++-программы в Debug и Release, вызов функций WinAPI и наблюдение за своим процессом. Ниже — готовое вычислительное ядро compute(from, to) под ваш вариант (его же используют работы 2–4), замер времени QueryPerformanceCounter, вызовы WinAPI и как воспроизвести неудачный вызов с кодом ошибки." },
    variant: {
      ...V("Номер варіанта = порядковий номер у списку групи (табл. 7). Ядро супроводжує всі чотири роботи."),
      compute: (v: number) => {
      const k = kern(v);
      return {
        codeFirst: true,
        tables: [
          { title: `Варіант ${v}: ${k.title}`, columns: ["Обчислювальне ядро", "Що повертає для [a, b)", "Тип результату"], rows: [[k.title, k.what, k.returns === "Result" ? "структура {value, index}" : k.returns]] },
        ],
        code: [
          { title: "Повна програма ЛР1 (стенд: Visual Studio, Console App C++, x64)", code: lab1Program(k, 200000000n), note: "N добирають так, щоб у Release обчислення тривало не менше секунди (починати зі 100 млн, подвоювати). Результат обов'язково друкується, інакше оптимізатор у Release прибере цикл." },
          {
            title: "WinAPI: відомості про систему й процес (етап 4)",
            code: `SYSTEM_INFO si;\nGetSystemInfo(&si);\nprintf("logical CPUs = %u\\n", si.dwNumberOfProcessors);\n\nMEMORYSTATUSEX ms{ sizeof(ms) };\nGlobalMemoryStatusEx(&ms);\nprintf("RAM = %llu MB\\n", ms.ullTotalPhys / (1024 * 1024));\n\nFILETIME c, e, kt, ut;\nGetProcessTimes(GetCurrentProcess(), &c, &e, &kt, &ut);\nULONGLONG user = (((ULONGLONG)ut.dwHighDateTime << 32) | ut.dwLowDateTime) / 10000;\nprintf("user time = %llu ms\\n", user);\n\nchar name[MAX_PATH];\nif (!GetModuleFileNameA(NULL, name, MAX_PATH))\n    printf("GetModuleFileName failed: %lu\\n", GetLastError());\nelse\n    printf("exe = %s\\n", name);`,
            note: "Час користувача й ядра в GetProcessTimes — у 100-нс одиницях, тому ділимо на 10000 для мілісекунд. Їх зіставляють з вкладкою Performance у Process Explorer.",
          },
          {
            title: "Неудачний виклик і код помилки (етап 5)",
            code: `// навмисно малий буфер — виклик не вміститься\nchar small[4];\nif (!GetModuleFileNameA(NULL, small, sizeof(small)))\n{\n    DWORD e = GetLastError();\n    char msg[256];\n    FormatMessageA(FORMAT_MESSAGE_FROM_SYSTEM, NULL, e, 0, msg, sizeof(msg), NULL);\n    printf("error %lu: %s", e, msg);   // 122 ERROR_INSUFFICIENT_BUFFER\n}`,
            note: "Функції WinAPI повідомляють про помилку поверненим значенням, а код — через GetLastError; FormatMessage дає його текстовий опис.",
          },
        ],
        notes: [
          "Витік дескрипторів для етапу 6: у циклі викликати OpenProcess(..., GetCurrentProcessId()) без CloseHandle — у Process Explorer стовпець Handles зростатиме; додати CloseHandle — стане сталим.",
          "Запускати для вимірювання без налагоджувача (Ctrl+F5), інакше час завищений.",
        ],
      };
      },
    },
    guide: {
      source: `${SRC}, лабораторна робота № 1`,
      goals: ["Збирати проєкт у Debug і Release, викликати функції WinAPI і розпізнавати причину невдалого виклику, спостерігати за показниками власного процесу."],
      steps: [
        { title: "Етап 1", body: "Створити Console App C++, перевірити збірку в Debug і Release, платформа x64." },
        { title: "Етап 2", body: "Ядро compute(from, to) окремою функцією з межами-параметрами (у ЛР2 його викличуть кілька потоків)." },
        { title: "Етап 3", body: "Замір часу QueryPerformanceCounter, тричі в кожній конфігурації; відношення середніх." },
        { title: "Етап 4", body: "GetSystemInfo, GlobalMemoryStatusEx, GetProcessTimes, GetModuleFileName." },
        { title: "Етап 5", body: "Неудачний виклик (малий буфер), GetLastError + FormatMessage." },
        { title: "Етапи 6–9", body: "Знайти внесену помилку налагоджувачем; витік і сталість Handles у Process Explorer." },
      ],
      screenshots: [
        { what: "Вікно програми з відомостями про систему й процес", how: "Після етапу 4." },
        { what: "Повідомлення про невдалий виклик з кодом і описом", how: "Етап 5." },
        { what: "Налагоджувач на точці зупину з неправильним значенням у локальних змінних", how: "Етап 6." },
        { what: "Вкладка Performance процесу в Process Explorer (час користувача й ядра)", how: "—" },
        { what: "Стовпець Handles під час витоку і після виправлення", how: "Два знімки." },
      ],
      report: ["Тема, мета, номер і формулювання варіанта.", "Умови вимірювання (процесор, логічні процесори, ОЗУ, Windows, середовище).", "Таблиця часу Debug/Release (3 повтори).", "Показники процесу і Process Explorer.", "Опис неудачного виклику.", "Лістинг, відповіді на питання, висновки."],
      questions: [],
    },
  },
  {
    slug: "sp2-lab2",
    intro:
      { uk: "Поділ того самого обчислювального ядра між потоками (CreateThread/WaitForMultipleObjects) за схемою варіанта і вимірювання прискорення при різній кількості потоків. Нижче — схема поділу, код розподілу діапазону і серія потоків під варіант.", ru: "Деление того же вычислительного ядра между потоками (CreateThread/WaitForMultipleObjects) по схеме варианта и измерение ускорения при разном числе потоков. Ниже — схема деления, код распределения диапазона и серия потоков под вариант." },
    variant: {
      ...V("Той самий номер, що й у ЛР1 (табл. 9). Ядро не змінюється — змінюється лише спосіб поділу діапазону."),
      compute: (v: number) => {
      const k = kern(v);
      const { scheme, threads } = divisionSchemes(v);
      const sc = splitCode(scheme);
      return {
        codeFirst: true,
        tables: [
          { title: `Варіант ${v}`, columns: ["Ядро (з ЛР1)", "Схема поділу діапазону", "Кількість потоків у серії"], rows: [[k.title, scheme, threads.join(", ")]] },
          {
            title: "Таблиця прискорення (заповнюється вимірюваннями, 3 повтори на значення)",
            columns: ["Потоків T", "Час, с (середній)", "Прискорення S = t₁/t_T", "Ефективність S/T"],
            rows: threads.map((t) => [t, t === 1 ? "t₁" : "…", t === 1 ? "1,00" : "…", t === 1 ? "1,00" : "…"]),
            note: "Прискорення зростає не лінійно: заважають накладні на створення потоків, конкуренція за кеш і пам'ять. Для схеми поділу цього варіанта пояснити форму кривої.",
          },
        ],
        code: [
          {
            title: `Розподіл діапазону між T потоками — ${scheme}`,
            code: `struct Arg { long long from, to; ${k.returns}* part; };\n\nDWORD WINAPI worker(LPVOID p)\n{\n    Arg* a = (Arg*)p;\n    *a->part = compute(a->from, a->to);   // ядро з ЛР1\n    return 0;\n}\n\nvoid runThreads(int T)\n{\n    std::vector<Arg> args(T);\n    std::vector<${k.returns}> parts(T);\n    std::vector<HANDLE> h(T);\n${sc.code.split("\n").map((l) => "    " + l).join("\n")}\n    for (int i = 0; i < T; ++i)\n        h[i] = CreateThread(NULL, 0, worker, &args[i], 0, NULL);\n    WaitForMultipleObjects(T, h.data(), TRUE, INFINITE);\n    ${k.returns} total${k.returns === "double" ? " = 0.0" : "{}"};\n    for (int i = 0; i < T; ++i) { total += parts[i]; CloseHandle(h[i]); }\n}`,
            note: sc.note,
          },
          {
            title: "Дочірній процес (етап роботи): CreateProcess і код виходу",
            code: `STARTUPINFOA si{ sizeof(si) };\nPROCESS_INFORMATION pi;\nchar cmd[] = "child.exe";\nif (CreateProcessA(NULL, cmd, NULL, NULL, FALSE, 0, NULL, NULL, &si, &pi))\n{\n    WaitForSingleObject(pi.hProcess, INFINITE);\n    DWORD code;\n    GetExitCodeProcess(pi.hProcess, &code);\n    printf("child exit code = %lu\\n", code);\n    CloseHandle(pi.hThread);\n    CloseHandle(pi.hProcess);\n}`,
          },
        ],
      };
      },
    },
    guide: {
      source: `${SRC}, лабораторна робота № 2`,
      goals: ["Створювати потоки й дочірні процеси, розподіляти між потоками обчислення, очікувати завершення й читати коди повернення."],
      steps: [
        { title: "Потоки", body: "Ядро з ЛР1 без змін; поділ діапазону за схемою варіанта; кожен потік пише в свій елемент масиву часткових результатів." },
        { title: "Серія вимірювань", body: "Для кожної кількості потоків серії — 3 повтори; прискорення як відношення до одного потоку." },
        { title: "Дочірній процес", body: "CreateProcess, WaitForSingleObject, GetExitCodeProcess." },
      ],
      screenshots: [{ what: "Таблиця й графік прискорення", how: "За серією потоків варіанта." }],
      report: ["Тема, мета, номер і формулювання варіанта, схема поділу.", "Таблиця й графік прискорення.", "Лістинг, відповіді на питання, висновки про форму кривої прискорення."],
      questions: [],
    },
  },
  {
    slug: "sp2-lab3",
    intro:
      { uk: "Відтворення і усунення гонки даних на спільному лічильнику і обмін даними між процесами через іменований канал і спільну пам'ять. Нижче — що накопичує лічильник і що передається через канал у вашому варіанті, код гонки і трьох засобів синхронізації.", ru: "Воспроизведение и устранение гонки данных на общем счётчике и обмен данными между процессами через именованный канал и общую память. Ниже — что накапливает счётчик и что передаётся через канал в вашем варианте, код гонки и трёх средств синхронизации." },
    variant: {
      ...V("Той самий номер (табл. 10). Змінюється, що накопичує спільний лічильник і що передається через канал."),
      compute: (v: number) => {
      const [counter, pipe] = L3[v];
      return {
        tables: [
          { title: `Варіант ${v}`, columns: ["Що накопичує спільний лічильник", "Що передається через канал"], rows: [[counter, pipe]] },
          {
            title: "Порівняння засобів синхронізації (заповнюється вимірюваннями)",
            columns: ["Засіб", "Результат", "Час, с", "Вартість"],
            rows: [
              ["без синхронізації", "неправильний (гонка)", "найменший", "—"],
              ["InterlockedIncrement (атомарна операція)", "правильний", "малий", "найдешевша для одного лічильника"],
              ["CRITICAL_SECTION", "правильний", "середній", "дешевша за м'ютекс, лише в межах процесу"],
              ["Mutex (CreateMutex)", "правильний", "найбільший", "працює й між процесами"],
            ],
            note: `Спільний лічильник накопичує «${counter}». Щоб гонка була стабільною, лічильник оновлюють дуже часто й без синхронізації — тоді втрати інкрементів видно при кожному запуску, а не зрідка.`,
          },
        ],
        code: [
          {
            title: "Гонка даних на спільному лічильнику",
            code: `volatile long shared = 0;   // ${counter}\n\nDWORD WINAPI worker(LPVOID)\n{\n    for (int i = 0; i < 1000000; ++i)\n        shared = shared + 1;     // читання-зміна-запис без захисту: інкременти губляться\n    return 0;\n}\n// після T потоків shared < T * 1000000 — це й є гонка`,
            note: "Неправильний результат стабільний саме через дуже часте оновлення спільної змінної кількома потоками одночасно.",
          },
          {
            title: "Три засоби усунення гонки",
            code: `// 1) атомарна операція\nInterlockedIncrement(&shared);\n\n// 2) критична секція\nCRITICAL_SECTION cs; InitializeCriticalSection(&cs);\nEnterCriticalSection(&cs); shared++; LeaveCriticalSection(&cs);\n\n// 3) м'ютекс\nHANDLE m = CreateMutex(NULL, FALSE, NULL);\nWaitForSingleObject(m, INFINITE); shared++; ReleaseMutex(m);`,
          },
          {
            title: `Передача між процесами через іменований канал (${pipe})`,
            code: `// сервер\nHANDLE pipe = CreateNamedPipeA("\\\\\\\\.\\\\pipe\\\\lab3", PIPE_ACCESS_DUPLEX,\n    PIPE_TYPE_MESSAGE | PIPE_WAIT, 1, 512, 512, 0, NULL);\nConnectNamedPipe(pipe, NULL);\nDWORD n;\nReadFile(pipe, buf, sizeof(buf), &n, NULL);   // приймає ${pipe}\n\n// клієнт\nHANDLE p = CreateFileA("\\\\\\\\.\\\\pipe\\\\lab3", GENERIC_WRITE, 0, NULL, OPEN_EXISTING, 0, NULL);\nWriteFile(p, data, size, &n, NULL);            // передає ${pipe}`,
            note: "Те саме можна зробити через спільну пам'ять: CreateFileMapping + MapViewOfFile, а синхронізацію готовності — подією CreateEvent.",
          },
        ],
      };
      },
    },
    guide: {
      source: `${SRC}, лабораторна робота № 3`,
      goals: ["Відтворювати гонку даних, усувати її різними засобами й порівнювати їх за вартістю; передавати дані між процесами."],
      steps: [
        { title: "Гонка", body: "Додати спільний лічильник до програми ЛР2, домогтися стабільно неправильного результату." },
        { title: "Синхронізація", body: "Усунути гонку трьома засобами (атомарна операція, критична секція, м'ютекс), виміряти час кожного." },
        { title: "Обмін", body: "Передати дані між двома процесами через іменований канал і через спільну пам'ять." },
      ],
      screenshots: [{ what: "Неправильний і правильні результати, таблиця часу засобів", how: "—" }],
      report: ["Тема, мета, номер і формулювання варіанта.", "Таблиця порівняння засобів синхронізації.", "Лістинг, відповіді на питання, висновок про вибір засобу."],
      questions: [],
    },
  },
  {
    slug: "sp2-lab4",
    intro:
      { uk: "Резервування і передача сторінок віртуальної пам'яті (VirtualAlloc), відображення файлу в пам'ять і розмежування доступу через список контролю доступу. Нижче — обсяг області, що резервується, частка для MEM_COMMIT і право, що забороняється, у вашому варіанті.", ru: "Резервирование и передача страниц виртуальной памяти (VirtualAlloc), отображение файла в память и разграничение доступа через список контроля доступа. Ниже — объём резервируемой области, доля для MEM_COMMIT и запрещаемое право в вашем варианте." },
    variant: {
      ...V("Той самий номер (табл. 11). Змінюються обсяг області, частка для передачі пам'яті й заборонене право."),
      compute: (v: number) => {
      const [size, frac, right] = L4[v];
      const flag = RIGHT_FLAG[right];
      const fr = FRACTION[frac] ?? frac;
      return {
        tables: [
          { title: `Варіант ${v}`, columns: ["Обсяг області", "Частка, яка передається одразу", "Право, що забороняється"], rows: [[size, `${frac} (${fr})`, `${right} (${flag})`]] },
        ],
        code: [
          {
            title: `Резервування ${size} і передача ${fr} пам'яті`,
            code: `SIZE_T total = ${size.replace(" МБ", "")} * 1024 * 1024;\n// крок 1: зарезервувати адресний простір без фізичної пам'яті\nvoid* base = VirtualAlloc(NULL, total, MEM_RESERVE, PAGE_READWRITE);\n// крок 2: передати (commit) лише ${frac} області\nSIZE_T commit = total ${fr.includes("/") ? `/ ${fr.split("/")[1]}` : ""};\nVirtualAlloc(base, commit, MEM_COMMIT, PAGE_READWRITE);\n// у переданій частині можна писати дані обчислювального завдання:\nint* p = (int*)base;\nfor (SIZE_T i = 0; i < commit / sizeof(int); ++i) p[i] = (int)i;`,
            note: "MEM_RESERVE лише бронює діапазон адрес (у VMMap — Reserved), MEM_COMMIT підкріплює його пам'яттю (Committed). Звертання за межі переданої частини дає порушення доступу.",
          },
          {
            title: "Карта адресного простору (зіставити з VMMap)",
            code: `MEMORY_BASIC_INFORMATION mbi;\nunsigned char* addr = 0;\nwhile (VirtualQuery(addr, &mbi, sizeof(mbi)) == sizeof(mbi))\n{\n    const char* s = mbi.State == MEM_COMMIT ? "Committed" :\n                    mbi.State == MEM_RESERVE ? "Reserved" : "Free";\n    printf("%p  %10llu  %s\\n", mbi.BaseAddress, (ULONGLONG)mbi.RegionSize, s);\n    addr += mbi.RegionSize;\n}`,
          },
          {
            title: "Відображення файлу в пам'ять і збереження результату",
            code: `HANDLE f = CreateFileA("result.bin", GENERIC_READ | GENERIC_WRITE, 0, NULL,\n    CREATE_ALWAYS, FILE_ATTRIBUTE_NORMAL, NULL);\nHANDLE map = CreateFileMappingA(f, NULL, PAGE_READWRITE, 0, (DWORD)commit, NULL);\nvoid* view = MapViewOfFile(map, FILE_MAP_WRITE, 0, 0, commit);\nmemcpy(view, base, commit);          // результат потрапляє у файл\nFlushViewOfFile(view, commit);\nUnmapViewOfFile(view);`,
          },
          {
            title: `Заборона права «${right}» (${flag}) і пояснення відмови`,
            code: `// явно заборонити ${flag} у DACL файлу для свого користувача\nEXPLICIT_ACCESSA ea{};\nea.grfAccessPermissions = ${flag};\nea.grfAccessMode = DENY_ACCESS;\nea.grfInheritance = NO_INHERITANCE;\nBuildTrusteeWithNameA(&ea.Trustee, (LPSTR)"CURRENT_USER");\nPACL dacl = NULL;\nSetEntriesInAclA(1, &ea, oldDacl, &dacl);\nSetNamedSecurityInfoA((LPSTR)"result.bin", SE_FILE_OBJECT,\n    DACL_SECURITY_INFORMATION, NULL, NULL, dacl, NULL);\n// тепер власна програма при відповідній операції дістане ERROR_ACCESS_DENIED (5),\n// бо заборона в DACL має перевагу над дозволом`,
            note: "Токен процесу читають OpenProcessToken; відмову пояснюють тим, що запис DENY у списку контролю доступу перевіряється раніше за ALLOW.",
          },
        ],
      };
      },
    },
    guide: {
      source: `${SRC}, лабораторна робота № 4`,
      goals: ["Керувати віртуальною пам'яттю процесу з коду, читати карту адресного простору, відображати файл у пам'ять і аналізувати параметри безпеки об'єкта."],
      steps: [
        { title: "Пам'ять", body: "VirtualAlloc MEM_RESERVE на обсяг варіанта, потім MEM_COMMIT на частку; розмістити дані завдання." },
        { title: "Карта", body: "VirtualQuery програмно, зіставити з VMMap." },
        { title: "Файл", body: "Відобразити файл у пам'ять, зберегти результат." },
        { title: "Права", body: "Прочитати токен і DACL; заборонити право варіанта, пояснити відмову." },
      ],
      screenshots: [{ what: "Карта адресного простору (програма і VMMap), відмова в доступі з кодом", how: "—" }],
      report: ["Тема, мета, номер і формулювання варіанта.", "Карта адресного простору.", "Опис відмови в доступі за фактичним DACL.", "Лістинг, відповіді на питання, висновки."],
      questions: [],
    },
  },
];

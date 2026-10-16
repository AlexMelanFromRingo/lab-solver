/**
 * «Системне програмування», ЛР 1–4: одне обчислювальне ядро супроводжує всі
 * чотири роботи (методрек СП, табл. 7). Для кожного з 20 варіантів — готова
 * функція compute(from, to) на C++ і параметри, що змінюються від роботи до
 * роботи: схема поділу діапазону між потоками (ЛР2, табл. 9), що накопичує
 * спільний лічильник і що передається через канал (ЛР3, табл. 10), обсяг
 * області пам'яті, частка й заборонене право (ЛР4, табл. 11).
 */

export interface Kernel {
  n: number;
  title: string;
  returns: string;
  /** Повертає для діапазону [a, b) — пояснення з табл. 7. */
  what: string;
  /** Тіло compute: оголошення, цикл, повернення. */
  body: string;
  /** Чи потрібен масив (заповнюється PRNG з фіксованим seed). */
  needsArray?: boolean;
  /** Додаткова константа (x, поріг, відро) у сигнатурі. */
  extra?: string;
}

const ARR = `// масив із фіксованим генератором: результат однаковий від запуску до запуску
static std::vector<int> makeData(long long n)
{
    std::mt19937 gen(12345);
    std::uniform_int_distribution<int> dist(0, 999);
    std::vector<int> a(n);
    for (long long i = 0; i < n; ++i) a[i] = dist(gen);
    return a;
}
static const std::vector<int> DATA = makeData(N);`;

export const KERNELS: Kernel[] = [
  { n: 1, title: "Ряд Лейбніца", returns: "double", what: "суму доданків (-1)^k / (2k+1)", body: `    double s = 0.0;\n    for (long long k = from; k < to; ++k)\n    {\n        double t = 1.0 / (2.0 * k + 1.0);\n        s += (k % 2 == 0) ? t : -t;\n    }\n    return s;` },
  { n: 2, title: "Прості числа", returns: "long long", what: "кількість простих чисел у діапазоні", body: `    long long count = 0;\n    for (long long k = from; k < to; ++k)\n    {\n        if (k < 2) continue;\n        bool prime = true;\n        for (long long d = 2; d * d <= k; ++d)\n            if (k % d == 0) { prime = false; break; }\n        if (prime) ++count;\n    }\n    return count;` },
  { n: 3, title: "Метод Монте-Карло", returns: "long long", what: "кількість точок, що потрапили в чверть кола", body: `    long long inside = 0;\n    for (long long k = from; k < to; ++k)\n    {\n        // детермінована «псевдовипадкова» точка в [0,1)^2 від індексу k\n        double x = (double)((k * 1103515245LL + 12345) & 0x7fffffff) / 0x7fffffff;\n        double y = (double)((k * 1234567891LL + 98765) & 0x7fffffff) / 0x7fffffff;\n        if (x * x + y * y <= 1.0) ++inside;\n    }\n    return inside;` },
  { n: 4, title: "Сума квадратів", returns: "unsigned long long", what: "суму квадратів індексів", body: `    unsigned long long s = 0;\n    for (long long k = from; k < to; ++k)\n        s += (unsigned long long)k * (unsigned long long)k;\n    return s;` },
  { n: 5, title: "Ряд для експоненти", returns: "double", what: "суму доданків x^k / k! при заданому x", extra: "double x", body: `    double s = 0.0, term = 1.0;\n    // term для k = from: x^from / from!\n    for (long long k = 1; k <= from; ++k) term *= x / k;\n    for (long long k = from; k < to; ++k)\n    {\n        s += term;\n        term *= x / (k + 1);\n    }\n    return s;` },
  { n: 6, title: "Кількість дільників", returns: "long long", what: "суму кількостей дільників чисел діапазону", body: `    long long s = 0;\n    for (long long k = from; k < to; ++k)\n    {\n        if (k < 1) continue;\n        long long d = 0;\n        for (long long i = 1; i * i <= k; ++i)\n            if (k % i == 0) d += (i * i == k) ? 1 : 2;\n        s += d;\n    }\n    return s;` },
  { n: 7, title: "Сума цифр", returns: "long long", what: "суму цифр усіх чисел діапазону", body: `    long long s = 0;\n    for (long long k = from; k < to; ++k)\n    {\n        long long x = k < 0 ? -k : k;\n        while (x) { s += x % 10; x /= 10; }\n    }\n    return s;` },
  { n: 8, title: "Скалярний добуток", returns: "long long", what: "суму добутків відповідних елементів двох масивів", needsArray: true, body: `    long long s = 0;\n    for (long long k = from; k < to; ++k)\n        s += (long long)DATA[k] * DATA2[k];\n    return s;` },
  { n: 9, title: "Норма вектора", returns: "double", what: "суму квадратів елементів масиву", needsArray: true, body: `    double s = 0.0;\n    for (long long k = from; k < to; ++k)\n        s += (double)DATA[k] * DATA[k];\n    return s;` },
  { n: 10, title: "Гістограма", returns: "long long", what: "кількість елементів масиву, що потрапили в задане відро", needsArray: true, extra: "int lo, int hi", body: `    long long count = 0;\n    for (long long k = from; k < to; ++k)\n        if (DATA[k] >= lo && DATA[k] < hi) ++count;\n    return count;` },
  { n: 11, title: "Інтеграл прямокутниками", returns: "double", what: "суму площ прямокутників під заданою кривою", extra: "double h", body: `    double s = 0.0;\n    for (long long k = from; k < to; ++k)\n    {\n        double x = (k + 0.5) * h;      // середина k-го прямокутника\n        s += (4.0 / (1.0 + x * x)) * h; // крива 4/(1+x^2): інтеграл на [0,1] = pi\n    }\n    return s;` },
  { n: 12, title: "Числа Фібоначчі за модулем", returns: "long long", what: "кількість індексів, для яких залишок дорівнює нулю", extra: "long long m", body: `    long long count = 0, a = 0, b = 1;\n    for (long long k = 0; k < to; ++k)\n    {\n        if (k >= from && a % m == 0) ++count;\n        long long t = (a + b) % m; a = b % m; b = t;\n    }\n    return count;` },
  { n: 13, title: "Контрольна сума CRC32", returns: "unsigned", what: "накопичену контрольну суму ділянки масиву", needsArray: true, body: `    unsigned crc = 0xFFFFFFFFu;\n    for (long long k = from; k < to; ++k)\n    {\n        crc ^= (unsigned char)DATA[k];\n        for (int i = 0; i < 8; ++i)\n            crc = (crc >> 1) ^ (0xEDB88320u & (-(int)(crc & 1)));\n    }\n    return crc ^ 0xFFFFFFFFu;` },
  { n: 14, title: "Досконалі числа", returns: "long long", what: "кількість чисел, рівних сумі власних дільників", body: `    long long count = 0;\n    for (long long k = from; k < to; ++k)\n    {\n        if (k < 2) continue;\n        long long sum = 1;\n        for (long long i = 2; i * i <= k; ++i)\n            if (k % i == 0) { sum += i; if (i * i != k) sum += k / i; }\n        if (sum == k) ++count;\n    }\n    return count;` },
  { n: 15, title: "Паліндроми", returns: "long long", what: "кількість чисел діапазону, що читаються однаково в обидва боки", body: `    long long count = 0;\n    for (long long k = from; k < to; ++k)\n    {\n        long long x = k, rev = 0;\n        while (x > 0) { rev = rev * 10 + x % 10; x /= 10; }\n        if (rev == k) ++count;\n    }\n    return count;` },
  { n: 16, title: "Сума логарифмів", returns: "double", what: "суму натуральних логарифмів індексів", body: `    double s = 0.0;\n    for (long long k = from; k < to; ++k)\n        if (k > 0) s += std::log((double)k);\n    return s;` },
  { n: 17, title: "Ряд для арктангенса", returns: "double", what: "суму доданків ряду arctg(x) при заданому x", extra: "double x", body: `    double s = 0.0;\n    for (long long k = from; k < to; ++k)\n    {\n        double t = std::pow(x, 2 * k + 1) / (2 * k + 1);\n        s += (k % 2 == 0) ? t : -t;\n    }\n    return s;` },
  { n: 18, title: "Максимум і його індекс", returns: "Result", what: "найбільше значення ділянки масиву та його індекс", needsArray: true, body: `    Result r{ DATA[from], from };\n    for (long long k = from + 1; k < to; ++k)\n        if (DATA[k] > r.value) { r.value = DATA[k]; r.index = k; }\n    return r;` },
  { n: 19, title: "Сортування підрахунком", returns: "long long", what: "кількість елементів ділянки, менших за задане значення", needsArray: true, extra: "int pivot", body: `    long long count = 0;\n    for (long long k = from; k < to; ++k)\n        if (DATA[k] < pivot) ++count;\n    return count;` },
  { n: 20, title: "Взаємно прості пари", returns: "long long", what: "кількість пар сусідніх чисел, НСД яких дорівнює одиниці", body: `    long long count = 0;\n    for (long long k = from; k < to; ++k)\n    {\n        long long a = k, b = k + 1;\n        while (b) { long long t = a % b; a = b; b = t; }\n        if (a == 1) ++count;\n    }\n    return count;` },
];

export const divisionSchemes = (n: number): { scheme: string; threads: number[] } => {
  const t: Record<number, string> = {
    1: "рівними суцільними блоками", 2: "циклічно по одному елементу", 3: "блоками зі зростаючим розміром",
    4: "рівними суцільними блоками", 5: "циклічно блоками по 1024 елементи", 6: "рівними суцільними блоками",
    7: "циклічно по одному елементу", 8: "блоками зі спадним розміром", 9: "рівними суцільними блоками",
    10: "циклічно блоками по 4096 елементів", 11: "рівними суцільними блоками", 12: "циклічно по одному елементу",
    13: "блоками зі зростаючим розміром", 14: "рівними суцільними блоками", 15: "циклічно блоками по 256 елементів",
    16: "рівними суцільними блоками", 17: "блоками зі спадним розміром", 18: "циклічно по одному елементу",
    19: "рівними суцільними блоками", 20: "циклічно блоками по 512 елементів",
  };
  const th: Record<number, number[]> = {
    1: [1, 2, 4, 8], 2: [1, 2, 4, 8], 3: [1, 2, 3, 4, 6], 4: [1, 2, 4, 6, 8], 5: [1, 2, 4, 8],
    6: [1, 2, 3, 4, 8], 7: [1, 2, 4, 6], 8: [1, 2, 4, 8], 9: [1, 2, 4, 8, 12], 10: [1, 2, 4, 8],
    11: [1, 2, 3, 6], 12: [1, 2, 4, 8], 13: [1, 2, 4, 6], 14: [1, 2, 4, 8], 15: [1, 2, 4, 8],
    16: [1, 2, 4, 6, 8], 17: [1, 2, 4, 8], 18: [1, 2, 3, 4], 19: [1, 2, 4, 8, 16], 20: [1, 2, 4, 8],
  };
  return { scheme: t[n], threads: th[n] };
};

/** Код поділу діапазону для ЛР2 за схемою. */
export function splitCode(scheme: string): { code: string; note: string } {
  if (scheme.startsWith("рівними суцільними")) {
    return {
      code: `// рівні суцільні блоки: потік i обробляє [i*N/T, (i+1)*N/T)\nlong long chunk = N / T;\nfor (int i = 0; i < T; ++i)\n{\n    long long a = i * chunk;\n    long long b = (i == T - 1) ? N : a + chunk;   // останній добирає залишок\n    args[i] = { a, b, &parts[i] };\n}`,
      note: "Останній потік добирає залишок N % T, щоб не загубити кінцеві елементи.",
    };
  }
  if (scheme.startsWith("циклічно по одному")) {
    return {
      code: `// циклічно по одному елементу: потік i бере елементи i, i+T, i+2T, …\n// ядро викликають зі step: compute(from, to, step)\nfor (int i = 0; i < T; ++i)\n    args[i] = { (long long)i, N, (long long)T, &parts[i] };`,
      note: "Ядро приймає ще й крок T; гірше використовує кеш, ніж суцільні блоки — це й досліджують.",
    };
  }
  const m = scheme.match(/по (\d+)/);
  if (m) {
    return {
      code: `// циклічно блоками по ${m[1]} елементів: потік i бере блок i, потім i+T, …\nconst long long BLOCK = ${m[1]};\nfor (int i = 0; i < T; ++i)\n    args[i] = { (long long)i, N, (long long)T, BLOCK, &parts[i] };`,
      note: `Компроміс між суцільними блоками й поелементним поділом: блок із ${m[1]} елементів тримає локальність кешу.`,
    };
  }
  const grow = scheme.includes("зростаючим");
  return {
    code: `// блоки ${grow ? "зі зростаючим" : "зі спадним"} розміром: суми ваг 1..T\nlong long total = (long long)T * (T + 1) / 2;\nlong long pos = 0;\nfor (int i = 0; i < T; ++i)\n{\n    long long w = ${grow ? "i + 1" : "T - i"};              // вага блоку\n    long long len = N * w / total;\n    long long a = pos;\n    long long b = (i == T - 1) ? N : pos + len;\n    args[i] = { a, b, &parts[i] };\n    pos = b;\n}`,
    note: `Перший потік отримує ${grow ? "найменший" : "найбільший"} блок; частини різні за обсягом, тому завершуються неодночасно.`,
  };
}

/** Повна програма ЛР1 для варіанта. */
export function lab1Program(k: Kernel, n: bigint): string {
  const needArr = k.needsArray;
  const extraDecl = k.extra ? `, ${k.extra}` : "";
  const headers = ["#include <windows.h>", "#include <cstdio>"];
  if (/std::log|std::pow/.test(k.body)) headers.push("#include <cmath>");
  if (needArr) headers.push("#include <vector>", "#include <random>");
  const resultStruct = k.returns === "Result" ? `struct Result { int value; long long index; };\n\n` : "";
  const dataDecl = needArr ? `\n${ARR}${k.n === 8 ? `\nstatic const std::vector<int> DATA2 = [] { auto a = makeData(N); for (auto& v : a) v = (v * 7 + 3) % 1000; return a; }();` : ""}\n` : "";
  const callExtra = k.n === 5 ? ", 0.5" : k.n === 10 ? ", 100, 300" : k.n === 11 ? ", 1.0 / N" : k.n === 12 ? ", 1000000007LL" : k.n === 17 ? ", 0.5" : k.n === 19 ? ", 500" : "";
  const print =
    k.returns === "double"
      ? `printf("result = %.12f\\n", r);`
      : k.returns === "Result"
        ? `printf("max = %d at %lld\\n", r.value, r.index);`
        : `printf("result = %lld\\n", (long long)r);`;
  return `${headers.join("\n")}

const long long N = ${n.toString()};
${resultStruct}${dataDecl}
// ${k.what[0].toUpperCase()}${k.what.slice(1)} на діапазоні індексів [from, to).
// Ядро нічого не друкує й не змінює глобальних змінних:
// у роботі 2 його одночасно викличуть кілька потоків.
${k.returns} compute(long long from, long long to${extraDecl})
{
${k.body}
}

int main()
{
    LARGE_INTEGER freq, t1, t2;
    QueryPerformanceFrequency(&freq);
    QueryPerformanceCounter(&t1);
    ${k.returns} r = compute(0, N${callExtra});
    QueryPerformanceCounter(&t2);
    double sec = double(t2.QuadPart - t1.QuadPart) / freq.QuadPart;
    ${print}
    printf("time = %.3f s\\n", sec);
    return 0;
}`;
}

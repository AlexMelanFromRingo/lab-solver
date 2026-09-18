export type Category = "crypto" | "number" | "theory" | "codes" | "arch" | "networks" | "pismi";

export const categories: Record<
  Category,
  { title: string; short: string; accent: string; accentSoft: string }
> = {
  crypto: {
    title: "Криптография",
    short: "Шифры и сети",
    accent: "var(--cat-crypto)",
    accentSoft: "var(--cat-crypto-soft)",
  },
  number: {
    title: "Теория чисел",
    short: "Простота, сравнения",
    accent: "var(--cat-number)",
    accentSoft: "var(--cat-number-soft)",
  },
  theory: {
    title: "Теория информации",
    short: "Энтропия, каналы",
    accent: "var(--cat-theory)",
    accentSoft: "var(--cat-theory-soft)",
  },
  codes: {
    title: "Помехоустойчивое кодирование",
    short: "Обнаружение и коррекция ошибок",
    accent: "var(--cat-codes)",
    accentSoft: "var(--cat-codes-soft)",
  },
  arch: {
    title: "Архитектура ЭВМ",
    short: "Микропрограммы",
    accent: "var(--cat-arch)",
    accentSoft: "var(--cat-arch-soft)",
  },
  networks: {
    title: "Компьютерные сети",
    short: "Адресация, подсети",
    accent: "var(--cat-networks)",
    accentSoft: "var(--cat-networks-soft)",
  },
  pismi: {
    title: "Проектирование ИС в сетях Интернет",
    short: "Формулы и объекты по вариантам",
    accent: "var(--cat-pismi)",
    accentSoft: "var(--cat-pismi-soft)",
  },
};

export interface LabModule {
  slug: string;
  title: string;
  category: Category;
  tagline: string;
  description: string;
  hasVariants: boolean;
  variantCount?: number;
  source: string;
  size: "lg" | "md" | "sm";
}

export const modules: LabModule[] = [
  {
    slug: "pismi-lab2-formulas",
    title: "Лаба 2 · программа 1: вычисление функций",
    category: "pismi",
    tagline: "15 вариантов · проверка тождества y₁ = y₂",
    description:
      "Считает оба выражения варианта прямо по условию, без упрощений, и показывает журнал промежуточных величин — из него видно, каким преобразованием одно выражение переходит в другое.",
    hasVariants: true,
    variantCount: 15,
    source: "Проектування інформаційних систем в мережах Інтернет, ЛР2, с. 12–14",
    size: "md",
  },
  {
    slug: "pismi-lab2-objects",
    title: "Лаба 2 · программа 2: задание объектом",
    category: "pismi",
    tagline: "13 вариантов · таблицы, адреса, календарь",
    description:
      "Тринадцать заданий второй программы: адреса сети и узла в двоичном виде, системы счисления, календарь, координаты ячейки, шахматная доска, пирамиды, зодиак и остальные — каждое по своим параметрам.",
    hasVariants: true,
    variantCount: 13,
    source: "Проектування інформаційних систем в мережах Інтернет, ЛР2, с. 14–15",
    size: "md",
  },
  {
    slug: "feistel-variant",
    title: "Сеть Фейстеля по варианту",
    category: "crypto",
    tagline: "24 варианта · n, K, F1/F2/F3",
    description:
      "Конструктор блочного шифра: по номеру варианта из таблицы собирается сеть Фейстеля с нужным размером блока, ключа и тройкой функций раунда.",
    hasVariants: true,
    variantCount: 24,
    source: "AppliedCryptology_Lab3_Gen/Variants.md + AnyaLaboratoryWork",
    size: "lg",
  },
  {
    slug: "jolsm",
    title: "Симулятор JOLS-M",
    category: "arch",
    tagline: "Микропрограммы · регистры · пошагово",
    description:
      "Интерпретатор учебного языка JOLS-M: READ/OPERATION/PRINT/GOTO/IF — выполняет микропрограмму и показывает состояние регистров и памяти на каждом шаге.",
    hasVariants: false,
    source: "jolsm-toolkit",
    size: "lg",
  },
  {
    slug: "rsa",
    title: "RSA",
    category: "crypto",
    tagline: "Генерация ключей · шифрование · подпись",
    description:
      "Генерация простых p, q, вычисление n, φ(n), e, d, пошаговое модульное возведение в степень для шифрования и расшифрования сообщений.",
    hasVariants: false,
    source: "rust-rsa-from-scratch",
    size: "md",
  },
  {
    slug: "classical-ciphers",
    title: "Цезарь, Виженер, гамма, OTP",
    category: "crypto",
    tagline: "Лаба 1 · классические шифры",
    description:
      "Шифр сдвига, полиалфавитный Виженер, гаммирование XOR и одноразовый блокнот — кодирование и раскодирование текста произвольным ключом.",
    hasVariants: false,
    source: "AnyaLaboratoryWork + Univetsity Lab1",
    size: "sm",
  },
  {
    slug: "sdes",
    title: "S-DES (учебный)",
    category: "crypto",
    tagline: "Лаба 4 · канонический алгоритм",
    description:
      "Классический Simplified DES: P10/P8, IP/IP⁻¹, EP, P4, два S-box, генерация раундовых ключей и два раунда сети Фейстеля — фиксированные таблицы, свои ключ и блок.",
    hasVariants: false,
    source: "Оптимизированный Optimized3.py",
    size: "sm",
  },
  {
    slug: "primality",
    title: "Тесты на простоту",
    category: "number",
    tagline: "Пробное деление · Ферма · Миллер–Рабин · Соловей–Штрассен",
    description:
      "Четыре теста простоты числа с трассировкой шагов: детерминированное пробное деление и три вероятностных теста со свидетелями.",
    hasVariants: false,
    source: "primary_tests",
    size: "md",
  },
  {
    slug: "crt",
    title: "Система сравнений (СКО)",
    category: "number",
    tagline: "Китайская теорема об остатках",
    description:
      "Решает систему x ≡ aᵢ (mod mᵢ) методом обобщённой Китайской теоремы об остатках с пошаговым выводом обратных элементов.",
    hasVariants: false,
    source: "coursework_year2_pt2",
    size: "sm",
  },
  {
    slug: "number-theory",
    title: "Евклид и линейное сравнение",
    category: "number",
    tagline: "НСД/НСК · ax≡b (mod n)",
    description:
      "Алгоритм Евклида для НСД и НСК с полной трассировкой шагов, и решение линейного сравнения ax≡b(mod n) через поиск обратного элемента — портировано с реального C++ кода из отчётов.",
    hasVariants: false,
    source: "Математичні основи інфобезпеки, Лабы 1_1 и 4_1",
    size: "md",
  },
  {
    slug: "luhn",
    title: "Алгоритм Луна",
    category: "number",
    tagline: "Проверка и довычисление контрольной цифры",
    description:
      "Проверка номера карты/документа по модулю 10 с удвоением через цифру и вычисление недостающей контрольной цифры.",
    hasVariants: false,
    source: "card-check-algo",
    size: "sm",
  },
  {
    slug: "entropy-coding",
    title: "Энтропия, Шеннон-Фано, Хаффман",
    category: "theory",
    tagline: "Лаба 2 · 12 вариантов",
    description:
      "По распределению вероятностей символов вашего варианта считает энтропию источника и строит коды Шеннона-Фано и Хаффмана с таблицей длин.",
    hasVariants: true,
    variantCount: 12,
    source: "Теория информации, Лаба 2",
    size: "md",
  },
  {
    slug: "parity-channel",
    title: "Код чётности и пропускная способность",
    category: "theory",
    tagline: "Лаба 4 · 12 вариантов",
    description:
      "Двумерный код с проверкой по строкам и столбцам — обнаружение и исправление ошибки, плюс расчёт пропускной способности двоичного симметричного канала по формуле Шеннона.",
    hasVariants: true,
    variantCount: 12,
    source: "Теория информации, Лаба 4",
    size: "md",
  },
  {
    slug: "crc",
    title: "Циклический код (CRC)",
    category: "theory",
    tagline: "Лаба 5 · 12 вариантов",
    description:
      "Кодирование делением многочлена на образующий, синдром принятого слова и исправление однократной ошибки по таблице синдромов.",
    hasVariants: true,
    variantCount: 12,
    source: "Теория информации, Лаба 5",
    size: "md",
  },
  {
    slug: "hamming",
    title: "Код Хэмминга",
    category: "codes",
    tagline: "Кодирование · синдром · исправление",
    description:
      "Кодирование информационных бит кодом Хэмминга, вычисление синдрома по принятому слову и исправление однократной ошибки.",
    hasVariants: false,
    source: "error-codes-explorer",
    size: "sm",
  },
  {
    slug: "shannon-hartley",
    title: "Непрерывный канал с шумом",
    category: "theory",
    tagline: "Лаба 6 · 12 вариантов",
    description:
      "Пропускная способность непрерывного канала по формуле Шеннона-Хартли для двух уровней шума из варианта — формула сверена по числам из реального отчёта.",
    hasVariants: true,
    variantCount: 12,
    source: "Теория информации, Лаба 6",
    size: "md",
  },
  {
    slug: "line-coding",
    title: "Линейное кодирование сигналов",
    category: "theory",
    tagline: "Лаба 7 · 12 вариантов",
    description:
      "NRZ, RZ, Манчестер, NRZI, MLT-3, 2B1Q, PAM5 — преобразование битовой последовательности варианта в форму сигнала с визуализацией.",
    hasVariants: true,
    variantCount: 12,
    source: "Теория информации, Лаба 7",
    size: "md",
  },
  {
    slug: "bbs-lfsr",
    title: "BBS и LFSR — генераторы гаммы",
    category: "crypto",
    tagline: "Лаба 5 · потоковые шифры",
    description:
      "Blum-Blum-Shub (X_i = X_{i-1}² mod n, младший бит — выход) и LFSR с линейной обратной связью — два способа получить псевдослучайную гамму для потокового шифрования.",
    hasVariants: false,
    source: "Прикладная криптология, LR5",
    size: "sm",
  },
  {
    slug: "gost-rc4",
    title: "ГОСТ 28147-89 и RC4",
    category: "crypto",
    tagline: "ПЛІС · аппаратный референс",
    description:
      "ГОСТ: 32-раундовая сеть Фейстеля (24 прямых + 8 обратных), один S-box на все нибблы, сдвиг на 11 бит — портировано с реальной VHDL-схемы. RC4: классические KSA+PRGA.",
    hasVariants: false,
    source: "ПЛІС, GOST.vhd + RC4",
    size: "sm",
  },
  {
    slug: "reed-solomon",
    title: "Код Рида-Соломона",
    category: "codes",
    tagline: "GF(2⁸) · Берлекэмп-Мэсси · Форни",
    description:
      "Кодирование над полем Галуа, вычисление синдромов, поиск полинома-локатора ошибок, позиций (Чень) и величин ошибок (Форни) для их исправления.",
    hasVariants: false,
    source: "error-codes-explorer",
    size: "sm",
  },
  {
    slug: "polar",
    title: "Полярные коды",
    category: "codes",
    tagline: "Батачария · SC / ML декодер",
    description:
      "Выбор замороженных/информационных каналов по параметру Батачария, кодирование через матрицу Кронекера, декодирование последовательным вычёркиванием (SC) или полным перебором (ML).",
    hasVariants: false,
    source: "error-codes-explorer",
    size: "sm",
  },
  {
    slug: "ldpc",
    title: "LDPC-коды",
    category: "codes",
    tagline: "Граф Таннера · belief propagation",
    description:
      "Порождающая матрица из разреженной проверочной через исключение Гаусса над GF(2), итеративное декодирование min-sum belief propagation с проверкой синдрома.",
    hasVariants: false,
    source: "error-codes-explorer",
    size: "sm",
  },
  {
    slug: "ip-subnet",
    title: "Калькулятор подсети",
    category: "networks",
    tagline: "IPv4 · маска, хосты, broadcast",
    description:
      "По полному IP-адресу и маске/префиксу — адрес сети, адрес хоста, первый и последний хост, широковещательный адрес и число узлов. Сверено с реальным примером из отчёта.",
    hasVariants: false,
    source: "КМ (Компьютерные сети), Лаба 4",
    size: "md",
  },
];

export function modulesByCategory(cat: Category) {
  return modules.filter((m) => m.category === cat);
}

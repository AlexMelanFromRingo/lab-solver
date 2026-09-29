/**
 * «Програмні засоби загального користування» — программы ЛР 1–3 на C++
 * по вариантам. Все собраны g++ -std=c++17 и прогнаны на примерах.
 */

/** Подготовка консоли Windows: вывод и ввод в UTF-8 (в Linux не нужна). */
export const WIN_HEAD = `#ifdef _WIN32
#include <windows.h>
#endif`;
export const WIN_INIT = `#ifdef _WIN32
    SetConsoleOutputCP(CP_UTF8);   // українські літери в консолі Windows
    SetConsoleCP(CP_UTF8);
#endif`;

// ------------------------------------------------------------- ЛР 1

export const LAB1_OLD = [
  "Користувач вводить послідовність цілих чисел, що закінчується нулем. Підрахувати кількість парних додатних чисел.",
  "Користувач вводить ціле число. Порахувати кількість цифр, рівних заданій.",
  "Користувач вводить послідовність символів, що закінчується крапкою. Порахувати кількість символів цифр.",
  "Користувач вводить задану кількість чисел. Обрахувати кількість чисел в заданому діапазоні.",
  "На заданому діапазоні знайти кількість тризначних чисел.",
  "На заданому діапазоні чисел знайти середнє арифметичне додатних парних чисел.",
  "Користувач вводить послідовність чисел, що закінчується заданим числом. Знайти максимальне число.",
  "Користувач вводить послідовність символів, що закінчується пробілом. Порахувати кількість великих та малих літер.",
  "Програма генерує задану кількість чисел в заданому діапазоні. Порахувати кількість додатних та від’ємних.",
  "Користувач вводить послідовність чисел, доки не введе від’ємне. Знайти мінімальне значення.",
  "Користувач вводить задану кількість чисел. Порахувати кількість чисел, що не рівні ні 1, ні 0.",
  "Користувач вводить послідовність символів, доки не введе пробіл. Порахувати кількість букв латиниці. Для рішення не використовувати функції перевірки належності діапазону/алфавіту.",
  "Користувач вводить послідовність цілих чисел, доки не введе від’ємне. Порахувати кількість чисел, що мають не менше двох розрядів.",
  "Користувач вводить число. Визначити чи всі цифри числа однакові.",
];

export const LAB1_NEW = [
  "Користувач вводить послідовність цілих чисел, що закінчується нулем. Підрахувати кількість парних додатних чисел серед введених.",
  "Користувач вводить ціле число. Порахувати кількість цифр, рівних заданій. Цифра задається користувачем з клавіатури.",
  "Користувач вводить послідовність символів, що закінчується крапкою. Порахувати кількість символів цифр. Забороняється використання вбудованих функцій мови програмування.",
  "Користувач вводить задану кількість цілих чисел. Обрахувати кількість чисел в діапазоні від А до Б. Значення А, Б – цілі, вводяться з клавіатури, співвідношення введених значень А, Б (більше/менше) не має впливати на результат обчислень.",
  "Користувач вводить задану кількість цілих чисел. Знайти кількість тризначних чисел.",
  "Користувач вводить послідовність цілих чисел, що закінчується попередньо заданим з клавіатури цілим числом. Знайти максимальне число серед введених.",
  "Користувач вводить послідовність символів, що закінчується пробілом. У введеній послідовності порахувати кількість великих та кількість малих літер латиниці. Забороняється використання вбудованих функцій мови програмування.",
  "Програма генерує задану кількість цілих чисел в заданому діапазоні. Порахувати кількість додатних та від’ємних чисел серед згенерованих. Межі діапазону – цілі числа, введені з клавіатури, співвідношення яких (більше/менше) не має впливати на результат обчислень.",
  "Користувач вводить послідовність цілих чисел, доки не введе від’ємне. Знайти мінімальне значення серед введених.",
  "Користувач вводить задану кількість цілих чисел. Кількість чисел задається з клавіатури. Порахувати кількість чисел, що не рівні ні 1, ні 0.",
  "Користувач вводить послідовність символів, доки не введе пробіл. Порахувати кількість букв кирилиці серед введених. Для рішення не використовувати функції перевірки належності діапазону/алфавіту.",
  "Користувач вводить послідовність цілих чисел, доки не введе від’ємне. Порахувати кількість чисел серед введених, що мають не менше двох розрядів.",
  "Користувач вводить число. Визначити чи всі цифри числа однакові.",
];

/** Реализация по ключу задачи; оба списка ссылаются на одни и те же решения. */
const L1: Record<string, { head?: string; body: string }> = {
  evenPos: {
    body: `    int x, count = 0;
    cout << "Введіть цілі числа (0 — кінець): ";
    cin >> x;
    while (x != 0) {                     // цикл з передумовою: 0 не обробляється
        if (x > 0 && x % 2 == 0)         // парне додатне
            count++;
        cin >> x;
    }
    cout << "Кількість парних додатних чисел: " << count << endl;`,
  },
  digitsEqual: {
    body: `    long long number;
    int digit, count = 0;
    cout << "Ціле число: ";
    cin >> number;
    cout << "Цифра (0-9): ";
    cin >> digit;
    if (digit < 0 || digit > 9) {
        cout << "Цифра має бути від 0 до 9" << endl;
        return 1;
    }
    if (number < 0)
        number = -number;                // знак на цифри не впливає
    do {                                 // цикл з постумовою: у числа 0 теж є одна цифра
        if (number % 10 == digit)
            count++;
        number /= 10;
    } while (number != 0);
    cout << "Кількість цифр, рівних " << digit << ": " << count << endl;`,
  },
  charDigits: {
    body: `    char c;
    int count = 0;
    cout << "Введіть символи (крапка — кінець): ";
    while (cin.get(c) && c != '.') {     // читаємо по одному символу, включно з пропусками
        if (c >= '0' && c <= '9')        // порівняння кодів замість isdigit()
            count++;
    }
    cout << "Кількість символів-цифр: " << count << endl;`,
  },
  inRange: {
    body: `    int n, a, b, x, count = 0;
    cout << "Кількість чисел: ";
    cin >> n;
    cout << "Межі діапазону А і Б: ";
    cin >> a >> b;
    if (a > b) {                         // порядок меж не впливає на результат
        int t = a;
        a = b;
        b = t;
    }
    for (int i = 1; i <= n; i++) {       // цикл з лічильником
        cout << "Число " << i << ": ";
        cin >> x;
        if (x >= a && x <= b)
            count++;
    }
    cout << "Чисел у діапазоні [" << a << "; " << b << "]: " << count << endl;`,
  },
  threeDigitRange: {
    body: `    int a, b, count = 0;
    cout << "Межі діапазону: ";
    cin >> a >> b;
    if (a > b) {
        int t = a;
        a = b;
        b = t;
    }
    for (int x = a; x <= b; x++) {
        int m = x < 0 ? -x : x;          // тризначне і від'ємне: -100…-999
        if (m >= 100 && m <= 999)
            count++;
    }
    cout << "Тризначних чисел у діапазоні: " << count << endl;`,
  },
  threeDigitInput: {
    body: `    int n, x, count = 0;
    cout << "Кількість чисел: ";
    cin >> n;
    for (int i = 1; i <= n; i++) {
        cout << "Число " << i << ": ";
        cin >> x;
        int m = x < 0 ? -x : x;          // тризначне і від'ємне: -100…-999
        if (m >= 100 && m <= 999)
            count++;
    }
    cout << "Тризначних чисел: " << count << endl;`,
  },
  evenAvgRange: {
    body: `    int a, b, count = 0;
    long long sum = 0;
    cout << "Межі діапазону: ";
    cin >> a >> b;
    if (a > b) {
        int t = a;
        a = b;
        b = t;
    }
    for (int x = a; x <= b; x++)
        if (x > 0 && x % 2 == 0) {
            sum += x;
            count++;
        }
    if (count == 0)
        cout << "У діапазоні немає додатних парних чисел" << endl;
    else
        cout << "Середнє арифметичне додатних парних: " << (double)sum / count << endl;`,
  },
  maxUntil: {
    body: `    int stop, x;
    cout << "Число-ознака кінця: ";
    cin >> stop;
    cout << "Введіть числа (" << stop << " — кінець): ";
    cin >> x;
    if (x == stop) {
        cout << "Не введено жодного числа" << endl;
        return 0;
    }
    int max = x;                         // перше введене — початкове значення максимуму
    cin >> x;
    while (x != stop) {
        if (x > max)
            max = x;
        cin >> x;
    }
    cout << "Максимальне число: " << max << endl;`,
  },
  upperLower: {
    body: `    char c;
    int upper = 0, lower = 0;
    cout << "Введіть символи (пропуск — кінець): ";
    while (cin.get(c) && c != ' ') {
        if (c >= 'A' && c <= 'Z')        // коди латиниці замість isupper()/islower()
            upper++;
        else if (c >= 'a' && c <= 'z')
            lower++;
    }
    cout << "Великих літер: " << upper << ", малих: " << lower << endl;`,
  },
  randomSigns: {
    head: "#include <cstdlib>\n#include <ctime>",
    body: `    int n, a, b, positive = 0, negative = 0;
    cout << "Кількість чисел: ";
    cin >> n;
    cout << "Межі діапазону: ";
    cin >> a >> b;
    if (a > b) {                         // порядок меж не впливає на результат
        int t = a;
        a = b;
        b = t;
    }
    srand((unsigned)time(nullptr));
    for (int i = 0; i < n; i++) {
        int x = a + rand() % (b - a + 1);   // рівномірно з [a; b]
        cout << x << " ";
        if (x > 0)
            positive++;
        else if (x < 0)
            negative++;
    }
    cout << endl << "Додатних: " << positive << ", від'ємних: " << negative << endl;`,
  },
  minUntilNeg: {
    body: `    int x;
    cout << "Введіть числа (від'ємне — кінець): ";
    cin >> x;
    if (x < 0) {
        cout << "Не введено жодного невід'ємного числа" << endl;
        return 0;
    }
    int min = x;
    cin >> x;
    while (x >= 0) {                     // від'ємне лише завершує введення
        if (x < min)
            min = x;
        cin >> x;
    }
    cout << "Мінімальне значення: " << min << endl;`,
  },
  notZeroOne: {
    body: `    int n, x, count = 0;
    cout << "Кількість чисел: ";
    cin >> n;
    for (int i = 1; i <= n; i++) {
        cout << "Число " << i << ": ";
        cin >> x;
        if (x != 0 && x != 1)
            count++;
    }
    cout << "Чисел, не рівних ні 0, ні 1: " << count << endl;`,
  },
  latin: {
    body: `    char c;
    int count = 0;
    cout << "Введіть символи (пропуск — кінець): ";
    while (cin.get(c) && c != ' ') {
        if ((c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z'))   // лише порівняння кодів
            count++;
    }
    cout << "Букв латиниці: " << count << endl;`,
  },
  cyrillic: {
    body: `    // Кирилиця в UTF-8 — два байти: перший 0xD0…0xD3, другий 0x80…0xBF.
    // Рахуємо перші байти; функції на кшталт isalpha() не використовуються.
    char c;
    int count = 0;
    cout << "Введіть символи (пропуск — кінець): ";
    while (cin.get(c) && c != ' ') {
        unsigned char u = (unsigned char)c;
        if (u >= 0xD0 && u <= 0xD3)
            count++;
    }
    cout << "Букв кирилиці: " << count << endl;`,
  },
  twoDigits: {
    body: `    int x, count = 0;
    cout << "Введіть цілі числа (від'ємне — кінець): ";
    cin >> x;
    while (x >= 0) {
        if (x >= 10)                     // не менше двох розрядів
            count++;
        cin >> x;
    }
    cout << "Чисел з двома й більше розрядами: " << count << endl;`,
  },
  sameDigits: {
    body: `    long long number;
    cout << "Число: ";
    cin >> number;
    if (number < 0)
        number = -number;
    int last = number % 10;              // з цією цифрою порівнюємо решту
    bool same = true;
    number /= 10;
    while (number != 0 && same) {
        if (number % 10 != last)
            same = false;
        number /= 10;
    }
    cout << (same ? "Усі цифри числа однакові" : "Цифри числа різні") << endl;`,
  },
};

const OLD_KEYS = ["evenPos", "digitsEqual", "charDigits", "inRange", "threeDigitRange", "evenAvgRange", "maxUntil", "upperLower", "randomSigns", "minUntilNeg", "notZeroOne", "latin", "twoDigits", "sameDigits"];
const NEW_KEYS = ["evenPos", "digitsEqual", "charDigits", "inRange", "threeDigitInput", "maxUntil", "upperLower", "randomSigns", "minUntilNeg", "notZeroOne", "cyrillic", "twoDigits", "sameDigits"];

export function lab1Program(list: "old" | "new", v: number): string {
  const key = (list === "old" ? OLD_KEYS : NEW_KEYS)[v - 1];
  const task = (list === "old" ? LAB1_OLD : LAB1_NEW)[v - 1];
  const p = L1[key];
  return `// ЛР 1, варіант ${v} (${list === "old" ? "до 2025 року" : "з 2025 року"}):
// ${task}
// Лише прості змінні — без масивів, рядків і структур.
#include <iostream>
${p.head ? `${p.head}\n` : ""}${WIN_HEAD}
using namespace std;

int main()
{
${WIN_INIT}
${p.body}
    return 0;
}
`;
}

// ------------------------------------------------------------- ЛР 2

export const LAB2_TASKS = [
  "Знайти номер парного рядка матриці з найбільшою сумою елементів. Якщо таких рядків декілька, вивести номер останнього зі знайдених.",
  "Знайти кількість рядків, сума елементів яких перевищує суму елементів заданого стовпця.",
  "Знайти кількість рядків, усі значення елементів яких знаходяться у межах заданого діапазону.",
  "Знайти кількість стовпців, у яких середнє арифметичне значення усіх елементів знаходиться в межах заданого діапазону.",
  "Знайти суми усіх елементів по периметру матриці та усіх елементів в середині. Визначити, яка з сум більша.",
  "Знайти суму елементів рядка, який містить максимальний елемент матриці. Якщо таких елементів декілька, розглядати лише перший.",
  "Знайти добутки елементів: першого рядка, останнього рядка, першого стовпця, останнього стовпця. Знайти мінімальний добуток.",
  "Знайти відсоток елементів матриці, які не перевищують 60% максимального елемента.",
  "Знайти кількості елементів рівних максимуму та мінімуму. Знайти середнє геометричне знайдених кількостей.",
  "Знайти середнє арифметичне всіх елементів парних стовпців та середнє арифметичне всіх непарних рядків. Визначити, яке зі знайдених значень є мінімальним.",
];

interface L2 {
  /** Параметры обработки, вводятся в main. */
  params: string;
  input: string;
  /** Сигнатура и тело processing (без ввода/вывода). */
  proc: string;
  call: string;
  output: string;
  head?: string;
}

const RANGE_IN = `    int low, high;
    cout << "Межі діапазону: ";
    cin >> low >> high;
    if (low > high) {
        int t = low;
        low = high;
        high = t;
    }`;

const LAB2: Record<number, L2> = {
  1: {
    params: "",
    input: "",
    proc: `// Повертає номер (з 1) парного рядка з найбільшою сумою; 0 — якщо парних рядків немає.
int processing(const Matrix& m)
{
    int best = 0;
    long long bestSum = 0;
    for (int i = 1; i < m.rows; i += 2) {       // парні номери 2, 4, … — індекси 1, 3, …
        long long sum = 0;                     // підзадача 1: сума рядка
        for (int j = 0; j < m.cols; j++)
            sum += m.data[i][j];
        if (best == 0 || sum >= bestSum) {     // підзадача 2: >= — при рівних лишається останній
            best = i + 1;
            bestSum = sum;
        }
    }
    return best;
}`,
    call: "    int row = processing(m);",
    output: `    if (row == 0)
        cout << "У матриці немає парних рядків" << endl;
    else
        cout << "Парний рядок з найбільшою сумою: " << row << endl;`,
  },
  2: {
    params: "",
    input: `    int col;
    cout << "Номер стовпця (1-" << m.cols << "): ";
    cin >> col;
    if (col < 1 || col > m.cols) {
        cout << "Немає такого стовпця" << endl;
        deleteMatrix(m);
        return 1;
    }`,
    proc: `// Кількість рядків, сума яких більша за суму стовпця col (номер з 1).
int processing(const Matrix& m, int col)
{
    long long colSum = 0;                      // підзадача 1: сума заданого стовпця
    for (int i = 0; i < m.rows; i++)
        colSum += m.data[i][col - 1];
    int count = 0;
    for (int i = 0; i < m.rows; i++) {         // підзадача 2: суми рядків і порівняння
        long long sum = 0;
        for (int j = 0; j < m.cols; j++)
            sum += m.data[i][j];
        if (sum > colSum)
            count++;
    }
    return count;
}`,
    call: "    int count = processing(m, col);",
    output: `    cout << "Рядків із сумою більше за суму стовпця " << col << ": " << count << endl;`,
  },
  3: {
    params: "",
    input: RANGE_IN,
    proc: `// Кількість рядків, усі елементи яких лежать у [low; high].
int processing(const Matrix& m, int low, int high)
{
    int count = 0;
    for (int i = 0; i < m.rows; i++) {
        bool inside = true;                    // шукаємо елемент поза діапазоном
        for (int j = 0; j < m.cols && inside; j++)
            if (m.data[i][j] < low || m.data[i][j] > high)
                inside = false;
        if (inside)
            count++;
    }
    return count;
}`,
    call: "    int count = processing(m, low, high);",
    output: `    cout << "Рядків з усіма елементами в [" << low << "; " << high << "]: " << count << endl;`,
  },
  4: {
    params: "",
    input: RANGE_IN,
    proc: `// Кількість стовпців, середнє арифметичне яких лежить у [low; high].
int processing(const Matrix& m, int low, int high)
{
    int count = 0;
    for (int j = 0; j < m.cols; j++) {
        long long sum = 0;                     // підзадача 1: сума стовпця
        for (int i = 0; i < m.rows; i++)
            sum += m.data[i][j];
        double avg = (double)sum / m.rows;     // підзадача 2: середнє і перевірка
        if (avg >= low && avg <= high)
            count++;
    }
    return count;
}`,
    call: "    int count = processing(m, low, high);",
    output: `    cout << "Стовпців із середнім у [" << low << "; " << high << "]: " << count << endl;`,
  },
  5: {
    params: "",
    input: "",
    proc: `// Суми елементів по периметру і всередині матриці.
void processing(const Matrix& m, long long& perimeter, long long& inner)
{
    perimeter = inner = 0;
    for (int i = 0; i < m.rows; i++)
        for (int j = 0; j < m.cols; j++)
            if (i == 0 || i == m.rows - 1 || j == 0 || j == m.cols - 1)
                perimeter += m.data[i][j];     // крайній рядок або стовпець
            else
                inner += m.data[i][j];
}`,
    call: `    long long perimeter, inner;
    processing(m, perimeter, inner);`,
    output: `    cout << "Сума по периметру: " << perimeter << ", всередині: " << inner << endl;
    if (perimeter > inner)
        cout << "Більша сума по периметру" << endl;
    else if (inner > perimeter)
        cout << "Більша сума всередині" << endl;
    else
        cout << "Суми рівні" << endl;`,
  },
  6: {
    params: "",
    input: "",
    proc: `// Сума рядка, що містить перший максимальний елемент; row — його номер (з 1).
long long processing(const Matrix& m, int& row)
{
    int bi = 0, bj = 0;                        // підзадача 1: перший максимум
    for (int i = 0; i < m.rows; i++)
        for (int j = 0; j < m.cols; j++)
            if (m.data[i][j] > m.data[bi][bj]) {   // строго більше — лишається перший
                bi = i;
                bj = j;
            }
    long long sum = 0;                         // підзадача 2: сума його рядка
    for (int j = 0; j < m.cols; j++)
        sum += m.data[bi][j];
    row = bi + 1;
    return sum;
}`,
    call: `    int row;
    long long sum = processing(m, row);`,
    output: `    cout << "Максимум у рядку " << row << ", сума цього рядка: " << sum << endl;`,
  },
  7: {
    params: "",
    input: "",
    proc: `// Добутки першого/останнього рядка і першого/останнього стовпця; повертає мінімальний.
long long processing(const Matrix& m, long long& firstRow, long long& lastRow, long long& firstCol, long long& lastCol)
{
    firstRow = lastRow = firstCol = lastCol = 1;
    for (int j = 0; j < m.cols; j++) {
        firstRow *= m.data[0][j];
        lastRow *= m.data[m.rows - 1][j];
    }
    for (int i = 0; i < m.rows; i++) {
        firstCol *= m.data[i][0];
        lastCol *= m.data[i][m.cols - 1];
    }
    long long min = firstRow;                  // мінімальний з чотирьох
    if (lastRow < min)
        min = lastRow;
    if (firstCol < min)
        min = firstCol;
    if (lastCol < min)
        min = lastCol;
    return min;
}`,
    call: `    long long fr, lr, fc, lc;
    long long min = processing(m, fr, lr, fc, lc);`,
    output: `    cout << "Перший рядок: " << fr << ", останній рядок: " << lr << endl;
    cout << "Перший стовпець: " << fc << ", останній стовпець: " << lc << endl;
    cout << "Мінімальний добуток: " << min << endl;`,
  },
  8: {
    params: "",
    input: "",
    proc: `// Відсоток елементів, що не перевищують 60 % максимального.
double processing(const Matrix& m)
{
    int max = m.data[0][0];                    // підзадача 1: максимум
    for (int i = 0; i < m.rows; i++)
        for (int j = 0; j < m.cols; j++)
            if (m.data[i][j] > max)
                max = m.data[i][j];
    int count = 0;                             // підзадача 2: елементи <= 0,6·max
    for (int i = 0; i < m.rows; i++)
        for (int j = 0; j < m.cols; j++)
            if (m.data[i][j] <= 0.6 * max)
                count++;
    return 100.0 * count / (m.rows * m.cols);
}`,
    call: "    double percent = processing(m);",
    output: `    cout << "Елементів, що не перевищують 60% максимуму: " << percent << "%" << endl;`,
  },
  9: {
    head: "#include <cmath>",
    params: "",
    input: "",
    proc: `// Кількості елементів, рівних максимуму і мінімуму; повертає їх середнє геометричне.
double processing(const Matrix& m, int& maxCount, int& minCount)
{
    int max = m.data[0][0], min = m.data[0][0];    // підзадача 1: максимум і мінімум
    for (int i = 0; i < m.rows; i++)
        for (int j = 0; j < m.cols; j++) {
            if (m.data[i][j] > max)
                max = m.data[i][j];
            if (m.data[i][j] < min)
                min = m.data[i][j];
        }
    maxCount = minCount = 0;                   // підзадача 2: скільки разів зустрічаються
    for (int i = 0; i < m.rows; i++)
        for (int j = 0; j < m.cols; j++) {
            if (m.data[i][j] == max)
                maxCount++;
            if (m.data[i][j] == min)
                minCount++;
        }
    return sqrt((double)maxCount * minCount);
}`,
    call: `    int maxCount, minCount;
    double g = processing(m, maxCount, minCount);`,
    output: `    cout << "Рівних максимуму: " << maxCount << ", мінімуму: " << minCount << endl;
    cout << "Середнє геометричне: " << g << endl;`,
  },
  10: {
    params: "",
    input: "",
    proc: `// Середнє елементів парних стовпців (2, 4, …) і непарних рядків (1, 3, …).
// Повертає false, якщо парних стовпців немає (матриця з одного стовпця).
bool processing(const Matrix& m, double& evenCols, double& oddRows)
{
    long long sum = 0;
    int count = 0;
    for (int j = 1; j < m.cols; j += 2)        // парні номери — непарні індекси
        for (int i = 0; i < m.rows; i++) {
            sum += m.data[i][j];
            count++;
        }
    evenCols = count ? (double)sum / count : 0;
    bool hasEven = count > 0;
    sum = 0;
    count = 0;
    for (int i = 0; i < m.rows; i += 2)        // непарні номери — парні індекси
        for (int j = 0; j < m.cols; j++) {
            sum += m.data[i][j];
            count++;
        }
    oddRows = (double)sum / count;
    return hasEven;
}`,
    call: `    double evenCols, oddRows;
    bool hasEven = processing(m, evenCols, oddRows);`,
    output: `    cout << "Середнє непарних рядків: " << oddRows << endl;
    if (!hasEven)
        cout << "Парних стовпців немає" << endl;
    else {
        cout << "Середнє парних стовпців: " << evenCols << endl;
        if (evenCols < oddRows)
            cout << "Мінімальне — середнє парних стовпців" << endl;
        else if (oddRows < evenCols)
            cout << "Мінімальне — середнє непарних рядків" << endl;
        else
            cout << "Значення рівні" << endl;
    }`,
  },
};

export function lab2Program(v: number): string {
  const p = LAB2[v];
  return `// ЛР 2, варіант ${v}: ${LAB2_TASKS[v - 1]}
#include <iostream>
#include <iomanip>
#include <cstdlib>
#include <ctime>
${p.head ? `${p.head}\n` : ""}${WIN_HEAD}
using namespace std;

// Матриця: розміри і динамічний масив рядків
struct Matrix {
    int rows;
    int cols;
    int** data;
};

// Створення матриці: розмірність і виділення пам'яті
Matrix create(int rows, int cols)
{
    Matrix m;
    m.rows = rows;
    m.cols = cols;
    m.data = new int*[rows];
    for (int i = 0; i < rows; i++)
        m.data[i] = new int[cols];
    return m;
}

// Очищення пам'яті (ім'я delete зайняте ключовим словом C++)
void deleteMatrix(Matrix& m)
{
    for (int i = 0; i < m.rows; i++)
        delete[] m.data[i];
    delete[] m.data;
    m.data = nullptr;
    m.rows = m.cols = 0;
}

// Заповнення з клавіатури
void manualFilling(Matrix& m)
{
    for (int i = 0; i < m.rows; i++) {
        cout << "Рядок " << i + 1 << " (" << m.cols << " чисел): ";
        for (int j = 0; j < m.cols; j++)
            cin >> m.data[i][j];
    }
}

// Заповнення генератором випадкових чисел з [low; high]
void randomFilling(Matrix& m, int low, int high)
{
    for (int i = 0; i < m.rows; i++)
        for (int j = 0; j < m.cols; j++)
            m.data[i][j] = low + rand() % (high - low + 1);
}

// Виведення матриці на екран
void show(const Matrix& m)
{
    for (int i = 0; i < m.rows; i++) {
        for (int j = 0; j < m.cols; j++)
            cout << setw(6) << m.data[i][j];
        cout << endl;
    }
}

${p.proc}

int main()
{
${WIN_INIT}
    srand((unsigned)time(nullptr));
    int rows, cols, mode;
    cout << "Кількість рядків і стовпців: ";
    cin >> rows >> cols;
    if (rows < 1 || cols < 1) {
        cout << "Розміри мають бути додатними" << endl;
        return 1;
    }
    Matrix m = create(rows, cols);
    cout << "Заповнення: 1 — з клавіатури, 2 — випадковими числами: ";
    cin >> mode;
    if (mode == 1)
        manualFilling(m);
    else {
        int low, high;
        cout << "Діапазон випадкових чисел: ";
        cin >> low >> high;
        if (low > high) {
            int t = low;
            low = high;
            high = t;
        }
        randomFilling(m, low, high);
    }
    show(m);
${p.input ? `${p.input}\n` : ""}${p.call}
${p.output}
    deleteMatrix(m);
    return 0;
}
`;
}

// ------------------------------------------------------------- ЛР 3

export function lab3Program(): string {
  return `// ЛР 3: калькулятор виразів через масиви вказівників на функції.
// Вирази — приклад (таблиця виразів варіанту — в елементі-завданні LIDER):
//   1) f1 = x^2 + x/2 + 1,                   x — double
//   2) f2 = (x + 1) / ((x - 1)(y - 2)) + x,  x, y — double
//   3) f3 = x + (10 - x) / (2 + y) * z + y,  x, y — double, z — int
#include <iostream>
#include <cmath>
${WIN_HEAD}
using namespace std;

// Дані кожного виразу — окрема структура зі своїми типами
struct Data1 { double x; };
struct Data2 { double x, y; };
struct Data3 { double x, y; int z; };

// ---- функції введення: отримують адресу даних як void*
void input1(void* p)
{
    Data1* d = static_cast<Data1*>(p);
    cout << "x = ";
    cin >> d->x;
}

void input2(void* p)
{
    Data2* d = static_cast<Data2*>(p);
    do {                                   // знаменник не може бути нулем
        cout << "x (x != 1) = ";
        cin >> d->x;
    } while (d->x == 1);
    do {
        cout << "y (y != 2) = ";
        cin >> d->y;
    } while (d->y == 2);
}

void input3(void* p)
{
    Data3* d = static_cast<Data3*>(p);
    cout << "x = ";
    cin >> d->x;
    do {
        cout << "y (y != -2) = ";
        cin >> d->y;
    } while (d->y == -2);
    cout << "z (ціле) = ";
    cin >> d->z;
}

// ---- функції обчислення: повертають дійсне значення
double calc1(void* p)
{
    const Data1* d = static_cast<Data1*>(p);
    return pow(d->x, 2) + d->x / 2 + 1;
}

double calc2(void* p)
{
    const Data2* d = static_cast<Data2*>(p);
    return (d->x + 1) / ((d->x - 1) * (d->y - 2)) + d->x;
}

double calc3(void* p)
{
    const Data3* d = static_cast<Data3*>(p);
    return d->x + (10 - d->x) / (2 + d->y) * d->z + d->y;
}

int main()
{
${WIN_INIT}
    const int N = 3;
    // однаковий індекс — функція введення і відповідна функція обчислення
    void (*inputs[N])(void*) = { input1, input2, input3 };
    double (*calcs[N])(void*) = { calc1, calc2, calc3 };
    Data1 d1;
    Data2 d2;
    Data3 d3;
    void* data[N] = { &d1, &d2, &d3 };
    int choice;
    do {
        cout << "\\n1) x^2 + x/2 + 1\\n2) (x+1)/((x-1)(y-2)) + x\\n3) x + (10-x)/(2+y)*z + y\\n0) вихід\\nВираз: ";
        cin >> choice;
        if (choice >= 1 && choice <= N) {
            inputs[choice - 1](data[choice - 1]);
            cout << "Результат: " << calcs[choice - 1](data[choice - 1]) << endl;
        } else if (choice != 0)
            cout << "Немає такого виразу" << endl;
    } while (choice != 0);
    return 0;
}
`;
}

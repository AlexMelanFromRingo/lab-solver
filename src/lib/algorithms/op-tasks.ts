/**
 * «Основи програмування»: генерація готового коду C++ під кожен варіант
 * індивідуальних завдань (номер = номер у журналі). Для кожної роботи — свій
 * набір варіантів; тут спільні генератори й дані завдань, де варіанти
 * формульні або табличні. Увесь код складено так, щоб збиратися в MSVC
 * (Visual Studio) і g++ -std=c++17.
 */

/** Обчислювальний вираз: вільні змінні, проміжне значення, формула Y. */
export interface FormulaVar {
  n: number;
  /** Текст умови з математичними знаками (√, ², ·, грецькі літери). */
  display: string;
  /** Вільні змінні (вводяться). */
  vars: string[];
  /** Проміжне значення name = expr (C++), необов'язкове. */
  inter?: { name: string; expr: string };
  /** Формула Y (C++ вираз). */
  y: string;
  /** Чи потрібні <cmath> (sqrt, cbrt, pow). */
  math?: boolean;
  /** Чи є константа π. */
  pi?: boolean;
}

/** Повна програма для формульного завдання. */
export function formulaProgram(v: FormulaVar): string {
  const headers = ["#include <iostream>"];
  if (v.math || v.pi) headers.push("#include <cmath>");
  headers.push("using namespace std;");
  const vars = v.vars.join(", ");
  const read = v.vars.join(" >> ");
  const lines = [
    headers.join("\n"),
    "",
    `// Варіант ${v.n}: обчислити Y = ${v.display}`,
    "int main() {",
    v.pi ? "    const double PI = 3.14159265358979;" : "",
    `    double ${vars};`,
    `    cout << "Введiть ${v.vars.join(", ")}: ";`,
    `    cin >> ${read};`,
    v.inter ? `    double ${v.inter.name} = ${v.inter.expr};` : "",
    `    double Y = ${v.y};`,
    `    cout << "Y = " << Y << endl;`,
    "    return 0;",
    "}",
  ].filter((l) => l !== "");
  return lines.join("\n");
}

/** Текстова задача з формулою результату: вводять дані, виводять одну величину. */
export interface WordTask {
  n: number;
  /** Повний текст умови. */
  text: string;
  /** Вільні змінні (вводяться). */
  vars: string[];
  /** Назва й вираз результату (C++). */
  result: { name: string; expr: string };
  /** Підпис результату у виводі. */
  label: string;
  math?: boolean;
}

export function wordProgram(t: WordTask): string {
  const headers = ["#include <iostream>"];
  if (t.math) headers.push("#include <cmath>");
  headers.push("using namespace std;");
  return [
    headers.join("\n"),
    "",
    `// Варіант ${t.n}. ${t.text}`,
    "int main() {",
    `    double ${t.vars.join(", ")};`,
    `    cout << "Введiть ${t.vars.join(", ")}: ";`,
    `    cin >> ${t.vars.join(" >> ")};`,
    `    double ${t.result.name} = ${t.result.expr};`,
    `    cout << "${t.label} = " << ${t.result.name} << endl;`,
    "    return 0;",
    "}",
  ].join("\n");
}

// ========================= ЛР2, завдання 1 — 30 формул =========================
export const LR2_T1: FormulaVar[] = [
  { n: 1, display: "5·√c − K,  де K = b/(c+1)", vars: ["c", "b"], inter: { name: "K", expr: "b / (c + 1)" }, y: "5 * sqrt(c) - K", math: true },
  { n: 2, display: "7·z − k·X,  де X = √z + 5·k", vars: ["z", "k"], inter: { name: "X", expr: "sqrt(z) + 5 * k" }, y: "7 * z - k * X", math: true },
  { n: 3, display: "α + α·P/β,  де P = 3·β + λ", vars: ["alpha", "beta", "lambda"], inter: { name: "P", expr: "3 * beta + lambda" }, y: "alpha + alpha * P / beta" },
  { n: 4, display: "f + 2·B,  де B = 3·f/(d+8)", vars: ["f", "d"], inter: { name: "B", expr: "3 * f / (d + 8)" }, y: "f + 2 * B" },
  { n: 5, display: "a + h/(t−3),  де a = 5·h − 1", vars: ["h", "t"], inter: { name: "a", expr: "5 * h - 1" }, y: "a + h / (t - 3)" },
  { n: 6, display: "V/a − 2·c,  де V = 4·c + m", vars: ["a", "c", "m"], inter: { name: "V", expr: "4 * c + m" }, y: "V / a - 2 * c" },
  { n: 7, display: "4·λ + T,  де T = λ/(φ+5)", vars: ["lambda", "phi"], inter: { name: "T", expr: "lambda / (phi + 5)" }, y: "4 * lambda + T" },
  { n: 8, display: "√c + 5·N,  де N = 2·x + 8·c", vars: ["c", "x"], inter: { name: "N", expr: "2 * x + 8 * c" }, y: "sqrt(c) + 5 * N", math: true },
  { n: 9, display: "C − g/(h+9),  де g = C + 2·h + π", vars: ["C", "h"], inter: { name: "g", expr: "C + 2 * h + PI" }, y: "C - g / (h + 9)", pi: true },
  { n: 10, display: "S + √f·N,  де N = S·d − 2", vars: ["S", "f", "d"], inter: { name: "N", expr: "S * d - 2" }, y: "S + sqrt(f) * N", math: true },
  { n: 11, display: "5·U/(b+2),  де U = 3·x + 7·b", vars: ["x", "b"], inter: { name: "U", expr: "3 * x + 7 * b" }, y: "5 * U / (b + 2)" },
  { n: 12, display: "c·√b + a,  де c = b² − a·d", vars: ["b", "a", "d"], inter: { name: "c", expr: "b * b - a * d" }, y: "c * sqrt(b) + a", math: true },
  { n: 13, display: "S/(h+r) + R,  де S = r + 4·h", vars: ["h", "r", "R"], inter: { name: "S", expr: "r + 4 * h" }, y: "S / (h + r) + R" },
  { n: 14, display: "λ·β + 5·x/c,  де x = β − λ²", vars: ["lambda", "beta", "c"], inter: { name: "x", expr: "beta - lambda * lambda" }, y: "lambda * beta + 5 * x / c" },
  { n: 15, display: "b·c − d/2,  де d = b/c + a", vars: ["b", "c", "a"], inter: { name: "d", expr: "b / c + a" }, y: "b * c - d / 2" },
  { n: 16, display: "s − 2·h³,  де s = a + b/(a−h)", vars: ["a", "b", "h"], inter: { name: "s", expr: "a + b / (a - h)" }, y: "s - 2 * h * h * h" },
  { n: 17, display: "L/(δ+β) + 3,  де L = γ + 4·β", vars: ["delta", "beta", "gamma"], inter: { name: "L", expr: "gamma + 4 * beta" }, y: "L / (delta + beta) + 3" },
  { n: 18, display: "4·t + n·x,  де t = √(x−2) + 5·z", vars: ["n", "x", "z"], inter: { name: "t", expr: "sqrt(x - 2) + 5 * z" }, y: "4 * t + n * x", math: true },
  { n: 19, display: "v + b/(2+c),  де b = v² − c²", vars: ["v", "c"], inter: { name: "b", expr: "v * v - c * c" }, y: "v + b / (2 + c)" },
  { n: 20, display: "(g+4)/2 + m,  де m = 3·√(a+4) − g", vars: ["g", "a"], inter: { name: "m", expr: "3 * sqrt(a + 4) - g" }, y: "(g + 4) / 2 + m", math: true },
  { n: 21, display: "c·∛(4·a) + d,  де d = a² − c", vars: ["c", "a"], inter: { name: "d", expr: "a * a - c" }, y: "c * cbrt(4 * a) + d", math: true },
  { n: 22, display: "λ + β − α,  де β = α³ − 7/λ²", vars: ["lambda", "alpha"], inter: { name: "beta", expr: "alpha * alpha * alpha - 7 / (lambda * lambda)" }, y: "lambda + beta - alpha" },
  { n: 23, display: "R − 3·r + 5,  де R = s + k/(2·s)", vars: ["s", "k", "r"], inter: { name: "R", expr: "s + k / (2 * s)" }, y: "R - 3 * r + 5" },
  { n: 24, display: "A − B/(2+C),  де B = C − 2·D", vars: ["A", "C", "D"], inter: { name: "B", expr: "C - 2 * D" }, y: "A - B / (2 + C)" },
  { n: 25, display: "v·x + c·b,  де v = c² + x/(8−b)", vars: ["c", "x", "b"], inter: { name: "v", expr: "c * c + x / (8 - b)" }, y: "v * x + c * b" },
  { n: 26, display: "c + 4·s/(5−d),  де c = d·(s−2) + t", vars: ["d", "s", "t"], inter: { name: "c", expr: "d * (s - 2) + t" }, y: "c + 4 * s / (5 - d)" },
  { n: 27, display: "n·(m/k + 3),  де m = k + n·h", vars: ["n", "k", "h"], inter: { name: "m", expr: "k + n * h" }, y: "n * (m / k + 3)" },
  { n: 28, display: "a + d/c + 3,  де d = a + 4·c³", vars: ["a", "c"], inter: { name: "d", expr: "a + 4 * c * c * c" }, y: "a + d / c + 3" },
  { n: 29, display: "α·β·γ − 4,  де β = α/(2·γ) + z", vars: ["alpha", "gamma", "z"], inter: { name: "beta", expr: "alpha / (2 * gamma) + z" }, y: "alpha * beta * gamma - 4" },
  { n: 30, display: "m·z·t/(9−f),  де t = 3·m + 2·z", vars: ["m", "z", "f"], inter: { name: "t", expr: "3 * m + 2 * z" }, y: "m * z * t / (9 - f)" },
];

// ============ Текстові (фізичні) задачі — спільні для ЛР1 (завд.1), ЛР2 (завд.2), ЛР9 ============
export interface PhysTask {
  n: number;
  text: string;
  vars: string[];
  /** Тіло програми після зчитування vars (обчислення й виведення). */
  body: string[];
  math?: boolean;
}

export function physProgram(t: PhysTask): string {
  const headers = ["#include <iostream>"];
  if (t.math) headers.push("#include <cmath>");
  headers.push("using namespace std;");
  return [
    headers.join("\n"),
    "",
    `// Варіант ${t.n}. ${t.text}`,
    "int main() {",
    `    double ${t.vars.join(", ")};`,
    `    cout << "Введiть ${t.vars.join(", ")}: ";`,
    `    cin >> ${t.vars.join(" >> ")};`,
    ...t.body.map((l) => "    " + l),
    "    return 0;",
    "}",
  ].join("\n");
}

export const LR_PHYS: PhysTask[] = [
  { n: 1, text: "Залізничний вагон масою m1 (швидкість V1) зчіплюється з нерухомим вагоном маси m2. Швидкість після зчеплення V = m1/(m1+m2)·V1.", vars: ["m1", "V1", "m2"], body: ["double V = m1 / (m1 + m2) * V1;", `cout << "V = " << V << endl;`] },
  { n: 2, text: "Два поїзди йдуть назустріч зі швидкостями V1 і V2 (км/год). Пасажир першого бачить, що другий проходить повз нього t секунд. Довжина другого поїзда S = (V1+V2)·t (швидкості — у м/с).", vars: ["V1", "V2", "t"], body: ["double S = (V1 + V2) * t;", `cout << "S = " << S << endl;`] },
  { n: 3, text: "Основний питомий опір руху навантажених вантажних вагонів колії 1067 мм: w0 = 0,7 + (7 + 0,3V + 0,0075V²)/q0 (q0 > 6 т).", vars: ["V", "q0"], body: ["double w0 = 0.7 + (7 + 0.3 * V + 0.0075 * V * V) / q0;", `cout << "w0 = " << w0 << endl;`] },
  { n: 4, text: "Основний питомий опір руху порожніх вантажних вагонів колії 1067 мм: w0 = 1,35 + 0,07V + 0,00045V².", vars: ["V"], body: ["double w0 = 1.35 + 0.07 * V + 0.00045 * V * V;", `cout << "w0 = " << w0 << endl;`] },
  { n: 5, text: "Основний питомий опір руху локомотивів на безстиковому шляху: електровози w0 = 1,9 + 0,008V + 0,0025V²; тепловози wx = 2,4 + 0,009V + 0,00035V².", vars: ["V"], body: ["double w0 = 1.9 + 0.008 * V + 0.0025 * V * V;", "double wx = 2.4 + 0.009 * V + 0.00035 * V * V;", `cout << "w0(ел) = " << w0 << "   wx(тепл) = " << wx << endl;`] },
  { n: 6, text: "Розрахунковий коефіцієнт зчеплення для тепловозів ТЕ10: Psi = 0,118 + 4/(22+V).", vars: ["V"], body: ["double Psi = 0.118 + 4 / (22 + V);", `cout << "Psi = " << Psi << endl;`] },
  { n: 7, text: "Назустріч йдуть два поїзди (V1, V2). Після зустрічі рухаються без зупинки. Положення кожного через t хвилин і відстань: x1 = x01 + V1·t; x2 = x02 + V2·t; L = |x2 − x1|.", vars: ["x01", "V1", "x02", "V2", "t"], body: ["double x1 = x01 + V1 * t;", "double x2 = x02 + V2 * t;", "double L = fabs(x2 - x1);", `cout << "x1 = " << x1 << "   x2 = " << x2 << "   L = " << L << endl;`], math: true },
  { n: 8, text: "Пасажирський поїзд за час t набуває швидкості V1. Визначити час t2 від початку руху, коли швидкість стане V2: a = V1/t; t2 = V2/a.", vars: ["V1", "t", "V2"], body: ["double a = V1 / t;", "double t2 = V2 / a;", `cout << "a = " << a << "   t2 = " << t2 << endl;`] },
  { n: 9, text: "Поїзд масою m (швидкість V1) збільшив швидкість до V2 на ділянці S. Сила (рух рівноприскорений): A = m·V2²/2 − m·V1²/2; F = A/S.", vars: ["m", "V1", "V2", "S"], body: ["double A = m * V2 * V2 / 2 - m * V1 * V1 / 2;", "double F = A / S;", `cout << "A = " << A << "   F = " << F << endl;`] },
  { n: 10, text: "Загальна вага складу з n порожніх і m навантажених вагонів. Маса порожнього N т, маса вантажу одного вагону M т.", vars: ["n", "m", "N", "M"], body: ["double W = n * N + m * (N + M);", `cout << "W = " << W << endl;`] },
  { n: 11, text: "Коефіцієнт тертя гальмівних чавунних стандартних колодок об колесо: phi = 0,27·(V+100)/(5V+100).", vars: ["V"], body: ["double phi = 0.27 * (V + 100) / (5 * V + 100);", `cout << "phi = " << phi << endl;`] },
  { n: 12, text: "Робота для зупинки поїзда (V2 = 0) масою m, що рухається зі швидкістю V1: A = m·V2²/2 − m·V1²/2 = −m·V1²/2 (за модулем m·V1²/2).", vars: ["m", "V1"], body: ["double V2 = 0;", "double A = m * V2 * V2 / 2 - m * V1 * V1 / 2;", `cout << "A = " << A << endl;`] },
  { n: 13, text: "Коефіцієнт тертя гальмівного черевика об рейку: сухі рейки phi = 0,19·(10,8V+100)/(21,6V+100); мокрі phi = 0,19·(7,2V+100)/(18V+100).", vars: ["V"], body: ["double phiDry = 0.19 * (10.8 * V + 100) / (21.6 * V + 100);", "double phiWet = 0.19 * (7.2 * V + 100) / (18 * V + 100);", `cout << "phi(сух) = " << phiDry << "   phi(мокр) = " << phiWet << endl;`] },
  { n: 14, text: "Основний питомий опір руху кривій (довжина поїзда більша за криву): Wr = 700/R − Skr/Lp.", vars: ["R", "Skr", "Lp"], body: ["double Wr = 700 / R - Skr / Lp;", `cout << "Wr = " << Wr << endl;`] },
  { n: 15, text: "Розрахункова сила натягнення на гальмівні чавунні стандартні колодки: kr = 2,22·k·(16k+100)/(80k+10) (k = 2,7 тс).", vars: ["k"], body: ["double kr = 2.22 * k * (16 * k + 100) / (80 * k + 10);", `cout << "kr = " << kr << endl;`] },
  { n: 16, text: "Поїзд їхав t1 год зі швидкістю V1; t2 год — V2; t3 год — V3 (км/год). Обчислити пройдені шляхи.", vars: ["t1", "V1", "t2", "V2", "t3", "V3"], body: ["double S1 = V1 * t1, S2 = V2 * t2, S3 = V3 * t3;", `cout << "S1 = " << S1 << "   S2 = " << S2 << "   S3 = " << S3 << endl;`] },
  { n: 17, text: "Ціна на проїзд у купейних вагонах виросла на p відсотків, у плацкартних — на k відсотків. Обчислити нові ціни (ck — купе, cp — плацкарт).", vars: ["ck", "p", "cp", "k"], body: ["double newK = ck * (1 + p / 100);", "double newP = cp * (1 + k / 100);", `cout << "купе = " << newK << "   плацкарт = " << newP << endl;`] },
  { n: 18, text: "Загальна кількість вагонів у складі вантажного поїзда за кількостями цистерн a, критих вагонів b і платформ c.", vars: ["a", "b", "c"], body: ["double total = a + b + c;", `cout << "Всього вагонiв = " << total << endl;`] },
  { n: 19, text: "Загальна протяжність залізниць України за заданими довжинами шести доріг.", vars: ["d1", "d2", "d3", "d4", "d5", "d6"], body: ["double total = d1 + d2 + d3 + d4 + d5 + d6;", `cout << "Загальна протяжнiсть = " << total << endl;`] },
  { n: 20, text: "Периметр і площа рівнобічної трапеції S = (a+b)/2·h за основами a, b і висотою h (бічна сторона — з висоти і різниці основ).", vars: ["a", "b", "h"], body: ["double S = (a + b) / 2 * h;", "double side = sqrt(h * h + (a - b) / 2 * (a - b) / 2);", "double P = a + b + 2 * side;", `cout << "S = " << S << "   P = " << P << endl;`], math: true },
  { n: 21, text: "Кінетична E = m·v²/2 і потенційна P = m·g·h енергії тіла маси m, що рухається на висоті h зі швидкістю v (g = 9,81).", vars: ["m", "v", "h"], body: ["const double g = 9.81;", "double E = m * v * v / 2;", "double P = m * g * h;", `cout << "E = " << E << "   P = " << P << endl;`] },
  { n: 22, text: "Площа трикутника S (Герон) зі сторонами a, b, c і радіус описаного кола r = abc/(4S).", vars: ["a", "b", "c"], body: ["double p = (a + b + c) / 2;", "double S = sqrt(p * (p - a) * (p - b) * (p - c));", "double r = a * b * c / (4 * S);", `cout << "S = " << S << "   r = " << r << endl;`], math: true },
  { n: 23, text: "Відстань між точками (x1,y1) і (x2,y2) та координати середини відрізка: d = sqrt((x1−x2)²+(y1−y2)²); xc=(x1+x2)/2; yc=(y1+y2)/2.", vars: ["x1", "y1", "x2", "y2"], body: ["double d = sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));", "double xc = (x1 + x2) / 2, yc = (y1 + y2) / 2;", `cout << "d = " << d << "   середина (" << xc << ", " << yc << ")" << endl;`], math: true },
  { n: 24, text: "Площа бічної поверхні S = 2πrh і об'єм V = πr²h бочки за висотою h і радіусом основи r.", vars: ["h", "r"], body: ["const double PI = 3.14159265358979;", "double S = 2 * PI * r * h;", "double V = PI * r * r * h;", `cout << "S = " << S << "   V = " << V << endl;`] },
  { n: 25, text: "Радіус вписаного r = sqrt((p−a)(p−b)(p−c)/p) і радіус описаного R = abc/(4·sqrt(p(p−a)(p−b)(p−c))) кола трикутника a, b, c.", vars: ["a", "b", "c"], body: ["double p = (a + b + c) / 2;", "double S = sqrt(p * (p - a) * (p - b) * (p - c));", "double r = S / p;", "double R = a * b * c / (4 * S);", `cout << "r(вписане) = " << r << "   R(описане) = " << R << endl;`], math: true },
  { n: 26, text: "Периметр і площа рівнобічного трикутника S = (a/2)·sqrt(b²−a²/4), де a — основа, b — бічна сторона.", vars: ["a", "b"], body: ["double S = a / 2 * sqrt(b * b - a * a / 4);", "double P = a + 2 * b;", `cout << "S = " << S << "   P = " << P << endl;`], math: true },
  { n: 27, text: "Бісектриса трикутника Wa = 2/(b+c)·sqrt(b·c·p·(p−a)) зі сторонами a, b, c.", vars: ["a", "b", "c"], body: ["double p = (a + b + c) / 2;", "double Wa = 2 / (b + c) * sqrt(b * c * p * (p - a));", `cout << "Wa = " << Wa << endl;`], math: true },
  { n: 28, text: "Площа круга з радіусом R і площа сектора Ssekt = πR²·alpha/360, де alpha — кут у градусах.", vars: ["R", "alpha"], body: ["const double PI = 3.14159265358979;", "double Scircle = PI * R * R;", "double Ssekt = PI * R * R * alpha / 360;", `cout << "S круга = " << Scircle << "   S сектора = " << Ssekt << endl;`] },
  { n: 29, text: "Тіло падає з прискоренням g. Обчислити шлях h = g·t²/2, пройдений після першої і другої секунд падіння.", vars: ["g"], body: ["double h1 = g * 1 * 1 / 2;", "double h2 = g * 2 * 2 / 2;", `cout << "h(1с) = " << h1 << "   h(2с) = " << h2 << endl;`] },
  { n: 30, text: "Висота hb = 2S/b і медіана mb = (1/2)·sqrt(2(a²+c²)−b²) трикутника a, b, c (S — площа за Героном).", vars: ["a", "b", "c"], body: ["double p = (a + b + c) / 2;", "double S = sqrt(p * (p - a) * (p - b) * (p - c));", "double hb = 2 * S / b;", "double mb = 0.5 * sqrt(2 * (a * a + c * c) - b * b);", `cout << "hb = " << hb << "   mb = " << mb << endl;`], math: true },
];

// ==================== ЛР1, завдання 2 — розгалуження (30) ====================
export const LR_BRANCH: PhysTask[] = [
  { n: 1, text: "Ввести два нерівні числа X і Y. Якщо менше з них X, то збільшити його двічі, інакше вивести «X більше Y».", vars: ["X", "Y"], body: ["if (X < Y) { X = X * 2; cout << \"X = \" << X << endl; }", "else cout << \"X бiльше Y\" << endl;"] },
  { n: 2, text: "Ввести два нерівні числа A і B. Якщо A більше B, то обчислити √|A−B|, інакше вивести «A менше B».", vars: ["A", "B"], body: ["if (A > B) cout << \"result = \" << sqrt(fabs(A - B)) << endl;", "else cout << \"A менше B\" << endl;"], math: true },
  { n: 3, text: "Ввести три числа a, b і c. Якщо c не дорівнює нулю, то обчислити (a+b)/c, інакше вивести «c дорівнює 0».", vars: ["a", "b", "c"], body: ["if (c != 0) cout << \"result = \" << (a + b) / c << endl;", "else cout << \"c дорiвнює 0\" << endl;"] },
  { n: 4, text: "Ввести два довільні числа b і c. Обчислити їх добуток, якщо b більше або дорівнює c, інакше вивести «b менше c».", vars: ["b", "c"], body: ["if (b >= c) cout << \"b*c = \" << b * c << endl;", "else cout << \"b менше c\" << endl;"] },
  { n: 5, text: "Ввести два нерівні числа Z і X. Якщо менше з них Z, то піднести його в куб, інакше вивести «X більше Z».", vars: ["Z", "X"], body: ["if (Z < X) cout << \"Z^3 = \" << Z * Z * Z << endl;", "else cout << \"X бiльше Z\" << endl;"] },
  { n: 6, text: "Ввести одне ціле число B. Вивести «Число парне», якщо воно кратне двом, інакше «Число непарне».", vars: ["B"], body: ["int b = (int)B;", "if (b % 2 == 0) cout << \"Число парне\" << endl;", "else cout << \"Число непарне\" << endl;"] },
  { n: 7, text: "Ввести два нерівні числа y і z. У меншого з цих чисел змінити знак на протилежний.", vars: ["y", "z"], body: ["if (y < z) y = -y; else z = -z;", "cout << \"y = \" << y << \"   z = \" << z << endl;"] },
  { n: 8, text: "Ввести два довільні числа y і z. Якщо рівні, то p = 1, інакше вивести «числа не рівні».", vars: ["y", "z"], body: ["if (y == z) { double p = 1; cout << \"p = \" << p << endl; }", "else cout << \"числа не рiвнi\" << endl;"] },
  { n: 9, text: "Ввести ціле число n. Змінній f присвоїти 1, якщо n кратно трьом, інакше 0.", vars: ["n"], body: ["int f = ((int)n % 3 == 0) ? 1 : 0;", "cout << \"f = \" << f << endl;"] },
  { n: 10, text: "Ввести два числа x і y. Визначити, чи належить точка (x, y) внутрішній області кола x²+y² < 50.", vars: ["x", "y"], body: ["if (x * x + y * y < 50) cout << \"крапка усерединi кола\" << endl;", "else cout << \"крапка поза колом або лежить на колу\" << endl;"] },
  { n: 11, text: "Ввести два нерівні числа x і z. Змінній N присвоїти більше, M — менше.", vars: ["x", "z"], body: ["double N = (x > z) ? x : z, M = (x > z) ? z : x;", "cout << \"N = \" << N << \"   M = \" << M << endl;"] },
  { n: 12, text: "Ввести два числа b і c. Якщо рівні — вивести повідомлення, інакше обчислити c²+b.", vars: ["b", "c"], body: ["if (b == c) cout << \"числа рiвнi\" << endl;", "else cout << \"result = \" << c * c + b << endl;"] },
  { n: 13, text: "Ввести два нерівні числа x і y. Менше з них розділити на більше.", vars: ["x", "y"], body: ["double res = (x < y) ? x / y : y / x;", "cout << \"result = \" << res << endl;"] },
  { n: 14, text: "Ввести число z, нерівне нулю. Вивести «Число додатне» або «Число від'ємне».", vars: ["z"], body: ["if (z > 0) cout << \"Число додатне\" << endl;", "else cout << \"Число вiд'ємне\" << endl;"] },
  { n: 15, text: "Ввести довільне число a. Присвоїти P = 1, якщо a ≤ 25, інакше вивести «a більше 25».", vars: ["a"], body: ["if (a <= 25) { double P = 1; cout << \"P = \" << P << endl; }", "else cout << \"a бiльше 25\" << endl;"] },
  { n: 16, text: "Ввести довільне число a. Якщо воно від'ємне, обчислити √|a|, інакше a².", vars: ["a"], body: ["if (a < 0) cout << \"result = \" << sqrt(fabs(a)) << endl;", "else cout << \"result = \" << a * a << endl;"], math: true },
  { n: 17, text: "Ввести два нерівні числа x і z. Менше з них замінити більшим.", vars: ["x", "z"], body: ["if (x < z) x = z; else z = x;", "cout << \"x = \" << x << \"   z = \" << z << endl;"] },
  { n: 18, text: "Обчислити площу кола з радіусом R. Якщо площа більше 25 — «велике коло», інакше «мале коло».", vars: ["R"], body: ["const double PI = 3.14159265358979;", "double S = PI * R * R;", "cout << \"S = \" << S << \"  -> \" << (S > 25 ? \"велике коло\" : \"мале коло\") << endl;"] },
  { n: 19, text: "Ввести два числа. Вивести «Числа рівні» або «Числа нерівні».", vars: ["a", "b"], body: ["cout << (a == b ? \"Числа рiвнi\" : \"Числа нерiвнi\") << endl;"] },
  { n: 20, text: "Ввести два нерівні числа. Обчислити квадрат меншого з них.", vars: ["a", "b"], body: ["double mn = (a < b) ? a : b;", "cout << \"result = \" << mn * mn << endl;"] },
  { n: 21, text: "Ввести два цілі числа. Якщо взаємно протилежні — повідомлення, інакше обчислити їх суму.", vars: ["a", "b"], body: ["if (a == -b) cout << \"числа взаємно протилежнi\" << endl;", "else cout << \"сума = \" << a + b << endl;"] },
  { n: 22, text: "Ввести a, b, c, d. Якщо a більше суми b, c, d — повідомлення, інакше середнє арифметичне чотирьох.", vars: ["a", "b", "c", "d"], body: ["if (a > b + c + d) cout << \"a бiльше суми b, c, d\" << endl;", "else cout << \"середнє = \" << (a + b + c + d) / 4 << endl;"] },
  { n: 23, text: "Ввести два числа. Обчислити різницю, якщо не рівні, інакше «Числа рівні».", vars: ["a", "b"], body: ["if (a != b) cout << \"рiзниця = \" << a - b << endl;", "else cout << \"Числа рiвнi\" << endl;"] },
  { n: 24, text: "Ввести два числа. Обчислити різницю та вивести «Різниця менше 0» або «Різниця не менше 0».", vars: ["a", "b"], body: ["double d = a - b;", "cout << \"рiзниця = \" << d << \"  -> \" << (d < 0 ? \"Рiзниця менше 0\" : \"Рiзниця не менше 0\") << endl;"] },
  { n: 25, text: "Обчислити площу квадрата зі стороною a та площу прямокутника зі сторонами b і c; порівняти.", vars: ["a", "b", "c"], body: ["double sq = a * a, rect = b * c;", "cout << (rect > sq ? \"площа прямокутника бiльше площi квадрата\" : \"площа прямокутника менше або дорiвнює площi квадрата\") << endl;"] },
  { n: 26, text: "Ввести два нерівні числа. Вивести, яке число найбільше: перше або друге.", vars: ["a", "b"], body: ["cout << (a > b ? \"найбiльше перше\" : \"найбiльше друге\") << endl;"] },
  { n: 27, text: "Ввести масу на вісь колісної пари q0 і швидкість V. Якщо q0 ≤ 6 — «Невірно введена маса», інакше w0 = 0,7 + (7+0,3V+0,0075V²)/q0.", vars: ["q0", "V"], body: ["if (q0 <= 6) cout << \"Невiрно введена маса\" << endl;", "else cout << \"w0 = \" << 0.7 + (7 + 0.3 * V + 0.0075 * V * V) / q0 << endl;"] },
  { n: 28, text: "Ввести швидкість поїзда V. Якщо V > 0 — w0 = 1,35 + 0,07V + 0,00045V², інакше «Невірно введена швидкість».", vars: ["V"], body: ["if (V > 0) cout << \"w0 = \" << 1.35 + 0.07 * V + 0.00045 * V * V << endl;", "else cout << \"Невiрно введена швидкiсть\" << endl;"] },
  { n: 29, text: "Визначити кількість вільних місць у купейному вагоні (36 місць) за кількістю проданих квитків k. Якщо всі продані — «немає вільних місць».", vars: ["k"], body: ["int free = 36 - (int)k;", "if (free <= 0) cout << \"У вагонi немає вiльних мiсць\" << endl;", "else cout << \"Вiльних мiсць: \" << free << endl;"] },
  { n: 30, text: "Ввести силу натягнення на одну гальмівну колодку k. Якщо k = 1,6 — kr = 1,22·k·(k+20)/(4k+20), інакше «Невірне вхідне k».", vars: ["k"], body: ["if (k == 1.6) cout << \"kr = \" << 1.22 * k * (k + 20) / (4 * k + 20) << endl;", "else cout << \"Невiрне вхiдне k\" << endl;"] },
];

/** Загорнути обчислення фізичної задачі в цикл по першій змінній (ЛР1 завд.3, циклічна структура). */
export function loopProgram(t: PhysTask): string {
  const loopVar = t.vars[0];
  const rest = t.vars.slice(1);
  const headers = ["#include <iostream>"];
  if (t.math || /sqrt|fabs|pow|cbrt/.test(t.body.join(""))) headers.push("#include <cmath>");
  headers.push("using namespace std;");
  const readRest = rest.length ? [`    cout << "Введiть ${rest.join(", ")}: ";`, `    cin >> ${rest.join(" >> ")};`] : [];
  return [
    headers.join("\n"),
    "",
    `// Варіант ${t.n} (циклічна структура). ${t.text}`,
    `// Розрахунок для ${loopVar} від ${loopVar}_poch до ${loopVar}_kin з кроком d${loopVar}.`,
    "int main() {",
    `    double ${rest.length ? rest.join(", ") + ", " : ""}${loopVar}_poch, ${loopVar}_kin, d${loopVar};`,
    ...readRest,
    `    cout << "Введiть ${loopVar}_poch, ${loopVar}_kin, крок: ";`,
    `    cin >> ${loopVar}_poch >> ${loopVar}_kin >> d${loopVar};`,
    `    for (double ${loopVar} = ${loopVar}_poch; ${loopVar} <= ${loopVar}_kin; ${loopVar} += d${loopVar}) {`,
    ...t.body.map((l) => "        " + l),
    "    }",
    "    return 0;",
    "}",
  ].join("\n");
}

// ==================== ЛР7 / ЛР10 — операції над масивом (20) ====================
export interface ArrayOp {
  n: number;
  text: string;
  extra: string[];
  /** Предикат над елементом a[i] (ціле). */
  pred: string;
  agg: "sum" | "count";
}

export const ARRAY_OPS: ArrayOp[] = [
  { n: 1, text: "Сума елементів масиву, кратних K (K вводиться).", extra: ["K"], pred: "a[i] % K == 0", agg: "sum" },
  { n: 2, text: "Сума елементів масиву, не кратних K (K вводиться).", extra: ["K"], pred: "a[i] % K != 0", agg: "sum" },
  { n: 3, text: "Сума елементів масиву, більших за X (X вводиться).", extra: ["X"], pred: "a[i] > X", agg: "sum" },
  { n: 4, text: "Кількість елементів масиву, менших за X (X вводиться).", extra: ["X"], pred: "a[i] < X", agg: "count" },
  { n: 5, text: "Сума елементів масиву, не більших за X (X вводиться).", extra: ["X"], pred: "a[i] <= X", agg: "sum" },
  { n: 6, text: "Сума елементів масиву, не менших за X (X вводиться).", extra: ["X"], pred: "a[i] >= X", agg: "sum" },
  { n: 7, text: "Сума елементів масиву, що дорівнюють X (X вводиться).", extra: ["X"], pred: "a[i] == X", agg: "sum" },
  { n: 8, text: "Сума елементів масиву, що не дорівнюють X (X вводиться).", extra: ["X"], pred: "a[i] != X", agg: "sum" },
  { n: 9, text: "Сума елементів масиву зі значеннями в діапазоні [L; R].", extra: ["L", "R"], pred: "a[i] >= L && a[i] <= R", agg: "sum" },
  { n: 10, text: "Сума елементів масиву зі значеннями в діапазоні (L; R].", extra: ["L", "R"], pred: "a[i] > L && a[i] <= R", agg: "sum" },
  { n: 11, text: "Сума елементів масиву зі значеннями в діапазоні [L; R).", extra: ["L", "R"], pred: "a[i] >= L && a[i] < R", agg: "sum" },
  { n: 12, text: "Сума елементів масиву зі значеннями в діапазоні (L; R).", extra: ["L", "R"], pred: "a[i] > L && a[i] < R", agg: "sum" },
  { n: 13, text: "Сума елементів масиву, значення яких не належить до [L; R].", extra: ["L", "R"], pred: "a[i] < L || a[i] > R", agg: "sum" },
  { n: 14, text: "Сума елементів масиву, значення яких не належить до (L; R].", extra: ["L", "R"], pred: "a[i] <= L || a[i] > R", agg: "sum" },
  { n: 15, text: "Сума елементів масиву, значення яких не належить до [L; R).", extra: ["L", "R"], pred: "a[i] < L || a[i] >= R", agg: "sum" },
  { n: 16, text: "Сума елементів масиву, значення яких не належить до (L; R).", extra: ["L", "R"], pred: "a[i] <= L || a[i] >= R", agg: "sum" },
  { n: 17, text: "Кількість позитивних елементів масиву.", extra: [], pred: "a[i] > 0", agg: "count" },
  { n: 18, text: "Кількість від'ємних елементів масиву.", extra: [], pred: "a[i] < 0", agg: "count" },
  { n: 19, text: "Кількість парних за значенням елементів масиву.", extra: [], pred: "a[i] % 2 == 0", agg: "count" },
  { n: 20, text: "Кількість непарних за значенням елементів масиву.", extra: [], pred: "a[i] % 2 != 0", agg: "count" },
];

/** Програма операції над масивом; variant: static | dynamic | std::array. */
export function arrayOpProgram(op: ArrayOp, kind: "static" | "dynamic" | "std"): string {
  const headers = ["#include <iostream>", "#include <cstdlib>"];
  if (kind === "std") headers.push("#include <array>");
  headers.push("using namespace std;");
  const readExtra = op.extra.length ? [`    cout << "Введiть ${op.extra.join(", ")}: ";`, `    cin >> ${op.extra.join(" >> ")};`] : [];
  const extraDecl = op.extra.length ? `    int ${op.extra.join(", ")};\n` : "";
  const accInit = op.agg === "sum" ? "long long acc = 0;" : "int acc = 0;";
  const add = op.agg === "sum" ? "acc += a[i];" : "++acc;";
  const label = op.agg === "sum" ? "Сума" : "Кiлькiсть";
  let decl: string;
  let free = "";
  if (kind === "dynamic") {
    decl = "    int* a = new int[n];";
    free = "    delete[] a;\n";
  } else if (kind === "std") {
    decl = "    const int N = 20;   // std::array — розмір фіксований на етапі компіляції\n    array<int, N> a;\n    n = N;";
  } else {
    decl = "    int a[1000];";
  }
  const nDecl = kind === "std" ? "    int n;" : "    int n;\n    cout << \"n = \";\n    cin >> n;";
  return [
    headers.join("\n"),
    "",
    `// Варіант ${op.n}. ${op.text}`,
    "int main() {",
    nDecl,
    extraDecl + readExtra.join("\n"),
    decl,
    "    srand(12345);   // фіксований seed: результат відтворюваний",
    `    ${accInit}`,
    "    for (int i = 0; i < n; i++) {",
    "        a[i] = rand() % 41 - 20;   // діапазон [-20, 20]",
    "        cout << a[i] << ' ';",
    `        if (${op.pred}) ${add}`,
    "    }",
    `    cout << "\\n${label}: " << acc << endl;`,
    free + "    return 0;",
    "}",
  ].filter((l) => l !== "").join("\n");
}

/** Фізична задача, розв'язана з винесенням обчислення у функцію користувача (ЛР9). */
export function funcProgram(t: PhysTask): string {
  const headers = ["#include <iostream>"];
  if (t.math) headers.push("#include <cmath>");
  headers.push("using namespace std;");
  const params = t.vars.map((v) => "double " + v).join(", ");
  return [
    headers.join("\n"),
    "",
    `// Варіант ${t.n}. ${t.text}`,
    `// Обчислення винесено у функцію користувача solve().`,
    `void solve(${params}) {`,
    ...t.body.map((l) => "    " + l),
    "}",
    "",
    "int main() {",
    `    double ${t.vars.join(", ")};`,
    `    cout << "Введiть ${t.vars.join(", ")}: ";`,
    `    cin >> ${t.vars.join(" >> ")};`,
    `    solve(${t.vars.join(", ")});`,
    "    return 0;",
    "}",
  ].join("\n");
}

// ==================== ЛР6 — числові ряди (30) ====================
export interface SeriesVar {
  n: number;
  display: string;
  /** Вільні змінні, крім i (вводяться). */
  vars: string[];
  /** Вираз члена ряду (C++) у змінних i та vars. */
  term: string;
  pi?: boolean;
  /** Замість циклу i=1..n — цикл по x у заданому діапазоні (варіанти 29, 30). */
  overX?: { from: number; to: number };
}

export const LR6_SERIES: SeriesVar[] = [
  { n: 1, display: "Z = cos(i·x)/i", vars: ["x"], term: "cos(i * x) / i" },
  { n: 2, display: "y = sin(xⁱ)/i", vars: ["x"], term: "sin(pow(x, i)) / i" },
  { n: 3, display: "U = 0,21·cos²(i·t)/(i + 1,5t)", vars: ["t"], term: "0.21 * cos(i * t) * cos(i * t) / (i + 1.5 * t)" },
  { n: 4, display: "y = 0,3x/(5i + 3)", vars: ["x"], term: "0.3 * x / (5 * i + 3)" },
  { n: 5, display: "z = √(0,25x)/(7i + 1)", vars: ["x"], term: "sqrt(0.25 * x) / (7 * i + 1)" },
  { n: 6, display: "Z = sin(i·x²)/√(5i + 2)", vars: ["x"], term: "sin(i * x * x) / sqrt(5 * i + 2)" },
  { n: 7, display: "m = −0,25·sin(i·x)/√(i² + 4)", vars: ["x"], term: "-0.25 * sin(i * x) / sqrt(i * i + 4)" },
  { n: 8, display: "f = (i² − 3i + a)/√(2i² + 1)", vars: ["a"], term: "(i * i - 3 * i + a) / sqrt(2 * i * i + 1)" },
  { n: 9, display: "v = cos(i·x)/√(5i + 1)", vars: ["x"], term: "cos(i * x) / sqrt(5 * i + 1)" },
  { n: 10, display: "z = √(0,25x)/(7i + 1)", vars: ["x"], term: "sqrt(0.25 * x) / (7 * i + 1)" },
  { n: 11, display: "w = −0,25·cos(5·x)/√(i² + 4)", vars: ["x"], term: "-0.25 * cos(5 * x) / sqrt(i * i + 4)" },
  { n: 12, display: "M = 0,21·cos(i·a)/(3i + 1,5)", vars: ["a"], term: "0.21 * cos(i * a) / (3 * i + 1.5)" },
  { n: 13, display: "R = (cos(x) + i·h)/((i + 1)·h)", vars: ["x", "h"], term: "(cos(x) + i * h) / ((i + 1) * h)" },
  { n: 14, display: "Y = (x + i·h)/(2·i + 1)", vars: ["x", "h"], term: "(x + i * h) / (2 * i + 1)" },
  { n: 15, display: "z = (cos(i·x) + sin(i·x))/2", vars: ["x"], term: "(cos(i * x) + sin(i * x)) / 2" },
  { n: 16, display: "T = 0,25·sin(2·x)/√(i² + 2)", vars: ["x"], term: "0.25 * sin(2 * x) / sqrt(i * i + 2)" },
  { n: 17, display: "y = sin(xⁱ)/i", vars: ["x"], term: "sin(pow(x, i)) / i" },
  { n: 18, display: "D = 0,3x/(5i + 3)", vars: ["x"], term: "0.3 * x / (5 * i + 3)" },
  { n: 19, display: "H = cos(xⁱ⁺¹)/(i + 1)", vars: ["x"], term: "cos(pow(x, i + 1)) / (i + 1)" },
  { n: 20, display: "G = cos(2ix)/(4i² + 1)", vars: ["x"], term: "cos(2 * i * x) / (4 * i * i + 1)" },
  { n: 21, display: "w = sin(i²·x)/√(i² + 2)", vars: ["x"], term: "sin(i * i * x) / sqrt(i * i + 2)" },
  { n: 22, display: "V = tg(2·i·x)/(4i² + 1)", vars: ["x"], term: "tan(2 * i * x) / (4 * i * i + 1)" },
  { n: 23, display: "b = 0,21·cos(i·a)/i", vars: ["a"], term: "0.21 * cos(i * a) / i" },
  { n: 24, display: "V = (4/3)·π·(i·R)³ — об'єми куль", vars: ["R"], term: "(4.0 / 3) * PI * pow(i * R, 3)", pi: true },
  { n: 25, display: "s = cos(x³)/i", vars: ["x"], term: "cos(pow(x, 3)) / i" },
  { n: 26, display: "z = 3·sin(√(2x² + π))/i", vars: ["x"], term: "3 * sin(sqrt(2 * x * x + PI)) / i", pi: true },
  { n: 27, display: "F = (i·x + 3·cos(x))/(sin(x) + i)", vars: ["x"], term: "(i * x + 3 * cos(x)) / (sin(x) + i)" },
  { n: 28, display: "q = sin(xⁱ)/i", vars: ["x"], term: "sin(pow(x, i)) / i" },
  { n: 29, display: "y = sin(3x)/(π + x) при x = −3, −2, …5", vars: [], term: "sin(3 * x) / (PI + x)", pi: true, overX: { from: -3, to: 5 } },
  { n: 30, display: "t = cos(3x)/(2π) при x = −6, −5, …6", vars: [], term: "cos(3 * x) / (2 * PI)", pi: true, overX: { from: -6, to: 6 } },
];

export function seriesProgram(s: SeriesVar): string {
  const lines = ["#include <iostream>", "#include <cmath>", "using namespace std;", "", `// Варіант ${s.n}. Обчислити ${s.display}`, "int main() {"];
  if (s.pi) lines.push("    const double PI = 3.14159265358979;");
  if (s.overX) {
    lines.push(
      "    double sum = 0;",
      "    int pos = 0, cnt = 0;",
      `    for (int x = ${s.overX.from}; x <= ${s.overX.to}; x++) {`,
      `        double q = ${s.term};`,
      `        cout << "x=" << x << "  q = " << q << endl;`,
      "        sum += q; cnt++; if (q > 0) pos++;",
      "    }",
      `    cout << "Сума = " << sum << "   Середнє = " << sum / cnt << "   Додатних: " << pos << endl;`,
    );
  } else {
    const read = ["n", ...s.vars];
    lines.push(
      `    int n; double ${s.vars.length ? s.vars.join(", ") + ";" : "dummy;"}`.replace(" double dummy;", ";"),
      `    cout << "Введiть n${s.vars.length ? ", " + s.vars.join(", ") : ""}: ";`,
      `    cin >> ${read.join(" >> ")};`,
      "    double sum = 0;",
      "    int pos = 0;",
      "    for (int i = 1; i <= n; i++) {",
      `        double q = ${s.term};`,
      `        cout << "q" << i << " = " << q << endl;`,
      "        sum += q; if (q > 0) pos++;",
      "    }",
      `    cout << "Сума = " << sum << "   Середнє = " << sum / n << "   Додатних членiв: " << pos << endl;`,
    );
  }
  lines.push("    return 0;", "}");
  return lines.join("\n");
}

// ============ ЛР5 (switch) / ЛР4 завд.2 — кусково задані функції (30) ============
export interface PieceVar {
  n: number;
  /** Три формули: вираз C++ і текстовий інтервал. */
  f: { e: string; iv: string }[];
}

export const LR5_PIECE: PieceVar[] = [
  { n: 1, f: [{ e: "pow(PI, x) - 1", iv: "−10 < x ≤ 0" }, { e: "sin(x) / x", iv: "0 < x ≤ 10" }, { e: "1 / log10(x * x - 1)", iv: "10 < x ≤ 1000" }] },
  { n: 2, f: [{ e: "sin(PI * x / 2 - 1)", iv: "−3 < x ≤ 1" }, { e: "exp(cbrt(x + 3))", iv: "1 < x ≤ 3" }, { e: "pow(log10(sqrt(x) + 1), 2)", iv: "x > 3" }] },
  { n: 3, f: [{ e: "tan(PI * x) - exp(x)", iv: "−π < x ≤ 0" }, { e: "2 * pow(cos(cbrt(PI * x)), 2)", iv: "0 < x ≤ π" }, { e: "1 - 2 * log10(x)", iv: "x > π" }] },
  { n: 4, f: [{ e: "pow(PI / 2, fabs(atan(x)))", iv: "−π < x ≤ 0" }, { e: "4 * pow(cos(PI * x), 2) - 2", iv: "0 < x ≤ 2" }, { e: "exp(log10(x * x + 1))", iv: "x < 2" }] },
  { n: 5, f: [{ e: "cbrt(fabs(atan(x)))", iv: "x ≤ 0" }, { e: "sqrt(1 - exp(-x))", iv: "0 < x ≤ 1,2" }, { e: "tan(x) / log10(x + 1)", iv: "1,2 < x ≤ π/2" }] },
  { n: 6, f: [{ e: "cbrt(pow(tan(x), 2))", iv: "−π/2 < x ≤ 0" }, { e: "pow(log10(x * x + 2), 2)", iv: "0 < x ≤ π" }, { e: "1 - exp(-x * x / 2)", iv: "π < x ≤ 2π" }] },
  { n: 7, f: [{ e: "cos(cbrt(x * x + 2))", iv: "−100 < x ≤ 0" }, { e: "pow(log10(sqrt(x) + 1), 2)", iv: "0 < x ≤ 10" }, { e: "exp(-sqrt(x + 1))", iv: "x > 10" }] },
  { n: 8, f: [{ e: "tan(0.1 * pow(PI, x) - 3)", iv: "0 < x ≤ π" }, { e: "exp(-x - 1)", iv: "π < x ≤ 2π" }, { e: "2 * log2(4 * x)", iv: "x > 2π" }] },
  { n: 9, f: [{ e: "tan(x + 1)", iv: "−2 < x ≤ 0" }, { e: "x / log10(x + 1)", iv: "0 < x ≤ 10" }, { e: "sin(2 * PI * cbrt(x) + 1)", iv: "10 < x ≤ 20" }] },
  { n: 10, f: [{ e: "cbrt(pow(tan(x), 2))", iv: "−π/2 < x < π/2" }, { e: "log10(pow(2, x) + 256)", iv: "π/2 ≤ x ≤ 10" }, { e: "atan(x)", iv: "x > 10" }] },
  { n: 11, f: [{ e: "fabs(pow(x, 3) - 1)", iv: "−100 < x ≤ 0" }, { e: "sin(2 * pow(PI, x) - 1)", iv: "0 < x ≤ 100" }, { e: "sqrt(log10(x * x - 2))", iv: "100 < x" }] },
  { n: 12, f: [{ e: "cbrt(x * x + 1)", iv: "x ≤ 0" }, { e: "2 * pow(tan(x - 1), 2)", iv: "0 < x < π/2" }, { e: "2 * log2(x + 1)", iv: "π/2 ≤ x" }] },
  { n: 13, f: [{ e: "sin(cbrt(x * x) + PI)", iv: "x ≤ 0" }, { e: "1 + log10(sqrt(x + 10))", iv: "0 < x ≤ 3" }, { e: "1 - exp(-x)", iv: "3 < x < 7" }] },
  { n: 14, f: [{ e: "1 - exp(x)", iv: "x ≤ 0" }, { e: "1 + cbrt(2 * x + 1)", iv: "0 < x ≤ 10" }, { e: "1 - pow(log10(2 * x + 1), 2)", iv: "x > 10" }] },
  { n: 15, f: [{ e: "pow(atan(x), 3)", iv: "−1000 < x ≤ 0" }, { e: "pow(x + 1, atan(PI))", iv: "0 < x ≤ 10" }, { e: "pow(x + 1, log10(PI))", iv: "x > 10" }] },
  { n: 16, f: [{ e: "tan(x - 1)", iv: "0 < x < 1" }, { e: "cbrt(x * x + 2)", iv: "1 ≤ x ≤ e" }, { e: "log2(exp(x) + 2)", iv: "e < x < 10" }] },
  { n: 17, f: [{ e: "cos(cbrt(x * x)) + 1", iv: "−1000 < x ≤ 0" }, { e: "pow(PI, x) + 1", iv: "0 < x ≤ π" }, { e: "log10(pow(PI, x) + 1)", iv: "π < x ≤ 2π" }] },
  { n: 18, f: [{ e: "exp(2 * x * x - 1)", iv: "−5 < x ≤ 1" }, { e: "sin(pow(x, 5) - 1)", iv: "1 < x ≤ 5" }, { e: "log10(1024 * x - 2)", iv: "5 < x < 25" }] },
  { n: 19, f: [{ e: "fabs(x - 7)", iv: "x ≤ 7" }, { e: "tan(2 * PI * x) - 2", iv: "7 < x ≤ 10" }, { e: "log2(1024 * x - 2)", iv: "3 < x ≤ 9" }] },
  { n: 20, f: [{ e: "pow(pow(3 - x, 2), 1.0 / 5)", iv: "−1000 < x ≤ 0" }, { e: "exp(-x * x / 2)", iv: "0 < x ≤ 3" }, { e: "pow(log10(pow(x, 3) - 3), 2)", iv: "3 < x < 1024" }] },
  { n: 21, f: [{ e: "cbrt(x * x + 1)", iv: "−1024 < x ≤ 0" }, { e: "x / tan(x + 1)", iv: "0 < x ≤ 0,5" }, { e: "pow(log10(x + 1), 2)", iv: "0,5 < x < 64" }] },
  { n: 22, f: [{ e: "exp(x * x / 2)", iv: "−2 < x ≤ 0" }, { e: "tan(x + 1)", iv: "0 < x ≤ 1" }, { e: "sin(pow(x, PI)) / pow(log10(x), 2)", iv: "1 < x ≤ π" }] },
  { n: 23, f: [{ e: "pow(x, 0.75) + 8", iv: "0 < x ≤ 8" }, { e: "atan(2 * PI * x + 1)", iv: "8 < x ≤ 256" }, { e: "2 / pow(log10(x), 2)", iv: "x > 256" }] },
  { n: 24, f: [{ e: "1 - exp(x - 1)", iv: "−8 < x ≤ π" }, { e: "atan(cbrt(x * x - 9))", iv: "π < x ≤ 8" }, { e: "8 / log2(2 * x)", iv: "x > 8" }] },
  { n: 25, f: [{ e: "pow(2 - x, sin(x))", iv: "−2 < x ≤ 0" }, { e: "2 / log10(pow(x, 3) + 4)", iv: "0 < x ≤ 8" }, { e: "4 / (x + 8)", iv: "x > 8" }] },
  { n: 26, f: [{ e: "pow(PI, 2 * x) - 1", iv: "−9 < x ≤ 0" }, { e: "x / log10(x + 1)", iv: "0 < x ≤ 10" }, { e: "sin(2 * PI * cbrt(x) + 1)", iv: "10 < x ≤ 20" }] },
  { n: 27, f: [{ e: "tan(PI * x) - exp(x)", iv: "−π < x ≤ 0" }, { e: "pow(log10(x * x + 2), 2)", iv: "0 < x ≤ π" }, { e: "1 - 3 * log10(x)", iv: "x > π" }] },
  { n: 28, f: [{ e: "cbrt(pow(tan(x), 2))", iv: "−π/2 < x ≤ 0" }, { e: "x / log10(x + 1)", iv: "0 < x ≤ 10" }, { e: "exp(-sqrt(x + 1))", iv: "x > 10" }] },
  { n: 29, f: [{ e: "fabs(x * x - 1)", iv: "−100 < x ≤ 0" }, { e: "exp(-x * x / 2)", iv: "0 < x ≤ 3" }, { e: "1 - exp(-x)", iv: "3 < x < 7" }] },
  { n: 30, f: [{ e: "cbrt(x * x + 1)", iv: "x ≤ 0" }, { e: "2 / log10(x * x + 4)", iv: "0 < x ≤ 8" }, { e: "8 / log2(2 * x)", iv: "x > 8" }] },
];

/** Програма з оператором switch (ЛР5) або ланцюгом if/else (ЛР4 завд.2), що обирає формулу за номером n. */
export function pieceProgram(p: PieceVar, useSwitch: boolean): string {
  const branches = useSwitch
    ? [
        "    switch (n) {",
        `        case 1: y = ${p.f[0].e}; break;`,
        `        case 2: y = ${p.f[1].e}; break;`,
        `        case 3: y = ${p.f[2].e}; break;`,
        "        default: cout << \"Немає такої формули\\n\"; return 1;",
        "    }",
      ]
    : [
        `    if (n == 1) y = ${p.f[0].e};`,
        `    else if (n == 2) y = ${p.f[1].e};`,
        `    else if (n == 3) y = ${p.f[2].e};`,
        "    else { cout << \"Немає такої формули\\n\"; return 1; }",
      ];
  return [
    "#include <iostream>",
    "#include <cmath>",
    "using namespace std;",
    "",
    `// Варіант ${p.n}. y1: ${p.f[0].e} (${p.f[0].iv}); y2: ${p.f[1].e} (${p.f[1].iv}); y3: ${p.f[2].e} (${p.f[2].iv})`,
    "int main() {",
    "    const double PI = 3.14159265358979;",
    "    int n; double x, y = 0;",
    "    cout << \"Введiть номер формули n (1-3) i x: \";",
    "    cin >> n >> x;",
    ...branches,
    "    cout << \"n=\" << n << \"  x=\" << x << \"  y=\" << y << endl;",
    "    return 0;",
    "}",
  ].join("\n");
}

// ==================== ЛР4 завд.3 — вирази з МІН/МАКС (30) ====================
export const LR4_MINMAX: WordTask[] = [
  { n: 1, text: "A = (МІН(c·f, d) + 5)/МАКС(c, d·f/2)", vars: ["c", "f", "d"], result: { name: "A", expr: "(fmin(c * f, d) + 5) / fmax(c, d * f / 2)" }, label: "A", math: true },
  { n: 2, text: "B = МАКС(x+y, y·z)/МІН(y+z, x)", vars: ["x", "y", "z"], result: { name: "B", expr: "fmax(x + y, y * z) / fmin(y + z, x)" }, label: "B", math: true },
  { n: 3, text: "H = МІН(x−z, y)/(МАКС(x, z) + z)", vars: ["x", "y", "z"], result: { name: "H", expr: "fmin(x - z, y) / (fmax(x, z) + z)" }, label: "H", math: true },
  { n: 4, text: "V = (МАКС(x−a, b) + МІН(a, b+x))/(2a)", vars: ["x", "a", "b"], result: { name: "V", expr: "(fmax(x - a, b) + fmin(a, b + x)) / (2 * a)" }, label: "V", math: true },
  { n: 5, text: "F = МІН(x+y, y+z)/МАКС(x, y−z) + x·y", vars: ["x", "y", "z"], result: { name: "F", expr: "fmin(x + y, y + z) / fmax(x, y - z) + x * y" }, label: "F", math: true },
  { n: 6, text: "W = МІН(x, a·b)/МАКС(a+b, x)", vars: ["x", "a", "b"], result: { name: "W", expr: "fmin(x, a * b) / fmax(a + b, x)" }, label: "W", math: true },
  { n: 7, text: "P = МІН(x−y, y−z)·МАКС(x+y, z)/3", vars: ["x", "y", "z"], result: { name: "P", expr: "fmin(x - y, y - z) * fmax(x + y, z) / 3" }, label: "P", math: true },
  { n: 8, text: "C = МІН(x, b·x) + 2·МАКС(a−x, b)", vars: ["x", "b", "a"], result: { name: "C", expr: "fmin(x, b * x) + 2 * fmax(a - x, b)" }, label: "C", math: true },
  { n: 9, text: "Q = |МАКС(x−y, z) − МІН(3y, x)|/(4z + x)", vars: ["x", "y", "z"], result: { name: "Q", expr: "fabs(fmax(x - y, z) - fmin(3 * y, x)) / (4 * z + x)" }, label: "Q", math: true },
  { n: 10, text: "F = МІН(5x, y + z/5)/МАКС(x, y−3) + x³", vars: ["x", "y", "z"], result: { name: "F", expr: "fmin(5 * x, y + z / 5) / fmax(x, y - 3) + pow(x, 3)" }, label: "F", math: true },
  { n: 11, text: "Z = (МІН(x+b, y) − x)/МАКС(x², y·b)", vars: ["x", "b", "y"], result: { name: "Z", expr: "(fmin(x + b, y) - x) / fmax(x * x, y * b)" }, label: "Z", math: true },
  { n: 12, text: "N = МАКС(x·z, y)/МІН(x+y+z, x·y·z)", vars: ["x", "y", "z"], result: { name: "N", expr: "fmax(x * z, y) / fmin(x + y + z, x * y * z)" }, label: "N", math: true },
  { n: 13, text: "A = (МАКС(c³, d) + 7)/МІН(d+c, a²)", vars: ["c", "d", "a"], result: { name: "A", expr: "(fmax(pow(c, 3), d) + 7) / fmin(d + c, a * a)" }, label: "A", math: true },
  { n: 14, text: "B = 5·МІН(a, b·c) − МАКС(a−c, b)", vars: ["a", "b", "c"], result: { name: "B", expr: "5 * fmin(a, b * c) - fmax(a - c, b)" }, label: "B", math: true },
  { n: 15, text: "R = МІН(c·d, n) + МАКС(c, n·d)", vars: ["c", "d", "n"], result: { name: "R", expr: "fmin(c * d, n) + fmax(c, n * d)" }, label: "R", math: true },
  { n: 16, text: "Z = (МАКС(3a, x) − МІН(a−x, y))/(x+y)", vars: ["a", "x", "y"], result: { name: "Z", expr: "(fmax(3 * a, x) - fmin(a - x, y)) / (x + y)" }, label: "Z", math: true },
  { n: 17, text: "P = МАКС(x, y·z)/(x·y·z) + МІН(x−y, z)", vars: ["x", "y", "z"], result: { name: "P", expr: "fmax(x, y * z) / (x * y * z) + fmin(x - y, z)" }, label: "P", math: true },
  { n: 18, text: "Q = (d − МІН(d, a))/МАКС(c·d, |a|)", vars: ["d", "a", "c"], result: { name: "Q", expr: "(d - fmin(d, a)) / fmax(c * d, fabs(a))" }, label: "Q", math: true },
  { n: 19, text: "U = МАКС(a, b) + МІН(a, b·c)/2", vars: ["a", "b", "c"], result: { name: "U", expr: "fmax(a, b) + fmin(a, b * c) / 2" }, label: "U", math: true },
  { n: 20, text: "T = МАКС(x³−y, z)/МІН(x+y+z, x·y·z/3)", vars: ["x", "y", "z"], result: { name: "T", expr: "fmax(pow(x, 3) - y, z) / fmin(x + y + z, x * y * z / 3)" }, label: "T", math: true },
  { n: 21, text: "S = (МАКС(x−y, y) − МІН(x+y, z))/(10−y)", vars: ["x", "y", "z"], result: { name: "S", expr: "(fmax(x - y, y) - fmin(x + y, z)) / (10 - y)" }, label: "S", math: true },
  { n: 22, text: "L = МІН(z, y+2)/(МАКС(x·y, z) − y)", vars: ["x", "y", "z"], result: { name: "L", expr: "fmin(z, y + 2) / (fmax(x * y, z) - y)" }, label: "L", math: true },
  { n: 23, text: "J = МІН(a²·b, x³) − МАКС(a·x, b+x)", vars: ["a", "b", "x"], result: { name: "J", expr: "fmin(a * a * b, pow(x, 3)) - fmax(a * x, b + x)" }, label: "J", math: true },
  { n: 24, text: "D = МІН(x−a, a−b)/(2·МАКС(x, a+b))", vars: ["x", "a", "b"], result: { name: "D", expr: "fmin(x - a, a - b) / (2 * fmax(x, a + b))" }, label: "D", math: true },
  { n: 25, text: "I = (МАКС(x, z) − МІН(y, x−2))/(x + y⁴)", vars: ["x", "y", "z"], result: { name: "I", expr: "(fmax(x, z) - fmin(y, x - 2)) / (x + pow(y, 4))" }, label: "I", math: true },
  { n: 26, text: "T = МІН(x+y, z)/(МАКС(x³, z²) + 5)", vars: ["x", "y", "z"], result: { name: "T", expr: "fmin(x + y, z) / (fmax(pow(x, 3), z * z) + 5)" }, label: "T", math: true },
  { n: 27, text: "I = 10 − МАКС(x·z, y·z−8)/МІН(x + y/2, z)", vars: ["x", "y", "z"], result: { name: "I", expr: "10 - fmax(x * z, y * z - 8) / fmin(x + y / 2, z)" }, label: "I", math: true },
  { n: 28, text: "P = МАКС(x·|y|, z) + 3·МІН(z, (x+y)/2)", vars: ["x", "y", "z"], result: { name: "P", expr: "fmax(x * fabs(y), z) + 3 * fmin(z, (x + y) / 2)" }, label: "P", math: true },
  { n: 29, text: "J = (МІН(b·x+2, c) + МАКС(c−b, x))/5", vars: ["b", "x", "c"], result: { name: "J", expr: "(fmin(b * x + 2, c) + fmax(c - b, x)) / 5" }, label: "J", math: true },
  { n: 30, text: "C = МАКС(a+n, m) − 3·МІН(m−n, a)", vars: ["a", "n", "m"], result: { name: "C", expr: "fmax(a + n, m) - 3 * fmin(m - n, a)" }, label: "C", math: true },
];

// ==================== ЛР8 — матриця оцінок (студенти × дисципліни), 20 ====================
export interface GradeVar {
  n: number;
  text: string;
  axis: "disc" | "stud";
  op: "count5" | "count2" | "avg" | "quality" | "success" | "listTwo" | "listOnly45";
  extreme?: "max" | "min";
}

export const LR8_GRADES: GradeVar[] = [
  { n: 1, text: "Дисципліни з максимальною кількістю 5-ок.", axis: "disc", op: "count5", extreme: "max" },
  { n: 2, text: "Студенти з максимальною кількістю 5-ок.", axis: "stud", op: "count5", extreme: "max" },
  { n: 3, text: "Дисципліни з максимальною кількістю 2-ок.", axis: "disc", op: "count2", extreme: "max" },
  { n: 4, text: "Студенти з максимальною кількістю 5-ок.", axis: "stud", op: "count5", extreme: "max" },
  { n: 5, text: "Дисципліни з максимальним середнім балом.", axis: "disc", op: "avg", extreme: "max" },
  { n: 6, text: "Студенти з максимальним середнім балом.", axis: "stud", op: "avg", extreme: "max" },
  { n: 7, text: "Середній бал кожного зі студентів, що мають хоча б одну 2-ку.", axis: "stud", op: "listTwo" },
  { n: 8, text: "Середній бал з кожної дисципліни, з якої студенти отримали хоча б одну 2-ку.", axis: "disc", op: "listTwo" },
  { n: 9, text: "Дисципліни з мінімальною кількістю 5-ок.", axis: "disc", op: "count5", extreme: "min" },
  { n: 10, text: "Студенти з мінімальною кількістю 5-ок.", axis: "stud", op: "count5", extreme: "min" },
  { n: 11, text: "Дисципліни з мінімальною кількістю 2-ок.", axis: "disc", op: "count2", extreme: "min" },
  { n: 12, text: "Студенти з мінімальною кількістю 5-ок.", axis: "stud", op: "count5", extreme: "min" },
  { n: 13, text: "Дисципліни з мінімальним середнім балом.", axis: "disc", op: "avg", extreme: "min" },
  { n: 14, text: "Студенти з мінімальним середнім балом.", axis: "stud", op: "avg", extreme: "min" },
  { n: 15, text: "Середній бал кожного зі студентів, що мають лише 4 та 5.", axis: "stud", op: "listOnly45" },
  { n: 16, text: "Середній бал з кожної дисципліни, з якої студенти отримали лише 4 та 5.", axis: "disc", op: "listOnly45" },
  { n: 17, text: "Дисципліни з максимальною якістю навчання (позитивні / усі оцінки).", axis: "disc", op: "quality", extreme: "max" },
  { n: 18, text: "Дисципліни з мінімальною якістю навчання (позитивні / усі оцінки).", axis: "disc", op: "quality", extreme: "min" },
  { n: 19, text: "Дисципліни з максимальною успішністю (4-ки та 5-ки / усі оцінки).", axis: "disc", op: "success", extreme: "max" },
  { n: 20, text: "Дисципліни з мінімальною успішністю (4-ки та 5-ки / усі оцінки).", axis: "disc", op: "success", extreme: "min" },
];

export function gradesProgram(g: GradeVar): string {
  const outer = g.axis === "disc" ? "j" : "i";
  const inner = g.axis === "disc" ? "i" : "j";
  const outerN = g.axis === "disc" ? "M" : "N";
  const innerN = g.axis === "disc" ? "N" : "M";
  const elem = "G[i][j]";
  const kind = g.axis === "disc" ? "Дисциплiна" : "Студент";
  const lines: string[] = [
    "#include <iostream>",
    "#include <cstdlib>",
    "using namespace std;",
    "",
    `// Варіант ${g.n}. ${g.text}`,
    "int main() {",
    "    const int N = 5, M = 5;   // N студентів, M дисциплін",
    "    int G[N][M];",
    "    srand(12345);",
    "    for (int i = 0; i < N; i++) {",
    "        for (int j = 0; j < M; j++) { G[i][j] = rand() % 4 + 2; cout << G[i][j] << ' '; }   // оцінки 2..5",
    "        cout << endl;",
    "    }",
  ];
  if (g.op === "listTwo" || g.op === "listOnly45") {
    const cond =
      g.op === "listTwo"
        ? `${elem} == 2`
        : `(${elem} == 4 || ${elem} == 5)`;
    const want = g.op === "listTwo" ? "hasTwo" : "all45";
    const init = g.op === "listTwo" ? "false" : "true";
    const upd = g.op === "listTwo" ? `if (${cond}) ${want} = true;` : `if (!(${cond})) ${want} = false;`;
    lines.push(
      `    for (int ${outer} = 0; ${outer} < ${outerN}; ${outer}++) {`,
      `        bool ${want} = ${init};`,
      "        double sum = 0;",
      `        for (int ${inner} = 0; ${inner} < ${innerN}; ${inner}++) { sum += ${elem}; ${upd} }`,
      `        if (${want}) cout << "${kind} " << ${outer} + 1 << ": середнiй бал " << sum / ${innerN} << endl;`,
      "    }",
    );
  } else {
    // метрика по індексу outer
    let metric: string;
    if (g.op === "count5") metric = `if (${elem} == 5) val++;`;
    else if (g.op === "count2") metric = `if (${elem} == 2) val++;`;
    else if (g.op === "avg") metric = `val += ${elem};`;
    else if (g.op === "quality") metric = `if (${elem} >= 3) val++;`;
    else metric = `if (${elem} >= 4) val++;`;
    const finalize = g.op === "avg" || g.op === "quality" || g.op === "success" ? ` / ${innerN}` : "";
    const cmp = g.extreme === "max" ? ">" : "<";
    lines.push(
      "    int best = 0;",
      "    double bestVal = -1e9;",
      g.extreme === "min" ? "    bestVal = 1e9;" : "",
      `    for (int ${outer} = 0; ${outer} < ${outerN}; ${outer}++) {`,
      "        double val = 0;",
      `        for (int ${inner} = 0; ${inner} < ${innerN}; ${inner}++) ${metric}`,
      `        double m = val${finalize};`,
      `        if (m ${cmp} bestVal) { bestVal = m; best = ${outer}; }`,
      "    }",
      `    cout << "${kind} " << best + 1 << " (значення " << bestVal << ")" << endl;`,
    );
  }
  lines.push("    return 0;", "}");
  return lines.filter((l) => l !== "").join("\n");
}

// ==================== ЛР12 — std::array, елементи на парних/непарних місцях (15) ====================
export interface StdArrVar {
  n: number;
  text: string;
  /** Тіло після заповнення масиву a (std::array<int,N>, N=10, значення [-5,5]). */
  body: string[];
}

// місця 1-based: непарні → індекси 0,2,4… (start 0); парні → 1,3,5… (start 1)
const whileOdd = (inner: string[]) => ["    int i = 0;", "    while (i < N) {", "        int e = a[i];", ...inner.map((l) => "        " + l), "        i += 2;", "    }"];
const whileEven = (inner: string[]) => ["    int i = 1;", "    while (i < N) {", "        int e = a[i];", ...inner.map((l) => "        " + l), "        i += 2;", "    }"];
const doOdd = (inner: string[]) => ["    int i = 0;", "    do {", "        int e = a[i];", ...inner.map((l) => "        " + l), "        i += 2;", "    } while (i < N);"];

export const LR12_VARS: StdArrVar[] = [
  { n: 1, text: "Кількість і сума позитивних елементів на парних місцях (while, без %).", body: ["int cnt = 0; double sum = 0;", ...whileEven(["if (e > 0) { cnt++; sum += e; }"]), `cout << "Кiлькiсть: " << cnt << "   Сума: " << sum << endl;`] },
  { n: 2, text: "Номери, кількість і сума негативних елементів на непарних місцях (while, без %).", body: ["int cnt = 0; double sum = 0;", ...whileOdd(["if (e < 0) { cnt++; sum += e; cout << \"номер \" << i + 1 << \" \"; }"]), `cout << "\\nКiлькiсть: " << cnt << "   Сума: " << sum << endl;`] },
  { n: 3, text: "Середнє арифметичне і кількість негативних елементів на непарних місцях (while, без %).", body: ["int cnt = 0; double sum = 0;", ...whileOdd(["if (e < 0) { cnt++; sum += e; }"]), `cout << "Кiлькiсть: " << cnt << "   Середнє: " << (cnt ? sum / cnt : 0) << endl;`] },
  { n: 4, text: "Сума, номери і кількість позитивних елементів на непарних місцях (while, без %).", body: ["int cnt = 0; double sum = 0;", ...whileOdd(["if (e > 0) { cnt++; sum += e; cout << \"номер \" << i + 1 << \" \"; }"]), `cout << "\\nКiлькiсть: " << cnt << "   Сума: " << sum << endl;`] },
  { n: 5, text: "Кількість і середнє арифметичне елементів на непарних місцях (while, без %).", body: ["int cnt = 0; double sum = 0;", ...whileOdd(["cnt++; sum += e;"]), `cout << "Кiлькiсть: " << cnt << "   Середнє: " << (cnt ? sum / cnt : 0) << endl;`] },
  { n: 6, text: "Добуток і сума негативних елементів на непарних місцях (while, без %).", body: ["long long prod = 1; double sum = 0; bool any = false;", ...whileOdd(["if (e < 0) { prod *= e; sum += e; any = true; }"]), `cout << "Добуток: " << (any ? prod : 0) << "   Сума: " << sum << endl;`] },
  { n: 7, text: "Елементи на парних місцях звести в квадрат і знайти їх суму (while, без %).", body: ["long long sum = 0;", ...whileEven(["sum += (long long)e * e;"]), `cout << "Сума квадратiв: " << sum << endl;`] },
  { n: 8, text: "Сума та добуток позитивних елементів на непарних місцях (do…while, без %).", body: ["double sum = 0; long long prod = 1; bool any = false;", ...doOdd(["if (e > 0) { sum += e; prod *= e; any = true; }"]), `cout << "Сума: " << sum << "   Добуток: " << (any ? prod : 0) << endl;`] },
  { n: 9, text: "Елементи на непарних місцях помножити на 5; знайти суму всього масиву; вивести номери позитивних елементів (do…while, без %).", body: [...doOdd(["a[i] = e * 5;"]), "double sum = 0;", "for (int k = 0; k < N; k++) { sum += a[k]; if (a[k] > 0) cout << \"номер \" << k + 1 << \" \"; }", `cout << "\\nСума масиву: " << sum << endl;`] },
  { n: 10, text: "Сума негативних елементів на непарних місцях; вивести номери елементів, що дорівнюють 1 (do…while, без %).", body: ["double sum = 0;", ...doOdd(["if (e < 0) sum += e;"]), "for (int k = 0; k < N; k++) if (a[k] == 1) cout << \"номер \" << k + 1 << \" \";", `cout << "\\nСума негативних: " << sum << endl;`] },
  { n: 11, text: "Вдвічі збільшити елементи на непарних місцях; вивести номери нульових елементів (do…while, без %).", body: [...doOdd(["a[i] = e * 2;"]), "for (int k = 0; k < N; k++) if (a[k] == 0) cout << \"номер \" << k + 1 << \" \";", `cout << "\\n(елементи на непарних мiсцях подвоєно)" << endl;`] },
  { n: 12, text: "Сума та кількість позитивних елементів на непарних місцях (do…while, без %).", body: ["int cnt = 0; double sum = 0;", ...doOdd(["if (e > 0) { cnt++; sum += e; }"]), `cout << "Кiлькiсть: " << cnt << "   Сума: " << sum << endl;`] },
  { n: 13, text: "Змінити знак елементів на парних місцях; сума отриманого масиву і кількість нульових елементів (do…while, без %).", body: ["int i = 1;", "do { a[i] = -a[i]; i += 2; } while (i < N);", "double sum = 0; int zeros = 0;", "for (int k = 0; k < N; k++) { sum += a[k]; if (a[k] == 0) zeros++; }", `cout << "Сума: " << sum << "   Нульових: " << zeros << endl;`] },
  { n: 14, text: "Сума та добуток позитивних елементів на непарних місцях (do…while, без %).", body: ["double sum = 0; long long prod = 1; bool any = false;", ...doOdd(["if (e > 0) { sum += e; prod *= e; any = true; }"]), `cout << "Сума: " << sum << "   Добуток: " << (any ? prod : 0) << endl;`] },
  { n: 15, text: "Добуток позитивних елементів (зведених у квадрат) на непарних місцях; кількість нульових елементів; номери позитивних (do…while, без %).", body: ["long long prod = 1; bool any = false;", ...doOdd(["if (e > 0) { prod *= (long long)e * e; any = true; cout << \"номер \" << i + 1 << \" \"; }"]), "int zeros = 0;", "for (int k = 0; k < N; k++) if (a[k] == 0) zeros++;", `cout << "\\nДобуток квадратiв: " << (any ? prod : 0) << "   Нульових: " << zeros << endl;`] },
];

export function stdArrayProgram(v: StdArrVar): string {
  return [
    "#include <iostream>",
    "#include <array>",
    "#include <cstdlib>",
    "using namespace std;",
    "",
    `// Варіант ${v.n}. ${v.text}`,
    "int main() {",
    "    const int N = 10;",
    "    array<int, N> a;",
    "    srand(12345);",
    "    for (int k = 0; k < N; k++) { a[k] = rand() % 11 - 5; cout << a[k] << ' '; }   // значення [-5, 5]",
    "    cout << endl;",
    ...v.body.map((l) => "    " + l),
    "    return 0;",
    "}",
  ].join("\n");
}

// ==================== ЛР11 — обробка символьних даних (15) ====================
export interface StrVar {
  n: number;
  statText: string;
  /** Рядки коду статистики (працюють з рядком s). */
  stat: string[];
  makeText: string;
  /** Рядки коду створення нового рядка r. */
  make: string[];
}

const U = "(c >= 'A' && c <= 'Z')";
const L = "(c >= 'a' && c <= 'z')";
const Dg = "(c >= '0' && c <= '9')";
const LAT = `(${U} || ${L})`;
const countStat = (pred: string, label: string) => [`int cnt = 0;`, `for (char c : s) if (${pred}) cnt++;`, `cout << "${label}: " << cnt << endl;`];
const allStat = (pred: string, label: string) => [`bool all = !s.empty();`, `for (char c : s) if (!(${pred})) all = false;`, `cout << "${label}: " << (all ? "так" : "нi") << endl;`];
const whichStat = (p1: string, p2: string, n1: string, n2: string) => [`int c1 = 0, c2 = 0;`, `for (char c : s) { if (${p1}) c1++; if (${p2}) c2++; }`, `cout << (c1 > c2 ? "бiльше: ${n1}" : c1 < c2 ? "бiльше: ${n2}" : "порівну") << endl;`];
const hasStat = (pred: string, label: string) => [`bool has = false;`, `for (char c : s) if (${pred}) has = true;`, `cout << "${label}: " << (has ? "так" : "нi") << endl;`];
const keep = (pred: string) => [`for (char c : s) if (${pred}) r += c;`];
const reorder = (p1: string, p2: string) => [`for (char c : s) if (${p1}) r += c;`, `for (char c : s) if (${p2}) r += c;`];

export const LR11_VARS: StrVar[] = [
  { n: 1, statText: "кількість великих латинських букв", stat: countStat(U, "Великих латинських"), makeText: "рядок з малих латинських букв", make: keep(L) },
  { n: 2, statText: "кількість малих латинських букв", stat: countStat(L, "Малих латинських"), makeText: "рядок з великих латинських букв", make: keep(U) },
  { n: 3, statText: "кількість цифр", stat: countStat(Dg, "Цифр"), makeText: "рядок з цифр", make: keep(Dg) },
  { n: 4, statText: "кількість латинських букв та цифр", stat: countStat(`${LAT} || ${Dg}`, "Латинських букв i цифр"), makeText: "рядок з латинських букв", make: keep(LAT) },
  { n: 5, statText: "кількість латинських букв", stat: countStat(LAT, "Латинських букв"), makeText: "рядок з цифр та латинських букв", make: keep(`${Dg} || ${LAT}`) },
  { n: 6, statText: "чи всі символи — великі латинські букви", stat: allStat(U, "Усі великі латинські"), makeText: "рядок із символів, крім цифр і латинських букв", make: keep(`!(${Dg} || ${LAT})`) },
  { n: 7, statText: "чи всі символи — малі латинські букви", stat: allStat(L, "Усі малі латинські"), makeText: "рядок із символів, крім цифр", make: keep(`!${Dg}`) },
  { n: 8, statText: "чи всі символи — латинські букви", stat: allStat(LAT, "Усі латинські"), makeText: "рядок із символів, крім латинських букв", make: keep(`!${LAT}`) },
  { n: 9, statText: "чи всі символи — цифри", stat: allStat(Dg, "Усі цифри"), makeText: "рядок із символів, крім малих латинських букв", make: keep(`!${L}`) },
  { n: 10, statText: "чи всі символи — цифри або латинські букви", stat: allStat(`${Dg} || ${LAT}`, "Усі цифри або латинські"), makeText: "рядок із символів, крім великих латинських букв", make: keep(`!${U}`) },
  { n: 11, statText: "яких латинських букв більше (великих чи малих)", stat: whichStat(U, L, "великих", "малих"), makeText: "рядок із символів, крім пробілу та табуляції", make: keep("!(c == ' ' || c == '\\t')") },
  { n: 12, statText: "яких символів більше: цифр чи латинських букв", stat: whichStat(Dg, LAT, "цифр", "латинських букв"), makeText: "рядок з цифр та латинських букв (спершу цифри, потім букви)", make: reorder(Dg, LAT) },
  { n: 13, statText: "яких символів більше: цифр чи великих латинських букв", stat: whichStat(Dg, U, "цифр", "великих латинських"), makeText: "рядок з цифр та латинських букв (спершу букви, потім цифри)", make: reorder(LAT, Dg) },
  { n: 14, statText: "яких символів більше: цифр чи малих латинських букв", stat: whichStat(Dg, L, "цифр", "малих латинських"), makeText: "рядок з латинських букв (спершу малі, потім великі)", make: reorder(L, U) },
  { n: 15, statText: "чи є в рядку пробіл або символ табуляції", stat: hasStat("c == ' ' || c == '\\t'", "Є пробiл або табуляцiя"), makeText: "рядок з латинських букв (спершу великі, потім малі)", make: reorder(U, L) },
];

export function stringProgram(v: StrVar): string {
  return [
    "#include <iostream>",
    "#include <string>",
    "using namespace std;",
    "",
    `// Варіант ${v.n}. Статистика: ${v.statText}. Новий рядок: ${v.makeText}.`,
    "int main() {",
    "    string s;",
    "    cout << \"Введiть рядок: \";",
    "    getline(cin, s);",
    "    // статистична обробка",
    ...v.stat.map((l) => "    " + l),
    "    // створення нового рядка",
    "    string r;",
    ...v.make.map((l) => "    " + l),
    "    cout << \"Новий рядок: \" << r << endl;",
    "    return 0;",
    "}",
  ].join("\n");
}

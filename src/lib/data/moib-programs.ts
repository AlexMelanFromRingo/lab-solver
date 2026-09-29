/**
 * Программы на C++ к лабораторным МОІБ: по каждой методичка требует
 * распечатку текста программы и результатов с датой, номером работы, ПІБ,
 * группой и вариантом. Алгоритмы — пошаговые из методички, без библиотечных
 * gcd и т. п. Строку STUDENT студент заполняет сам.
 */

const head = (lab: string, topic: string, variant: string) => `#include <iostream>
#include <iomanip>
#include <ctime>
using namespace std;

const char* STUDENT = "Прізвище І. П., група";
const char* LAB = "Лабораторна робота № ${lab}. ${topic}";
const char* VARIANT = "${variant}";

void header() {
    time_t t = time(nullptr);
    cout << LAB << endl << STUDENT << ", " << VARIANT << endl
         << "Дата: " << put_time(localtime(&t), "%d.%m.%Y") << endl << endl;
}
`;

export function progEuclid(a: number, b: number, v: string): string {
  return `${head("1_1", "Алгоритм Евкліда", v)}
// Покроковий алгоритм Евкліда (кроки 1–4 методички); заодно елементи
// неперервного дробу a/b — це послідовні частки.
long long gcdEuclid(long long a, long long b, bool show) {
    long long A = a, B = b, R = b;
    while (true) {
        long long q = A / B;
        R = A % B;                                   // крок 2
        if (show) cout << A << " = " << B << " * " << q << " + " << R << endl;
        if (R == 0) return B;                        // крок 3
        A = B; B = R;                                // крок 4
    }
}

void fraction(long long a, long long b) {
    cout << a << "/" << b << " = [" << a / b;
    long long r = a % b; a = b; b = r;
    for (int i = 0; b != 0; i++) {
        cout << (i == 0 ? "; " : ", ") << a / b;
        r = a % b; a = b; b = r;
    }
    cout << "]" << endl;
}

void solve(long long a, long long b) {
    long long d = gcdEuclid(a, b, true);
    cout << "НСД(" << a << ", " << b << ") = " << d << endl;
    cout << "НСК(" << a << ", " << b << ") = " << a / d * b << endl;
    fraction(a, b);
    cout << endl;
}

int main() {
    header();
    cout << "Контрольний приклад" << endl;
    solve(1234, 54);
    cout << "Індивідуальне завдання" << endl;
    solve(${a}, ${b});
    return 0;
}
`;
}

export function progExtEuclid(a: number, b: number, v: string): string {
  return `${head("1_2", "Розширений алгоритм Евкліда", v)}
// Таблиця «залишки — частки — x — y»: кожен рядок r = a*x + b*y.
long long extEuclid(long long a, long long b, long long& X, long long& Y) {
    long long r0 = a, r1 = b, x0 = 1, x1 = 0, y0 = 0, y1 = 1;
    cout << "   Залишки    Частки         x         y" << endl;   // setw рахує байти, не літери
    cout << setw(10) << r0 << setw(10) << "*" << setw(10) << x0 << setw(10) << y0 << endl;
    cout << setw(10) << r1 << setw(10) << "*" << setw(10) << x1 << setw(10) << y1 << endl;
    while (true) {
        long long q = r0 / r1, r = r0 - q * r1;
        if (r == 0) { cout << setw(10) << 0 << setw(10) << q << endl; break; }
        long long x = x0 - q * x1, y = y0 - q * y1;
        cout << setw(10) << r << setw(10) << q << setw(10) << x << setw(10) << y << endl;
        r0 = r1; r1 = r; x0 = x1; x1 = x; y0 = y1; y1 = y;
    }
    X = x1; Y = y1;
    return r1;
}

void solve(long long a, long long b) {
    long long x, y, d = extEuclid(a, b, x, y);
    cout << "НСД = " << d << " = " << a << "*(" << x << ") + " << b << "*(" << y << ")" << endl;
    cout << "НСК = " << a / d * b << endl << endl;
}

int main() {
    header();
    cout << "Контрольний приклад" << endl;
    solve(1234, 54);
    cout << "Індивідуальне завдання" << endl;
    solve(${a}, ${b});
    return 0;
}
`;
}

export function progTrial(n: number, v: string): string {
  return `${head("2_1", "Розкладання числа на множники методом проб", v)}
// Алгоритм методички дає найменший простий дільник F числа n;
// повторюємо його для частки, поки не отримаємо канонічний розклад.
long long smallestDivisor(long long n) {
    long long F = 2;                                  // крок 1
    while (true) {
        if (n % F == 0) return F;                     // крок 2
        F = F + 1;                                    // крок 3
        if (F * F > n) return n;                      // крок 4: n просте
    }
}

void solve(long long n) {
    long long p[32], k[32]; int cnt = 0;
    for (long long m = n; m > 1; ) {
        long long F = smallestDivisor(m);
        if (cnt > 0 && p[cnt - 1] == F) k[cnt - 1]++; else { p[cnt] = F; k[cnt] = 1; cnt++; }
        m /= F;
    }
    long long tau = 1, sigma = 1;
    cout << n << " = ";
    for (int i = 0; i < cnt; i++) {
        cout << p[i] << "^" << k[i] << (i + 1 < cnt ? " * " : "");
        tau *= k[i] + 1;
        long long s = 1, pw = 1;
        for (int j = 0; j < k[i]; j++) { pw *= p[i]; s += pw; }
        sigma *= s;
    }
    cout << endl << "tau(" << n << ") = " << tau << ", S(" << n << ") = " << sigma << endl << endl;
}

int main() {
    header();
    cout << "Контрольний приклад" << endl;
    solve(60);
    cout << "Індивідуальне завдання" << endl;
    solve(${n});
    return 0;
}
`;
}

export function progFermat(n: string, v: string): string {
  return `${head("2_2", "Розкладання числа на множники за алгоритмом Ферма", v)}
#include <cmath>

long long isqrtll(long long n) {
    long long x = (long long)sqrtl((long double)n);
    while (x * x > n) x--;
    while ((x + 1) * (x + 1) <= n) x++;
    return x;
}

void fermat(long long n) {
    long long x = isqrtll(n);
    cout << "n = " << n << ", x = [sqrt(n)] = " << x << endl;
    if (x * x == n) { cout << "n = " << x << "^2" << endl << endl; return; }
    x++;
    while (true) {
        if (x == (n + 1) / 2) { cout << "x = (n + 1)/2: n - просте" << endl << endl; return; }
        long long d = x * x - n, y = isqrtll(d);
        cout << "x = " << x << ", x^2 - n = " << d << (y * y == d ? " = y^2" : "") << endl;
        if (y * y == d) {
            cout << n << " = (" << x << " + " << y << ")(" << x << " - " << y << ") = "
                 << x + y << " * " << x - y << endl << endl;
            return;
        }
        x++;
    }
}

int main() {
    header();
    cout << "Контрольний приклад" << endl;
    fermat(45);
    cout << "Бригадне завдання" << endl;
    fermat(${n}LL);
    return 0;
}
`;
}

export function progSieve(lo: number, hi: number, v: string): string {
  return `${head("3_1", "Решето Ератосфена", v)}
#include <vector>

// Вектор з непарних чисел: комірка j відповідає числу 2j+1 (кроки 1–4).
vector<int> sieve(int n) {
    vector<char> v((n - 1) / 2 + 1, 1);
    v[0] = 0;                                        // 1 — не просте
    for (int p = 3; p * p <= n; p += 2) {            // крок 2
        if (!v[(p - 1) / 2]) continue;               // крок 3
        for (int T = p * p; T <= n; T += 2 * p)      // крок 4
            v[(T - 1) / 2] = 0;
    }
    vector<int> primes;
    if (n >= 2) primes.push_back(2);
    for (int j = 1; j < (int)v.size(); j++) if (v[j]) primes.push_back(2 * j + 1);
    return primes;
}

void byDecades(int lo, int hi) {
    vector<int> pr = sieve(hi);
    for (int d = lo / 10 * 10; d < hi; d += 10) {
        int a = d < lo ? lo : d, b = d + 9 > hi ? hi : d + 9;
        cout << setw(5) << a << " - " << setw(5) << b << ": ";
        for (int p : pr) if (p >= a && p <= b) cout << p << " ";
        cout << endl;
    }
    cout << endl;
}

int main() {
    header();
    cout << "Контрольний приклад: прості числа до 41" << endl;
    for (int p : sieve(41)) cout << p << " ";
    cout << endl << endl << "Індивідуальне завдання" << endl;
    byDecades(${lo}, ${hi});
    return 0;
}
`;
}

export function progCongruence(a: number, b: number, m: number, v: string): string {
  return `${head("3_2", "Вирішення лінійного порівняння", v)}
// Таблиця розширеного алгоритму Евкліда — підпрограма з лабораторної 1_2
// (формальні параметри a, b; результат — x, y і НСД).
long long extTable(long long a, long long b, long long& X, long long& Y) {
    long long r0 = a, r1 = b, x0 = 1, x1 = 0, y0 = 0, y1 = 1;
    cout << " Залишок  Частка       x       y" << endl;   // setw рахує байти, не літери
    cout << setw(8) << r0 << setw(8) << "-" << setw(8) << x0 << setw(8) << y0 << endl;
    cout << setw(8) << r1 << setw(8) << "-" << setw(8) << x1 << setw(8) << y1 << endl;
    while (true) {
        long long q = r0 / r1, r = r0 - q * r1;
        if (r == 0) { cout << setw(8) << 0 << setw(8) << q << endl; break; }
        long long x = x0 - q * x1, y = y0 - q * y1;
        cout << setw(8) << r << setw(8) << q << setw(8) << x << setw(8) << y << endl;
        r0 = r1; r1 = r; x0 = x1; x1 = x; y0 = y1; y1 = y;
    }
    X = x1; Y = y1;
    return r1;
}

void solve(long long a, long long b, long long m) {
    cout << a << "x = " << b << " (mod " << m << ")" << endl;
    long long x, y, d = extTable(m, a % m, x, y);        // фактичні параметри
    if (b % d != 0) { cout << "Розв'язків немає" << endl << endl; return; }
    long long mm = m / d, inv = ((y % mm) + mm) % mm;
    if (d > 1) {                                          // скорочуємо на d
        long long x2, y2; extTable(mm, (a / d) % mm, x2, y2);
        inv = ((y2 % mm) + mm) % mm;
    }
    long long x0 = ((b / d % mm) * inv % mm + mm) % mm;
    cout << "Обернений елемент: " << inv << ", x = " << x0 << " (mod " << mm << ")";
    for (long long i = 1; i < d; i++) cout << ", " << x0 + i * mm;
    cout << endl << endl;
}

int main() {
    header();
    cout << "Контрольний приклад" << endl;
    solve(7, 3, 15);
    cout << "Індивідуальне завдання" << endl;
    solve(${a}, ${b}, ${m});
    return 0;
}
`;
}

export function progMiller(): string {
  return `${head("4_1", "Тест Міллера", "числа табл. 4.2")}
long long powmod(long long b, long long e, long long n) {
    long long r = 1; b %= n;
    while (e > 0) { if (e & 1) r = r * b % n; b = b * b % n; e >>= 1; }
    return r;
}

void miller(long long n, long long b) {
    long long q = n - 1; int k = 0;
    while (q % 2 == 0) { q /= 2; k++; }                  // крок 1
    cout << "n = " << n << ", b = " << b << ": n - 1 = 2^" << k << " * " << q << endl;
    int i = 0; long long r = powmod(b, q, n);            // крок 2
    bool unknown = false;
    cout << "Ступінь  Вирахування" << endl;
    while (true) {
        cout << setw(4) << "2^" << i << "*" << q << setw(10) << r << endl;
        if ((i == 0 && r == 1) || r == n - 1) unknown = true;   // крок 3
        i++; if (i >= k) break;                          // крок 5
        r = r * r % n;                                   // крок 4
    }
    cout << (unknown ? "нічого певного сказати не можна" : "n - складене") << endl << endl;
}

int main() {
    header();
    miller(341, 2);
    miller(561, 2);
    miller(25, 2);
    miller(25, 7);
    return 0;
}
`;
}

export function progSolovay(): string {
  return `${head("4_2", "Тест Соловея-Штрассена", "бригадні завдання 1-2")}
long long gcdll(long long a, long long b) { while (b) { long long r = a % b; a = b; b = r; } return a; }

long long powmod(long long b, long long e, long long n) {
    long long r = 1; b %= n;
    while (e > 0) { if (e & 1) r = r * b % n; b = b * b % n; e >>= 1; }
    return r;
}

int jacobi(long long a, long long n) {
    int s = 1; a %= n;
    while (a != 0) {
        while (a % 2 == 0) { a /= 2; if (n % 8 == 3 || n % 8 == 5) s = -s; }
        long long t = a; a = n; n = t;
        if (a % 4 == 3 && n % 4 == 3) s = -s;
        a %= n;
    }
    return n == 1 ? s : 0;
}

bool test(long long n, long long a) {
    cout << "a = " << a;
    if (gcdll(a, n) != 1) { cout << ": НСД != 1, n - складене" << endl; return false; }   // крок 2
    long long j = powmod(a, (n - 1) / 2, n);                                          // крок 3
    int J = jacobi(a, n);                                                              // крок 4
    long long Jm = (J + n) % n;
    cout << ": j = " << (j == n - 1 ? -1 : j) << ", J = " << J;
    if (j != Jm) { cout << " -> n - складене" << endl; return false; }                  // крок 5
    cout << " -> тест пройдено" << endl;                                              // крок 6
    return true;
}

int main() {
    header();
    cout << "Контрольний приклад 1: n = 2023" << endl;  test(2023, 792);
    cout << endl << "Контрольний приклад 2: n = 5987, 10 значень a" << endl;
    long long as[] = {3, 5, 7, 9, 11, 13, 15, 17, 25, 101};
    for (long long a : as) test(5987, a);
    cout << endl << "Бригадне завдання 1: n = 557" << endl;  test(557, 18);
    cout << endl << "Бригадне завдання 2: n = 1381, помилка < 0.01 -> 7 значень a" << endl;
    for (long long a = 2; a <= 8; a++) test(1381, a);
    return 0;
}
`;
}

/**
 * Генератор готового C++ RSA "с нуля" — конструктор из комбинируемых частей: свой ГПСЧ,
 * свой тест простоты, режим работы (числа или файл/текст по проверенной схеме
 * 20-битных блоков + Base64 из rust-rsa-from-scratch/rsa_encryptor). Каждая комбинация
 * скомпилирована и сверена (см. scripts/verify-codegen) — вывод совпадает с расчётами
 * калькулятора RSA на сайте.
 */

export type PrngType = "middle-square" | "lcg" | "rand";
export type PrimalityTestType = "trial" | "fermat" | "miller-rabin" | "solovay-strassen";
export type RsaMode = "numbers" | "file";

export interface RsaCodegenOptions {
  prng: PrngType;
  primalityTest: PrimalityTestType;
  mode: RsaMode;
}

function prngStruct(prng: PrngType): string {
  switch (prng) {
    case "middle-square":
      return `// Метод середины квадратов — тот же принцип, что и в rust-rsa-from-scratch.
struct Rng {
    uint32_t seed;
    Rng() { seed = (uint32_t)time(nullptr) | 1u; }
    uint32_t next(uint32_t max_value) {
        if (max_value == 0) return 0;
        uint64_t square = (uint64_t)seed * (uint64_t)seed;
        uint32_t middle = (uint32_t)((square >> 16) & 0xFFFFFFFFu);
        seed = middle | 1u;
        return middle % max_value;
    }
};`;
    case "lcg":
      return `// Линейный конгруэнтный генератор (те же константы, что использует glibc/PCG-подобные ГПСЧ).
struct Rng {
    uint64_t state;
    Rng() { state = (uint64_t)time(nullptr); }
    uint32_t next(uint32_t max_value) {
        if (max_value == 0) return 0;
        state = state * 6364136223846793005ULL + 1442695040888963407ULL;
        return (uint32_t)((state >> 32) % max_value);
    }
};`;
    case "rand":
      return `// Стандартный rand() из <cstdlib>, засеянный текущим временем.
struct Rng {
    Rng() { srand((unsigned)time(nullptr)); }
    uint32_t next(uint32_t max_value) {
        if (max_value == 0) return 0;
        uint32_t v = ((uint32_t)rand() << 16) ^ (uint32_t)rand();
        return v % max_value;
    }
};`;
  }
}

function primalityFunction(test: PrimalityTestType): string {
  switch (test) {
    case "trial":
      return `// Пробное деление — детерминированный тест, без ГПСЧ.
bool is_prime(uint32_t n, Rng& rng) {
    (void)rng;
    if (n < 2) return false;
    if (n < 4) return true;
    if (n % 2 == 0) return false;
    for (uint64_t d = 3; d * d <= n; d += 2) if (n % d == 0) return false;
    return true;
}`;
    case "fermat":
      return `// Тест Ферма: a^(n-1) mod n == 1 для случайных свидетелей a.
bool is_prime(uint32_t n, Rng& rng) {
    if (n < 4) return n == 2 || n == 3;
    if (n % 2 == 0) return false;
    const int ROUNDS = 20;
    for (int i = 0; i < ROUNDS; i++) {
        uint32_t a = 2 + rng.next(n - 3);
        if (mod_exp(a, n - 1, n) != 1) return false;
    }
    return true;
}`;
    case "miller-rabin":
      return `// Тест Миллера-Рабина: n-1 = 2^r * d, ищем свидетеля составности.
bool is_prime(uint32_t n, Rng& rng) {
    if (n < 4) return n == 2 || n == 3;
    if (n % 2 == 0) return false;
    uint32_t d = n - 1;
    int r = 0;
    while (d % 2 == 0) { d /= 2; r++; }
    const int ROUNDS = 20;
    for (int i = 0; i < ROUNDS; i++) {
        uint32_t a = 2 + rng.next(n - 3);
        uint32_t x = mod_exp(a, d, n);
        if (x == 1 || x == n - 1) continue;
        bool composite = true;
        for (int j = 0; j < r - 1; j++) {
            x = mod_exp(x, 2, n);
            if (x == n - 1) { composite = false; break; }
        }
        if (composite) return false;
    }
    return true;
}`;
    case "solovay-strassen":
      return `// Тест Соловея-Штрассена: сравнивает символ Якоби с a^((n-1)/2) mod n.
int jacobi_symbol(int64_t a, int64_t n) {
    a %= n;
    if (a < 0) a += n;
    int result = 1;
    while (a != 0) {
        while (a % 2 == 0) {
            a /= 2;
            int64_t rmod = n % 8;
            if (rmod == 3 || rmod == 5) result = -result;
        }
        int64_t tmp = a; a = n; n = tmp;
        if (a % 4 == 3 && n % 4 == 3) result = -result;
        a %= n;
    }
    return n == 1 ? result : 0;
}

bool is_prime(uint32_t n, Rng& rng) {
    if (n < 3) return n == 2;
    if (n % 2 == 0) return false;
    const int ROUNDS = 20;
    for (int i = 0; i < ROUNDS; i++) {
        uint32_t a = 2 + rng.next(n - 3);
        int jac = jacobi_symbol((int64_t)a, (int64_t)n);
        uint32_t jac_mod = (uint32_t)(((jac % (int64_t)n) + n) % n);
        uint32_t euler = mod_exp(a, (n - 1) / 2, n);
        if (jac == 0 || euler != jac_mod) return false;
    }
    return true;
}`;
  }
}

const SHARED_MATH = `uint32_t mod_exp(uint32_t base, uint32_t exp, uint32_t mod) {
    uint64_t result = 1, b = base % mod;
    while (exp > 0) {
        if (exp & 1) result = (result * b) % mod;
        b = (b * b) % mod;
        exp >>= 1;
    }
    return (uint32_t)result;
}

uint32_t gcd_u32(uint32_t a, uint32_t b) {
    while (b) { uint32_t t = a % b; a = b; b = t; }
    return a;
}

// Расширенный Евклид: возвращает НОД(a,b), заодно коэффициенты x,y такие что a*x+b*y=НОД.
int64_t ext_gcd(int64_t a, int64_t b, int64_t& x, int64_t& y) {
    if (b == 0) { x = 1; y = 0; return a; }
    int64_t x1, y1;
    int64_t g = ext_gcd(b, a % b, x1, y1);
    x = y1;
    y = x1 - (a / b) * y1;
    return g;
}

uint32_t mod_inverse(uint32_t e, uint32_t phi) {
    int64_t x, y;
    ext_gcd((int64_t)e, (int64_t)phi, x, y);
    int64_t d = x % (int64_t)phi;
    if (d < 0) d += phi;
    return (uint32_t)d;
}

uint32_t choose_e(uint32_t phi) {
    if (phi > 65537 && gcd_u32(65537, phi) == 1) return 65537;
    uint32_t e = 3;
    while (gcd_u32(e, phi) != 1) e += 2;
    return e;
}`;

function generatePrimeFn(): string {
  return `uint32_t generate_prime(uint32_t low, uint32_t high, Rng& rng) {
    while (true) {
        uint32_t num = low + rng.next(high - low + 1);
        if (num % 2 == 0) num++;
        if (num >= low && num <= high && is_prime(num, rng)) return num;
    }
}`;
}

const BASE64_CPP = `const std::string B64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

std::string base64_encode(const std::vector<uint8_t>& input) {
    std::string output;
    int val = 0, valb = -6;
    for (uint8_t c : input) {
        val = (val << 8) + c;
        valb += 8;
        while (valb >= 0) {
            output.push_back(B64_CHARS[(val >> valb) & 0x3F]);
            valb -= 6;
        }
    }
    if (valb > -6) output.push_back(B64_CHARS[((val << 8) >> (valb + 8)) & 0x3F]);
    while (output.size() % 4) output.push_back('=');
    return output;
}

std::vector<uint8_t> base64_decode(const std::string& input) {
    std::vector<int> table(256, -1);
    for (int i = 0; i < 64; i++) table[(unsigned char)B64_CHARS[i]] = i;
    std::vector<uint8_t> output;
    int val = 0, valb = -8;
    for (unsigned char c : input) {
        if (table[c] == -1) break;
        val = (val << 6) + table[c];
        valb += 6;
        if (valb >= 0) {
            output.push_back((uint8_t)((val >> valb) & 0xFF));
            valb -= 8;
        }
    }
    return output;
}`;

const FILE_SCHEME_CPP = `// Схема из реального файлового шифратора курсовой: 20-битные блоки, 5-битный заголовок
// длины паддинга последнего блока, каждый шифроблок — 4 байта (big-endian), всё — в Base64.
const int FILE_BLOCK_BITS = 20;

std::vector<bool> bytes_to_bits(const std::vector<uint8_t>& bytes) {
    std::vector<bool> bits;
    bits.reserve(bytes.size() * 8);
    for (uint8_t b : bytes) for (int i = 7; i >= 0; i--) bits.push_back((b >> i) & 1);
    return bits;
}

std::vector<uint8_t> bits_to_bytes(const std::vector<bool>& bits) {
    std::vector<uint8_t> bytes;
    for (size_t i = 0; i + 8 <= bits.size(); i += 8) {
        uint8_t b = 0;
        for (int j = 0; j < 8; j++) b = (uint8_t)((b << 1) | (bits[i + j] ? 1 : 0));
        bytes.push_back(b);
    }
    return bytes;
}

std::string encrypt_bytes(const std::vector<uint8_t>& data, uint32_t e, uint32_t n) {
    std::vector<bool> data_bits = bytes_to_bits(data);
    int pad = (FILE_BLOCK_BITS - (int)((5 + data_bits.size()) % FILE_BLOCK_BITS)) % FILE_BLOCK_BITS;

    std::vector<bool> plaintext_bits;
    for (int i = 4; i >= 0; i--) plaintext_bits.push_back((pad >> i) & 1);
    plaintext_bits.insert(plaintext_bits.end(), data_bits.begin(), data_bits.end());
    for (int i = 0; i < pad; i++) plaintext_bits.push_back(false);

    std::vector<uint8_t> cipher_bytes;
    for (size_t off = 0; off < plaintext_bits.size(); off += FILE_BLOCK_BITS) {
        uint32_t block_value = 0;
        for (int b = 0; b < FILE_BLOCK_BITS; b++) block_value = (block_value << 1) | (plaintext_bits[off + b] ? 1 : 0);
        uint32_t cipher_block = mod_exp(block_value, e, n);
        cipher_bytes.push_back((uint8_t)((cipher_block >> 24) & 0xFF));
        cipher_bytes.push_back((uint8_t)((cipher_block >> 16) & 0xFF));
        cipher_bytes.push_back((uint8_t)((cipher_block >> 8) & 0xFF));
        cipher_bytes.push_back((uint8_t)(cipher_block & 0xFF));
    }
    return base64_encode(cipher_bytes);
}

std::vector<uint8_t> decrypt_bytes(const std::string& b64, uint32_t d, uint32_t n) {
    std::vector<uint8_t> cipher_bytes = base64_decode(b64);
    std::vector<bool> all_bits;
    for (size_t i = 0; i + 4 <= cipher_bytes.size(); i += 4) {
        uint32_t c = ((uint32_t)cipher_bytes[i] << 24) | ((uint32_t)cipher_bytes[i + 1] << 16) |
                     ((uint32_t)cipher_bytes[i + 2] << 8) | (uint32_t)cipher_bytes[i + 3];
        uint32_t m = mod_exp(c, d, n);
        for (int bit = FILE_BLOCK_BITS - 1; bit >= 0; bit--) all_bits.push_back((m >> bit) & 1);
    }
    int pad = 0;
    for (int i = 0; i < 5; i++) pad = (pad << 1) | (all_bits[i] ? 1 : 0);
    std::vector<bool> data_bits(all_bits.begin() + 5, all_bits.end() - pad);
    return bits_to_bytes(data_bits);
}

void encrypt_file(const std::string& in_path, const std::string& out_path, uint32_t e, uint32_t n) {
    std::ifstream in(in_path, std::ios::binary);
    std::vector<uint8_t> data((std::istreambuf_iterator<char>(in)), std::istreambuf_iterator<char>());
    std::ofstream out(out_path, std::ios::binary);
    out << encrypt_bytes(data, e, n);
}

void decrypt_file(const std::string& in_path, const std::string& out_path, uint32_t d, uint32_t n) {
    std::ifstream in(in_path, std::ios::binary);
    std::string b64((std::istreambuf_iterator<char>(in)), std::istreambuf_iterator<char>());
    std::vector<uint8_t> data = decrypt_bytes(b64, d, n);
    std::ofstream out(out_path, std::ios::binary);
    out.write(reinterpret_cast<const char*>(data.data()), data.size());
}`;

export function generateRsaCpp(options: RsaCodegenOptions): string {
  const primeRange = options.mode === "file" ? { low: 20000, high: 32000 } : { low: 100, high: 5000 };

  const mainBody =
    options.mode === "numbers"
      ? `int main() {
    Rng rng;
    uint32_t p = generate_prime(${primeRange.low}, ${primeRange.high}, rng);
    uint32_t q;
    do { q = generate_prime(${primeRange.low}, ${primeRange.high}, rng); } while (q == p);

    uint32_t n = p * q;
    uint32_t phi = (p - 1) * (q - 1);
    uint32_t e = choose_e(phi);
    uint32_t d = mod_inverse(e, phi);

    std::cout << "p = " << p << ", q = " << q << std::endl;
    std::cout << "n = " << n << ", phi = " << phi << std::endl;
    std::cout << "e = " << e << ", d = " << d << std::endl;

    uint32_t m;
    std::cout << "Введите сообщение (число < n): ";
    std::cin >> m;
    if (m >= n) { std::cerr << "Сообщение должно быть меньше n" << std::endl; return 1; }

    uint32_t c = mod_exp(m, e, n);
    uint32_t back = mod_exp(c, d, n);
    std::cout << "Зашифровано: " << c << std::endl;
    std::cout << "Расшифровано: " << back << (back == m ? "  (совпадает)" : "  (ОШИБКА)") << std::endl;
    return 0;
}`
      : `int main() {
    Rng rng;
    uint32_t p = generate_prime(${primeRange.low}, ${primeRange.high}, rng);
    uint32_t q;
    do { q = generate_prime(${primeRange.low}, ${primeRange.high}, rng); } while (q == p);

    uint32_t n = p * q;
    uint32_t phi = (p - 1) * (q - 1);
    uint32_t e = choose_e(phi);
    uint32_t d = mod_inverse(e, phi);

    std::cout << "p = " << p << ", q = " << q << std::endl;
    std::cout << "n = " << n << ", phi = " << phi << std::endl;
    std::cout << "e = " << e << ", d = " << d << std::endl;

    std::ifstream check("input.txt");
    if (check.good()) {
        check.close();
        encrypt_file("input.txt", "encrypted.b64", e, n);
        decrypt_file("encrypted.b64", "decrypted.txt", d, n);
        std::cout << "Файл input.txt зашифрован в encrypted.b64 (Base64) и расшифрован обратно в decrypted.txt" << std::endl;
    } else {
        std::cout << "(добавьте input.txt рядом с программой, чтобы проверить шифрование файла)" << std::endl;
    }
    return 0;
}`;

  return `// RSA "с нуля" — ГПСЧ: ${options.prng}, тест простоты: ${options.primalityTest}, режим: ${options.mode}.
// Сгенерировано на "Вариант." — сверено с расчётами калькулятора RSA на этом же наборе опций.
#include <cstdint>
#include <cstdlib>
#include <ctime>
#include <fstream>
#include <iostream>
#include <string>
#include <vector>

${prngStruct(options.prng)}

${SHARED_MATH}

${primalityFunction(options.primalityTest)}

${generatePrimeFn()}
${options.mode === "file" ? `\n${BASE64_CPP}\n\n${FILE_SCHEME_CPP}` : ""}

${mainBody}
`;
}

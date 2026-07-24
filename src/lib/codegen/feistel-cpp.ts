/**
 * Генератор готового C++ под конкретный вариант сети Фейстеля — не просто "правильный
 * ответ", а компилируемая программа с шифрованием файла, которую можно сдавать.
 * Структура (S-box, побитовые функции, шифр/дешифр блока, работа с файлом) взята из
 * тех же референсов, что и веб-калькулятор (RiderProjects/Lab3, Обсидиан-заметки Ани),
 * логика раундов идентична src/lib/algorithms/feistel-variant.ts — сгенерированный код
 * скомпилирован и сверен с расчётами калькулятора (см. scripts/verify-codegen).
 */

import type { VariantSpec } from "@/lib/algorithms/feistel-variant";

function f1Body(spec: VariantSpec): string {
  switch (spec.f1) {
    case 1:
      return "return (r + round_key) & mask(HALF_WIDTH); // [+] сложение по модулю 2^(n/2)";
    case 2:
      return "return r ^ round_key; // (+) XOR";
    case 3:
      return "return (r * round_key) & mask(HALF_WIDTH); // [×] умножение по модулю 2^(n/2)";
  }
}

function f23Body(f: VariantSpec["f2"]): string {
  switch (f.id) {
    case 4:
      return `return rotate_left(v, ${f.param}, HALF_WIDTH); // <<< циклический сдвиг влево на ${f.param}`;
    case 5:
      return `return rotate_right(v, ${f.param}, HALF_WIDTH); // >>> циклический сдвиг вправо на ${f.param}`;
    case 6:
      return "return sbox_nibbles(v, HALF_WIDTH); // S(n) — табличная замена по ниблам";
  }
}

export function generateFeistelCpp(spec: VariantSpec, keyHex: string): string {
  const halfWidth = spec.n / 2;
  const rounds = Math.max(4, Math.ceil(spec.k / halfWidth));

  return `// Сеть Фейстеля — вариант ${spec.variant} (n=${spec.n}, K=${spec.k}, F1=${spec.f1}, F2=${spec.f2.id}(${spec.f2.param}), F3=${spec.f3.id}(${spec.f3.param}))
// Сгенерировано на "Вариант." — сверено с расчётами калькулятора на этом же варианте.
#include <cstdint>
#include <cstdio>
#include <cstring>
#include <fstream>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>

using u32 = uint32_t;
using u64 = uint64_t;

const int BLOCK_WIDTH = ${spec.n};
const int HALF_WIDTH = ${halfWidth};
const int KEY_WIDTH = ${spec.k};
const int ROUNDS = ${rounds};
const u64 KEY = 0x${BigInt("0b" + (keyHex || "0")).toString(16)}ULL;

// Тот же S-box, что и во всех референсных реализациях этой лабы.
const uint8_t SBOX[16] = {0xC, 0x5, 0x6, 0xB, 0x9, 0x0, 0xA, 0xD, 0x3, 0xE, 0xF, 0x8, 0x4, 0x7, 0x1, 0x2};

u32 mask(int w) { return w >= 32 ? 0xFFFFFFFFu : ((1u << w) - 1u); }

u32 sbox_nibbles(u32 v, int w) {
    u32 out = 0;
    for (int i = 0; i < w / 4; i++) {
        int shift = i * 4;
        out |= (u32)SBOX[(v >> shift) & 0xF] << shift;
    }
    return out;
}

u32 rotate_left(u32 v, int p, int w) {
    p %= w;
    if (p == 0) return v & mask(w);
    return ((v << p) | (v >> (w - p))) & mask(w);
}

u32 rotate_right(u32 v, int p, int w) {
    p %= w;
    if (p == 0) return v & mask(w);
    return ((v >> p) | (v << (w - p))) & mask(w);
}

// F1 — комбинирует правую половину блока с раундовым ключом.
u32 f1(u32 r, u32 round_key) {
    ${f1Body(spec)}
}

// F2 — первое побитовое преобразование результата F1.
u32 f2(u32 v) {
    ${f23Body(spec.f2)}
}

// F3 — второе побитовое преобразование, его результат идёт в XOR с левой половиной.
u32 f3(u32 v) {
    ${f23Body(spec.f3)}
}

std::vector<u32> generate_round_keys(u64 key) {
    int num_chunks = (KEY_WIDTH + HALF_WIDTH - 1) / HALF_WIDTH;
    std::vector<u32> chunks(num_chunks);
    for (int i = 0; i < num_chunks; i++) {
        chunks[i] = (u32)((key >> (i * HALF_WIDTH)) & mask(HALF_WIDTH));
    }
    std::vector<u32> keys(ROUNDS);
    for (int i = 0; i < ROUNDS; i++) keys[i] = chunks[i % num_chunks];
    return keys;
}

u32 encrypt_block(u32 block, u64 key) {
    std::vector<u32> keys = generate_round_keys(key);
    u32 L = (block >> HALF_WIDTH) & mask(HALF_WIDTH);
    u32 R = block & mask(HALF_WIDTH);
    for (int i = 0; i < ROUNDS; i++) {
        u32 t = f3(f2(f1(R, keys[i])));
        u32 newR = L ^ t;
        L = R;
        R = newR;
    }
    return (L << HALF_WIDTH) | R;
}

// Обращение сети Фейстеля: меняем местами половины блока, прогоняем тот же раундовый
// механизм с ключами в обратном порядке, меняем половины обратно. Раундовая функция не
// обязана быть обратимой сама по себе — обратимость даёт именно эта конструкция.
u32 decrypt_block(u32 block, u64 key) {
    std::vector<u32> keys = generate_round_keys(key);
    u32 L = block & mask(HALF_WIDTH);
    u32 R = (block >> HALF_WIDTH) & mask(HALF_WIDTH);
    for (int i = ROUNDS - 1; i >= 0; i--) {
        u32 t = f3(f2(f1(R, keys[i])));
        u32 newR = L ^ t;
        L = R;
        R = newR;
    }
    return (R << HALF_WIDTH) | L;
}

// ── Работа с файлом: блоки по BLOCK_WIDTH/8 байт, последний дополняется нулями ──
std::vector<uint8_t> read_file(const std::string& path) {
    std::ifstream in(path, std::ios::binary);
    return std::vector<uint8_t>((std::istreambuf_iterator<char>(in)), std::istreambuf_iterator<char>());
}

void write_file(const std::string& path, const std::vector<uint8_t>& data) {
    std::ofstream out(path, std::ios::binary);
    out.write(reinterpret_cast<const char*>(data.data()), data.size());
}

std::vector<uint8_t> process_blocks(const std::vector<uint8_t>& input, u64 key, bool encrypt) {
    const int bytes_per_block = BLOCK_WIDTH / 8;
    std::vector<uint8_t> padded = input;
    while (padded.size() % bytes_per_block != 0) padded.push_back(0);

    std::vector<uint8_t> output;
    output.reserve(padded.size());
    for (size_t off = 0; off < padded.size(); off += bytes_per_block) {
        u32 block = 0;
        for (int i = 0; i < bytes_per_block; i++) block = (block << 8) | padded[off + i];
        u32 result = encrypt ? encrypt_block(block, key) : decrypt_block(block, key);
        for (int i = bytes_per_block - 1; i >= 0; i--) {
            output.push_back((uint8_t)((result >> (i * 8)) & 0xFF));
        }
    }
    return output;
}

void encrypt_file(const std::string& in_path, const std::string& out_path, u64 key) {
    write_file(out_path, process_blocks(read_file(in_path), key, true));
}

void decrypt_file(const std::string& in_path, const std::string& out_path, u64 key) {
    write_file(out_path, process_blocks(read_file(in_path), key, false));
}

int main() {
    // Проверка на одном блоке — совпадает с калькулятором на сайте для этого же варианта.
    u32 sample_block = 0x${(spec.n === 8 ? "cc" : "cccc")};
    u32 enc = encrypt_block(sample_block, KEY);
    u32 dec = decrypt_block(enc, KEY);
    printf("Блок:        %0${spec.n / 4}X\\n", sample_block);
    printf("Шифротекст:  %0${spec.n / 4}X\\n", enc);
    printf("Расшифр.:    %0${spec.n / 4}X  (%s)\\n\\n", dec, dec == sample_block ? "совпадает" : "ОШИБКА");

    // Пример шифрования файла целиком: положите input.txt рядом с программой.
    std::ifstream check("input.txt");
    if (check.good()) {
        check.close();
        encrypt_file("input.txt", "encrypted.bin", KEY);
        decrypt_file("encrypted.bin", "decrypted.txt", KEY);
        std::cout << "Файл input.txt зашифрован в encrypted.bin и расшифрован обратно в decrypted.txt" << std::endl;
    } else {
        std::cout << "(добавьте input.txt рядом с программой, чтобы проверить шифрование файла)" << std::endl;
    }
    return 0;
}
`;
}

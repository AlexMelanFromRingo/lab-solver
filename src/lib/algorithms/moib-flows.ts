/**
 * Блок-схеми лабораторних робіт МОІБ — дослівно за кроками алгоритмів
 * методички (МОІБ_лаб_2024): алгоритм Евкліда (кроки 1–4), розширений
 * алгоритм (табл. 1.2), ділення методом проб (кроки 1–4), алгоритм Ферма
 * (кроки 1–3), «Решето Ератосфена» (кроки 1–4), лінійне порівняння через
 * розширений алгоритм, тест Міллера (кроки 1–5), тест Соловея–Штрассена
 * (кроки 1–6).
 */

import { END, io, op, seq, type Flow } from "./flowchart";

const START: Flow = { t: "start", text: "Початок" };

/** ЛР 1_1: кроки 1–4 алгоритму Евкліда, НСК = a·b / НСД. */
export const euclidFlow = (): Flow =>
  seq(
    START,
    io("Введення a, b"),
    op("A := a; R := B := b"),
    {
      t: "loop",
      body: seq(
        op("R := A mod B"),
        { t: "if", cond: "R = 0", yes: seq(io("НСД(a, b) = B"), op("НСК(a, b) := a·b / НСД"), io("НСК(a, b)"), END), no: op("A := B; B := R") },
      ),
    },
  );

/** ЛР 1_2: таблиця 1.2 розширеного алгоритму. */
export const extEuclidFlow = (): Flow =>
  seq(
    START,
    io("Введення a, b"),
    op("r₋₁ := a; x₋₁ := 1; y₋₁ := 0\nr₀ := b; x₀ := 0; y₀ := 1\nj := 0"),
    {
      t: "until",
      body: seq(
        op("j := j + 1"),
        op("qⱼ := rⱼ₋₂ div rⱼ₋₁\nrⱼ := rⱼ₋₂ − qⱼ·rⱼ₋₁"),
        op("xⱼ := xⱼ₋₂ − qⱼ·xⱼ₋₁\nyⱼ := yⱼ₋₂ − qⱼ·yⱼ₋₁"),
        io("Рядок таблиці: rⱼ, qⱼ, xⱼ, yⱼ"),
      ),
      cond: "rⱼ ≠ 0",
    },
    op("НСД := rⱼ₋₁; α := xⱼ₋₁; β := yⱼ₋₁"),
    io("НСД(a, b), α, β: a·α + b·β = НСД"),
    END,
  );

/** ЛР 2_1: кроки 1–4 ділення методом проб; знайдений дільник — і далі для частки. */
export const trialFlow = (): Flow =>
  seq(
    START,
    io("Введення n"),
    op("F := 2"),
    {
      t: "while",
      cond: "F ≤ √n",
      body: { t: "if", cond: "n / F — ціле", yes: seq(io("F — дільник n"), op("n := n / F")), no: op("F := F + 1") },
    },
    { t: "if", cond: "n > 1", yes: io("n — простий множник") },
    END,
  );

/** ЛР 2_2: кроки 1–3 алгоритму Ферма. */
export const fermatFlow = (): Flow =>
  seq(
    START,
    io("Введення непарного n"),
    op("x := ⌊√n⌋"),
    { t: "if", cond: "n = x²", yes: seq(io("x — дільник n"), END), no: op("x := x + 1") },
    {
      t: "loop",
      body: seq(
        { t: "if", cond: "x = (n + 1) / 2", yes: seq(io("n — просте"), END) },
        op("y := √(x² − n)"),
        { t: "if", cond: "y — ціле", yes: seq(io("n = (x + y)(x − y)"), END), no: op("x := x + 1") },
      ),
    },
  );

/** ЛР 3_1: кроки 1–4 «Решета Ератосфена» (вектор лише для непарних чисел). */
export const sieveFlow = (): Flow =>
  seq(
    START,
    io("Введення непарного n"),
    op("v(j) := 1, j = 1…(n − 1)/2\np := 3"),
    {
      t: "loop",
      body: seq(
        { t: "if", cond: "p² > n", yes: seq(io("Вивести 2j + 1 для всіх v(j) = 1 — по десятках"), END) },
        {
          t: "if",
          cond: "v((p − 1)/2) = 0",
          yes: op("p := p + 2"),
          no: seq(op("T := p²"), { t: "until", body: seq(op("v((T − 1)/2) := 0"), op("T := T + 2p")), cond: "T ≤ n" }, op("p := p + 2")),
        },
      ),
    },
  );

/** ЛР 3_2: ax ≡ b (mod m) через зворотний елемент з розширеного алгоритму. */
export const congruenceFlow = (): Flow =>
  seq(
    START,
    io("Введення a, b, m"),
    op("Таблиця розширеного алгоритму Евкліда для m і a (підпрограма)\nd := НСД(a, m)"),
    {
      t: "if",
      cond: "d = 1",
      yes: seq(op("α — зворотний до a: a·α ≡ 1 (mod m)"), op("x := α·b mod m"), io("x ≡ α·b (mod m)")),
      no: {
        t: "if",
        cond: "d ділить b",
        yes: seq(op("a′ := a/d; b′ := b/d; m′ := m/d"), op("x₀ := b′·(a′)⁻¹ mod m′"), io("x ≡ x₀ + k·m′ (mod m), k = 0…d − 1")),
        no: io("Розв'язків немає"),
      },
    },
    END,
  );

/** ЛР 4_1: кроки 1–5 тесту Міллера. */
export const millerFlow = (): Flow =>
  seq(
    START,
    io("Введення n, b"),
    op("q := n − 1; k := 0"),
    { t: "while", cond: "q — парне", body: op("q := q / 2; k := k + 1") },
    op("i := 0; r := b^q mod n"),
    {
      t: "loop",
      body: seq(
        { t: "if", cond: "i = 0 і r = 1 або r = n − 1", yes: seq(io("Нічого певного сказати не можна"), END) },
        op("i := i + 1; r := r² mod n"),
        io("Рядок таблиці: i, r"),
        { t: "if", cond: "i ≥ k", yes: seq(io("n — складене"), END) },
      ),
    },
  );

/** ЛР 4_2: кроки 1–6 тесту Соловея–Штрассена. */
export const solovayFlow = (): Flow =>
  seq(
    START,
    io("Введення n, a (1 < a < n − 1)"),
    {
      t: "if",
      cond: "НСД(a, n) ≠ 1",
      yes: io("n — складене"),
      no: seq(
        op("j := a^((n − 1)/2) mod n"),
        op("J := J(a; n) — символ Якобі"),
        { t: "if", cond: "j ≡ J (mod n)", yes: io("n — просте з імовірністю помилки ≤ 1/2"), no: io("n — складене") },
      ),
    },
    END,
  );

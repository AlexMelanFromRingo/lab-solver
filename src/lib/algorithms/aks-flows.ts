/**
 * Блок-схеми алгоритмів практичних робіт «Архітектура комп'ютерів» — ті
 * самі кроки, що в мікропрограмах aks.ts, з розрядами варіанта. Позначення:
 * Л1/П1 — зсув ліворуч/праворуч на розряд, ¬ — інверсія.
 */

import { io, op, seq, type Flow } from "./flowchart";
import { lab2Variant, lab3Variant, lab4Variant, lab5Variant, lab6Variant } from "./aks";

const START: Flow = { t: "start", text: "Початок" };
const END: Flow = { t: "end", text: "Кінець" };

// ─────────────────────────────────────────────────────────────── ПР 2 (рис. 2.5)

export function lab2Flow(v: number): Flow {
  const { n, code } = lab2Variant(v);
  const neg = (r: string): Flow => ({
    t: "if",
    cond: `${r}(${n - 1}) = 1`,
    yes: code === "ЗК" ? op(`${r}(${n - 2}:0) := ¬${r}(${n - 2}:0)`) : seq(op(`${r}(${n - 2}:0) := ¬${r}(${n - 2}:0)`), op(`${r} := ${r} + 1`)),
  });
  return seq(
    START,
    io(`Введення Рг1(${n - 1}:0), Рг2(${n - 1}:0)`),
    op(`Рг1(${n}) := Рг1(${n - 1})\nРг2(${n}) := Рг2(${n - 1})`),
    neg("Рг1"),
    neg("Рг2"),
    op(code === "ЗК" ? "См := Рг1 + Рг2 з циклічним перенесенням" : "См := Рг1 + Рг2"),
    {
      t: "if",
      cond: `См(${n}) ≠ См(${n - 1})`,
      yes: io("Переповнення"),
      no: seq(
        {
          t: "if",
          cond: `См(${n}) = 1`,
          yes: code === "ЗК" ? op(`См(${n - 2}:0) := ¬См(${n - 2}:0)`) : seq(op("См := См − 1"), op(`См(${n - 2}:0) := ¬См(${n - 2}:0)`)),
        },
        op(`РгР := См(${n - 1}:0)`),
        io("Друк РгР"),
      ),
    },
    END,
  );
}

// ─────────────────────────────────────────────────────────────── ПР 3 (рис. 3.9)

export function lab3Flow(v: number): Flow {
  const { n, method } = lab3Variant(v);
  const init = [START, io("Введення Рг2 (множене), Рг1 (множник)"), op(`ЛчТ := ${n}; СЧД := 0`)];
  const tail = [io(`Друк СЧД(${2 * n - 1}:0)`), END];
  const loop = (body: Flow): Flow => ({ t: "until", body, cond: "ЛчТ ≠ 0" });
  const print = io("Друк Рг1, СЧД");
  if (method === 1)
    return seq(
      ...init,
      loop(seq({ t: "if", cond: "Рг1(0) = 1", yes: op(`СЧД(${2 * n}:${n}) := СЧД(${2 * n}:${n}) + Рг2`) }, op("СЧД := СЧД П1\nРг1 := Рг1 П1"), op("ЛчТ := ЛчТ − 1"), print)),
      ...tail,
    );
  if (method === 2)
    return seq(
      ...init,
      loop(seq({ t: "if", cond: "Рг1(0) = 1", yes: op("СЧД := СЧД + Рг2") }, op("Рг2 := Рг2 Л1\nРг1 := Рг1 П1"), op("ЛчТ := ЛчТ − 1"), io("Друк Рг1, Рг2, СЧД"))),
      ...tail,
    );
  if (method === 3)
    return seq(
      ...init,
      loop(
        seq(
          { t: "if", cond: `Рг1(${n - 1}) = 1`, yes: op("СЧД := СЧД + Рг2") },
          op("ЛчТ := ЛчТ − 1"),
          { t: "if", cond: "ЛчТ ≠ 0", yes: op("СЧД := СЧД Л1"), yesLabel: "так", noLabel: "ні: останній зсув не виконується" },
          op("Рг1 := Рг1 Л1"),
          print,
        ),
      ),
      ...tail,
    );
  return seq(
    ...init,
    loop(seq(op("Рг2 := Рг2 П1"), { t: "if", cond: `Рг1(${n - 1}) = 1`, yes: op("СЧД := СЧД + Рг2") }, op("Рг1 := Рг1 Л1"), op("ЛчТ := ЛчТ − 1"), io("Друк Рг1, Рг2, СЧД"))),
    ...tail,
  );
}

// ─────────────────────────────────────────────────────────────── ПР 4

export function lab4Flow(v: number): Flow {
  const { n, method } = lab4Variant(v);
  const T = n / 2;
  const loop = (body: Flow): Flow => ({ t: "until", body, cond: "ЛчТ ≠ 0" });
  if (method <= 2) {
    const A = method === 1 ? `СЧД(${2 * n + 2}:${n})` : "СЧД";
    const pick: Flow = {
      t: "if",
      cond: "q = 1",
      yes: op(`${A} := ${A} + Рг2`),
      no: {
        t: "if",
        cond: "q = 2",
        yes: op(`${A} := ${A} + 2·Рг2`),
        no: { t: "if", cond: "q = 3", yes: op(`${A} := ${A} − Рг2\nc := 1`), no: { t: "if", cond: "q = 4", yes: op("c := 1") } },
      },
    };
    return seq(
      START,
      io("Введення Рг2 (множене), Рг1 (множник)"),
      op(`ЛчТ := ${T}; СЧД := 0; c := 0`),
      loop(
        seq(
          op("q := Рг1(1:0) + c\nc := 0"),
          pick,
          op(method === 1 ? "СЧД := СЧД П2 (арифметичний)" : "Рг2 := Рг2 Л2"),
          op("Рг1 := Рг1 П2\nЛчТ := ЛчТ − 1"),
          io("Друк q, c, СЧД"),
        ),
      ),
      { t: "if", cond: "c = 1", yes: op(`${A} := ${A} + Рг2 (додатковий такт)`) },
      io(`Друк СЧД(${2 * n - 1}:0)`),
      END,
    );
  }
  const M = method === 3 ? "Рг2" : "md";
  const pick: Flow = {
    t: "if",
    cond: "q = 001 або 010",
    yes: op(`СЧД := СЧД + ${M}`),
    no: {
      t: "if",
      cond: "q = 011",
      yes: op(`СЧД := СЧД + 2·${M}`),
      no: { t: "if", cond: "q = 100", yes: op(`СЧД := СЧД − 2·${M}`), no: { t: "if", cond: "q = 101 або 110", yes: op(`СЧД := СЧД − ${M}`) } },
    },
  };
  return seq(
    START,
    io("Введення Рг2 (множене), Рг1 (множник)"),
    op(`mr(${n}:1) := Рг1 (mr(${n + 2}:${n + 1}) = 00 — фіктивна пара)\nЛчТ := ${T + 1}; СЧД := 0`),
    method === 4 && op(`md(${2 * n}:${n}) := Рг2`),
    loop(
      seq(
        op(`q := mr(${n + 2}:${n})`),
        method === 3 && op("СЧД := СЧД Л2"),
        pick,
        op("mr := mr Л2\nЛчТ := ЛчТ − 1"),
        io("Друк q, СЧД"),
        method === 4 && { t: "if", cond: "ЛчТ ≠ 0", yes: op("md := md П2") },
      ),
    ),
    io(`Друк СЧД(${2 * n - 1}:0)`),
    END,
  );
}

// ─────────────────────────────────────────────────────────────── ПР 5 (рис. 5.7)

export function lab5Flow(v: number): Flow {
  const { n, restore, shift } = lab5Variant(v);
  const rem = shift === "залишку";
  const sgn = rem ? `См(${n + 1})` : `См(${2 * n + 1})`;
  const negB = "rgd := ¬Рг2 + 1 (−Рг2 у ДК)";
  const body: Flow = rem
    ? restore
      ? seq(op("См := См Л1"), op("См := См + rgd"), op("Рг1 := Рг1 Л1"), { t: "if", cond: `${sgn} = 0`, yes: op("Рг1(0) := 1"), no: op("См := См + Рг2 (відновлення)") })
      : seq(op("См := См Л1"), { t: "if", cond: `${sgn} = 1`, yes: op("См := См + Рг2"), no: op("См := См + rgd") }, op("Рг1 := Рг1 Л1"), { t: "if", cond: `${sgn} = 0`, yes: op("Рг1(0) := 1") })
    : restore
      ? seq(op(`Рг2 := Рг2 П1\n${negB}`), op("См := См + rgd"), op("Рг1 := Рг1 Л1"), { t: "if", cond: `${sgn} = 0`, yes: op("Рг1(0) := 1"), no: op("См := См + Рг2 (відновлення)") })
      : seq(op("Рг2 := Рг2 П1"), { t: "if", cond: `${sgn} = 1`, yes: op("См := См + Рг2"), no: op(`${negB}\nСм := См + rgd`) }, op("Рг1 := Рг1 Л1"), { t: "if", cond: `${sgn} = 0`, yes: op("Рг1(0) := 1") });
  const inputs = rem ? `См(${n - 1}:0), Рг2(${n - 1}:0)` : `См(${2 * n - 1}:${n}), Рг2(${2 * n - 1}:${n})`;
  return seq(
    START,
    io(`Введення ${inputs}`),
    op(negB),
    op("См := См + rgd (пробний такт)"),
    {
      t: "if",
      cond: `${sgn} = 0`,
      yes: io("Переповнення"),
      no: seq(
        restore && op("См := См + Рг2 (відновлення)"),
        op(`ЛчТ := ${n}`),
        { t: "until", body: seq(body, op("ЛчТ := ЛчТ − 1"), io("Друк Рг1, См")), cond: "ЛчТ ≠ 0" },
        io(`Друк частки 0,Рг1(${n - 1}:0)`),
      ),
    },
    END,
  );
}

// ─────────────────────────────────────────────────────────────── ПР 6 (рис. 6.2)

export function lab6Flow(v: number): Flow {
  const { m, p: n, code } = lab6Variant(v);
  const add = code === "ЗК" ? " з циклічним перенесенням" : "";
  const align = (reg: string): Flow => ({
    t: "while",
    cond: "ЛчТ ≠ 0",
    body: seq(op(`${reg}(${m - 2}:0) := ${reg} П1\nЛчТ := ЛчТ − 1`), io(`Друк ${reg}, ЛчТ`)),
  });
  return seq(
    START,
    io("Введення мантис і порядків A, B (прямий код)"),
    op(`СмМ := A (ЗН — ${m}, модуль ${m - 2}:0)\nРгМ := B; Рг1 := PA`),
    op(`СмП := PA, РгП := −PB у модифікованому ${code}`),
    op(`СмП := СмП + РгП${add}\nT := СмП(${n})`),
    op("ЛчТ := |СмП|"),
    {
      t: "if",
      cond: `ЛчТ ≥ ${m}`,
      yes: { t: "if", cond: "T = 0", yes: op("результат — A"), no: op("результат — B"), yesLabel: "так", noLabel: "ні" },
      no: seq(
        { t: "if", cond: "T = 0", yes: align("РгМ"), no: align("СмМ") },
        op(`СмП := T = 0 ? PA : PB (у ${code})`),
        op(`СмМ, РгМ — у модифікований ${code}\nСмМ := СмМ + РгМ${add}`),
        op("СмМ — у прямий код (П — розряд переповнення)"),
        { t: "if", cond: `СмМ(${m - 1}) = 1`, yes: seq(op("СмМ := СмМ П1\nСмП := СмП + 1"), { t: "if", cond: `СмП(${n}) ≠ СмП(${n - 1})`, yes: io("Переповнення порядку") }) },
        {
          t: "if",
          cond: `СмМ(${m - 2}:0) = 0`,
          yes: io("Результат — нуль"),
          no: seq(
            {
              t: "while",
              cond: `СмМ(${m - 2}) = 0`,
              body: seq(op("СмМ := СмМ Л1\nСмП := СмП − 1"), io("Друк СмМ, СмП"), { t: "if", cond: `СмП(${n}) ≠ СмП(${n - 1})`, yes: io("Зникнення порядку: нуль") }),
            },
            op("СмП — у прямий код"),
            io("Друк мантиси й порядку"),
          ),
        },
      ),
    },
    END,
  );
}

/**
 * Сборка файла .fls — формата программы Fuzzy Logic Systems, в которой
 * делается лабораторная.
 *
 * Формат текстовый, кодировка CP1251, концы строк CRLF. Строение файла
 * разобрано по примерам, приложенным к программе:
 *
 *     fuzzy_logic_system
 *     <число переменных> <имя переменной> <значение>
 *     <левая граница универса> <правая> <четыре служебных числа>
 *     <число термов> <имя терма>  <левая> <правая> <цвет> <мю>
 *     <число точек> x y x y ...        функция принадлежности терма
 *     <число точек> x y x y ...        результат активизации
 *     ...
 *                                      пустая строка после каждой переменной
 *     <методы: конъюнкция … дефазификация>
 *     Basic_rule_set <наборов> <правил> IF ...
 *
 * Имена переменных и термов не могут содержать пробелов — вместо них ставится
 * подчёркивание. Второй набор точек программа пересчитывает сама во время
 * вывода, поэтому при сборке он повторяет первый.
 */

import type { FuzzySystem, Methods, Variable } from "./fuzzy-mamdani";
import { cp1251Encode } from "./cp1251";

/** Хвост строки с границами универса; во всех примерах он одинаков. */
const VAR_TAIL = "0 0.95 0.7 1";

/** Цвета в формате COLORREF: значение = R + G·256 + B·65536. */
const COLORS = [255, 65280, 16711680, 16711935, 16776960, 32896, 8388736];

const NL = "\r\n";

/** Число в том же виде, в каком его записывает сама программа. */
function num(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return String(Number(value.toFixed(6)));
}

const ident = (name: string) => name.replace(/\s+/g, "_");

function variableBlock(variable: Variable, value: number, first: boolean, total: number): string[] {
  const out: string[] = [];
  const head = `${ident(variable.name)} ${num(value)}`;
  out.push(first ? `${total} ${head}` : head);
  out.push(`${num(variable.universe[0])} ${num(variable.universe[1])} ${VAR_TAIL}`);

  variable.terms.forEach((term, j) => {
    const color = COLORS[j % COLORS.length];
    const line = `${ident(term.name)}  ${num(variable.universe[0])} ${num(variable.universe[1])} ${color} 0`;
    out.push(j === 0 ? `${variable.terms.length} ${line}` : line);

    const points = term.points.map(([x, mu]) => `${num(x)} ${num(mu)}`).join(" ");
    // Оба набора точек одинаковы: второй программа перезапишет сама.
    out.push(`${term.points.length} ${points} `);
    out.push(`${term.points.length} ${points} `);
  });

  out.push("");
  return out;
}

/**
 * Текст файла .fls для системы с заданными значениями входов и методами.
 *
 * @param values значения входных переменных: имя → число
 */
export function buildFlsFile(
  system: FuzzySystem,
  values: Record<string, number>,
  methods: Methods
): string {
  const variables = [...system.inputs, system.output];
  const out: string[] = ["fuzzy_logic_system"];

  variables.forEach((variable, i) => {
    const value = i < system.inputs.length ? (values[variable.name] ?? 0) : 0;
    out.push(...variableBlock(variable, value, i === 0, variables.length));
  });

  out.push("");
  // Позиции 1 и 4 не менялись ни в одном из опытов с программой.
  out.push(
    ["minimum", methods.conj, methods.disj, "minimum", methods.impl, methods.accum, methods.defuzz, "1", "10"].join(" ")
  );

  system.rules.forEach((rule, i) => {
    const op = rule.op === "or" ? "f_or" : "f_and";
    const body = rule.when.map(([v, t]) => `${ident(v)} IS ${ident(t)}`).join(` ${op} `);
    const line = `IF ${rule.when.length} ${body} `;
    out.push(i === 0 ? `Basic_rule_set 1 ${system.rules.length} ${line}` : line);
    out.push(`THEN ${ident(system.output.name)} IS ${ident(rule.then)} WITH CERTAINTY 1`);
  });

  out.push("");
  out.push("");
  return out.join(NL) + NL;
}

/**
 * Перекодировка в CP1251.
 *
 * Программа читает файлы только в этой кодировке: в UTF-8 имена термов
 * превращаются в мусор, и система не открывается. Браузер кодирует лишь в
 * UTF-8, поэтому таблица своя — общая, в cp1251.ts.
 */
export function encodeCp1251(text: string): Uint8Array<ArrayBuffer> {
  return cp1251Encode(text);
}

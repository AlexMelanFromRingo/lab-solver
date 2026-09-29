/**
 * Подсказки для редактора JOLS-M без нейросети: разбор объявлений и меток,
 * контекстное автодополнение, шаблоны типовых конструкций практических работ
 * и справка по командам и операциям. Правила — те же, что у интерпретатора,
 * сверенного с IDE yal.cc (jolsm.ts).
 */

import { validate } from "./jolsm";

const L = "A-Za-zА-Яа-яЁёІіЇїЄєҐґ";
const WORD_RE = new RegExp(`[${L}0-9_]+$`);

export interface KeywordInfo {
  words: string[];
  syntax: string;
  doc: string;
}

/** Микрокоманды с синонимами — в порядке, в каком их предлагает автодополнение. */
export const KEYWORDS: KeywordInfo[] = [
  { words: ["var", "объявить", "обьявить", "задать", "создать", "def", "dim", "define"], syntax: "var рег(разрядность), пам(ячеек)(разрядность)", doc: "Объявление регистров и памяти, разрядность 1…64." },
  { words: ["read", "ввести", "ввод", "scan", "input"], syntax: "read оп1, оп2", doc: "Ввод значений по порядку: десятичное, $hex или #bin. Отрицательное (-5) — только при вводе." },
  { words: ["print", "печать", "вывести", "write", "echo"], syntax: 'print "текст", оп, …', doc: "Печать. Одна переменная — с именем: a(00000101 05 5); несколько элементов — без имён. Массив памяти целиком не печатается." },
  { words: ["if", "если"], syntax: "if A отношение B then микрокоманда", doc: "Отношения = == <> != ~= < > <= >= (сравнение беззнаковое). Действие — любая микрокоманда, кроме if." },
  { words: ["then", "то", "тогда"], syntax: "if … then действие", doc: "Необязательное слово между условием и действием." },
  { words: ["goto", "идти_к", "идти", "jump", "go_to"], syntax: "goto метка", doc: "Безусловный переход на метку." },
  { words: ["call", "вызов", "вызвать"], syntax: "call метка", doc: "Вызов подпрограммы: адрес возврата — в стек (до 65535)." },
  { words: ["return", "возврат", "вернуться", "ret"], syntax: "return", doc: "Возврат из подпрограммы." },
  { words: ["end", "конец"], syntax: 'end "сообщение"', doc: "Конец программы; сообщение печатается." },
  { words: ["op", "операция", "оп", "do", "operation"], syntax: "op приёмник операция операнд", doc: "Необязательное слово перед операцией." },
  { words: ["delay", "задержка", "ждать", "sleep"], syntax: "delay мс", doc: "Пауза (в интерпретаторе — пустая команда)." },
];

const KW_INDEX = new Map<string, KeywordInfo>();
for (const k of KEYWORDS) for (const w of k.words) KW_INDEX.set(w, k);

export interface OperatorInfo {
  op: string;
  doc: string;
}

/** Операции IDE: приёмник := приёмник ⊕ операнд, результат по модулю 2^разрядности приёмника. */
export const OPERATORS: OperatorInfo[] = [
  { op: "=", doc: "присваивание" },
  { op: "+", doc: "сложение (перенос из старшего разряда теряется)" },
  { op: "+!", doc: "сложение с циклическим переносом — для обратного кода" },
  { op: "-", doc: "вычитание" },
  { op: "&", doc: "логическое И" },
  { op: "|", doc: "логическое ИЛИ" },
  { op: "^", doc: "сложение по модулю 2" },
  { op: "<<", doc: "логический сдвиг влево (вдвигаются нули)" },
  { op: ">>", doc: "логический сдвиг вправо" },
  { op: "|<", doc: "циклический сдвиг влево (то же <<<)" },
  { op: ">|", doc: "циклический сдвиг вправо (то же >>>)" },
  { op: "<->", doc: "обмен значениями двух переменных" },
  { op: "~", doc: "инверсия приёмника (одноместная; внутри операции инверсии операнда нет)" },
  { op: "++", doc: "+1 (одноместная)" },
  { op: "--", doc: "−1 (одноместная)" },
];

export interface Symbol {
  name: string;
  kind: "reg" | "mem" | "label";
  width?: number;
  count?: number;
  line: number;
}

/** Строки без комментариев % и {…}; внутри кавычек это текст. */
function stripLineComments(code: string): string[] {
  const lines: string[] = [];
  let cur = "";
  let block = false;
  let quote = "";
  let rest = false;
  for (const c of code) {
    if (c === "\n") {
      lines.push(cur);
      cur = "";
      quote = "";
      rest = false;
      continue;
    }
    if (rest) continue;
    if (block) {
      if (c === "}") block = false;
      continue;
    }
    if (quote) {
      cur += c;
      if (c === quote) quote = "";
      continue;
    }
    if (c === "%") {
      rest = true;
      continue;
    }
    if (c === "{") {
      block = true;
      continue;
    }
    if (c === '"' || c === "'") quote = c;
    cur += c;
  }
  lines.push(cur);
  return lines;
}

/** Объявленные регистры, память и метки. */
export function symbols(code: string): Symbol[] {
  const out: Symbol[] = [];
  const declRe = new RegExp(`^\\s*(?:[${L}0-9_]+\\s*:\\s*)?(var|объявить|обьявить|задать|создать|def|dim|define)\\s+(.*)$`, "i");
  const labelRe = new RegExp(`^\\s*([${L}0-9_]+)\\s*:`);
  stripLineComments(code).forEach((text, i) => {
    const lm = text.match(labelRe);
    if (lm && !KW_INDEX.has(lm[1].toLowerCase())) out.push({ name: lm[1], kind: "label", line: i + 1 });
    const dm = text.match(declRe);
    if (!dm) return;
    for (const part of dm[2].split(",")) {
      const mem = part.match(new RegExp(`^\\s*([${L}_][${L}0-9_]*)\\s*\\((\\d+)\\)\\s*\\((\\d+)\\)\\s*$`));
      if (mem) {
        out.push({ name: mem[1], kind: "mem", count: +mem[2], width: +mem[3], line: i + 1 });
        continue;
      }
      const reg = part.match(new RegExp(`^\\s*([${L}_][${L}0-9_]*)\\s*\\((\\d+)\\)\\s*$`));
      if (reg) out.push({ name: reg[1], kind: "reg", width: +reg[2], line: i + 1 });
    }
  });
  return out;
}

export interface Completion {
  label: string;
  /** Что вставить; ${…} — поля шаблона (синтаксис CodeMirror snippet). */
  apply?: string;
  snippet?: boolean;
  type: "keyword" | "variable" | "label" | "snippet" | "field" | "operator";
  detail?: string;
  info?: string;
  boost?: number;
}

/** Шаблоны: конструкции, из которых собираются программы практических работ. */
export const SNIPPETS: Completion[] = [
  { label: "цикл по счётчику", type: "snippet", snippet: true, detail: "метка + if … goto", apply: "${1:cnt}=${2:8}\n${3:loop}: ${4:тело}\n${1:cnt}-1\nif ${1:cnt}<>0 then goto ${3:loop}", info: "Счётчик тактов, как ЛчТ в структурах методички." },
  { label: "если … иначе", type: "snippet", snippet: true, detail: "через метки", apply: "if ${1:a}=${2:b} then goto ${3:yes}\n${4:иначе}\ngoto ${5:done}\n${3:yes}: ${6:то}\n${5:done}:", info: "Ветвление: переход на ветку «то», иначе — следующая строка." },
  { label: "обратный код отрицательного", type: "snippet", snippet: true, detail: "ПК → ЗК", apply: "if ${1:r}(${2:7})=1 then ${1:r}(${3:6}:0)~", info: "Знак 1 — инвертировать значащие разряды." },
  { label: "дополнительный код отрицательного", type: "snippet", snippet: true, detail: "ПК → ДК", apply: "if ${1:r}(${2:7})=1 then ${1:r}(${3:6}:0)~\nif ${1:r}(${2:7})=1 then ${1:r}+1", info: "Инверсия значащих разрядов и +1 ко всему регистру (−0 превращается в +0)." },
  { label: "модифицированный код", type: "snippet", snippet: true, detail: "копия знака", apply: "${1:r}(${2:8})=${1:r}(${3:7})", info: "Второй знаковый разряд для обнаружения переполнения." },
  { label: "проверка переполнения", type: "snippet", snippet: true, detail: "знаковые разряды", apply: "if ${1:sm}(${2:8})<>${1:sm}(${3:7}) then goto ${4:ovf}", info: "В модифицированном коде разные знаковые разряды — переполнение." },
  { label: "арифметический сдвиг вправо", type: "snippet", snippet: true, detail: "с сохранением знака", apply: "${1:s}=${2:r}(${3:7})\n${2:r}>>1\nif ${1:s}=1 then ${2:r}(${3:7})=1", info: ">> логический; знак восстанавливается вручную (s — 1-битный регистр)." },
  { label: "дополнительный код регистра", type: "snippet", snippet: true, detail: "−x в ДК", apply: "${1:neg}=${2:x}\n${1:neg}~\n${1:neg}+1", info: "Для вычитания сложением: neg := −x." },
  { label: "подпрограмма", type: "snippet", snippet: true, detail: "call / return", apply: "call ${1:sub}\nend\n${1:sub}: ${2:тело}\nreturn", info: "Адрес возврата — в стек вызовов." },
  { label: "обмен", type: "snippet", snippet: true, detail: "<->", apply: "${1:a}<->${2:b}", info: "Обмен значениями двух переменных." },
];

const lc = (s: string) => s.toLowerCase();

/**
 * Автодополнение в позиции pos. Возвращает начало заменяемого слова и
 * варианты — по контексту строки: начало строки, цель перехода, операнд,
 * поле бит после «имя(».
 */
export function complete(code: string, pos: number): { from: number; options: Completion[] } | null {
  const lineStart = code.lastIndexOf("\n", pos - 1) + 1;
  const beforeRaw = code.slice(lineStart, pos);
  if (/%/.test(beforeRaw) || (beforeRaw.split('"').length - 1) % 2 === 1) return null; // комментарий или строка
  const syms = symbols(code);
  const regs = syms.filter((s) => s.kind !== "label");
  const labels = syms.filter((s) => s.kind === "label");
  const word = beforeRaw.match(WORD_RE)?.[0] ?? "";
  const from = pos - word.length;
  const before = beforeRaw.slice(0, beforeRaw.length - word.length).replace(new RegExp(`^\\s*[${L}0-9_]+\\s*:\\s*`), "");
  const b = lc(before.trim());

  // имя( — поля бит объявленного регистра
  const call = beforeRaw.match(new RegExp(`([${L}_][${L}0-9_]*)\\($`));
  if (call) {
    const s = regs.find((r) => r.name === call[1]);
    if (!s || !s.width) return null;
    if (s.kind === "mem") return { from: pos, options: [{ label: `0…${s.count! - 1}`, apply: "0)", type: "field", detail: `ячейка из ${s.count}` }] };
    const w = s.width;
    const opts: Completion[] = [
      { label: `${w - 1}:0)`, type: "field", detail: "все разряды" },
      { label: `${w - 1})`, type: "field", detail: "старший (знаковый) разряд" },
      { label: `0)`, type: "field", detail: "младший разряд" },
    ];
    if (w > 2) opts.splice(1, 0, { label: `${w - 2}:0)`, type: "field", detail: "без старшего разряда" });
    if (w >= 8) opts.push({ label: `${Math.floor(w / 2) - 1}:0)`, type: "field", detail: "младшая половина" });
    return { from: pos, options: opts.map((o, i) => ({ ...o, boost: 10 - i })) };
  }

  const regOptions = (boost = 0): Completion[] =>
    regs.map((r) => ({
      label: r.name,
      type: "variable",
      detail: r.kind === "mem" ? `память ${r.count}×${r.width}` : `${r.width} бит`,
      boost,
    }));
  const labelOptions = labels.map((l): Completion => ({ label: l.name, type: "label", detail: `метка, строка ${l.line}` }));
  const kwOptions = (list: KeywordInfo[]): Completion[] =>
    list.flatMap((k) => k.words.map((w, i): Completion => ({ label: w, type: "keyword", detail: k.syntax, info: k.doc, boost: i === 0 ? 1 : 0 })));

  // цель перехода
  if (/(^|\s)(goto|идти_к|идти|jump|go_to|call|вызов|вызвать)\s+$/.test(lc(before))) return { from, options: labelOptions };
  // объявление: имена не подсказываем
  if (/^(var|объявить|обьявить|задать|создать|def|dim|define)\b/.test(b)) return null;
  // начало строки: микрокоманды, регистры (операция), шаблоны
  if (b === "") return { from, options: [...kwOptions(KEYWORDS), ...regOptions(), ...SNIPPETS] };
  // после условия if A rel B — then и действия
  const ifm = b.match(/^(if|если)\s+(.+)$/);
  if (ifm) {
    if (/(=|<|>)\s*\S+\s+$/.test(lc(before))) {
      const acts = KEYWORDS.filter((k) => !k.words.includes("if") && !k.words.includes("var") && !k.words.includes("then"));
      const then = KEYWORDS.find((k) => k.words.includes("then"))!;
      return { from, options: [...kwOptions([then]).map((o) => ({ ...o, boost: 3 })), ...kwOptions(acts), ...regOptions()] };
    }
    return { from, options: regOptions(1) };
  }
  // операнды read/print и правая часть операций
  return { from, options: regOptions(1) };
}

/** Справка по слову под курсором: команда, операция, регистр или метка. */
export function hoverInfo(code: string, word: string): string | null {
  const k = KW_INDEX.get(lc(word));
  if (k) return `${k.syntax}\n${k.doc}`;
  const s = symbols(code).find((x) => x.name === word);
  if (s?.kind === "reg") return `${s.name}: регистр ${s.width} бит, разряды ${s.width! - 1}…0 (объявлен в строке ${s.line})`;
  if (s?.kind === "mem") return `${s.name}: память ${s.count} ячеек по ${s.width} бит, индекс 0…${s.count! - 1} (строка ${s.line})`;
  if (s?.kind === "label") return `${s.name}: метка, строка ${s.line}`;
  return null;
}

export function operatorInfo(op: string): string | null {
  const o = OPERATORS.find((x) => x.op === op);
  return o ? `${o.op} — ${o.doc}` : null;
}

export interface Diagnostic {
  line: number;
  severity: "error" | "warning";
  message: string;
}

/** Проверка без запуска (validate интерпретатора): ошибки и предупреждения по строкам. */
export function diagnose(code: string): Diagnostic[] {
  return validate(code).map((s) => {
    const m = s.match(/^(ОШИБКА|ПРЕДУПРЕЖДЕНИЕ)[^(]*(?:\(строка (\d+)\))?:\s*(.*)$/);
    return {
      line: m?.[2] ? +m[2] : 1,
      severity: m?.[1] === "ПРЕДУПРЕЖДЕНИЕ" ? "warning" : "error",
      message: m?.[3] ?? s,
    };
  });
}

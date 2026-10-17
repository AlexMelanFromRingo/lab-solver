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
  { words: ["var", "объявить", "обьявить", "задать", "создать", "def", "dim", "define"], syntax: "var рег(розрядність), пам(комірок)(розрядність)", doc: "Оголошення регістрів і пам'яті, розрядність 1…64." },
  { words: ["read", "ввести", "ввод", "scan", "input"], syntax: "read оп1, оп2", doc: "Введення значень за порядком: десяткове, $hex або #bin. Від'ємне (-5) — лише під час введення." },
  { words: ["print", "печать", "вывести", "write", "echo"], syntax: 'print "текст", оп, …', doc: "Друк. Одна змінна — з іменем: a(00000101 05 5); кілька елементів — без імен. Масив пам'яті цілком не друкується." },
  { words: ["if", "если"], syntax: "if A відношення B then мікрокоманда", doc: "Відношення = == <> != ~= < > <= >= (порівняння беззнакове). Дія — будь-яка мікрокоманда, крім if." },
  { words: ["then", "то", "тогда"], syntax: "if … then дія", doc: "Необов'язкове слово між умовою і дією." },
  { words: ["goto", "идти_к", "идти", "jump", "go_to"], syntax: "goto мітка", doc: "Безумовний перехід на мітку." },
  { words: ["call", "вызов", "вызвать"], syntax: "call мітка", doc: "Виклик підпрограми: адреса повернення — у стек (до 65535)." },
  { words: ["return", "возврат", "вернуться", "ret"], syntax: "return", doc: "Повернення з підпрограми." },
  { words: ["end", "конец"], syntax: 'end "повідомлення"', doc: "Кінець програми; повідомлення друкується." },
  { words: ["op", "операция", "оп", "do", "operation"], syntax: "op приймач операція операнд", doc: "Необов'язкове слово перед операцією." },
  { words: ["delay", "задержка", "ждать", "sleep"], syntax: "delay мс", doc: "Пауза (в інтерпретаторі — порожня команда)." },
];

const KW_INDEX = new Map<string, KeywordInfo>();
for (const k of KEYWORDS) for (const w of k.words) KW_INDEX.set(w, k);

export interface OperatorInfo {
  op: string;
  doc: string;
}

/** Операции IDE: приёмник := приёмник ⊕ операнд, результат по модулю 2^разрядности приёмника. */
export const OPERATORS: OperatorInfo[] = [
  { op: "=", doc: "присвоєння" },
  { op: "+", doc: "додавання (перенесення зі старшого розряду втрачається)" },
  { op: "+!", doc: "додавання з циклічним перенесенням — для оберненого коду" },
  { op: "-", doc: "віднімання" },
  { op: "&", doc: "логічне І" },
  { op: "|", doc: "логічне АБО" },
  { op: "^", doc: "додавання за модулем 2" },
  { op: "<<", doc: "логічний зсув ліворуч (вдвигаються нулі)" },
  { op: ">>", doc: "логічний зсув праворуч" },
  { op: "|<", doc: "циклічний зсув ліворуч (те саме <<<)" },
  { op: ">|", doc: "циклічний зсув праворуч (те саме >>>)" },
  { op: "<->", doc: "обмін значеннями двох змінних" },
  { op: "~", doc: "інверсія приймача (одномісна; усередині операції інверсії операнда немає)" },
  { op: "++", doc: "+1 (одномісна)" },
  { op: "--", doc: "−1 (одномісна)" },
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
  { label: "цикл за лічильником", type: "snippet", snippet: true, detail: "мітка + if … goto", apply: "${1:cnt}=${2:8}\n${3:loop}: ${4:тіло}\n${1:cnt}-1\nif ${1:cnt}<>0 then goto ${3:loop}", info: "Лічильник тактів, як ЛчТ у структурах методички." },
  { label: "якщо … інакше", type: "snippet", snippet: true, detail: "через мітки", apply: "if ${1:a}=${2:b} then goto ${3:yes}\n${4:інакше}\ngoto ${5:done}\n${3:yes}: ${6:то}\n${5:done}:", info: "Розгалуження: перехід на гілку «то», інакше — наступний рядок." },
  { label: "обернений код від'ємного", type: "snippet", snippet: true, detail: "ПК → ЗК", apply: "if ${1:r}(${2:7})=1 then ${1:r}(${3:6}:0)~", info: "Знак 1 — інвертувати значущі розряди." },
  { label: "доповняльний код від'ємного", type: "snippet", snippet: true, detail: "ПК → ДК", apply: "if ${1:r}(${2:7})=1 then ${1:r}(${3:6}:0)~\nif ${1:r}(${2:7})=1 then ${1:r}+1", info: "Інверсія значущих розрядів і +1 до всього регістра (−0 перетворюється на +0)." },
  { label: "модифікований код", type: "snippet", snippet: true, detail: "копія знака", apply: "${1:r}(${2:8})=${1:r}(${3:7})", info: "Другий знаковий розряд для виявлення переповнення." },
  { label: "перевірка переповнення", type: "snippet", snippet: true, detail: "знакові розряди", apply: "if ${1:sm}(${2:8})<>${1:sm}(${3:7}) then goto ${4:ovf}", info: "У модифікованому коді різні знакові розряди — переповнення." },
  { label: "арифметичний зсув праворуч", type: "snippet", snippet: true, detail: "зі збереженням знака", apply: "${1:s}=${2:r}(${3:7})\n${2:r}>>1\nif ${1:s}=1 then ${2:r}(${3:7})=1", info: ">> логічний; знак відновлюється вручну (s — 1-бітний регістр)." },
  { label: "доповняльний код регістра", type: "snippet", snippet: true, detail: "−x у ДК", apply: "${1:neg}=${2:x}\n${1:neg}~\n${1:neg}+1", info: "Для віднімання додаванням: neg := −x." },
  { label: "підпрограма", type: "snippet", snippet: true, detail: "call / return", apply: "call ${1:sub}\nend\n${1:sub}: ${2:тіло}\nreturn", info: "Адреса повернення — у стек викликів." },
  { label: "обмін", type: "snippet", snippet: true, detail: "<->", apply: "${1:a}<->${2:b}", info: "Обмін значеннями двох змінних." },
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
    if (s.kind === "mem") return { from: pos, options: [{ label: `0…${s.count! - 1}`, apply: "0)", type: "field", detail: `комірка з ${s.count}` }] };
    const w = s.width;
    const opts: Completion[] = [
      { label: `${w - 1}:0)`, type: "field", detail: "усі розряди" },
      { label: `${w - 1})`, type: "field", detail: "старший (знаковий) розряд" },
      { label: `0)`, type: "field", detail: "молодший розряд" },
    ];
    if (w > 2) opts.splice(1, 0, { label: `${w - 2}:0)`, type: "field", detail: "без старшого розряду" });
    if (w >= 8) opts.push({ label: `${Math.floor(w / 2) - 1}:0)`, type: "field", detail: "молодша половина" });
    return { from: pos, options: opts.map((o, i) => ({ ...o, boost: 10 - i })) };
  }

  const regOptions = (boost = 0): Completion[] =>
    regs.map((r) => ({
      label: r.name,
      type: "variable",
      detail: r.kind === "mem" ? `пам'ять ${r.count}×${r.width}` : `${r.width} біт`,
      boost,
    }));
  const labelOptions = labels.map((l): Completion => ({ label: l.name, type: "label", detail: `мітка, рядок ${l.line}` }));
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
  if (s?.kind === "reg") return `${s.name}: регістр ${s.width} біт, розряди ${s.width! - 1}…0 (оголошений у рядку ${s.line})`;
  if (s?.kind === "mem") return `${s.name}: пам'ять ${s.count} комірок по ${s.width} біт, індекс 0…${s.count! - 1} (рядок ${s.line})`;
  if (s?.kind === "label") return `${s.name}: мітка, рядок ${s.line}`;
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
    const m = s.match(/^(ПОМИЛКА|ПОПЕРЕДЖЕННЯ)[^(]*(?:\(рядок (\d+)\))?:\s*(.*)$/);
    return {
      line: m?.[2] ? +m[2] : 1,
      severity: m?.[1] === "ПОПЕРЕДЖЕННЯ" ? "warning" : "error",
      message: m?.[3] ?? s,
    };
  });
}

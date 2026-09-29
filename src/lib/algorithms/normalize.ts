/**
 * «Бази даних», індивідуальне завдання: метод нормальних форм (1НФ → 2НФ →
 * 3НФ, перевірка БКНФ) і правила формування відношень методу
 * «сутність — зв'язок». Порядок дій — як у прикладі ВИКЛАДАЧ методички.
 */

export interface Fd {
  lhs: string[];
  rhs: string[];
}

export interface Relation {
  name: string;
  attrs: string[];
  key: string[];
  note: string;
}

export interface NormResult {
  keys: string[][];
  key: string[];
  partial: Fd[];
  transitive: Fd[];
  nf2: Relation[];
  nf3: Relation[];
  bcnfViolations: { rel: string; fd: Fd }[];
}

const uniq = (xs: string[]) => [...new Set(xs)];

/** «A, B -> C, D» по строке; атрибуты через запятую. */
export function parseFds(src: string): Fd[] {
  return src
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [a, b] = l.split(/->|→/);
      if (b === undefined) throw new Error(`Немає «->» у рядку «${l}»`);
      const lhs = a.split(",").map((s) => s.trim()).filter(Boolean);
      const rhs = b.split(",").map((s) => s.trim()).filter(Boolean);
      if (!lhs.length || !rhs.length) throw new Error(`Порожня частина в «${l}»`);
      return { lhs, rhs };
    });
}

export function closure(x: string[], fds: Fd[]): string[] {
  const c = new Set(x);
  for (let changed = true; changed; ) {
    changed = false;
    for (const f of fds)
      if (f.lhs.every((a) => c.has(a)))
        for (const r of f.rhs)
          if (!c.has(r)) {
            c.add(r);
            changed = true;
          }
  }
  return [...c];
}

/** Все потенциальные ключи (минимальные надключи), перебор подмножеств — до ~14 атрибутов. */
export function candidateKeys(attrs: string[], fds: Fd[]): string[][] {
  const n = attrs.length;
  if (n > 16) throw new Error("Забагато атрибутів для перебору (більше 16)");
  const keys: number[] = [];
  const masks = Array.from({ length: 1 << n }, (_, m) => m).sort((a, b) => popcount(a) - popcount(b) || a - b);
  for (const m of masks) {
    if (keys.some((k) => (k & m) === k)) continue;
    const set = attrs.filter((_, i) => m & (1 << i));
    if (closure(set, fds).length >= n && attrs.every((a) => closure(set, fds).includes(a))) keys.push(m);
  }
  return keys.map((m) => attrs.filter((_, i) => m & (1 << i)));
}

function popcount(x: number) {
  let c = 0;
  for (let v = x; v; v &= v - 1) c++;
  return c;
}

/** Нетривиальные FD, проецируемые на подмножество атрибутов (левая часть — подмножества, правая — остальное замыкание). */
function projectFds(attrs: string[], fds: Fd[]): Fd[] {
  const out: Fd[] = [];
  const n = attrs.length;
  for (let m = 1; m < 1 << n; m++) {
    const lhs = attrs.filter((_, i) => m & (1 << i));
    const rhs = closure(lhs, fds).filter((a) => attrs.includes(a) && !lhs.includes(a));
    if (rhs.length) out.push({ lhs, rhs });
  }
  return out;
}

const isSuperkey = (x: string[], attrs: string[], fds: Fd[]) => attrs.every((a) => closure(x, fds).includes(a));

/**
 * 2НФ: для каждой части составного ключа, от которой зависят неключевые
 * атрибуты, — отдельная проекция (часть ключа + её зависимые вместе с
 * транзитивными, как R2 в примере). 3НФ: транзитивные зависимости
 * неключевых атрибутов выносятся в проекции (R3, R4, R5).
 */
export function normalize(attrs: string[], fds: Fd[], keyHint?: string[]): NormResult {
  const unknown = uniq(fds.flatMap((f) => [...f.lhs, ...f.rhs])).filter((a) => !attrs.includes(a));
  if (unknown.length) throw new Error(`У залежностях є атрибути, яких немає у відношенні: ${unknown.join(", ")}`);
  const keys = candidateKeys(attrs, fds);
  const key = keyHint && keyHint.length && isSuperkey(keyHint, attrs, fds) ? keyHint : keys[0];
  const nonKey = attrs.filter((a) => !key.includes(a));

  // часткові залежності: від власних підмножин ключа
  const partial: Fd[] = [];
  const assigned = new Set<string>();
  const nf2: Relation[] = [];
  if (key.length > 1) {
    const subs: string[][] = [];
    for (let m = 1; m < (1 << key.length) - 1; m++) subs.push(key.filter((_, i) => m & (1 << i)));
    subs.sort((a, b) => a.length - b.length);
    for (const s of subs) {
      const dep = closure(s, fds).filter((a) => nonKey.includes(a) && !assigned.has(a));
      if (!dep.length) continue;
      partial.push({ lhs: s, rhs: dep });
      dep.forEach((a) => assigned.add(a));
    }
  }
  const mainAttrs = [...key, ...nonKey.filter((a) => !assigned.has(a))];
  nf2.push({ name: "R1", attrs: mainAttrs, key, note: "ключ і атрибути, що повністю залежать від усього ключа" });
  partial.forEach((p, i) => nf2.push({ name: `R${i + 2}`, attrs: [...p.lhs, ...p.rhs], key: p.lhs, note: `проєкція часткової залежності від ${p.lhs.join(", ")}` }));

  // 3НФ
  const transitive: Fd[] = [];
  const nf3: Relation[] = [];
  let counter = nf2.length;
  const split = (rel: Relation) => {
    let rest = [...rel.attrs];
    const pieces: Relation[] = [];
    const nk = () => rest.filter((a) => !rel.key.includes(a));
    for (let changed = true; changed; ) {
      changed = false;
      const cand = nk();
      // детермінанти з неключових атрибутів — від менших груп до більших
      const groups: string[][] = [];
      for (let m = 1; m < 1 << cand.length && cand.length <= 12; m++) groups.push(cand.filter((_, i) => m & (1 << i)));
      groups.sort((a, b) => a.length - b.length);
      for (const g of groups) {
        const dep = closure(g, fds).filter((a) => rest.includes(a) && !g.includes(a) && !rel.key.includes(a));
        if (!dep.length) continue;
        transitive.push({ lhs: g, rhs: dep });
        pieces.push({ name: "", attrs: [...g, ...dep], key: g, note: `транзитивна залежність ${rel.key.join(", ")} → ${g.join(", ")} → ${dep.join(", ")}` });
        rest = rest.filter((a) => !dep.includes(a));
        changed = true;
        break;
      }
    }
    return { rest, pieces };
  };
  for (const r of nf2) {
    const { rest, pieces } = split(r);
    if (!pieces.length) nf3.push({ ...r, note: `${r.name} уже в 3НФ` });
    else {
      nf3.push({ name: `R${++counter}`, attrs: rest, key: r.key, note: `${r.name} без транзитивно залежних атрибутів` });
      for (const p of pieces) nf3.push({ ...p, name: `R${++counter}` });
    }
  }
  // BCNF
  const bcnfViolations: { rel: string; fd: Fd }[] = [];
  for (const r of nf3)
    for (const f of projectFds(r.attrs, fds))
      if (!isSuperkey(f.lhs, r.attrs, fds.concat()) && !r.attrs.every((a) => closure(f.lhs, fds).includes(a))) {
        const minimal = !bcnfViolations.some((v) => v.rel === r.name && v.fd.lhs.every((a) => f.lhs.includes(a)));
        if (minimal) bcnfViolations.push({ rel: r.name, fd: f });
      }
  return { keys, key, partial, transitive, nf2, nf3, bcnfViolations };
}

// ---------------------------------------------------- метод «сутність — зв'язок»

export type Degree = "1:1" | "1:Б" | "Б:Б";
export type Cls = "обов'язковий" | "необов'язковий";

/**
 * Правила формування попередніх відношень (лекція 11): номер правила і
 * відношення з ключами. Для 1:Б перша сутність — на боці «Б» (як ВИКЛАДАЧ МАЄ СТАЖ).
 */
export function erRule(deg: Degree, e1: { name: string; key: string; cls: Cls }, e2: { name: string; key: string; cls: Cls }, verb: string) {
  const m1 = e1.cls === "обов'язковий";
  const m2 = e2.cls === "обов'язковий";
  const rel = (name: string, keys: string[], extra: string[] = []) => `${name} (${[...keys.map((k) => `«${k}»`), ...extra].join(", ")}, …)`;
  if (deg === "1:1") {
    if (m1 && m2) return { rule: 1, relations: [rel(`${e1.name}_${e2.name}`, [e1.key], [e2.key])], why: "обидві сутності обов'язкові — одне відношення, ключ — ключ будь-якої з них" };
    if (m1 !== m2) {
      const [must, opt] = m1 ? [e1, e2] : [e2, e1];
      return { rule: 2, relations: [rel(must.name, [must.key], [opt.key]), rel(opt.name, [opt.key])], why: `клас обов'язковий лише в ${must.name} — два відношення, ключ ${opt.name} додається в ${must.name}` };
    }
    return { rule: 3, relations: [rel(e1.name, [e1.key]), rel(e2.name, [e2.key]), rel(verb, [e1.key], [e2.key])], why: "обидві необов'язкові — три відношення: дві сутності й зв'язок з ключами обох" };
  }
  if (deg === "1:Б") {
    if (m1) return { rule: 4, relations: [rel(e1.name, [e1.key], [e2.key]), rel(e2.name, [e2.key])], why: `сутність на боці «Б» (${e1.name}) має обов'язковий клас — два відношення, ключ ${e2.name} додається в ${e1.name}` };
    return { rule: 5, relations: [rel(e1.name, [e1.key]), rel(e2.name, [e2.key]), rel(verb, [e1.key], [e2.key])], why: `сутність на боці «Б» необов'язкова — три відношення, зв'язок ${verb} з ключами обох (ключ — ключ ${e1.name})` };
  }
  return { rule: 6, relations: [rel(e1.name, [e1.key]), rel(verb, [e1.key, e2.key]), rel(e2.name, [e2.key])], why: "зв'язок «багато-до-багатьох» — завжди три відношення; ключ зв'язку — ключі обох сутностей" };
}

"use client";

import { useEffect, useRef } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, hoverTooltip, keymap, lineNumbers, highlightActiveLine, drawSelection } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { HighlightStyle, StreamLanguage, syntaxHighlighting } from "@codemirror/language";
import { autocompletion, completionKeymap, snippetCompletion, type Completion as CmCompletion, type CompletionContext } from "@codemirror/autocomplete";
import { linter, lintGutter, type Diagnostic as CmDiagnostic } from "@codemirror/lint";
import { tags as t } from "@lezer/highlight";
import { KEYWORDS, complete, diagnose, hoverInfo, operatorInfo } from "@/lib/algorithms/jolsm-assist";

const KW = new Set(KEYWORDS.flatMap((k) => k.words));
const WORD = /[A-Za-zА-Яа-яЁёІіЇїЄєҐґ0-9_]/;

/** Подсветка JOLS-M: комментарии % и {…}, строки, ключевые слова, числа #b/$h, метки, знаки операций. */
const jolsmLanguage = StreamLanguage.define<{ block: boolean }>({
  startState: () => ({ block: false }),
  token(stream, state) {
    if (state.block) {
      if (stream.skipTo("}")) {
        stream.next();
        state.block = false;
      } else stream.skipToEnd();
      return "comment";
    }
    if (stream.eatSpace()) return null;
    if (stream.peek() === "%") {
      stream.skipToEnd();
      return "comment";
    }
    if (stream.peek() === "{") {
      state.block = true;
      stream.next();
      return "comment";
    }
    const q = stream.peek();
    if (q === '"' || q === "'") {
      stream.next();
      while (!stream.eol() && stream.next() !== q);
      return "string";
    }
    if (stream.match(/^#[01]+/) || stream.match(/^\$[0-9A-Fa-f]+/) || stream.match(/^\d+/)) return "number";
    if (stream.match(/^[=+\-<>&|^~!*/@[\]]+/)) return "operator";
    if (WORD.test(stream.peek() ?? "")) {
      let w = "";
      while (!stream.eol() && WORD.test(stream.peek()!)) w += stream.next();
      if (stream.string.slice(0, stream.start).trim() === "" && stream.match(/^\s*:/, false)) return "labelName";
      return KW.has(w.toLowerCase()) ? "keyword" : "variableName";
    }
    stream.next();
    return null;
  },
  languageData: { commentTokens: { line: "%" } },
});

const highlight = HighlightStyle.define([
  { tag: t.comment, color: "var(--ink-faint)", fontStyle: "italic" },
  { tag: t.string, color: "var(--cat-number)" },
  { tag: t.keyword, color: "var(--cat-arch)", fontWeight: "600" },
  { tag: t.number, color: "var(--cat-theory)" },
  { tag: t.operator, color: "var(--cat-codes)" },
  { tag: t.labelName, color: "var(--cat-pismi)" },
  { tag: t.variableName, color: "var(--ink)" },
]);

const theme = EditorView.theme(
  {
    "&": { height: "22rem", backgroundColor: "rgba(0,0,0,0.3)", color: "var(--ink)", fontSize: "13px", borderRadius: "3px", border: "1px solid var(--border)" },
    ".cm-scroller": { overflow: "auto" },
    "&.cm-focused": { outline: "none", borderColor: "var(--border-strong)" },
    ".cm-content": { fontFamily: "var(--font-mono, ui-monospace, monospace)", padding: "10px 0", caretColor: "var(--cat-arch)" },
    ".cm-gutters": { backgroundColor: "transparent", color: "var(--ink-faint)", border: "none" },
    ".cm-activeLine": { backgroundColor: "rgba(56,189,248,0.05)" },
    ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": { backgroundColor: "rgba(56,189,248,0.22) !important" },
    ".cm-tooltip": { backgroundColor: "var(--surface-2)", border: "1px solid var(--border-strong)", color: "var(--ink)", borderRadius: "3px" },
    ".cm-tooltip-autocomplete ul li[aria-selected]": { backgroundColor: "rgba(56,189,248,0.18)", color: "var(--ink)" },
    ".cm-completionDetail": { color: "var(--ink-faint)", fontStyle: "normal", marginLeft: "0.8em" },
    ".cm-completionInfo": { maxWidth: "22rem", whiteSpace: "pre-wrap", fontSize: "12px", color: "var(--ink-dim)" },
    ".cm-hover": { padding: "6px 10px", whiteSpace: "pre-wrap", maxWidth: "26rem", fontSize: "12px", lineHeight: "1.5" },
    ".cm-diagnostic": { fontSize: "12px" },
    ".cm-snippetField": { backgroundColor: "rgba(56,189,248,0.12)" },
  },
  { dark: true },
);

function source(ctx: CompletionContext) {
  const code = ctx.state.doc.toString();
  const r = complete(code, ctx.pos);
  if (!r) return null;
  if (r.from === ctx.pos && !ctx.explicit && !/[(\s]$/.test(code.slice(0, ctx.pos))) return null;
  const options: CmCompletion[] = r.options.map((o) => {
    const base = { label: o.label, detail: o.detail, info: o.info, type: o.type === "snippet" ? "text" : o.type, boost: o.boost };
    return o.snippet && o.apply ? snippetCompletion(o.apply, base) : { ...base, apply: o.apply };
  });
  return { from: r.from, options, validFor: /^[A-Za-zА-Яа-яЁёІіЇїЄєҐґ0-9_]*$/ };
}

const lint = linter((view) => {
  const doc = view.state.doc;
  return diagnose(doc.toString()).map((d): CmDiagnostic => {
    const line = doc.line(Math.min(Math.max(1, d.line), doc.lines));
    return { from: line.from, to: Math.max(line.from, line.to), severity: d.severity, message: d.message };
  });
});

const hover = hoverTooltip((view, pos) => {
  const line = view.state.doc.lineAt(pos);
  const text = line.text;
  let a = pos - line.from;
  let b = a;
  let info: string | null = null;
  if (WORD.test(text[a] ?? "") || WORD.test(text[a - 1] ?? "")) {
    while (a > 0 && WORD.test(text[a - 1])) a--;
    while (b < text.length && WORD.test(text[b])) b++;
    info = hoverInfo(view.state.doc.toString(), text.slice(a, b));
  } else {
    const ops = /[=+\-<>&|^~!]/;
    while (a > 0 && ops.test(text[a - 1])) a--;
    while (b < text.length && ops.test(text[b])) b++;
    if (b > a) info = operatorInfo(text.slice(a, b));
  }
  if (!info) return null;
  return {
    pos: line.from + a,
    end: line.from + b,
    above: true,
    create: () => {
      const dom = document.createElement("div");
      dom.className = "cm-hover";
      dom.textContent = info;
      return { dom };
    },
  };
});

/** Редактор микропрограмм: подсветка, автодополнение с шаблонами, справка при наведении, проверка как в IDE. */
export function JolsmEditor({ value, onChange, className }: { value: string; onChange: (v: string) => void; className?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const change = useRef(onChange);
  useEffect(() => {
    change.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const v = new EditorView({
      parent: host.current!,
      state: EditorState.create({
        doc: value,
        extensions: [
          lineNumbers(),
          history(),
          // связанные поля шаблона редактируются вместе — несколькими курсорами
          EditorState.allowMultipleSelections.of(true),
          drawSelection(),
          highlightActiveLine(),
          jolsmLanguage,
          syntaxHighlighting(highlight),
          autocompletion({ override: [source], activateOnTyping: true, icons: false }),
          lint,
          lintGutter(),
          hover,
          keymap.of([...completionKeymap, ...defaultKeymap, ...historyKeymap]),
          theme,
          EditorView.updateListener.of((u) => {
            if (u.docChanged) change.current(u.state.doc.toString());
          }),
        ],
      }),
    });
    view.current = v;
    return () => v.destroy();
    // редактор создаётся один раз; внешние изменения — эффектом ниже
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const v = view.current;
    if (v && v.state.doc.toString() !== value) v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: value } });
  }, [value]);

  return <div ref={host} className={className} />;
}

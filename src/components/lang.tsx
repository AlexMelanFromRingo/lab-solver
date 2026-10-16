"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Languages } from "lucide-react";
import { tr, ui, type Lang, type Loc } from "@/lib/i18n";

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
}

const LangContext = createContext<Ctx>({ lang: "uk", setLang: () => {} });

/** Українська за замовчуванням; вибір зберігається в localStorage. */
export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("uk");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("lang");
      if (saved === "ru" || saved === "uk") setLangState(saved);
    } catch {
      // localStorage недоступний — лишаємо українську
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dataset.lang = lang;
  }, [lang]);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("lang", l);
    } catch {
      // ignore
    }
  };

  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}

export function useLang(): Ctx {
  return useContext(LangContext);
}

/** Відрендерити локалізований рядок за поточною мовою. */
export function L({ v }: { v: Loc | undefined }) {
  const { lang } = useLang();
  return <>{tr(v, lang)}</>;
}

/** Кнопка перемикання мови UA / RU. */
export function LangToggle({ className }: { className?: string }) {
  const { lang, setLang } = useLang();
  return (
    <button
      type="button"
      onClick={() => setLang(lang === "uk" ? "ru" : "uk")}
      title={ui("langSwitch", lang)}
      aria-label={ui("langSwitch", lang)}
      className={
        "inline-flex items-center gap-1.5 rounded-[3px] border border-border px-2 py-1 font-mono text-xs text-ink-dim transition-colors hover:border-border-strong hover:text-ink " +
        (className ?? "")
      }
    >
      <Languages size={13} />
      <span className={lang === "uk" ? "text-ink" : ""}>UA</span>
      <span className="text-ink-faint">/</span>
      <span className={lang === "ru" ? "text-ink" : ""}>RU</span>
    </button>
  );
}

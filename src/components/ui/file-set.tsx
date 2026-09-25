"use client";

import { useEffect, useState } from "react";
import { CodeBlock } from "./code-block";
import { cn } from "@/lib/cn";

export interface LabFile {
  path: string;
  note: string;
  size: number;
  /**
   * Файл не належить до самого завдання: основа класу, спільна для всіх
   * завдань, або початок документа з оформленням. Потрібен, щоб робота
   * запускалася, але в переліку стоїть осторонь.
   */
  supporting?: boolean;
}

/**
 * Готові файли роботи: перелік ліворуч, вміст обраного праворуч.
 *
 * Файли не вбудовані в сторінку, а лежать поруч статикою й підвантажуються
 * тоді, коли їх відкрили: інакше в бандл поїхало б кілька сотень кілобайт
 * тексту, потрібного далеко не кожному відвідувачу.
 *
 * Адреси навмисно відносні — сайт живе під /lab-solver на GitHub Pages і в
 * корені під час локальної збірки, а відносний шлях правильний в обох.
 */
/** Размер в килобайтах: точнее здесь не нужно. */
function kb(size: number): string {
  return `${Math.max(1, Math.round(size / 1024))} КБ`;
}

export function FileSet({
  base,
  files,
  accent,
  archive,
  supportingNote = "Это оформление и общая основа: к заданию они не относятся, но без них работа не запустится.",
}: {
  base: string;
  files: LabFile[];
  accent: string;
  /** Архив всего каталога работы, если он выложен. */
  archive?: { path: string; size: number };
  /** Что за вспомогательные файлы: у каждой работы они свои. */
  supportingNote?: string;
}) {
  const [active, setActive] = useState(files[0]?.path ?? "");
  const [withSupporting, setWithSupporting] = useState(false);

  const supportingCount = files.filter((f) => f.supporting).length;
  const shown = withSupporting ? files : files.filter((f) => !f.supporting);

  // Перелік може змінитися разом із варіантом або з перемикачем — тоді
  // показуємо перший файл із наявних.
  const known = shown.some((f) => f.path === active);
  const current = known ? active : (shown[0]?.path ?? "");
  const url = `${base}/${current}`;

  // Завантажене зберігається разом з адресою, з якої прийшло. Якщо адреса
  // змінилася, стан «вантажиться» випливає з порівняння, і скидати його
  // окремим викликом усередині ефекту не доводиться.
  const [loaded, setLoaded] = useState<{ url: string; code: string | null }>({
    url: "",
    code: null,
  });

  useEffect(() => {
    let cancelled = false;

    fetch(url)
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status));
        return response.text();
      })
      .then((text) => {
        if (!cancelled) setLoaded({ url, code: text });
      })
      .catch(() => {
        if (!cancelled) setLoaded({ url, code: null });
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  const settled = loaded.url === url;
  const state = !settled ? "loading" : loaded.code === null ? "failed" : "ready";
  const code = loaded.code ?? "";

  return (
    <div className="space-y-4">
      {archive && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[4px] border border-border bg-black/20 px-4 py-3">
          <p className="text-sm text-ink-dim">
            Весь каталог работы одним архивом: распаковать и запустить, ничего не доустанавливая.
          </p>
          <a
            href={`${base}/${archive.path}`}
            download
            className="shrink-0 rounded-[3px] px-4 py-2 text-sm font-medium transition-colors"
            style={{ color: accent, background: `${accent}14`, border: `1px solid ${accent}44` }}
          >
            Скачать архивом · {kb(archive.size)}
          </a>
        </div>
      )}

      {/* min-w-0 обов'язковий: без нього колонка розсувається під найдовше
          ім'я файла й наїжджає на панель з кодом. У роботах на Laravel шляхи
          довгі – на них це видно одразу. */}
      <div className="grid gap-5 lg:grid-cols-[17rem_minmax(0,1fr)]">
      <nav className="flex min-w-0 flex-col gap-0.5">
        {shown.map((file) => {
          const selected = file.path === current;
          // Ім'я файла важливіше за шлях до нього, тому каталог показується
          // окремим рядком і приглушено: інакше довгий шлях з'їдає все місце.
          const slash = file.path.lastIndexOf("/");
          const folder = slash < 0 ? "" : file.path.slice(0, slash + 1);
          const name = slash < 0 ? file.path : file.path.slice(slash + 1);

          return (
            <button
              key={file.path}
              type="button"
              onClick={() => setActive(file.path)}
              className={cn(
                "min-w-0 rounded-[3px] px-3 py-2 text-left transition-colors",
                selected ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"
              )}
            >
              {folder && (
                <span className="block break-all font-mono text-[0.6875rem] leading-tight text-ink-faint">
                  {folder}
                </span>
              )}
              <span
                className="block break-all font-mono text-[0.8125rem] leading-snug"
                style={{ color: selected ? accent : undefined }}
              >
                {name}
              </span>
              <span className="mt-0.5 block break-words text-xs leading-snug text-ink-faint">
                {file.note}
              </span>
            </button>
          );
        })}
        {supportingCount > 0 && (
          <label className="mt-2 flex cursor-pointer items-start gap-2 px-3 py-2 text-xs leading-snug text-ink-faint">
            <input
              type="checkbox"
              checked={withSupporting}
              onChange={(e) => setWithSupporting(e.target.checked)}
              className="mt-0.5 shrink-0 accent-current"
              style={{ accentColor: accent }}
            />
            <span>
              Показать вспомогательные файлы — {supportingCount}. {supportingNote}
            </span>
          </label>
        )}
      </nav>

      {state === "failed" ? (
        <p className="rounded-[4px] border border-border bg-black/30 px-4 py-3 text-sm text-ink-dim">
          Не вдалося завантажити {current}.
        </p>
      ) : (
        <CodeBlock
          code={state === "ready" ? code : "…"}
          filename={current.split("/").pop() ?? current}
        />
      )}
      </div>
    </div>
  );
}

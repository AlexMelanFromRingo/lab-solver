"use client";

import { useEffect, useState } from "react";
import { CodeBlock } from "./code-block";
import { cn } from "@/lib/cn";

export interface LabFile {
  path: string;
  note: string;
  size: number;
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
export function FileSet({
  base,
  files,
  accent,
}: {
  base: string;
  files: LabFile[];
  accent: string;
}) {
  const [active, setActive] = useState(files[0]?.path ?? "");

  // Перелік може змінитися разом із варіантом — тоді показуємо перший файл.
  const known = files.some((f) => f.path === active);
  const current = known ? active : (files[0]?.path ?? "");
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
    <div className="grid gap-5 lg:grid-cols-[16rem_minmax(0,1fr)]">
      <nav className="flex flex-col gap-0.5">
        {files.map((file) => {
          const selected = file.path === current;

          return (
            <button
              key={file.path}
              type="button"
              onClick={() => setActive(file.path)}
              className={cn(
                "rounded-lg px-3 py-2 text-left transition-colors",
                selected ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"
              )}
            >
              <span
                className="block font-mono text-[0.8125rem]"
                style={{ color: selected ? accent : undefined }}
              >
                {file.path}
              </span>
              <span className="mt-0.5 block text-xs leading-snug text-ink-faint">{file.note}</span>
            </button>
          );
        })}
      </nav>

      {state === "failed" ? (
        <p className="rounded-xl border border-border bg-black/30 px-4 py-3 text-sm text-ink-dim">
          Не вдалося завантажити {current}.
        </p>
      ) : (
        <CodeBlock
          code={state === "ready" ? code : "…"}
          filename={current.split("/").pop() ?? current}
        />
      )}
    </div>
  );
}

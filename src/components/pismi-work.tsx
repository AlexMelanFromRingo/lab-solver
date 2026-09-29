"use client";

import { Fragment, useMemo, useState, type ReactNode } from "react";
import { Check, Download } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { FileSet, type LabFile } from "@/components/ui/file-set";
import { Pitfalls, Steps } from "@/components/lab-steps";
import { cn } from "@/lib/cn";
import { PISMI_BASE, setStudent, useStudent, useTemplates } from "@/lib/pismi-files";
import {
  archiveName,
  buildArchive,
  fill,
  selectedFiles,
  studentValues,
  type PismiIndex,
  type PismiLab,
  type PlaceholderValues,
  type Selection,
} from "@/lib/pismi-work";

/**
 * Готовая работа ПІСМІ: данные студента → уровень оформления → файлы → архив.
 *
 * Данные вписываются в код прямо на странице, как того требует методичка
 * (никакой адресной строки и форм). Файлы показываются уже с подстановкой,
 * архив собирается в браузере из тех же текстов — что видно, то и скачается.
 */

/** Полупрозрачный оттенок акцента; акцент раздела — CSS-переменная, поэтому color-mix. */
function tint(color: string, percent: number): string {
  return `color-mix(in srgb, ${color} ${percent}%, transparent)`;
}

function kb(bytes: number): string {
  return `${Math.max(1, Math.round(bytes / 1024))} КБ`;
}

function plural(n: number, one: string, few: string, many: string): string {
  const tail = n % 100;
  if (tail > 10 && tail < 20) return many;
  if (n % 10 === 1) return one;
  if (n % 10 >= 2 && n % 10 <= 4) return few;
  return many;
}

// --- данные студента -------------------------------------------------------------

function StudentFields({
  index,
  values,
  errors,
  accent,
  archive,
}: {
  index: PismiIndex;
  values: PlaceholderValues | null;
  errors: { pib?: string; group?: string };
  accent: string;
  archive: string;
}) {
  const student = useStudent();
  const [touched, setTouched] = useState({ pib: false, group: false });
  const show = (key: "pib" | "group") => (touched[key] || student[key] !== "" ? errors[key] : undefined);

  const control =
    "w-full rounded-[3px] border bg-surface-2 px-3.5 py-2.5 text-ink placeholder:text-ink-faint transition-colors focus:outline-none text-[0.9375rem]";

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem]">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-dim">ПІБ полностью</span>
          <input
            type="text"
            value={student.pib}
            onChange={(e) => setStudent({ ...student, pib: e.target.value })}
            onBlur={() => setTouched((t) => ({ ...t, pib: true }))}
            placeholder="Прізвище Ім’я По батькові"
            autoComplete="name"
            spellCheck={false}
            aria-invalid={Boolean(show("pib"))}
            className={cn(control, show("pib") ? "border-[#fb7185]" : "border-border focus:border-border-strong")}
          />
          {show("pib") && <span className="mt-1.5 block text-xs text-[#fb7185]">{show("pib")}</span>}
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-dim">Группа</span>
          <input
            type="text"
            value={student.group}
            onChange={(e) => setStudent({ ...student, group: e.target.value })}
            onBlur={() => setTouched((t) => ({ ...t, group: true }))}
            placeholder="КІ-101"
            spellCheck={false}
            aria-invalid={Boolean(show("group"))}
            className={cn(control, show("group") ? "border-[#fb7185]" : "border-border focus:border-border-strong")}
          />
          {show("group") && <span className="mt-1.5 block text-xs text-[#fb7185]">{show("group")}</span>}
        </label>
      </div>

      {/* Основная надпись: что именно окажется в коде. Цвет акцента выводится
          из ПІБ, у одного студента он всегда один и тот же. */}
      <dl className="grid grid-cols-2 border-l border-t border-border text-sm sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,1fr)]">
        {[
          { label: "в коде полностью", value: values?.PIB, wide: true },
          { label: "сокращённо", value: values?.PIB_SHORT },
          { label: "группа", value: values?.GROUP },
          {
            label: "цвет оформления",
            wide: true,
            value: values && (
              <span className="inline-flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="inline-block h-3.5 w-3.5 rounded-[2px] border border-white/15"
                  style={{ background: values.ACCENT }}
                />
                <span className="font-mono text-[0.8125rem]">{values.ACCENT}</span>
              </span>
            ),
          },
        ].map((cell) => (
          <div
            key={cell.label}
            className={cn("min-w-0 border-b border-r border-border px-3 py-2.5", cell.wide && "col-span-2 sm:col-span-1")}
          >
            <dt className="text-[0.6875rem] leading-none text-ink-faint">{cell.label}</dt>
            <dd className={cn("mt-1.5 min-h-[1.25rem] break-words leading-snug", cell.value ? "text-ink" : "text-ink-faint")}>
              {cell.value || "—"}
            </dd>
          </div>
        ))}
        <div className="col-span-2 min-w-0 border-b border-r border-border px-3 py-2.5 sm:col-span-4">
          <dt className="text-[0.6875rem] leading-none text-ink-faint">архив</dt>
          <dd className="mt-1.5 break-all font-mono text-[0.8125rem]" style={{ color: values ? accent : undefined }}>
            {archive}
          </dd>
        </div>
      </dl>

      <p className="text-xs leading-relaxed text-ink-faint">
        Хранится только в этом браузере. Нельзя использовать символы{" "}
        <span className="font-mono text-ink-dim">{index.forbidden.join(" ")}</span>: имя стоит в
        тексте страниц и в строках PHP.
      </p>
    </div>
  );
}

// --- уровни оформления -----------------------------------------------------------

function TierPicker({
  index,
  lab,
  value,
  onChange,
  accent,
}: {
  index: PismiIndex;
  lab: PismiLab;
  value: string;
  onChange: (tier: string) => void;
  accent: string;
}) {
  const base = lab.features?.[lab.tiers[0]] ?? [];

  return (
    <div role="radiogroup" aria-label="Оформление" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {lab.tiers.map((code) => {
        const info = index.tiers.find((t) => t.code === code);
        const note = lab.tier_notes?.[code] ?? info?.note ?? "";
        const extra = (lab.features?.[code] ?? []).filter((f) => !base.includes(f));
        const selected = code === value;
        const preview = lab.previews[code];

        return (
          <button
            key={code}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(code)}
            className={cn(
              "group flex min-w-0 flex-row overflow-hidden rounded-[4px] border text-left transition-colors sm:flex-col",
              selected ? "" : "border-border hover:border-border-strong",
            )}
            style={selected ? { borderColor: accent, background: tint(accent, 6) } : undefined}
          >
            {/* На телефоне плитка — строка: снимок слева, подпись справа. */}
            <div className="relative aspect-[16/10] w-32 shrink-0 self-start overflow-hidden border-r border-border bg-black/40 sm:w-full sm:border-b sm:border-r-0">
              {preview ? (
                // Статический экспорт: next/image здесь ничего не оптимизирует,
                // а путь к картинке относительный (сайт живёт под /lab-solver).
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`${PISMI_BASE}/${preview}`}
                  alt={`Как выглядит уровень «${info?.title ?? code}» с примерными данными`}
                  width={640}
                  height={400}
                  loading="lazy"
                  className={cn("h-full w-full object-cover object-top transition-opacity", selected ? "" : "opacity-70 group-hover:opacity-100")}
                />
              ) : (
                <div className="flex h-full items-center justify-center px-4 text-center text-xs text-ink-faint">
                  снимка нет
                </div>
              )}
              {selected && (
                <span
                  className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-[3px] sm:right-2 sm:top-2"
                  style={{ background: accent, color: "#08090b" }}
                >
                  <Check size={14} strokeWidth={2.5} />
                </span>
              )}
            </div>
            <div className="min-w-0 space-y-1 px-3.5 py-3">
              <div className="font-medium text-ink" style={selected ? { color: accent } : undefined}>
                {info?.title ?? code}
              </div>
              <p className="text-xs leading-snug text-ink-dim">{note}</p>
              {extra.length > 0 && (
                <p className="text-xs leading-snug text-ink-faint">Сверх обязательного: {extra.join(", ")}</p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// --- всё вместе --------------------------------------------------------------------

function Section({ title, hint, children }: { title: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <section className="space-y-4 border-t border-border pt-6 first:border-t-0 first:pt-0">
      <div>
        <h3 className="font-display text-base font-semibold tracking-tight text-ink">{title}</h3>
        {hint && <div className="mt-1 text-sm leading-relaxed text-ink-dim">{hint}</div>}
      </div>
      {children}
    </section>
  );
}

export function PismiWork({
  index,
  lab,
  accent,
  choice = {},
  selectors,
  intro,
  student = true,
}: {
  index: PismiIndex;
  lab: PismiLab;
  accent: string;
  /** Варианты ЛР2 (v1, v2) или тема ЛР3 — выбираются на странице. */
  choice?: Omit<Selection, "tier">;
  /** Выбор варианта или темы — стоит перед оформлением. */
  selectors?: { title: string; hint?: ReactNode; node: ReactNode };
  intro: ReactNode;
  /** Нужны ли данные студента (в ЛР4 заполнителей нет). */
  student?: boolean;
}) {
  const [tier, setTier] = useState(lab.tiers[0]);
  const input = useStudent();
  const check = useMemo(() => studentValues(input, index.palette, index.forbidden), [input, index]);
  const values = student && check.ok ? check.values : null;
  const errors = check.ok ? {} : check.errors;

  const { v1, v2, theme } = choice;
  const files = useMemo(() => selectedFiles(lab, { tier, v1, v2, theme }), [lab, tier, v1, v2, theme]);
  const { texts, failed } = useTemplates(files.map((f) => f.url));

  // Подстановка на каждый ввод: тексты небольшие, а показывать надо то, что скачается.
  const shown = useMemo(() => {
    if (!texts) return null;
    try {
      return Object.fromEntries(
        files.map((f) => [f.path, values ? fill(texts[f.url], values) : texts[f.url]]),
      ) as Record<string, string>;
    } catch {
      return null;
    }
  }, [files, texts, values]);

  const notes = new Map(lab.files.map((f) => [f.path, f.note]));
  const listed: LabFile[] = files.map((f) => ({
    path: f.path,
    note: notes.get(f.path) ?? "",
    size: shown ? new TextEncoder().encode(shown[f.path]).length : 0,
  }));
  const total = listed.reduce((sum, f) => sum + f.size, 0);
  const ready = shown !== null && (values !== null || !student);
  const name = archiveName(lab, student ? values : check.ok ? check.values : null);

  function download() {
    if (!texts || !ready) return;
    const { bytes } = buildArchive(
      lab,
      files.map((f) => ({ path: f.path, template: texts[f.url] })),
      student ? values : null,
    );
    const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: "application/zip" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <Card>
      <CardBody className="space-y-6 pt-6">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight text-ink">Готовая работа</h2>
          <div className="mt-1.5 max-w-3xl text-sm leading-relaxed text-ink-dim">{intro}</div>
        </div>

        {student && (
          <Section
            title="Данные студента"
            hint="Вписываются прямо в код страниц — так требует методичка. Общие для всех пяти работ."
          >
            <StudentFields index={index} values={values} errors={errors} accent={accent} archive={name} />
          </Section>
        )}

        {selectors && (
          <Section title={selectors.title} hint={selectors.hint}>
            {selectors.node}
          </Section>
        )}

        {lab.tiers.length > 1 && (
          <Section
            title="Оформление"
            hint="Обязательное по методичке есть в каждом варианте; отличаются вид и то, что сделано сверх него. Внутри варианта работы разных студентов отличаются ещё и цветом."
          >
            <TierPicker index={index} lab={lab} value={tier} onChange={setTier} accent={accent} />
          </Section>
        )}

        <Section
          title="Файлы"
          hint={
            student && !values
              ? "Пока данные не введены, в тексте видны заполнители вида %%PIB%% — на их место встанут ПІБ и группа."
              : undefined
          }
        >
          {failed ? (
            <p className="rounded-[4px] border border-border bg-black/30 px-4 py-3 text-sm text-ink-dim">
              Файлы не загрузились. Обновите страницу.
            </p>
          ) : shown ? (
            <FileSet base={PISMI_BASE} files={listed} accent={accent} contents={shown} />
          ) : (
            <p className="text-sm text-ink-faint">Загрузка…</p>
          )}

          <div className="flex flex-col gap-3 rounded-[4px] border border-border bg-black/20 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 text-sm">
              <div className="break-all font-mono text-[0.8125rem] text-ink">{name}</div>
              <div className="mt-0.5 text-xs text-ink-faint">
                {ready
                  ? `${files.length} ${plural(files.length, "файл", "файла", "файлов")}, ${kb(total)}; внутри — каталог ${lab.root}/, как в методичке`
                  : student && !values
                    ? "Сначала ПІБ и группа: без них архив не собирается"
                    : "Файлы ещё загружаются"}
              </div>
            </div>
            <button
              type="button"
              onClick={download}
              disabled={!ready}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-[3px] border px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40"
              style={{ color: accent, background: tint(accent, 8), borderColor: tint(accent, 30) }}
            >
              <Download size={15} />
              Скачать архив
            </button>
          </div>
        </Section>
      </CardBody>
    </Card>
  );
}

/** Запуск готовой работы, что из неё в отчёт и чем она отступает от методички. */
export function PismiRun({ lab, accent, before }: { lab: PismiLab; accent: string; before?: ReactNode }) {
  return (
    <Card>
      <CardBody className="space-y-6 pt-6">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight text-ink">Как запустить</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-dim">
            Порты и имена контейнеров — как в методичке:{" "}
            {lab.ports.map((p, i) => (
              <span key={p.host}>
                {i > 0 && ", "}
                <span className="font-mono text-ink">{p.host}</span> — {p.service}
              </span>
            ))}
            .
          </p>
        </div>

        {before}

        <Steps steps={lab.run.map((body) => ({ body }))} accent={accent} compact />

        <div className="border-t border-border pt-5">
          <h3 className="mb-2.5 font-display text-base font-semibold tracking-tight text-ink">
            Что из этой работы идёт в отчёт
          </h3>
          <ul className="space-y-1.5">
            {lab.report.map((item) => (
              <li key={item} className="flex gap-2 text-sm leading-relaxed text-ink-dim">
                <span style={{ color: accent }}>·</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {lab.notes && lab.notes.length > 0 && <Pitfalls items={lab.notes} accent={accent} />}

        {lab.deviations.length > 0 && (
          <Pitfalls
            title="Где работа отступает от методички и почему"
            accent={accent}
            items={lab.deviations.map((d, i) => (
              <Fragment key={i}>
                {d.where && <span className="font-mono text-xs text-ink-faint">{d.where}. </span>}
                <span className="text-ink">{d.what}</span> {d.why}
              </Fragment>
            ))}
          />
        )}
      </CardBody>
    </Card>
  );
}

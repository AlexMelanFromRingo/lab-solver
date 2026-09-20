"use client";

import { Card, CardBody } from "@/components/ui/card";
import { Steps } from "@/components/lab-steps";
import type { LabGuide } from "@/lib/data/pismi-labs";

/**
 * Ход работы, состав отчёта и перечень снимков экрана.
 *
 * Снимки вынесены в отдельный блок и пронумерованы кадрами: это то, что
 * забывают чаще всего, а без нужного кадра работу возвращают независимо от
 * того, сколько кода написано. Поэтому здесь не только «что снять», но и
 * «как»: что должно попасть в кадр, чтобы снимок что-то доказывал.
 */
export function LabProcedure({ guide, accent }: { guide: LabGuide; accent: string }) {
  return (
    <>
      <Card>
        <CardBody className="pt-6 space-y-6">
          <div>
            <h2 className="font-display text-xl font-semibold tracking-tight text-ink">
              Что требуется сделать
            </h2>
            <p className="mt-1 text-sm text-ink-faint">{guide.source}</p>
          </div>

          <ul className="space-y-1.5 text-sm text-ink-dim">
            {guide.goals.map((goal) => (
              <li key={goal} className="flex gap-2 leading-relaxed">
                <span style={{ color: accent }}>·</span>
                {goal}
              </li>
            ))}
          </ul>

          {guide.task && (
            <div
              className="rounded-xl border px-5 py-4"
              style={{ borderColor: `${accent}44`, background: `${accent}0d` }}
            >
              <div className="text-xs uppercase tracking-wide text-ink-faint">
                Индивидуальное задание
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-ink">{guide.task}</p>
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardBody className="pt-6 space-y-5">
          <h2 className="font-display text-xl font-semibold tracking-tight text-ink">
            Порядок выполнения
          </h2>
          <Steps steps={guide.steps} accent={accent} />
        </CardBody>
      </Card>

      <Card>
        <CardBody className="pt-6 space-y-6">
          <div>
            <h2 className="font-display text-xl font-semibold tracking-tight text-ink">
              Что снять на экран
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-ink-dim">
              Перечень из методички. Это чаще всего и оказывается причиной, по которой работу
              возвращают на доработку.
            </p>
          </div>

          <div className="space-y-3">
            {guide.screenshots.map((shot, i) => (
              <div
                key={shot.what}
                className="grid gap-3 rounded-xl border border-border bg-black/20 px-4 py-3.5 sm:grid-cols-[4.5rem_minmax(0,1fr)]"
              >
                <div className="text-xs font-medium uppercase tracking-wide" style={{ color: accent }}>
                  Кадр {i + 1}
                </div>
                <div className="min-w-0">
                  <p className="text-sm leading-snug text-ink">{shot.what}</p>
                  <p className="mt-1 text-xs leading-relaxed text-ink-faint">{shot.how}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-5">
            <h3 className="mb-2.5 font-display text-base font-semibold tracking-tight text-ink">
              Что должно быть в отчёте
            </h3>
            <ol className="space-y-1.5">
              {guide.report.map((item, i) => (
                <li key={item} className="flex gap-3 text-sm leading-relaxed text-ink-dim">
                  <span className="font-mono text-xs tabular-nums text-ink-faint">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {item}
                </li>
              ))}
            </ol>
          </div>
        </CardBody>
      </Card>

      <details className="rounded-2xl border border-border bg-surface/60 backdrop-blur-xl">
        <summary className="cursor-pointer px-6 py-4 text-sm text-ink-dim">
          Контрольные вопросы — {guide.questions.length}
        </summary>
        <ol className="space-y-2 border-t border-border px-6 py-5">
          {guide.questions.map((q, i) => (
            <li key={q} className="flex gap-3 text-sm leading-relaxed text-ink-dim">
              <span className="font-mono text-xs tabular-nums text-ink-faint">{i + 1}</span>
              {q}
            </li>
          ))}
        </ol>
      </details>
    </>
  );
}

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { categories, type LabModule } from "@/lib/modules";

/**
 * Шапка модуля.
 *
 * Раздел обозначен насечкой того же цвета, что и на главной, а не значком с
 * подписью: название раздела читатель уже видел, когда сюда переходил.
 * Источник стоит внизу отдельной строкой – это выходные данные, а не заголовок.
 */
export function ModuleHeader({ module }: { module: LabModule }) {
  const cat = categories[module.category];

  return (
    <div className="border-b border-border">
      <div className="mx-auto max-w-5xl px-6 pb-8 pt-8">
        <Link
          href="/"
          className="mb-7 flex w-fit items-center gap-1.5 text-sm text-ink-faint transition-colors hover:text-ink-dim"
        >
          <ArrowLeft size={14} />
          Все модули
        </Link>

        <div className="rule pt-5" style={{ ["--tick" as string]: cat.accent }}>
          <h1 className="font-display text-[2.1rem] font-semibold leading-[1.05] tracking-[-0.03em] text-ink sm:text-[2.6rem]">
            {module.title}
          </h1>
          <p className="mt-3 max-w-2xl leading-relaxed text-ink-dim">{module.description}</p>

          <div className="mt-5 flex flex-wrap items-end gap-x-8 gap-y-3">
            <div>
              <div className="text-[0.6875rem] leading-none text-ink-faint">раздел</div>
              <div className="mt-1 font-mono text-[0.8125rem] leading-none" style={{ color: cat.accent }}>
                {cat.title}
              </div>
            </div>
            {module.hasVariants && (
              <div>
                <div className="text-[0.6875rem] leading-none text-ink-faint">вариантов</div>
                <div className="mt-1 font-mono text-[0.8125rem] leading-none text-ink-dim">
                  {module.variantCount}
                </div>
              </div>
            )}
            <div className="min-w-0">
              <div className="text-[0.6875rem] leading-none text-ink-faint">источник</div>
              <div className="mt-1 font-mono text-[0.8125rem] leading-none text-ink-dim">
                {module.source}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

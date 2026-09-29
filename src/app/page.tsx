"use client";

import { motion } from "framer-motion";
import { HeroTeaser } from "@/components/hero-teaser";
import { ModuleCard } from "@/components/module-card";
import { categories, modules, type Category } from "@/lib/modules";

const CATEGORY_ORDER: Category[] = [
  "pismi",
  "ai",
  "it",
  "plis",
  "zikm",
  "km",
  "lm",
  "pk",
  "ak",
  "tik",
  "moib",
  "amo",
  "kdm",
  "temk",
  "extra",
];

export default function Home() {
  return (
    <div>
      <section className="relative">
        <div className="relative mx-auto grid max-w-6xl gap-12 px-6 pb-16 pt-20 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 80, damping: 20 }}
          >
            <h1 className="font-display text-[2.75rem] font-semibold leading-[1.02] tracking-[-0.035em] text-ink sm:text-[3.75rem]">
              Часть лабораторной&nbsp;— формула.
              <br />
              <span className="text-ink-faint">Формулу можно посчитать.</span>
            </h1>
            <p className="mt-6 text-lg text-ink-dim leading-relaxed max-w-xl">
              Каждая лаба состоит из двух частей: вариант, который вам назначили, и работа, которая из
              него следует. Вариант вы не выбираете — а вот математику не нужно пересчитывать руками, а
              ход работы — выискивать по методичке. Здесь {modules.length} модулей по дисциплинам
              магистратуры и бакалавриата: расчёт по формулам методички там, где работа сводится к
              формуле, и порядок выполнения с составом отчёта там, где она делается в программе.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="#modules"
                className="bg-ink px-5 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
                style={{ borderRadius: 4 }}
              >
                Смотреть модули
              </a>
              <a
                href="#about"
                className="border-b border-border-strong pb-0.5 text-sm text-ink-dim transition-colors hover:border-ink hover:text-ink"
              >
                Как это устроено
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 80, damping: 20, delay: 0.15 }}
          >
            <HeroTeaser />
          </motion.div>
        </div>
      </section>

      <section id="modules" className="mx-auto max-w-6xl px-6 py-10 space-y-16 scroll-mt-16">
        {CATEGORY_ORDER.map((cat) => {
          const items = modules.filter((m) => m.category === cat);
          if (items.length === 0) return null;
          const info = categories[cat];
          return (
            <div key={cat}>
              {/* Насечка того же цвета, что и у карточек раздела: принадлежность
                  видно по метке, а не по подписи на каждой карточке. */}
              <div
                className="rule mb-5 flex items-baseline justify-between gap-4 pt-4"
                style={{ ["--tick" as string]: info.accent }}
              >
                <div>
                  <div className="text-xs text-ink-faint">{info.stage}</div>
                  <h2 className="mt-1 font-display text-[1.6rem] font-semibold leading-tight tracking-[-0.025em] text-ink">
                    {info.title}
                  </h2>
                  <p className="mt-1 text-sm text-ink-faint">{info.short}</p>
                </div>
                <span className="shrink-0 font-mono text-xs text-ink-faint">
                  {items.length} модул{items.length === 1 ? "ь" : items.length < 5 ? "я" : "ей"}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 auto-rows-[minmax(6.75rem,auto)] gap-3">
                {items.map((m, i) => (
                  <ModuleCard key={m.slug} module={m} index={i} />
                ))}
              </div>
            </div>
          );
        })}
      </section>

      <section id="about" className="mx-auto max-w-6xl px-6 py-20 scroll-mt-16">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="mb-4 font-display text-[1.6rem] font-semibold tracking-[-0.025em] text-ink">Что здесь автоматизировано, а что нет</h2>
            <p className="text-ink-dim leading-relaxed">
              В лабораторную обычно входит вариант — набор параметров, который назначается по номеру
              в списке группы, — и порядок работы, который из этих параметров выводит результат.
              Там, где работа сводится к формуле (шифры, коды, адресация, энтропия), модуль считает
              её для любого варианта и показывает промежуточные шаги. Там, где работа делается в
              программе (Packet Tracer, Docker, Excel), модуль даёт порядок выполнения, готовые
              файлы и состав отчёта. Разбор задания, отчёт и объяснение «почему так» — по-прежнему
              ваша часть работы.
            </p>
          </div>
          <div>
            <h2 className="mb-4 font-display text-[1.6rem] font-semibold tracking-[-0.025em] text-ink">Откуда взялись формулы</h2>
            <p className="text-ink-dim leading-relaxed">
              Каждый модуль сверяется с методичкой своей дисциплины: названия работ, таблицы
              вариантов, пункты порядка выполнения и состав отчёта — оттуда, без додумывания. Где
              в методичке опечатка или она допускает разночтения, это помечено прямо в модуле и
              вынесено в редактируемое поле, а не исправлено молча.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

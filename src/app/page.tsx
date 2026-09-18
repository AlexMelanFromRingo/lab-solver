"use client";

import { motion } from "framer-motion";
import { HeroTeaser } from "@/components/hero-teaser";
import { ModuleCard } from "@/components/module-card";
import { categories, modules, type Category } from "@/lib/modules";

const CATEGORY_ORDER: Category[] = [
  "crypto",
  "number",
  "theory",
  "codes",
  "arch",
  "networks",
  "pismi",
  "ai",
];

export default function Home() {
  return (
    <div>
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 20% 0%, rgba(139,124,246,0.14), transparent), radial-gradient(ellipse 50% 40% at 90% 10%, rgba(45,212,191,0.10), transparent)",
          }}
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-6xl px-6 pt-20 pb-16 grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 80, damping: 20 }}
          >
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-ink-faint mb-5">
              Прикладная криптология · Теория информации · Архитектура ЭВМ
            </p>
            <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight text-ink leading-[1.05]">
              Часть лабораторной — формула.
              <br />
              <span className="text-ink-dim">Формулу можно посчитать.</span>
            </h1>
            <p className="mt-6 text-lg text-ink-dim leading-relaxed max-w-xl">
              Каждая лаба состоит из двух частей: вариант, который вам назначили, и математика,
              которая из него следует. Вариант вы не выбираете — а вот саму математику не нужно
              пересчитывать руками. Здесь — {modules.length} калькуляторов, которые делают именно
              это: детерминированную часть лабораторных по криптографии, теории информации,
              помехоустойчивому кодированию и архитектуре ЭВМ, честно посчитанную по формулам из
              методичек и сверенную с рабочим кодом с занятий.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="#modules"
                className="rounded-xl bg-ink px-5 py-3 text-sm font-medium text-background hover:opacity-90 transition-opacity"
              >
                Смотреть модули
              </a>
              <a href="#about" className="text-sm text-ink-dim hover:text-ink transition-colors">
                Как это устроено →
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
              <div className="flex items-baseline justify-between mb-5">
                <div>
                  <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">{info.title}</h2>
                  <p className="text-sm text-ink-faint mt-1">{info.short}</p>
                </div>
                <span className="text-xs font-mono text-ink-faint">{items.length} модул{items.length === 1 ? "ь" : items.length < 5 ? "я" : "ей"}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 auto-rows-[minmax(9rem,auto)] gap-4">
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
            <h2 className="font-display text-2xl font-semibold tracking-tight text-ink mb-4">Что здесь автоматизировано, а что нет</h2>
            <p className="text-ink-dim leading-relaxed">
              В лабораторную обычно входит вариант — набор параметров, который назначается по номеру
              в списке группы, — и алгоритм, который из этих параметров детерминированно выводит
              ответ. Вариант придумывать не нужно, его выдают; а вот применение алгоритма к своим
              числам — чистая математика, и её можно проверить программой. Сюда попало только то,
              что действительно сводится к формуле: шифры, тесты на простоту, коды с исправлением
              ошибок, энтропийное кодирование, микропрограммы. Разбор задания, оформление отчёта и
              объяснение «почему так» — по-прежнему ваша часть работы.
            </p>
          </div>
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-ink mb-4">Откуда взялись формулы</h2>
            <p className="text-ink-dim leading-relaxed">
              Каждый модуль сверен с исходным кодом лабораторных (C++/Python/Rust с занятий) и
              таблицами вариантов из методичек — там, где нашлась таблица на 12 или 24 варианта, она
              перенесена как есть, без додумывания. Там, где методичка допускает разночтения
              (например, число раундов в сети Фейстеля), это явно помечено и вынесено в
              редактируемое поле, а не зашито тихо «как получится».
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

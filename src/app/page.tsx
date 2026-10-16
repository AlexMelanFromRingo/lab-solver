"use client";

import { motion } from "framer-motion";
import { HeroTeaser } from "@/components/hero-teaser";
import { ModuleCard } from "@/components/module-card";
import { categories, modules, type Category } from "@/lib/modules";
import { L, useLang } from "@/components/lang";
import { UI, heroLead, modulesWord, ui } from "@/lib/i18n";

const CATEGORY_ORDER: Category[] = [
  "pismi",
  "ai",
  "it",
  "kfs",
  "cisco",
  "plis",
  "zikm",
  "oop",
  "km",
  "spz",
  "mps",
  "db",
  "lm",
  "pk",
  "ak",
  "tik",
  "moib",
  "amo",
  "ks",
  "pzzk",
  "pp",
  "kdm",
  "temk",
  "extra",
];

export default function Home() {
  const { lang } = useLang();
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
              <L v={UI.heroTitle1} />
              <br />
              <span className="text-ink-faint"><L v={UI.heroTitle2} /></span>
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
                {ui("ctaModules", lang)}
              </a>
              <a
                href="#about"
                className="border-b border-border-strong pb-0.5 text-sm text-ink-dim transition-colors hover:border-ink hover:text-ink"
              >
                <L v={UI.navAbout} />
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
                  <div className="text-xs text-ink-faint"><L v={info.stage} /></div>
                  <h2 className="mt-1 font-display text-[1.6rem] font-semibold leading-tight tracking-[-0.025em] text-ink">
                    <L v={info.title} />
                  </h2>
                  <p className="mt-1 text-sm text-ink-faint"><L v={info.short} /></p>
                </div>
                <span className="shrink-0 font-mono text-xs text-ink-faint">
                  {items.length} {modulesWord(items.length, lang)}
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
            <h2 className="mb-4 font-display text-[1.6rem] font-semibold tracking-[-0.025em] text-ink"><L v={UI.aboutTitle1} /></h2>
            <p className="text-ink-dim leading-relaxed"><L v={UI.aboutBody1} /></p>
          </div>
          <div>
            <h2 className="mb-4 font-display text-[1.6rem] font-semibold tracking-[-0.025em] text-ink"><L v={UI.aboutTitle2} /></h2>
            <p className="text-ink-dim leading-relaxed"><L v={UI.aboutBody2} /></p>
          </div>
        </div>
      </section>
    </div>
  );
}

import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="group flex items-baseline gap-2">
          <span className="font-display text-[1.0625rem] font-semibold tracking-[-0.02em] text-ink">
            Вариант
          </span>
          <span className="hidden font-mono text-[0.6875rem] text-ink-faint sm:inline">
            решатель лабораторных
          </span>
        </Link>
        <nav className="flex items-center gap-6 text-sm text-ink-dim">
          <Link href="/#modules" className="transition-colors hover:text-ink">
            Модули
          </Link>
          <Link href="/#about" className="transition-colors hover:text-ink">
            Как это устроено
          </Link>
        </nav>
      </div>
    </header>
  );
}

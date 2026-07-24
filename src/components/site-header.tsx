import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/70 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="font-display text-lg font-semibold tracking-tight text-ink">
            Вариант<span className="text-crypto">.</span>
          </span>
        </Link>
        <nav className="flex items-center gap-6 text-sm text-ink-dim">
          <Link href="/#modules" className="hover:text-ink transition-colors">
            Модули
          </Link>
          <Link href="/#about" className="hover:text-ink transition-colors">
            Как это устроено
          </Link>
        </nav>
      </div>
    </header>
  );
}

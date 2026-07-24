export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-6xl px-6 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <p className="text-sm text-ink-faint max-w-md leading-relaxed">
          Всё считается в браузере — ни один текст, ключ или номер варианта никуда не отправляется.
        </p>
        <p className="text-xs font-mono text-ink-faint">
          детерминированные части лабораторных · остальное — своей головой
        </p>
      </div>
    </footer>
  );
}

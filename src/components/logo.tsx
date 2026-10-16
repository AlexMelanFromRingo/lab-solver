/**
 * Знак lab-solver: экран прибора со ступенчатым следом измерения, который
 * приходит к светящейся точке — посчитанному ответу. Цвета — из палитры
 * «поля прибора»; тот же рисунок лежит в app/icon.svg для вкладки.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect x="1" y="1" width="30" height="30" rx="7" fill="var(--surface)" stroke="var(--border-strong)" strokeWidth="1.5" />
      <path d="M5.5 11h21M5.5 16h21M5.5 21h21" stroke="var(--border)" strokeWidth=".9" />
      <path d="M6 23h4.5v-9.5h4.5v6h4.5V9h3.4" fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx="25" cy="9" r="2.4" fill="#5eead4" />
    </svg>
  );
}

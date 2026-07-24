import type { Category } from "@/lib/modules";
import { categories } from "@/lib/modules";
import { cn } from "@/lib/cn";

export function CategoryBadge({
  category,
  className,
}: {
  category: Category;
  className?: string;
}) {
  const cat = categories[category];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide",
        className
      )}
      style={{
        color: cat.accent,
        borderColor: cat.accentSoft,
        background: cat.accentSoft,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: cat.accent }}
        aria-hidden="true"
      />
      {cat.title}
    </span>
  );
}

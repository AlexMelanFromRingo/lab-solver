"use client";

import { cn } from "@/lib/cn";
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

function Label({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between gap-2">
      <span className="text-sm font-medium text-ink-dim">{children}</span>
      {hint && <span className="text-xs text-ink-faint font-mono">{hint}</span>}
    </div>
  );
}

const controlClass =
  "w-full rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-ink placeholder:text-ink-faint transition-colors focus:border-border-strong focus:outline-none font-mono text-sm";

export function NumberField({
  label,
  hint,
  className,
  ...props
}: { label: string; hint?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <Label hint={hint}>{label}</Label>
      <input type="number" className={cn(controlClass, className)} {...props} />
    </label>
  );
}

export function TextField({
  label,
  hint,
  className,
  ...props
}: { label: string; hint?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <Label hint={hint}>{label}</Label>
      <input type="text" className={cn(controlClass, className)} {...props} />
    </label>
  );
}

export function TextAreaField({
  label,
  hint,
  className,
  ...props
}: { label: string; hint?: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="block">
      <Label hint={hint}>{label}</Label>
      <textarea className={cn(controlClass, "resize-y min-h-[6rem]", className)} {...props} />
    </label>
  );
}

export function SelectField({
  label,
  hint,
  className,
  children,
  ...props
}: { label: string; hint?: string; children: React.ReactNode } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="block">
      <Label hint={hint}>{label}</Label>
      <select className={cn(controlClass, "appearance-none cursor-pointer", className)} {...props}>
        {children}
      </select>
    </label>
  );
}

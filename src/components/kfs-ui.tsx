"use client";

import type { ReactNode } from "react";
import { Card, CardBody } from "@/components/ui/card";
import { useLang } from "@/components/lang";
import { tr, type Loc } from "@/lib/i18n";

// --- таблица с подсветкой ячеек ---------------------------------------------------

export type Tint = "diag" | "eq" | "fix" | "tree" | "elite";
export const TINT: Record<Tint, string> = {
  diag: "rgba(250, 204, 21, 0.10)",
  eq: "rgba(74, 222, 128, 0.14)",
  fix: "rgba(251, 146, 60, 0.20)",
  tree: "rgba(96, 165, 250, 0.16)",
  elite: "rgba(244, 114, 182, 0.20)",
};

export interface Cell {
  v: ReactNode;
  tint?: Tint;
  bold?: boolean;
}
export const c = (v: ReactNode, tint?: Tint, bold?: boolean): Cell => ({ v, tint, bold });

export function Grid({ title, head, rows, note }: { title: Loc; head: Loc[]; rows: (Cell | ReactNode)[][]; note?: ReactNode }) {
  const { lang } = useLang();
  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-ink-dim">{tr(title, lang)}</h3>
      <div className="overflow-x-auto rounded-[4px] border border-border">
        <table className="w-full font-mono text-sm">
          <thead className="border-b border-border text-xs text-ink-faint">
            <tr>
              {head.map((h, i) => (
                <th key={i} className="px-3 py-2 text-left align-bottom font-normal">
                  {tr(h, lang)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-ink-dim">
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-border/50 last:border-0">
                {row.map((cell, j) => {
                  const cc = cell && typeof cell === "object" && "v" in (cell as object) ? (cell as Cell) : { v: cell as ReactNode };
                  return (
                    <td key={j} className={`px-3 py-1.5 align-top ${cc.bold ? "text-ink" : ""}`} style={cc.tint ? { background: TINT[cc.tint] } : undefined}>
                      {cc.v}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {note && <p className="mt-2 text-xs leading-relaxed text-ink-faint">{note}</p>}
    </div>
  );
}

export function Section({ title, children }: { title: Loc; children: ReactNode }) {
  const { lang } = useLang();
  return (
    <Card>
      <CardBody className="space-y-5">
        <h2 className="text-base font-medium text-ink">{tr(title, lang)}</h2>
        {children}
      </CardBody>
    </Card>
  );
}


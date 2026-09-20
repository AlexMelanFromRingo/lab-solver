import type { Metadata } from "next";
import { Geologica, Golos_Text, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

// Гарнитуры выбраны под предмет и под язык. Geologica — переменный гротеск
// с кириллицей и техническим характером: в крупном кегле держит плотный набор
// и читается как надпись на приборе. Golos Text рисовался от кириллицы и
// спокоен в сплошном тексте. IBM Plex Mono стоит там, где числа, и совпадает
// с типографикой самих работ.
const display = Geologica({
  variable: "--ff-display",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const body = Golos_Text({
  variable: "--ff-body",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const mono = IBM_Plex_Mono({
  variable: "--ff-mono",
  weight: ["400", "500", "600"],
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Вариант — решатель лабораторных",
  description:
    "Детерминированные части лабораторных по криптографии, теории информации, помехоустойчивому кодированию и архитектуре ЭВМ — посчитано, а не переписано.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="antialiased min-h-screen flex flex-col">
        <div className="noise-veil" aria-hidden="true" />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}

import { moduleMetadata } from "@/lib/meta";

// Страница модуля — клиентский компонент, заголовок вкладки задаётся здесь.
export const metadata = moduleMetadata("hamming");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

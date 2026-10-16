import { moduleMetadata } from "@/lib/meta";

// Страница модуля — клиентский компонент, заголовок вкладки задаётся здесь.
export const metadata = moduleMetadata("ai-lab1");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

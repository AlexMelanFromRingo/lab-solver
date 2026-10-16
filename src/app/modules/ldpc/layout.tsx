import { moduleMetadata } from "@/lib/meta";

// Страница модуля — клиентский компонент, заголовок вкладки задаётся здесь.
export const metadata = moduleMetadata("ldpc");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

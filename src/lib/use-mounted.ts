"use client";

import { useEffect, useState } from "react";

/**
 * true только после гидратации на клиенте. Нужен для блоков, зависящих от
 * crypto.getRandomValues (тесты простоты, генерация ключей RSA/OTP) — без
 * этого сервер и клиент считают разные случайные числа при первом рендере,
 * и React ругается на hydration mismatch.
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

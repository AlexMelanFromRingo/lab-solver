"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { PismiIndex, StudentInput } from "@/lib/pismi-work";

/**
 * Загрузка шаблонов работ ПІСМІ из public/pismi и данные студента.
 *
 * Адреса относительные: сайт живёт под /lab-solver на GitHub Pages и в корне
 * при локальной сборке, а путь от /modules/<slug>/ верен в обоих случаях.
 * Тексты шаблонов не вшиты в бандл: их сотни, а нужен посетителю один набор.
 */
export const PISMI_BASE = "../../pismi";

const requests = new Map<string, Promise<string>>();

/** Один запрос на адрес за всё время жизни страницы. */
function fetchText(url: string): Promise<string> {
  let request = requests.get(url);
  if (!request) {
    request = fetch(url).then((response) => {
      if (!response.ok) throw new Error(`${url}: ${response.status}`);
      return response.text();
    });
    request.catch(() => requests.delete(url));
    requests.set(url, request);
  }

  return request;
}

export function usePismiIndex(): { index: PismiIndex | null; failed: boolean } {
  const [state, setState] = useState<{ index: PismiIndex | null; failed: boolean }>({
    index: null,
    failed: false,
  });

  useEffect(() => {
    let cancelled = false;
    fetchText(`${PISMI_BASE}/index.json`)
      .then((text) => {
        if (!cancelled) setState({ index: JSON.parse(text) as PismiIndex, failed: false });
      })
      .catch(() => {
        if (!cancelled) setState({ index: null, failed: true });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

/**
 * Тексты шаблонов по адресам относительно public/pismi. Пока набор грузится,
 * texts = null; загруженное хранится вместе с ключом набора, поэтому смена
 * уровня или варианта не требует сброса состояния внутри эффекта.
 */
export function useTemplates(urls: string[]): { texts: Record<string, string> | null; failed: boolean } {
  const key = urls.join("\n");
  const [loaded, setLoaded] = useState<{ key: string; texts: Record<string, string> | null }>({
    key: "",
    texts: null,
  });

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    const list = key.split("\n");
    Promise.all(list.map((url) => fetchText(`${PISMI_BASE}/${url}`)))
      .then((texts) => {
        if (!cancelled) setLoaded({ key, texts: Object.fromEntries(list.map((url, i) => [url, texts[i]])) });
      })
      .catch(() => {
        if (!cancelled) setLoaded({ key, texts: null });
      });

    return () => {
      cancelled = true;
    };
  }, [key]);

  const settled = loaded.key === key;

  return { texts: settled ? loaded.texts : null, failed: settled && loaded.texts === null };
}

// --- данные студента: localStorage, общие для всех пяти работ -------------------

const STUDENT_KEY = "pismi-student";
const EMPTY: StudentInput = { pib: "", group: "" };
const listeners = new Set<() => void>();
let current: StudentInput | null = null;

function readStudent(): StudentInput {
  try {
    const raw = window.localStorage.getItem(STUDENT_KEY);
    if (!raw) return EMPTY;
    const data = JSON.parse(raw) as Partial<StudentInput>;
    return {
      pib: typeof data.pib === "string" ? data.pib : "",
      group: typeof data.group === "string" ? data.group : "",
    };
  } catch {
    return EMPTY;
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STUDENT_KEY) return;
    current = readStudent();
    listener();
  };
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function snapshot(): StudentInput {
  if (current === null) current = readStudent();
  return current;
}

export function setStudent(next: StudentInput): void {
  current = next;
  try {
    window.localStorage.setItem(STUDENT_KEY, JSON.stringify(next));
  } catch {
    // Хранилище недоступно (приватный режим, запрет сайта) — данные живут до перезагрузки.
  }
  listeners.forEach((listener) => listener());
}

/** Введённое как есть (с пробелами): нормализует studentValues(). */
export function useStudent(): StudentInput {
  return useSyncExternalStore(subscribe, snapshot, () => EMPTY);
}

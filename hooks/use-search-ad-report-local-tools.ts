"use client";

import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from "react";

const HISTORY_KEY = "searchAdReportHistory";
const TEMPLATE_KEY = "searchAdReportTemplates";
const HISTORY_LIMIT = 20;
const LOCAL_EVENT = "search-ad-report-local-tools.updated";

export type SearchAdReportHistoryItem<TForm> = {
  id: string;
  date: string;
  form: TForm;
  result: string;
};

export type SearchAdReportTemplateItem<TForm> = {
  id: string;
  name: string;
  form: TForm;
};

function readJson<T>(key: string, fallback: T) {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event(LOCAL_EVENT));
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handler = () => callback();
  window.addEventListener("storage", handler);
  window.addEventListener(LOCAL_EVENT, handler);

  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(LOCAL_EVENT, handler);
  };
}

export function useSearchAdReportLocalTools<TForm>({
  form,
  resultText,
}: {
  form: TForm;
  resultText: string;
}) {
  const lastSnapshotRef = useRef("");

  const historySnapshot = useSyncExternalStore(
    subscribe,
    () => JSON.stringify(readJson<SearchAdReportHistoryItem<TForm>[]>(HISTORY_KEY, [])),
    () => "[]",
  );

  const templatesSnapshot = useSyncExternalStore(
    subscribe,
    () => JSON.stringify(readJson<SearchAdReportTemplateItem<TForm>[]>(TEMPLATE_KEY, [])),
    () => "[]",
  );

  const history = useMemo(
    () => (JSON.parse(historySnapshot) as SearchAdReportHistoryItem<TForm>[]).slice(0, 5),
    [historySnapshot],
  );

  const templates = useMemo(
    () => JSON.parse(templatesSnapshot) as SearchAdReportTemplateItem<TForm>[],
    [templatesSnapshot],
  );

  useEffect(() => {
    const snapshot = JSON.stringify({ form, resultText });
    if (snapshot === lastSnapshotRef.current) {
      return;
    }

    lastSnapshotRef.current = snapshot;

    const current = readJson<SearchAdReportHistoryItem<TForm>[]>(HISTORY_KEY, []);
    const nextItem: SearchAdReportHistoryItem<TForm> = {
      id: `${Date.now()}`,
      date: new Date().toISOString(),
      form,
      result: resultText,
    };

    writeJson(HISTORY_KEY, [nextItem, ...current].slice(0, HISTORY_LIMIT));
  }, [form, resultText]);

  const saveTemplate = useCallback(
    (name: string) => {
      const trimmedName = name.trim();
      if (!trimmedName) {
        return false;
      }

      const current = readJson<SearchAdReportTemplateItem<TForm>[]>(TEMPLATE_KEY, []);
      writeJson(TEMPLATE_KEY, [
        {
          id: `${Date.now()}`,
          name: trimmedName,
          form,
        },
        ...current,
      ]);

      return true;
    },
    [form],
  );

  return {
    history,
    templates,
    saveTemplate,
  };
}

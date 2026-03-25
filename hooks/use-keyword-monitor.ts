"use client";

import { useSyncExternalStore } from "react";
import {
  createKeywordMonitorStore,
  getKeywordMonitorStorageEventName,
  type KeywordMonitorState,
  type MonitorCheckStatus,
  type MonitorResultSummary,
  type MonitorSearchType,
} from "@/lib/monitoring/keyword-monitor-store";

function subscribe(callback: () => void) {
  const handleChange = () => callback();
  window.addEventListener("storage", handleChange);
  window.addEventListener(getKeywordMonitorStorageEventName(), handleChange);

  return () => {
    window.removeEventListener("storage", handleChange);
    window.removeEventListener(getKeywordMonitorStorageEventName(), handleChange);
  };
}

export function useKeywordMonitor() {
  const serializedState = useSyncExternalStore(
    subscribe,
    () => JSON.stringify(createKeywordMonitorStore().read()),
    () => JSON.stringify({ version: 3, records: [] } satisfies KeywordMonitorState),
  );
  const state = JSON.parse(serializedState) as KeywordMonitorState;

  const addKeyword = (input: { keyword: string; searchType: MonitorSearchType }) => {
    const store = createKeywordMonitorStore();
    return store.add(input);
  };

  const removeKeyword = (id: string) => {
    const store = createKeywordMonitorStore();
    return store.remove(id);
  };

  const updateCheckResult = (input: {
    id: string;
    checkedAt: string;
    status: Exclude<MonitorCheckStatus, "loading">;
    summary: MonitorResultSummary | null;
    message?: string | null;
  }) => {
    const store = createKeywordMonitorStore();
    return store.updateCheckResult(input);
  };

  return {
    state,
    addKeyword,
    removeKeyword,
    updateCheckResult,
  };
}

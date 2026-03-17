"use client";

import { useState } from "react";
import {
  createKeywordMonitorStore,
  type KeywordMonitorState,
  type MonitorCheckStatus,
  type MonitorResultSummary,
  type MonitorSearchType,
} from "@/lib/monitoring/keyword-monitor-store";

export function useKeywordMonitor() {
  const [state, setState] = useState<KeywordMonitorState>(() => createKeywordMonitorStore().read());

  const addKeyword = (input: { keyword: string; searchType: MonitorSearchType }) => {
    const store = createKeywordMonitorStore();
    const next = store.add(input);
    setState(next);
    return next;
  };

  const removeKeyword = (id: string) => {
    const store = createKeywordMonitorStore();
    const next = store.remove(id);
    setState(next);
    return next;
  };

  const updateCheckResult = (input: {
    id: string;
    checkedAt: string;
    status: Exclude<MonitorCheckStatus, "loading">;
    summary: MonitorResultSummary | null;
    message?: string | null;
  }) => {
    const store = createKeywordMonitorStore();
    const next = store.updateCheckResult(input);
    setState(next);
    return next;
  };

  return {
    state,
    addKeyword,
    removeKeyword,
    updateCheckResult,
  };
}

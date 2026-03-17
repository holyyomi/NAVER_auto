"use client";

import { useState } from "react";
import {
  createSearchWorkbenchStore,
  type SearchCondition,
  type SearchWorkbenchState,
} from "@/lib/search/workbench-store";
import type { SearchResponse } from "@/lib/naver/types";

type SaveSessionInput = {
  result: SearchResponse;
  source?: "naver" | "mock";
  mode?: "real" | "demo";
};

export function useSearchWorkbench() {
  const [state, setState] = useState<SearchWorkbenchState>(() =>
    createSearchWorkbenchStore().read(),
  );

  const refresh = () => {
    const store = createSearchWorkbenchStore();
    setState(store.read());
  };

  const saveRecentSearch = (input: SearchCondition) => {
    const store = createSearchWorkbenchStore();
    const next = store.saveRecentSearch(input);
    setState(next);
    return next;
  };

  const saveFavorite = (input: SearchCondition) => {
    const store = createSearchWorkbenchStore();
    const next = store.saveFavorite(input);
    setState(next);
    return next;
  };

  const removeFavorite = (id: string) => {
    const store = createSearchWorkbenchStore();
    const next = store.removeFavorite(id);
    setState(next);
    return next;
  };

  const clearRecentSearches = () => {
    const store = createSearchWorkbenchStore();
    const next = store.clearRecentSearches();
    setState(next);
    return next;
  };

  const saveResultSession = (input: SaveSessionInput) => {
    const store = createSearchWorkbenchStore();
    const next = store.saveResultSession(input);
    setState(next);
    return next;
  };

  const removeSavedSession = (id: string) => {
    const store = createSearchWorkbenchStore();
    const next = store.removeSavedSession(id);
    setState(next);
    return next;
  };

  return {
    state,
    refresh,
    saveRecentSearch,
    saveFavorite,
    removeFavorite,
    clearRecentSearches,
    saveResultSession,
    removeSavedSession,
  };
}

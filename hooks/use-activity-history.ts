"use client";

import { useState } from "react";
import { createActivityStore } from "@/lib/history/store";
import type {
  ActiveFeatureKey,
  SaveActivityInput,
  SavedActivityRecord,
} from "@/lib/history/types";

export function useActivityHistory(feature?: ActiveFeatureKey) {
  const [records, setRecords] = useState<SavedActivityRecord[]>(() =>
    createActivityStore().list(feature),
  );

  const refresh = () => {
    const store = createActivityStore();
    setRecords(store.list(feature));
  };

  const saveRecord = (input: SaveActivityInput) => {
    const store = createActivityStore();
    const saved = store.save(input);
    setRecords(store.list(feature));
    return saved;
  };

  const removeRecord = (id: string) => {
    const store = createActivityStore();
    store.remove(id);
    setRecords(store.list(feature));
  };

  return {
    records,
    saveRecord,
    removeRecord,
    refresh,
  };
}

"use client";

import { useSyncExternalStore } from "react";
import { createActivityStore, getSavedItemsStorageEventName } from "@/lib/history/store";
import type { SaveItemInput, SavedFeatureType, SavedItemRecord } from "@/lib/history/types";

function subscribe(callback: () => void) {
  const handleChange = () => callback();
  window.addEventListener("storage", handleChange);
  window.addEventListener(getSavedItemsStorageEventName(), handleChange);

  return () => {
    window.removeEventListener("storage", handleChange);
    window.removeEventListener(getSavedItemsStorageEventName(), handleChange);
  };
}

export function useActivityHistory(featureType?: SavedFeatureType) {
  const serializedRecords = useSyncExternalStore(
    subscribe,
    () => JSON.stringify(createActivityStore().list(featureType)),
    () => "[]",
  );
  const records = JSON.parse(serializedRecords) as SavedItemRecord[];

  const saveRecord = (input: SaveItemInput) => {
    const store = createActivityStore();
    return store.save(input);
  };

  const removeRecord = (id: string) => {
    const store = createActivityStore();
    store.remove(id);
  };

  return {
    records,
    saveRecord,
    removeRecord,
    refresh: () => undefined,
  };
}

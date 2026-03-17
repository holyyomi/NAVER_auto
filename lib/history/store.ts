import type {
  ActiveFeatureKey,
  ActivityStore,
  SaveActivityInput,
  SavedActivityRecord,
} from "@/lib/history/types";

const STORAGE_KEY = "naver-auto.activity-history.v1";
const MAX_RECORDS = 30;

function sortRecords(records: SavedActivityRecord[]) {
  return [...records].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}

function readRecords(): SavedActivityRecord[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as SavedActivityRecord[];
    return Array.isArray(parsed) ? sortRecords(parsed) : [];
  } catch {
    return [];
  }
}

function writeRecords(records: SavedActivityRecord[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sortRecords(records).slice(0, MAX_RECORDS)));
}

class LocalActivityStore implements ActivityStore {
  list(feature?: ActiveFeatureKey) {
    const records = readRecords();
    return feature ? records.filter((record) => record.feature === feature) : records;
  }

  save(input: SaveActivityInput) {
    const nextRecord: SavedActivityRecord = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };

    const records = readRecords();
    writeRecords([nextRecord, ...records]);
    return nextRecord;
  }

  remove(id: string) {
    writeRecords(readRecords().filter((record) => record.id !== id));
  }
}

export function createActivityStore(): ActivityStore {
  return new LocalActivityStore();
}

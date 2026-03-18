import {
  getSavedFeatureMeta,
  type SaveItemInput,
  type SavedFeatureType,
  type SavedItemRecord,
  type SaveStore,
} from "@/lib/history/types";

const STORAGE_KEY = "naver-auto.saved-items.v1";
const STORAGE_EVENT = "naver-auto:saved-items-updated";
const MAX_RECORDS = 50;

function isSavedFeatureType(value: unknown): value is SavedFeatureType {
  return (
    value === "keyword-trends" ||
    value === "search-results" ||
    value === "shopping-insights" ||
    value === "local-business-research" ||
    value === "search-ad-report-assist" ||
    value === "ad-operations-assist"
  );
}

function isValidDateString(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function normalizeText(value: string, fallback: string) {
  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized || fallback;
}

function sanitizeFields(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((field) => {
    if (!field || typeof field !== "object") {
      return [];
    }

    const candidate = field as Partial<SavedItemRecord["fields"][number]>;
    if (typeof candidate.label !== "string" || typeof candidate.value !== "string") {
      return [];
    }

    const label = normalizeText(candidate.label, "");
    const fieldValue = normalizeText(candidate.value, "");
    if (!label || !fieldValue) {
      return [];
    }

    return [{ label, value: fieldValue }];
  });
}

function sortRecords(records: SavedItemRecord[]) {
  return [...records].sort(
    (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
  );
}

function normalizeRecord(record: SavedItemRecord): SavedItemRecord {
  const featureMeta = getSavedFeatureMeta(record.featureType);

  return {
    ...record,
    title: normalizeText(record.title, featureMeta.label),
    summary: normalizeText(record.summary, `${featureMeta.label} 저장 항목`),
    fields: sanitizeFields(record.fields),
  };
}

function sanitizeRecord(value: unknown): SavedItemRecord | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<SavedItemRecord>;
  if (
    typeof candidate.id !== "string" ||
    !isSavedFeatureType(candidate.featureType) ||
    typeof candidate.title !== "string" ||
    typeof candidate.summary !== "string" ||
    !isValidDateString(candidate.createdAt) ||
    !isValidDateString(candidate.updatedAt)
  ) {
    return null;
  }

  return normalizeRecord({
    id: candidate.id,
    featureType: candidate.featureType,
    title: candidate.title,
    summary: candidate.summary,
    inputSnapshot: candidate.inputSnapshot ?? null,
    outputSnapshot: candidate.outputSnapshot ?? null,
    createdAt: candidate.createdAt,
    updatedAt: candidate.updatedAt,
    fields: sanitizeFields(candidate.fields),
  });
}

function readRecords(): SavedItemRecord[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return sortRecords(
      parsed.flatMap((item) => {
        const sanitized = sanitizeRecord(item);
        return sanitized ? [sanitized] : [];
      }),
    );
  } catch {
    return [];
  }
}

function dispatchRecordsChanged() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(STORAGE_EVENT));
}

function writeRecords(records: SavedItemRecord[]) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const normalized = sortRecords(records).slice(0, MAX_RECORDS).map(normalizeRecord);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    dispatchRecordsChanged();
  } catch {
    // localStorage may be unavailable; fail safely.
  }
}

class LocalSaveStore implements SaveStore {
  list(featureType?: SavedFeatureType) {
    const records = readRecords();
    return featureType ? records.filter((record) => record.featureType === featureType) : records;
  }

  get(id: string) {
    return readRecords().find((record) => record.id === id) ?? null;
  }

  save(input: SaveItemInput) {
    const now = new Date().toISOString();
    const records = readRecords();
    const existing = input.id ? records.find((record) => record.id === input.id) : null;
    const nextRecord = normalizeRecord({
      id: existing?.id ?? crypto.randomUUID(),
      featureType: input.featureType,
      title: input.title,
      summary: input.summary,
      inputSnapshot: input.inputSnapshot,
      outputSnapshot: input.outputSnapshot,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      fields: input.fields,
    });

    writeRecords([nextRecord, ...records.filter((record) => record.id !== nextRecord.id)]);
    return nextRecord;
  }

  remove(id: string) {
    writeRecords(readRecords().filter((record) => record.id !== id));
  }
}

export function createActivityStore(): SaveStore {
  return new LocalSaveStore();
}

export function getSavedItemsStorageEventName() {
  return STORAGE_EVENT;
}

import { trimRecentRecords } from "@/lib/history/recent-records";
import {
  getSavedFeatureMeta,
  type SaveItemInput,
  type SavedFeatureType,
  type SavedItemRecord,
  type SaveStore,
} from "@/lib/history/types";
import {
  dispatchLocalStorageEvent,
  readLocalStorageJson,
  writeLocalStorageJson,
} from "@/lib/storage/local-storage";

const STORAGE_KEY = "naver-auto.saved-items.v2";
const LEGACY_STORAGE_KEY = "naver-auto.saved-items.v1";
const STORAGE_EVENT = "naver-auto:saved-items-updated";

function isSavedFeatureType(value: unknown): value is SavedFeatureType {
  return (
    value === "search-results" ||
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

function normalizeRecord(record: SavedItemRecord): SavedItemRecord {
  const featureMeta = getSavedFeatureMeta(record.featureType);

  return {
    ...record,
    title: normalizeText(record.title, featureMeta.label),
    summary: normalizeText(record.summary, `${featureMeta.label} 저장 항목`),
    fields: sanitizeFields(record.fields),
  };
}

function sanitizeLegacyFeatureType(value: unknown): SavedFeatureType | null {
  if (value === "search-results") return "search-results";
  if (value === "local-business-research") return "local-business-research";
  if (value === "search-ad-report-assist") return "search-ad-report-assist";
  if (value === "ad-operations-assist") return "ad-operations-assist";
  return null;
}

function sanitizeRecord(value: unknown): SavedItemRecord | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<SavedItemRecord> & {
    featureType?: unknown;
  };
  const featureType = isSavedFeatureType(candidate.featureType)
    ? candidate.featureType
    : sanitizeLegacyFeatureType(candidate.featureType);

  if (
    typeof candidate.id !== "string" ||
    !featureType ||
    typeof candidate.title !== "string" ||
    typeof candidate.summary !== "string" ||
    !isValidDateString(candidate.createdAt) ||
    !isValidDateString(candidate.updatedAt)
  ) {
    return null;
  }

  return normalizeRecord({
    id: candidate.id,
    featureType,
    title: candidate.title,
    summary: candidate.summary,
    inputSnapshot: candidate.inputSnapshot ?? null,
    outputSnapshot: candidate.outputSnapshot ?? null,
    createdAt: candidate.createdAt,
    updatedAt: candidate.updatedAt,
    fields: sanitizeFields(candidate.fields),
  });
}

function readRawRecords(): SavedItemRecord[] {
  const current = readLocalStorageJson<unknown[]>(STORAGE_KEY, []);
  if (Array.isArray(current) && current.length > 0) {
    return current.flatMap((item) => {
      const sanitized = sanitizeRecord(item);
      return sanitized ? [sanitized] : [];
    });
  }

  const legacy = readLocalStorageJson<unknown[]>(LEGACY_STORAGE_KEY, []);
  if (!Array.isArray(legacy)) {
    return [];
  }

  return legacy.flatMap((item) => {
    const sanitized = sanitizeRecord(item);
    return sanitized ? [sanitized] : [];
  });
}

function readRecords(): SavedItemRecord[] {
  return trimRecentRecords(readRawRecords()).map(normalizeRecord);
}

function writeRecords(records: SavedItemRecord[]) {
  const normalized = trimRecentRecords(records).map(normalizeRecord);
  const didWrite = writeLocalStorageJson(STORAGE_KEY, normalized);

  if (didWrite) {
    dispatchLocalStorageEvent(STORAGE_EVENT);
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

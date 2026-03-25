import {
  dispatchLocalStorageEvent,
  readLocalStorageJson,
  writeLocalStorageJson,
} from "@/lib/storage/local-storage";
import type { SearchResponse } from "@/lib/naver/types";

export type MonitorSearchType = "blog" | "news" | "shopping";

export type MonitorCheckStatus =
  | "idle"
  | "loading"
  | "success"
  | "empty"
  | "quota"
  | "error";

export type MonitorHealthStatus = "normal" | "changed" | "needs-review";

export type MonitorResultSummary = {
  total: number;
  topTitle?: string;
  topSource?: string;
  topLink?: string;
  visibleKeys: string[];
};

export type MonitoredKeywordRecord = {
  id: string;
  keyword: string;
  searchType: MonitorSearchType;
  createdAt: string;
  latestCheckedAt: string | null;
  previousCheckedAt: string | null;
  lastStatus: MonitorCheckStatus;
  latestSummary: MonitorResultSummary | null;
  previousSummary: MonitorResultSummary | null;
  healthStatus: MonitorHealthStatus;
  changeSummary: string;
  lastMessage: string | null;
};

export type KeywordMonitorState = {
  version: 3;
  records: MonitoredKeywordRecord[];
};

type KeywordMonitorStore = {
  read: () => KeywordMonitorState;
  add: (input: { keyword: string; searchType: MonitorSearchType }) => KeywordMonitorState;
  remove: (id: string) => KeywordMonitorState;
  updateCheckResult: (input: {
    id: string;
    checkedAt: string;
    status: Exclude<MonitorCheckStatus, "loading">;
    summary: MonitorResultSummary | null;
    message?: string | null;
  }) => KeywordMonitorState;
};

const STORAGE_KEY = "naver-auto.keyword-monitor.v3";
const STORAGE_EVENT = "naver-auto.keyword-monitor.updated";
const MAX_RECORDS = 5;

const emptyState: KeywordMonitorState = {
  version: 3,
  records: [],
};

function normalizeKeyword(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function isSearchType(value: unknown): value is MonitorSearchType {
  return value === "blog" || value === "news" || value === "shopping";
}

function sortRecords(records: MonitoredKeywordRecord[]) {
  return [...records].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}

function buildVisibleKey(title?: string, source?: string) {
  return `${(title ?? "").trim().toLowerCase()}::${(source ?? "").trim().toLowerCase()}`;
}

function sanitizeSummary(value: unknown): MonitorResultSummary | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<MonitorResultSummary>;
  if (typeof candidate.total !== "number") {
    return null;
  }

  const visibleKeys = Array.isArray(candidate.visibleKeys)
    ? candidate.visibleKeys.filter((item): item is string => typeof item === "string").slice(0, 10)
    : [];

  return {
    total: candidate.total,
    topTitle: typeof candidate.topTitle === "string" ? candidate.topTitle : undefined,
    topSource: typeof candidate.topSource === "string" ? candidate.topSource : undefined,
    topLink: typeof candidate.topLink === "string" ? candidate.topLink : undefined,
    visibleKeys,
  };
}

function countPresenceChanges(
  latestSummary: MonitorResultSummary | null,
  previousSummary: MonitorResultSummary | null,
) {
  if (!latestSummary || !previousSummary) {
    return {
      appearedCount: 0,
      disappearedCount: 0,
      previousTopStillVisible: false,
    };
  }

  const currentSet = new Set(latestSummary.visibleKeys);
  const previousSet = new Set(previousSummary.visibleKeys);

  const appearedCount = latestSummary.visibleKeys.filter((key) => !previousSet.has(key)).length;
  const disappearedCount = previousSummary.visibleKeys.filter((key) => !currentSet.has(key)).length;
  const previousTopStillVisible =
    previousSummary.visibleKeys.length > 0 ? currentSet.has(previousSummary.visibleKeys[0]) : false;

  return {
    appearedCount,
    disappearedCount,
    previousTopStillVisible,
  };
}

function buildHealthStatus(
  status: Exclude<MonitorCheckStatus, "loading" | "idle">,
  latestSummary: MonitorResultSummary | null,
  previousSummary: MonitorResultSummary | null,
) {
  if (status === "quota" || status === "error") {
    return "needs-review" as const;
  }

  if (status === "empty") {
    return previousSummary ? ("changed" as const) : ("needs-review" as const);
  }

  if (!latestSummary) {
    return "needs-review" as const;
  }

  if (!previousSummary) {
    return "normal" as const;
  }

  const { appearedCount, disappearedCount, previousTopStillVisible } = countPresenceChanges(
    latestSummary,
    previousSummary,
  );

  if (appearedCount > 0 || disappearedCount > 0 || !previousTopStillVisible) {
    return "changed" as const;
  }

  return "normal" as const;
}

function buildChangeSummary(
  status: Exclude<MonitorCheckStatus, "loading" | "idle">,
  latestSummary: MonitorResultSummary | null,
  previousSummary: MonitorResultSummary | null,
  message?: string | null,
) {
  if (status === "quota" || status === "error") {
    return message ?? "조회 중 문제가 있어 다시 확인이 필요합니다.";
  }

  if (status === "empty") {
    if (previousSummary) {
      return "이전 저장본 대비 현재 노출이 줄었습니다.";
    }

    return "현재 조회 결과가 없어 비교 기준이 아직 없습니다.";
  }

  if (!latestSummary) {
    return "현재 비교 결과가 없습니다.";
  }

  if (!previousSummary) {
    return `첫 저장본입니다. 현재 노출 결과 ${latestSummary.total}건을 기준으로 저장했습니다.`;
  }

  const { appearedCount, disappearedCount, previousTopStillVisible } = countPresenceChanges(
    latestSummary,
    previousSummary,
  );

  if (appearedCount === 0 && disappearedCount === 0 && previousTopStillVisible) {
    return "이전 저장본 대비 노출 유지";
  }

  if (disappearedCount > appearedCount) {
    return "이전 저장본 대비 노출 감소";
  }

  return "이전 저장본 대비 일부 결과 변화";
}

function sanitizeRecord(value: unknown): MonitoredKeywordRecord | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<MonitoredKeywordRecord>;
  if (
    typeof candidate.id !== "string" ||
    typeof candidate.keyword !== "string" ||
    !isSearchType(candidate.searchType) ||
    typeof candidate.createdAt !== "string"
  ) {
    return null;
  }

  const keyword = normalizeKeyword(candidate.keyword);
  if (!keyword) {
    return null;
  }

  const latestSummary = sanitizeSummary(candidate.latestSummary);
  const previousSummary = sanitizeSummary(candidate.previousSummary);
  const lastStatus =
    candidate.lastStatus === "success" ||
    candidate.lastStatus === "empty" ||
    candidate.lastStatus === "quota" ||
    candidate.lastStatus === "error"
      ? candidate.lastStatus
      : "idle";

  return {
    id: candidate.id,
    keyword,
    searchType: candidate.searchType,
    createdAt: candidate.createdAt,
    latestCheckedAt: typeof candidate.latestCheckedAt === "string" ? candidate.latestCheckedAt : null,
    previousCheckedAt:
      typeof candidate.previousCheckedAt === "string" ? candidate.previousCheckedAt : null,
    lastStatus,
    latestSummary,
    previousSummary,
    healthStatus:
      candidate.healthStatus === "normal" ||
      candidate.healthStatus === "changed" ||
      candidate.healthStatus === "needs-review"
        ? candidate.healthStatus
        : lastStatus === "idle"
          ? "needs-review"
          : buildHealthStatus(lastStatus, latestSummary, previousSummary),
    changeSummary:
      typeof candidate.changeSummary === "string"
        ? candidate.changeSummary
        : lastStatus === "idle"
          ? "아직 저장한 비교 결과가 없습니다."
          : buildChangeSummary(
              lastStatus,
              latestSummary,
              previousSummary,
              typeof candidate.lastMessage === "string" ? candidate.lastMessage : null,
            ),
    lastMessage: typeof candidate.lastMessage === "string" ? candidate.lastMessage : null,
  };
}

function sanitizeState(value: unknown): KeywordMonitorState {
  if (!value || typeof value !== "object") {
    return emptyState;
  }

  const candidate = value as Partial<KeywordMonitorState>;
  const records = Array.isArray(candidate.records)
    ? candidate.records.flatMap((item) => {
        const sanitized = sanitizeRecord(item);
        return sanitized ? [sanitized] : [];
      })
    : [];

  return {
    version: 3,
    records: sortRecords(records).slice(0, MAX_RECORDS),
  };
}

function readState() {
  return readLocalStorageJson(STORAGE_KEY, emptyState, sanitizeState);
}

function writeState(state: KeywordMonitorState) {
  writeLocalStorageJson(STORAGE_KEY, state);
  dispatchLocalStorageEvent(STORAGE_EVENT);
}

function getDuplicateKey(input: { keyword: string; searchType: MonitorSearchType }) {
  return `${normalizeKeyword(input.keyword).toLowerCase()}::${input.searchType}`;
}

export function getKeywordMonitorStorageEventName() {
  return STORAGE_EVENT;
}

export function toMonitorSummary(data: SearchResponse): MonitorResultSummary {
  const first = data.items[0];
  return {
    total: data.total,
    topTitle: first?.title,
    topSource: first?.source,
    topLink: first?.link,
    visibleKeys: data.items.slice(0, 10).map((item) => buildVisibleKey(item.title, item.source)),
  };
}

class LocalKeywordMonitorStore implements KeywordMonitorStore {
  read() {
    return readState();
  }

  add(input: { keyword: string; searchType: MonitorSearchType }) {
    const keyword = normalizeKeyword(input.keyword);
    if (!keyword) {
      return this.read();
    }

    const current = this.read();
    const duplicateKey = getDuplicateKey({ keyword, searchType: input.searchType });
    const exists = current.records.some((record) => getDuplicateKey(record) === duplicateKey);
    if (exists) {
      return current;
    }

    const nextState: KeywordMonitorState = {
      version: 3,
      records: sortRecords([
        {
          id: crypto.randomUUID(),
          keyword,
          searchType: input.searchType,
          createdAt: new Date().toISOString(),
          latestCheckedAt: null,
          previousCheckedAt: null,
          lastStatus: "idle",
          latestSummary: null,
          previousSummary: null,
          healthStatus: "needs-review",
          changeSummary: "아직 저장한 비교 결과가 없습니다.",
          lastMessage: null,
        },
        ...current.records,
      ]).slice(0, MAX_RECORDS),
    };

    writeState(nextState);
    return nextState;
  }

  remove(id: string) {
    const current = this.read();
    const nextState: KeywordMonitorState = {
      version: 3,
      records: current.records.filter((record) => record.id !== id),
    };

    writeState(nextState);
    return nextState;
  }

  updateCheckResult(input: {
    id: string;
    checkedAt: string;
    status: Exclude<MonitorCheckStatus, "loading">;
    summary: MonitorResultSummary | null;
    message?: string | null;
  }) {
    const current = this.read();
    const nextState: KeywordMonitorState = {
      version: 3,
      records: current.records.map((record) => {
        if (record.id !== input.id) {
          return record;
        }

        const latestSummary = input.summary;
        const previousSummary = record.latestSummary;
        const healthStatus =
          input.status === "idle"
            ? record.healthStatus
            : buildHealthStatus(input.status, latestSummary, previousSummary);

        return {
          ...record,
          previousCheckedAt: record.latestCheckedAt,
          latestCheckedAt: input.checkedAt,
          lastStatus: input.status,
          previousSummary,
          latestSummary,
          healthStatus,
          changeSummary:
            input.status === "idle"
              ? record.changeSummary
              : buildChangeSummary(input.status, latestSummary, previousSummary, input.message),
          lastMessage: input.message ?? null,
        };
      }),
    };

    writeState(nextState);
    return nextState;
  }
}

export function createKeywordMonitorStore(): KeywordMonitorStore {
  return new LocalKeywordMonitorStore();
}

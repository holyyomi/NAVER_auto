import type { SearchResponse } from "@/lib/naver/types";

export type MonitorSearchType = "blog" | "news" | "shopping";

export type MonitorCheckStatus =
  | "idle"
  | "loading"
  | "success"
  | "empty"
  | "quota"
  | "error";

export type MonitorResultSummary = {
  total: number;
  topTitle?: string;
  topSource?: string;
  topLink?: string;
};

export type MonitoredKeywordRecord = {
  id: string;
  keyword: string;
  searchType: MonitorSearchType;
  createdAt: string;
  lastCheckedAt: string | null;
  lastStatus: MonitorCheckStatus;
  latestSummary: MonitorResultSummary | null;
  lastMessage: string | null;
};

export type KeywordMonitorState = {
  version: 1;
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

const STORAGE_KEY = "naver-auto.keyword-monitor.v1";
const MAX_RECORDS = 30;

const emptyState: KeywordMonitorState = {
  version: 1,
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

function sanitizeSummary(value: unknown): MonitorResultSummary | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<MonitorResultSummary>;
  if (typeof candidate.total !== "number") {
    return null;
  }

  return {
    total: candidate.total,
    topTitle: typeof candidate.topTitle === "string" ? candidate.topTitle : undefined,
    topSource: typeof candidate.topSource === "string" ? candidate.topSource : undefined,
    topLink: typeof candidate.topLink === "string" ? candidate.topLink : undefined,
  };
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

  return {
    id: candidate.id,
    keyword,
    searchType: candidate.searchType,
    createdAt: candidate.createdAt,
    lastCheckedAt: typeof candidate.lastCheckedAt === "string" ? candidate.lastCheckedAt : null,
    lastStatus:
      candidate.lastStatus === "success" ||
      candidate.lastStatus === "empty" ||
      candidate.lastStatus === "quota" ||
      candidate.lastStatus === "error"
        ? candidate.lastStatus
        : "idle",
    latestSummary: sanitizeSummary(candidate.latestSummary),
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
    version: 1,
    records: sortRecords(records).slice(0, MAX_RECORDS),
  };
}

function readState() {
  if (typeof window === "undefined") {
    return emptyState;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return emptyState;
    }

    return sanitizeState(JSON.parse(raw));
  } catch {
    return emptyState;
  }
}

function writeState(state: KeywordMonitorState) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage may be unavailable; fail safely.
  }
}

function getDuplicateKey(input: { keyword: string; searchType: MonitorSearchType }) {
  return `${normalizeKeyword(input.keyword).toLocaleLowerCase()}::${input.searchType}`;
}

export function toMonitorSummary(data: SearchResponse): MonitorResultSummary {
  const first = data.items[0];
  return {
    total: data.total,
    topTitle: first?.title,
    topSource: first?.source,
    topLink: first?.link,
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
      version: 1,
      records: sortRecords([
        {
          id: crypto.randomUUID(),
          keyword,
          searchType: input.searchType,
          createdAt: new Date().toISOString(),
          lastCheckedAt: null,
          lastStatus: "idle",
          latestSummary: null,
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
      version: 1,
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
      version: 1,
      records: current.records.map((record) =>
        record.id === input.id
          ? {
              ...record,
              lastCheckedAt: input.checkedAt,
              lastStatus: input.status,
              latestSummary: input.summary,
              lastMessage: input.message ?? null,
            }
          : record,
      ),
    };

    writeState(nextState);
    return nextState;
  }
}

export function createKeywordMonitorStore(): KeywordMonitorStore {
  return new LocalKeywordMonitorStore();
}

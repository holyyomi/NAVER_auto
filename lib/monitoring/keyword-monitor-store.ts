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
  version: 2;
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

const STORAGE_KEY = "naver-auto.keyword-monitor.v2";
const LEGACY_STORAGE_KEY = "naver-auto.keyword-monitor.v1";
const MAX_RECORDS = 30;

const emptyState: KeywordMonitorState = {
  version: 2,
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

function hasTopResultChanged(
  latestSummary: MonitorResultSummary | null,
  previousSummary: MonitorResultSummary | null,
) {
  if (!latestSummary || !previousSummary) {
    return false;
  }

  return (
    latestSummary.topTitle !== previousSummary.topTitle ||
    latestSummary.topSource !== previousSummary.topSource
  );
}

function hasCountChanged(
  latestSummary: MonitorResultSummary | null,
  previousSummary: MonitorResultSummary | null,
) {
  if (!latestSummary || !previousSummary) {
    return false;
  }

  return latestSummary.total !== previousSummary.total;
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

  if (hasCountChanged(latestSummary, previousSummary) || hasTopResultChanged(latestSummary, previousSummary)) {
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
    return message ?? "확인 중 오류가 발생해 다시 점검이 필요합니다.";
  }

  if (status === "empty") {
    if (previousSummary) {
      return `이전 확인에는 ${previousSummary.total}건이 있었지만 이번에는 결과가 보이지 않습니다.`;
    }

    return "이번 확인에서는 결과가 없어 기준 스냅샷을 만들지 못했습니다.";
  }

  if (!latestSummary) {
    return "비교할 최신 스냅샷을 만들지 못했습니다.";
  }

  if (!previousSummary) {
    return `첫 확인 기준으로 결과 ${latestSummary.total}건을 저장했습니다. 다음 확인부터 변화 비교가 가능합니다.`;
  }

  const details: string[] = [];
  const countDiff = latestSummary.total - previousSummary.total;

  if (countDiff > 0) {
    details.push(`결과 수가 ${countDiff}건 증가했습니다.`);
  } else if (countDiff < 0) {
    details.push(`결과 수가 ${Math.abs(countDiff)}건 감소했습니다.`);
  }

  if (hasTopResultChanged(latestSummary, previousSummary)) {
    details.push("상위 노출 결과가 변경되었습니다.");
  }

  if (details.length === 0) {
    return "이전 확인 대비 큰 변화가 없습니다.";
  }

  return details.join(" ");
}

function sanitizeRecord(value: unknown): MonitoredKeywordRecord | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<MonitoredKeywordRecord> & {
    lastCheckedAt?: string | null;
  };

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

  const latestCheckedAt =
    typeof candidate.latestCheckedAt === "string"
      ? candidate.latestCheckedAt
      : typeof candidate.lastCheckedAt === "string"
        ? candidate.lastCheckedAt
        : null;

  return {
    id: candidate.id,
    keyword,
    searchType: candidate.searchType,
    createdAt: candidate.createdAt,
    latestCheckedAt,
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
          ? "아직 확인 이력이 없습니다. 첫 확인을 실행하면 비교 기준이 생성됩니다."
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
    version: 2,
    records: sortRecords(records).slice(0, MAX_RECORDS),
  };
}

function readState() {
  if (typeof window === "undefined") {
    return emptyState;
  }

  try {
    const raw =
      window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_STORAGE_KEY);
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
      version: 2,
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
          changeSummary: "아직 확인 이력이 없습니다. 첫 확인을 실행하면 비교 기준이 생성됩니다.",
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
      version: 2,
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
      version: 2,
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

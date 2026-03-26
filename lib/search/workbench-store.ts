import type { NaverRuntimeMode, SearchItem, SearchResponse } from "@/lib/naver/types";
import {
  sanitizeDisplayText,
  sanitizeOptionalDisplayText,
} from "@/lib/text/display-text";

export type SearchType = "blog" | "news" | "shopping";

export type SearchCondition = {
  keyword: string;
  searchType: SearchType;
};

export type RecentSearchRecord = SearchCondition & {
  id: string;
  timestamp: string;
};

export type FavoriteSearchRecord = SearchCondition & {
  id: string;
  createdAt: string;
};

export type SavedResultSnapshot = {
  keyword: string;
  searchType: SearchType;
  total: number;
  items: SearchItem[];
  source?: "naver" | "mock";
  mode?: NaverRuntimeMode;
};

export type SavedResultSessionRecord = {
  id: string;
  keyword: string;
  searchType: SearchType;
  savedAt: string;
  resultCount: number;
  snapshot: SavedResultSnapshot;
};

export type SearchWorkbenchState = {
  version: 1;
  recentSearches: RecentSearchRecord[];
  favorites: FavoriteSearchRecord[];
  savedSessions: SavedResultSessionRecord[];
};

type SaveSessionInput = {
  result: SearchResponse;
  source?: "naver" | "mock";
  mode?: NaverRuntimeMode;
};

type SearchWorkbenchStore = {
  read: () => SearchWorkbenchState;
  saveRecentSearch: (input: SearchCondition) => SearchWorkbenchState;
  saveFavorite: (input: SearchCondition) => SearchWorkbenchState;
  removeFavorite: (id: string) => SearchWorkbenchState;
  clearRecentSearches: () => SearchWorkbenchState;
  saveResultSession: (input: SaveSessionInput) => SearchWorkbenchState;
  removeSavedSession: (id: string) => SearchWorkbenchState;
};

const STORAGE_KEY = "naver-auto.search-workbench.v1";
const MAX_RECENT_SEARCHES = 10;
const MAX_FAVORITES = 12;
const MAX_SAVED_SESSIONS = 20;

const emptyState: SearchWorkbenchState = {
  version: 1,
  recentSearches: [],
  favorites: [],
  savedSessions: [],
};

function isSearchType(value: unknown): value is SearchType {
  return value === "blog" || value === "news" || value === "shopping";
}

function normalizeKeyword(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeCondition(input: SearchCondition): SearchCondition | null {
  const keyword = sanitizeDisplayText(normalizeKeyword(input.keyword), "");
  if (!keyword || !isSearchType(input.searchType)) {
    return null;
  }

  return {
    keyword,
    searchType: input.searchType,
  };
}

function getConditionKey(input: SearchCondition) {
  return `${normalizeKeyword(input.keyword).toLocaleLowerCase()}::${input.searchType}`;
}

function sortByDate<T extends { timestamp?: string; createdAt?: string; savedAt?: string }>(items: T[]) {
  return [...items].sort((left, right) => {
    const leftValue = left.timestamp ?? left.createdAt ?? left.savedAt ?? new Date(0).toISOString();
    const rightValue =
      right.timestamp ?? right.createdAt ?? right.savedAt ?? new Date(0).toISOString();

    return new Date(rightValue).getTime() - new Date(leftValue).getTime();
  });
}

function sanitizeRecentSearches(value: unknown): RecentSearchRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return sortByDate(
    value.flatMap((item) => {
      if (!item || typeof item !== "object") {
        return [];
      }

      const candidate = item as Partial<RecentSearchRecord>;
      if (typeof candidate.keyword !== "string" || !isSearchType(candidate.searchType)) {
        return [];
      }

      const keyword = normalizeKeyword(candidate.keyword);
      if (!keyword) {
        return [];
      }

      return [
        {
          id:
            typeof candidate.id === "string" && candidate.id.length > 0
              ? candidate.id
              : crypto.randomUUID(),
          keyword,
          searchType: candidate.searchType,
          timestamp:
            typeof candidate.timestamp === "string" && !Number.isNaN(Date.parse(candidate.timestamp))
              ? candidate.timestamp
              : new Date(0).toISOString(),
        },
      ];
    }),
  ).slice(0, MAX_RECENT_SEARCHES);
}

function sanitizeFavorites(value: unknown): FavoriteSearchRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return sortByDate(
    value.flatMap((item) => {
      if (!item || typeof item !== "object") {
        return [];
      }

      const candidate = item as Partial<FavoriteSearchRecord>;
      if (typeof candidate.keyword !== "string" || !isSearchType(candidate.searchType)) {
        return [];
      }

      const keyword = normalizeKeyword(candidate.keyword);
      if (!keyword) {
        return [];
      }

      return [
        {
          id:
            typeof candidate.id === "string" && candidate.id.length > 0
              ? candidate.id
              : crypto.randomUUID(),
          keyword,
          searchType: candidate.searchType,
          createdAt:
            typeof candidate.createdAt === "string" && !Number.isNaN(Date.parse(candidate.createdAt))
              ? candidate.createdAt
              : new Date(0).toISOString(),
        },
      ];
    }),
  ).slice(0, MAX_FAVORITES);
}

function sanitizeSearchItem(value: unknown): SearchItem | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<SearchItem>;
  if (
    typeof candidate.title !== "string" ||
    typeof candidate.link !== "string" ||
    typeof candidate.description !== "string" ||
    !isSearchType(candidate.type)
  ) {
    return null;
  }

  return {
    title: sanitizeDisplayText(candidate.title),
    link: candidate.link,
    description: sanitizeDisplayText(candidate.description),
    type: candidate.type,
    source: sanitizeOptionalDisplayText(candidate.source),
    publishedAt: sanitizeOptionalDisplayText(candidate.publishedAt),
  };
}

function sanitizeSnapshot(value: unknown): SavedResultSnapshot | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<SavedResultSnapshot>;
  if (
    typeof candidate.keyword !== "string" ||
    !isSearchType(candidate.searchType) ||
    typeof candidate.total !== "number" ||
    !Array.isArray(candidate.items)
  ) {
    return null;
  }

  const keyword = sanitizeDisplayText(normalizeKeyword(candidate.keyword), "");
  if (!keyword) {
    return null;
  }

  return {
    keyword,
    searchType: candidate.searchType,
    total: candidate.total,
    items: candidate.items.flatMap((item) => {
      const sanitized = sanitizeSearchItem(item);
      return sanitized ? [sanitized] : [];
    }),
    source: candidate.source === "naver" || candidate.source === "mock" ? candidate.source : undefined,
    mode: candidate.mode === "real" || candidate.mode === "demo" ? candidate.mode : undefined,
  };
}

function sanitizeSavedSessions(value: unknown): SavedResultSessionRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return sortByDate(
    value.flatMap((item) => {
      if (!item || typeof item !== "object") {
        return [];
      }

      const candidate = item as Partial<SavedResultSessionRecord>;
      const snapshot = sanitizeSnapshot(candidate.snapshot);
      if (!snapshot) {
        return [];
      }

      return [
        {
          id:
            typeof candidate.id === "string" && candidate.id.length > 0
              ? candidate.id
              : crypto.randomUUID(),
          keyword: snapshot.keyword,
          searchType: snapshot.searchType,
          savedAt:
            typeof candidate.savedAt === "string" && !Number.isNaN(Date.parse(candidate.savedAt))
              ? candidate.savedAt
              : new Date(0).toISOString(),
          resultCount:
            typeof candidate.resultCount === "number" && candidate.resultCount >= 0
              ? candidate.resultCount
              : snapshot.total,
          snapshot,
        },
      ];
    }),
  ).slice(0, MAX_SAVED_SESSIONS);
}

function sanitizeState(value: unknown): SearchWorkbenchState {
  if (!value || typeof value !== "object") {
    return emptyState;
  }

  const candidate = value as Partial<SearchWorkbenchState>;
  return {
    version: 1,
    recentSearches: sanitizeRecentSearches(candidate.recentSearches),
    favorites: sanitizeFavorites(candidate.favorites),
    savedSessions: sanitizeSavedSessions(candidate.savedSessions),
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

function writeState(state: SearchWorkbenchState) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage may be unavailable; fail safely.
  }
}

class LocalSearchWorkbenchStore implements SearchWorkbenchStore {
  read() {
    return readState();
  }

  saveRecentSearch(input: SearchCondition) {
    const condition = normalizeCondition(input);
    if (!condition) {
      return this.read();
    }

    const current = this.read();
    const nextState: SearchWorkbenchState = {
      ...current,
      recentSearches: sortByDate([
        {
          id: crypto.randomUUID(),
          ...condition,
          timestamp: new Date().toISOString(),
        },
        ...current.recentSearches.filter((item) => getConditionKey(item) !== getConditionKey(condition)),
      ]).slice(0, MAX_RECENT_SEARCHES),
    };

    writeState(nextState);
    return nextState;
  }

  saveFavorite(input: SearchCondition) {
    const condition = normalizeCondition(input);
    if (!condition) {
      return this.read();
    }

    const current = this.read();
    const exists = current.favorites.some(
      (item) => getConditionKey(item) === getConditionKey(condition),
    );
    if (exists) {
      return current;
    }

    const nextState: SearchWorkbenchState = {
      ...current,
      favorites: sortByDate([
        {
          id: crypto.randomUUID(),
          ...condition,
          createdAt: new Date().toISOString(),
        },
        ...current.favorites,
      ]).slice(0, MAX_FAVORITES),
    };

    writeState(nextState);
    return nextState;
  }

  removeFavorite(id: string) {
    const current = this.read();
    const nextState: SearchWorkbenchState = {
      ...current,
      favorites: current.favorites.filter((item) => item.id !== id),
    };

    writeState(nextState);
    return nextState;
  }

  clearRecentSearches() {
    const current = this.read();
    const nextState: SearchWorkbenchState = {
      ...current,
      recentSearches: [],
    };

    writeState(nextState);
    return nextState;
  }

  saveResultSession(input: SaveSessionInput) {
    const condition = normalizeCondition(input.result);
    if (!condition) {
      return this.read();
    }

    const current = this.read();
    const snapshot: SavedResultSnapshot = {
      keyword: input.result.keyword,
      searchType: input.result.searchType,
      total: input.result.total,
      items: input.result.items,
      source: input.source,
      mode: input.mode,
    };

    const nextState: SearchWorkbenchState = {
      ...current,
      savedSessions: sortByDate([
        {
          id: crypto.randomUUID(),
          keyword: snapshot.keyword,
          searchType: snapshot.searchType,
          savedAt: new Date().toISOString(),
          resultCount: snapshot.total,
          snapshot,
        },
        ...current.savedSessions.filter((item) => getConditionKey(item) !== getConditionKey(condition)),
      ]).slice(0, MAX_SAVED_SESSIONS),
    };

    writeState(nextState);
    return nextState;
  }

  removeSavedSession(id: string) {
    const current = this.read();
    const nextState: SearchWorkbenchState = {
      ...current,
      savedSessions: current.savedSessions.filter((item) => item.id !== id),
    };

    writeState(nextState);
    return nextState;
  }
}

export function createSearchWorkbenchStore(): SearchWorkbenchStore {
  return new LocalSearchWorkbenchStore();
}

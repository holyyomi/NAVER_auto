"use client";

import { useState, useTransition } from "react";
import { ActiveFeatureLayout } from "@/components/features/active-feature-layout";
import { FeatureShell } from "@/components/features/feature-shell";
import { ResultPanel } from "@/components/features/result-panel";
import { ResultSummaryGrid } from "@/components/features/result-summary-grid";
import { EmptyState, ErrorState } from "@/components/features/shared-states";
import { HistoryPanel } from "@/components/history/history-panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { useActivityHistory } from "@/hooks/use-activity-history";
import type { SavedActivityRecord } from "@/lib/history/types";
import type { ApiResult, SearchItem, SearchResponse } from "@/lib/naver/types";

const SEARCH_FORM_KEY = "naver-auto.search-form.v1";
const RECENT_SEARCH_KEY = "naver-auto.recent-searches.v1";

type SearchForm = {
  keyword: string;
  searchType: "blog" | "news" | "shopping";
};

type RecentSearchItem = SearchForm & {
  id: string;
  updatedAt: string;
};

const initialForm: SearchForm = {
  keyword: "마케팅 자동화",
  searchType: "blog",
};

function getTypeLabel(type: "blog" | "news" | "shopping") {
  if (type === "blog") return "블로그";
  if (type === "news") return "뉴스";
  return "쇼핑";
}

function getTypeTone(type: "blog" | "news" | "shopping") {
  if (type === "news") return "attention" as const;
  if (type === "shopping") return "neutral" as const;
  return "active" as const;
}

function normalizeText(value?: string) {
  return value && value.trim().length > 0 ? value : "-";
}

function readSearchForm(): SearchForm {
  if (typeof window === "undefined") {
    return initialForm;
  }

  try {
    const raw = window.localStorage.getItem(SEARCH_FORM_KEY);
    if (!raw) {
      return initialForm;
    }

    const parsed = JSON.parse(raw) as Partial<SearchForm>;
    if (
      typeof parsed.keyword === "string" &&
      (parsed.searchType === "blog" || parsed.searchType === "news" || parsed.searchType === "shopping")
    ) {
      return {
        keyword: parsed.keyword,
        searchType: parsed.searchType,
      };
    }
  } catch {
    return initialForm;
  }

  return initialForm;
}

function writeSearchForm(form: SearchForm) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(SEARCH_FORM_KEY, JSON.stringify(form));
}

function readRecentSearches(): RecentSearchItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(RECENT_SEARCH_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as RecentSearchItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRecentSearches(items: RecentSearchItem[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(items.slice(0, 8)));
}

function upsertRecentSearch(form: SearchForm) {
  const nextItem: RecentSearchItem = {
    ...form,
    id: `${form.keyword}-${form.searchType}`,
    updatedAt: new Date().toISOString(),
  };

  const nextItems = [
    nextItem,
    ...readRecentSearches().filter(
      (item) => !(item.keyword === form.keyword && item.searchType === form.searchType),
    ),
  ];

  writeRecentSearches(nextItems);
  return nextItems.slice(0, 8);
}

type UtilityButtonProps = {
  label: string;
  active?: boolean;
  onClick: () => void;
};

function UtilityButton({ label, active = false, onClick }: UtilityButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex h-8 items-center justify-center rounded-lg border px-3 text-xs font-medium transition",
        active
          ? "border-[var(--line-strong)] bg-[var(--bg-soft)] text-[var(--text-strong)]"
          : "border-[var(--line)] bg-[rgba(255,255,255,0.02)] text-[var(--text-body)] hover:border-[var(--line-strong)] hover:bg-[rgba(255,255,255,0.05)]",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

type SearchResultCardProps = {
  item: SearchItem;
  copiedKey: string | null;
  onCopy: (key: string, value: string) => void;
};

function SearchResultCard({ item, copiedKey, onCopy }: SearchResultCardProps) {
  const [expanded, setExpanded] = useState(false);
  const itemKey = `${item.link}-${item.title}`;
  const summary = item.description || "요약 없음";
  const isLong = summary.length > 140;

  return (
    <article className="rounded-2xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-5 py-5 transition hover:border-[var(--line-strong)] hover:bg-white/[0.03]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={getTypeTone(item.type)}>{getTypeLabel(item.type)}</StatusBadge>
            <span className="rounded-md border border-[var(--line)] px-2 py-1 text-[11px] text-[var(--text-dim)]">
              {normalizeText(item.source)}
            </span>
            <span className="rounded-md border border-[var(--line)] px-2 py-1 text-[11px] text-[var(--text-dim)]">
              {normalizeText(item.publishedAt)}
            </span>
          </div>

          <h3 className="mt-4 text-[16px] font-semibold leading-7 text-[var(--text-strong)]">
            {item.title}
          </h3>

          <div className="mt-3 rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-dim)]">요약</p>
            <p
              className={[
                "mt-2 text-sm leading-6 text-[var(--text-body)]",
                expanded ? "" : "line-clamp-3",
              ].join(" ")}
            >
              {summary}
            </p>
            {isLong ? (
              <button
                type="button"
                onClick={() => setExpanded((current) => !current)}
                className="mt-2 text-xs font-medium text-[var(--text-muted)] transition hover:text-[var(--text-strong)]"
              >
                {expanded ? "접기" : "더 보기"}
              </button>
            ) : null}
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-3 py-2">
              <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--text-dim)]">출처</p>
              <p className="mt-1 text-sm text-[var(--text-body)]">{normalizeText(item.source)}</p>
            </div>
            <div className="rounded-lg border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-3 py-2">
              <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--text-dim)]">유형</p>
              <p className="mt-1 text-sm text-[var(--text-body)]">{getTypeLabel(item.type)}</p>
            </div>
            <div className="rounded-lg border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-3 py-2">
              <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--text-dim)]">날짜</p>
              <p className="mt-1 text-sm text-[var(--text-body)]">{normalizeText(item.publishedAt)}</p>
            </div>
          </div>

          <p className="mt-4 truncate text-xs text-[var(--text-dim)]">{item.link}</p>
        </div>

        <div className="flex shrink-0 flex-row flex-wrap gap-2 xl:w-[170px] xl:flex-col xl:items-stretch">
          <UtilityButton
            active={copiedKey === `${itemKey}-title`}
            label={copiedKey === `${itemKey}-title` ? "제목 복사됨" : "제목 복사"}
            onClick={() => onCopy(`${itemKey}-title`, item.title)}
          />
          <UtilityButton
            active={copiedKey === `${itemKey}-summary`}
            label={copiedKey === `${itemKey}-summary` ? "요약 복사됨" : "요약 복사"}
            onClick={() => onCopy(`${itemKey}-summary`, summary)}
          />
          <a
            href={item.link}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 items-center justify-center rounded-lg border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-3 text-xs font-medium text-[var(--text-body)] transition hover:border-[var(--line-strong)] hover:bg-[rgba(255,255,255,0.05)] hover:text-[var(--text-strong)]"
          >
            링크 열기
          </a>
        </div>
      </div>
    </article>
  );
}

export function SearchResultsPanel() {
  const [form, setForm] = useState<SearchForm>(() => readSearchForm());
  const [recentSearches, setRecentSearches] = useState<RecentSearchItem[]>(() => readRecentSearches());
  const [result, setResult] = useState<ApiResult<SearchResponse> | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { records, saveRecord, removeRecord } = useActivityHistory("search-results-hub");

  const updateForm = (updater: (current: SearchForm) => SearchForm) => {
    setForm((current) => {
      const next = updater(current);
      writeSearchForm(next);
      return next;
    });
  };

  const submit = (override?: SearchForm) => {
    const nextForm = override ?? form;

    writeSearchForm(nextForm);
    if (override) {
      setForm(nextForm);
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(nextForm),
        });

        const data = (await response.json()) as ApiResult<SearchResponse>;
        setResult(data);

        if (data.ok) {
          setRecentSearches(upsertRecentSearch(nextForm));
        }
      } catch {
        setResult({
          ok: false,
          error: "결과를 불러오지 못했습니다.",
        });
      }
    });
  };

  const handleCopy = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      window.setTimeout(() => {
        setCopiedKey((current) => (current === key ? null : current));
      }, 1600);
    } catch {
      setCopiedKey(null);
    }
  };

  const handleSave = () => {
    if (!result?.ok) {
      return;
    }

    saveRecord({
      feature: "search-results-hub",
      featureLabel: "검색 결과 모음",
      title: form.keyword,
      description: `${getTypeLabel(form.searchType)} 결과 ${result.data.items.length}건 저장`,
      route: "/features/search-results-hub",
      fields: [
        { label: "유형", value: getTypeLabel(form.searchType) },
        { label: "결과", value: `${result.data.items.length}건` },
        { label: "출처", value: result.meta?.source ?? "-" },
      ],
      input: form,
      snapshot: result,
    });

    setSaveMessage("저장됨");
    window.setTimeout(() => setSaveMessage(null), 1600);
  };

  const applySavedResult = (record: SavedActivityRecord) => {
    const nextForm = record.input as SearchForm;
    setForm(nextForm);
    writeSearchForm(nextForm);
    setResult(record.snapshot as ApiResult<SearchResponse>);
  };

  return (
    <FeatureShell
      title="검색 결과 모음"
      description="검색하고 비교하고 필요한 결과를 저장합니다."
      source={result?.ok ? result.meta?.source ?? null : null}
    >
      <ActiveFeatureLayout
        controls={
          <div className="space-y-5">
            <div className="rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-4 py-4">
              <p className="text-sm font-medium text-[var(--text-strong)]">검색</p>
              <div className="mt-4 space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[var(--text-body)]">
                    검색어
                  </span>
                  <input
                    value={form.keyword}
                    onChange={(event) =>
                      updateForm((current) => ({ ...current, keyword: event.target.value }))
                    }
                    className="w-full rounded-lg border border-[var(--line)] bg-[var(--bg-elevated)] px-3 py-2.5 text-sm text-[var(--text-strong)] outline-none transition focus:border-[var(--line-strong)]"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[var(--text-body)]">유형</span>
                  <select
                    value={form.searchType}
                    onChange={(event) =>
                      updateForm((current) => ({
                        ...current,
                        searchType: event.target.value as "blog" | "news" | "shopping",
                      }))
                    }
                    className="w-full rounded-lg border border-[var(--line)] bg-[var(--bg-elevated)] px-3 py-2.5 text-sm text-[var(--text-strong)] outline-none transition focus:border-[var(--line-strong)]"
                  >
                    <option value="blog">블로그</option>
                    <option value="news">뉴스</option>
                    <option value="shopping">쇼핑</option>
                  </select>
                </label>
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                  <button
                    type="button"
                    onClick={() => submit()}
                    disabled={isPending}
                    className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--bg-soft)] text-sm font-medium text-[var(--text-strong)] transition hover:border-[var(--line-strong)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isPending ? "조회 중..." : "조회"}
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={!result?.ok}
                    className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-[var(--line)] bg-transparent text-sm font-medium text-[var(--text-body)] transition hover:border-[var(--line-strong)] hover:text-[var(--text-strong)] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {saveMessage ?? "현재 결과 저장"}
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-[var(--text-strong)]">최근 검색</p>
                <span className="text-xs text-[var(--text-dim)]">{recentSearches.length}개</span>
              </div>
              {recentSearches.length === 0 ? (
                <p className="mt-3 text-sm text-[var(--text-dim)]">조회한 검색이 여기에 쌓입니다.</p>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  {recentSearches.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        submit({
                          keyword: item.keyword,
                          searchType: item.searchType,
                        })
                      }
                      className="inline-flex items-center rounded-lg border border-[var(--line)] bg-[var(--bg-elevated)] px-3 py-2 text-xs text-[var(--text-body)] transition hover:border-[var(--line-strong)] hover:text-[var(--text-strong)]"
                    >
                      {item.keyword} · {getTypeLabel(item.searchType)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <HistoryPanel
              title="저장 결과"
              description="다시 볼 결과"
              records={records.slice(0, 5)}
              emptyTitle="저장 없음"
              emptyDescription="필요한 결과를 저장해 두세요."
              onApply={applySavedResult}
              onRemove={removeRecord}
            />
          </div>
        }
      >
        {!result ? (
          <EmptyState
            title="검색어를 입력하세요"
            description="조회 후 결과를 비교하고 저장할 수 있습니다."
          />
        ) : !result.ok ? (
          <ErrorState
            title={result.error}
            description="검색어 또는 유형을 바꿔 다시 조회하세요."
          />
        ) : result.data.items.length === 0 ? (
          <EmptyState
            title="결과가 없습니다"
            description="검색어를 바꾸거나 다른 유형으로 조회하세요."
          />
        ) : (
          <div className="space-y-4">
            <ResultSummaryGrid>
              <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-dim)]">
                  검색어
                </p>
                <p className="mt-2 text-base font-semibold text-[var(--text-strong)]">
                  {result.data.keyword}
                </p>
              </div>
              <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-dim)]">
                  유형
                </p>
                <p className="mt-2 text-base font-semibold text-[var(--text-strong)]">
                  {getTypeLabel(result.data.searchType)}
                </p>
              </div>
              <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-dim)]">
                  결과 수
                </p>
                <p className="mt-2 text-base font-semibold text-[var(--text-strong)]">
                  {result.data.total}건
                </p>
              </div>
            </ResultSummaryGrid>

            <ResultPanel
              title={`${result.data.keyword} 결과`}
              description={`${getTypeLabel(result.data.searchType)} · ${result.data.total}건`}
              aside={<StatusBadge tone="neutral">리서치</StatusBadge>}
            >
              <div className="space-y-3">
                {result.data.items.map((item) => (
                  <SearchResultCard
                    key={`${item.link}-${item.title}`}
                    item={item}
                    copiedKey={copiedKey}
                    onCopy={handleCopy}
                  />
                ))}
              </div>
            </ResultPanel>
          </div>
        )}
      </ActiveFeatureLayout>
    </FeatureShell>
  );
}

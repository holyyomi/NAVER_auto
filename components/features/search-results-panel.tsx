"use client";

import { useMemo, useState, useTransition } from "react";
import { ActiveFeatureLayout } from "@/components/features/active-feature-layout";
import { FeatureShell } from "@/components/features/feature-shell";
import { ResultPanel } from "@/components/features/result-panel";
import { ResultSummaryGrid } from "@/components/features/result-summary-grid";
import { EmptyState, ErrorState } from "@/components/features/shared-states";
import { StatusBadge } from "@/components/ui/status-badge";
import { useActivityHistory } from "@/hooks/use-activity-history";
import { useSearchWorkbench } from "@/hooks/use-search-workbench";
import type { SavedActivityRecord } from "@/lib/history/types";
import type { ApiResult, SearchItem, SearchResponse } from "@/lib/naver/types";
import type {
  FavoriteSearchRecord,
  RecentSearchRecord,
  SavedResultSessionRecord,
  SearchCondition,
  SearchType,
} from "@/lib/search/workbench-store";

type SearchForm = SearchCondition;

const initialForm: SearchForm = {
  keyword: "마케팅 자동화",
  searchType: "blog",
};

const presetSearches: Array<{ label: string; condition: SearchForm }> = [
  { label: "브랜드 반응", condition: { keyword: "네이버 광고", searchType: "news" } },
  { label: "경쟁사 동향", condition: { keyword: "쿠팡 광고", searchType: "blog" } },
  { label: "구매 관심", condition: { keyword: "스마트스토어 마케팅", searchType: "shopping" } },
];

function getTypeLabel(type: SearchType) {
  if (type === "blog") return "블로그";
  if (type === "news") return "뉴스";
  return "쇼핑";
}

function getTypeTone(type: SearchType) {
  if (type === "news") return "attention" as const;
  if (type === "shopping") return "neutral" as const;
  return "active" as const;
}

function normalizeText(value?: string) {
  return value && value.trim().length > 0 ? value : "-";
}

function normalizeKeyword(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function isQuotaExceededMessage(message: string) {
  return message.includes("호출 한도");
}

function getStatusState(result: ApiResult<SearchResponse> | null) {
  if (!result) return "idle" as const;
  if (result.ok) return "success" as const;
  if (isQuotaExceededMessage(result.error)) return "quota" as const;
  return "error" as const;
}

function escapeCsvValue(value: string) {
  const normalized = value.replace(/\r?\n/g, " ").replace(/"/g, '""');
  return `"${normalized}"`;
}

function formatTimestamp(timestamp: string) {
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(parsed);
}

function formatFileTimestamp() {
  const now = new Date();
  const parts = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
  ];

  return parts.join("");
}

function buildResultsText(result: SearchResponse) {
  return [
    `검색어: ${result.keyword}`,
    `유형: ${getTypeLabel(result.searchType)}`,
    `결과 수: ${result.total}건`,
    "",
    ...result.items.flatMap((item, index) => [
      `${index + 1}. ${item.title}`,
      `요약: ${normalizeText(item.description)}`,
      `출처: ${normalizeText(item.source)}`,
      `날짜: ${normalizeText(item.publishedAt)}`,
      `링크: ${item.link}`,
      "",
    ]),
  ].join("\n");
}

function buildCsvContent(result: SearchResponse) {
  const header = ["검색어", "유형", "순번", "제목", "요약", "출처", "날짜", "링크"];
  const rows = result.items.map((item, index) => [
    result.keyword,
    getTypeLabel(result.searchType),
    String(index + 1),
    item.title,
    item.description ?? "",
    item.source ?? "",
    item.publishedAt ?? "",
    item.link,
  ]);

  return [header, ...rows]
    .map((row) => row.map((value) => escapeCsvValue(value)).join(","))
    .join("\r\n");
}

function StatusBanner({ result }: { result: ApiResult<SearchResponse> | null }) {
  const state = getStatusState(result);

  if (!result) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-4 py-3">
        <p className="text-sm font-medium text-[var(--text-strong)]">조회 전</p>
        <p className="mt-1 text-sm text-[var(--text-body)]">검색어를 입력하고 조회하세요.</p>
      </div>
    );
  }

  if (state === "success" && result.ok) {
    return (
      <div className="rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-[var(--text-strong)]">
              {result.data.keyword} 결과 {result.data.total}건
            </p>
            <p className="mt-1 text-sm text-[var(--text-body)]">
              {getTypeLabel(result.data.searchType)} 기준 조회
            </p>
          </div>
          <StatusBadge tone="active">정상</StatusBadge>
        </div>
      </div>
    );
  }

  if (state === "quota") {
    return (
      <div className="rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-[var(--text-strong)]">오늘 호출 한도 초과</p>
            <p className="mt-1 text-sm text-[var(--text-body)]">내일 다시 시도해 주세요.</p>
          </div>
          <StatusBadge tone="attention">한도 초과</StatusBadge>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[var(--text-strong)]">
            {!result.ok ? result.error : "상태를 확인해 주세요."}
          </p>
          <p className="mt-1 text-sm text-[var(--text-body)]">
            검색어 또는 유형을 바꿔 다시 조회하세요.
          </p>
        </div>
        <StatusBadge tone="attention">확인 필요</StatusBadge>
      </div>
    </div>
  );
}

function UtilityButton({
  label,
  active = false,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
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

function SearchResultCard({
  item,
  copiedKey,
  onCopy,
}: {
  item: SearchItem;
  copiedKey: string | null;
  onCopy: (key: string, value: string) => void;
}) {
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
            <p className="text-[11px] tracking-[0.12em] text-[var(--text-dim)]">요약</p>
            <p
              className={[
                "mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[var(--text-body)]",
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
              <p className="text-[11px] tracking-[0.12em] text-[var(--text-dim)]">출처</p>
              <p className="mt-1 text-sm text-[var(--text-body)]">{normalizeText(item.source)}</p>
            </div>
            <div className="rounded-lg border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-3 py-2">
              <p className="text-[11px] tracking-[0.12em] text-[var(--text-dim)]">유형</p>
              <p className="mt-1 text-sm text-[var(--text-body)]">{getTypeLabel(item.type)}</p>
            </div>
            <div className="rounded-lg border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-3 py-2">
              <p className="text-[11px] tracking-[0.12em] text-[var(--text-dim)]">날짜</p>
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

function SearchConditionButton({
  label,
  meta,
  onClick,
  trailing,
}: {
  label: string;
  meta: string;
  onClick: () => void;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onClick}
        className="flex min-w-0 flex-1 items-center justify-between rounded-lg border border-[var(--line)] bg-[var(--bg-elevated)] px-3 py-3 text-left transition hover:border-[var(--line-strong)] hover:bg-white/[0.04]"
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-[var(--text-strong)]">{label}</p>
          <p className="mt-1 text-xs text-[var(--text-dim)]">{meta}</p>
        </div>
      </button>
      {trailing}
    </div>
  );
}

function FavoriteItem({
  item,
  onSelect,
  onRemove,
}: {
  item: FavoriteSearchRecord;
  onSelect: (condition: SearchForm) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <SearchConditionButton
      label={item.keyword}
      meta={`${getTypeLabel(item.searchType)} · ${formatTimestamp(item.createdAt)}`}
      onClick={() => onSelect({ keyword: item.keyword, searchType: item.searchType })}
      trailing={
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg border border-[var(--line)] px-3 text-xs text-[var(--text-dim)] transition hover:border-[var(--line-strong)] hover:text-[var(--text-strong)]"
        >
          삭제
        </button>
      }
    />
  );
}

function RecentSearchItem({
  item,
  onSelect,
}: {
  item: RecentSearchRecord;
  onSelect: (condition: SearchForm) => void;
}) {
  return (
    <SearchConditionButton
      label={item.keyword}
      meta={`${getTypeLabel(item.searchType)} · ${formatTimestamp(item.timestamp)}`}
      onClick={() => onSelect({ keyword: item.keyword, searchType: item.searchType })}
    />
  );
}

function SavedSessionItem({
  item,
  onApply,
  onRemove,
}: {
  item: SavedResultSessionRecord;
  onApply: (item: SavedResultSessionRecord) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <SearchConditionButton
      label={item.keyword}
      meta={`${getTypeLabel(item.searchType)} · ${item.resultCount}건 · ${formatTimestamp(item.savedAt)}`}
      onClick={() => onApply(item)}
      trailing={
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg border border-[var(--line)] px-3 text-xs text-[var(--text-dim)] transition hover:border-[var(--line-strong)] hover:text-[var(--text-strong)]"
        >
          삭제
        </button>
      }
    />
  );
}

function SideSection({
  title,
  count,
  action,
  children,
}: {
  title: string;
  count?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-[var(--text-strong)]">{title}</p>
          {count ? <span className="text-xs text-[var(--text-dim)]">{count}</span> : null}
        </div>
        {action}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export function SearchResultsPanel() {
  const [form, setForm] = useState<SearchForm>(initialForm);
  const [result, setResult] = useState<ApiResult<SearchResponse> | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [favoriteMessage, setFavoriteMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { saveRecord } = useActivityHistory("search-results-hub");
  const {
    state: workbenchState,
    saveRecentSearch,
    saveFavorite,
    removeFavorite,
    clearRecentSearches,
    saveResultSession,
    removeSavedSession,
  } = useSearchWorkbench();

  const isFavorite = useMemo(() => {
    const keyword = normalizeKeyword(form.keyword).toLocaleLowerCase();
    return workbenchState.favorites.some(
      (item) =>
        normalizeKeyword(item.keyword).toLocaleLowerCase() === keyword &&
        item.searchType === form.searchType,
    );
  }, [form, workbenchState.favorites]);

  const canUseResultActions = result?.ok && result.data.items.length > 0;

  const showActionMessage = (message: string) => {
    setActionMessage(message);
    window.setTimeout(() => setActionMessage(null), 1800);
  };

  const submit = (override?: SearchForm) => {
    const nextForm = override ?? form;
    const normalizedForm = {
      keyword: normalizeKeyword(nextForm.keyword),
      searchType: nextForm.searchType,
    };

    if (normalizedForm.keyword.length === 0) {
      return;
    }

    setForm(normalizedForm);

    startTransition(async () => {
      try {
        const response = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(normalizedForm),
        });

        const data = (await response.json()) as ApiResult<SearchResponse>;
        setResult(data);

        if (data.ok) {
          saveRecentSearch(normalizedForm);
        }
      } catch {
        setResult({
          ok: false,
          error: "결과를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
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

  const handleCopyAll = async () => {
    if (!result?.ok || result.data.items.length === 0) {
      return;
    }

    try {
      await navigator.clipboard.writeText(buildResultsText(result.data));
      showActionMessage("결과 전체를 복사했습니다.");
    } catch {
      showActionMessage("복사하지 못했습니다. 다시 시도해 주세요.");
    }
  };

  const handleExportCsv = () => {
    if (!result?.ok || result.data.items.length === 0) {
      return;
    }

    try {
      const csv = `\uFEFF${buildCsvContent(result.data)}`;
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const safeKeyword = normalizeKeyword(result.data.keyword).replace(/[\\/:*?"<>| ]+/g, "-");
      link.href = url;
      link.download = `search-results-${safeKeyword}-${formatFileTimestamp()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showActionMessage("CSV를 내려받았습니다.");
    } catch {
      showActionMessage("CSV를 만들지 못했습니다. 다시 시도해 주세요.");
    }
  };

  const handleFavoriteSave = () => {
    if (normalizeKeyword(form.keyword).length === 0 || isFavorite) {
      return;
    }

    saveFavorite({
      keyword: form.keyword,
      searchType: form.searchType,
    });

    setFavoriteMessage("추가됨");
    window.setTimeout(() => setFavoriteMessage(null), 1600);
  };

  const handleSave = () => {
    if (!result?.ok || result.data.items.length === 0) {
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

    saveResultSession({
      result: result.data,
      source: result.meta?.source,
      mode: result.meta?.mode,
    });

    showActionMessage("현재 결과를 저장했습니다.");
  };

  const applyCondition = (condition: SearchForm, rerun = false) => {
    const normalizedCondition = {
      keyword: normalizeKeyword(condition.keyword),
      searchType: condition.searchType,
    };

    setForm(normalizedCondition);

    if (rerun) {
      submit(normalizedCondition);
    }
  };

  const applySavedResult = (record: SavedResultSessionRecord | SavedActivityRecord) => {
    if ("snapshot" in record && "savedAt" in record) {
      const snapshot = record.snapshot;
      setForm({
        keyword: snapshot.keyword,
        searchType: snapshot.searchType,
      });
      setResult({
        ok: true,
        data: {
          keyword: snapshot.keyword,
          searchType: snapshot.searchType,
          total: snapshot.total,
          items: snapshot.items,
        },
        meta:
          snapshot.source || snapshot.mode
            ? {
                source: snapshot.source ?? "naver",
                mode: snapshot.mode ?? "real",
              }
            : undefined,
      });
      return;
    }

    const nextForm = record.input as SearchForm;
    setForm(nextForm);
    setResult(record.snapshot as ApiResult<SearchResponse>);
  };

  return (
    <FeatureShell
      title="검색 결과 모음"
      description="검색 결과를 비교하고 필요한 결과를 다시 씁니다."
      source={result?.ok ? result.meta?.source ?? null : null}
    >
      <ActiveFeatureLayout
        controls={
          <div className="space-y-5">
            <SideSection title="검색">
              <div className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[var(--text-body)]">
                    검색어
                  </span>
                  <input
                    value={form.keyword}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, keyword: event.target.value }))
                    }
                    disabled={isPending}
                    className="w-full rounded-lg border border-[var(--line)] bg-[var(--bg-elevated)] px-3 py-2.5 text-sm text-[var(--text-strong)] outline-none transition focus:border-[var(--line-strong)] disabled:opacity-70"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[var(--text-body)]">
                    유형
                  </span>
                  <select
                    value={form.searchType}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        searchType: event.target.value as SearchType,
                      }))
                    }
                    disabled={isPending}
                    className="w-full rounded-lg border border-[var(--line)] bg-[var(--bg-elevated)] px-3 py-2.5 text-sm text-[var(--text-strong)] outline-none transition focus:border-[var(--line-strong)] disabled:opacity-70"
                  >
                    <option value="blog">블로그</option>
                    <option value="news">뉴스</option>
                    <option value="shopping">쇼핑</option>
                  </select>
                </label>

                <div className="grid gap-2">
                  <button
                    type="button"
                    onClick={() => submit()}
                    disabled={isPending || normalizeKeyword(form.keyword).length === 0}
                    className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--bg-soft)] text-sm font-medium text-[var(--text-strong)] transition hover:border-[var(--line-strong)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isPending ? "조회 중..." : "조회"}
                  </button>
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                    <button
                      type="button"
                      onClick={handleFavoriteSave}
                      disabled={normalizeKeyword(form.keyword).length === 0 || isFavorite}
                      className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-[var(--line)] bg-transparent text-sm font-medium text-[var(--text-body)] transition hover:border-[var(--line-strong)] hover:text-[var(--text-strong)] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {favoriteMessage ?? (isFavorite ? "즐겨찾기됨" : "즐겨찾기 추가")}
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={!canUseResultActions}
                      className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-[var(--line)] bg-transparent text-sm font-medium text-[var(--text-body)] transition hover:border-[var(--line-strong)] hover:text-[var(--text-strong)] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      현재 결과 저장
                    </button>
                  </div>
                </div>
              </div>
            </SideSection>

            <SideSection title="빠른 검색" count={`${presetSearches.length}개`}>
              <div className="flex flex-wrap gap-2">
                {presetSearches.map((preset) => (
                  <button
                    key={`${preset.label}-${preset.condition.keyword}`}
                    type="button"
                    onClick={() => applyCondition(preset.condition, false)}
                    className="inline-flex items-center rounded-lg border border-[var(--line)] bg-[var(--bg-elevated)] px-3 py-2 text-xs text-[var(--text-body)] transition hover:border-[var(--line-strong)] hover:text-[var(--text-strong)]"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </SideSection>

            <SideSection title="즐겨찾기" count={`${workbenchState.favorites.length}개`}>
              {workbenchState.favorites.length === 0 ? (
                <p className="text-sm text-[var(--text-dim)]">자주 쓰는 검색 조건을 저장해 두세요.</p>
              ) : (
                <div className="space-y-2">
                  {workbenchState.favorites.map((item) => (
                    <FavoriteItem
                      key={item.id}
                      item={item}
                      onSelect={(condition) => applyCondition(condition, false)}
                      onRemove={removeFavorite}
                    />
                  ))}
                </div>
              )}
            </SideSection>

            <SideSection
              title="최근 검색"
              count={`${workbenchState.recentSearches.length}개`}
              action={
                workbenchState.recentSearches.length > 0 ? (
                  <button
                    type="button"
                    onClick={clearRecentSearches}
                    className="text-xs text-[var(--text-dim)] transition hover:text-[var(--text-strong)]"
                  >
                    전체 삭제
                  </button>
                ) : null
              }
            >
              {workbenchState.recentSearches.length === 0 ? (
                <p className="text-sm text-[var(--text-dim)]">최근 검색이 없습니다.</p>
              ) : (
                <div className="space-y-2">
                  {workbenchState.recentSearches.map((item) => (
                    <RecentSearchItem
                      key={item.id}
                      item={item}
                      onSelect={(condition) => applyCondition(condition, true)}
                    />
                  ))}
                </div>
              )}
            </SideSection>

            <SideSection title="저장 결과" count={`${workbenchState.savedSessions.length}개`}>
              {workbenchState.savedSessions.length === 0 ? (
                <p className="text-sm text-[var(--text-dim)]">저장한 결과가 없습니다.</p>
              ) : (
                <div className="space-y-2">
                  {workbenchState.savedSessions.slice(0, 5).map((item) => (
                    <SavedSessionItem
                      key={item.id}
                      item={item}
                      onApply={applySavedResult}
                      onRemove={removeSavedSession}
                    />
                  ))}
                </div>
              )}
            </SideSection>
          </div>
        }
      >
        <div className="space-y-4">
          <StatusBanner result={result} />

          {isPending ? (
            <ResultPanel
              title="검색 결과"
              description="조회 중"
              aside={<StatusBadge tone="attention">조회 중</StatusBadge>}
            >
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={`loading-${index}`}
                    className="loading-shimmer rounded-2xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-5 py-5"
                  >
                    <div className="h-4 w-28 rounded bg-white/8" />
                    <div className="mt-4 h-6 w-3/4 rounded bg-white/8" />
                    <div className="mt-4 h-4 w-full rounded bg-white/8" />
                    <div className="mt-2 h-4 w-5/6 rounded bg-white/8" />
                    <div className="mt-4 h-10 rounded-xl bg-white/8" />
                  </div>
                ))}
              </div>
            </ResultPanel>
          ) : !result ? (
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
            <>
              <ResultSummaryGrid>
                <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-4">
                  <p className="text-[11px] tracking-[0.14em] text-[var(--text-dim)]">검색어</p>
                  <p className="mt-2 text-base font-semibold text-[var(--text-strong)]">
                    {result.data.keyword}
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-4">
                  <p className="text-[11px] tracking-[0.14em] text-[var(--text-dim)]">유형</p>
                  <p className="mt-2 text-base font-semibold text-[var(--text-strong)]">
                    {getTypeLabel(result.data.searchType)}
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-4">
                  <p className="text-[11px] tracking-[0.14em] text-[var(--text-dim)]">결과 수</p>
                  <p className="mt-2 text-base font-semibold text-[var(--text-strong)]">
                    {result.data.total}건
                  </p>
                </div>
              </ResultSummaryGrid>

              <ResultPanel
                title={`${result.data.keyword} 결과`}
                description={`${getTypeLabel(result.data.searchType)} 기준 ${result.data.total}건`}
                aside={
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {actionMessage ? (
                      <span className="text-xs text-[var(--text-dim)]">{actionMessage}</span>
                    ) : null}
                    <UtilityButton label="결과 전체 복사" onClick={handleCopyAll} />
                    <UtilityButton label="CSV 내보내기" onClick={handleExportCsv} />
                    <StatusBadge tone="neutral">리서치</StatusBadge>
                  </div>
                }
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
            </>
          )}
        </div>
      </ActiveFeatureLayout>
    </FeatureShell>
  );
}

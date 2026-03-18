"use client";

import { useMemo, useState, useTransition } from "react";
import { ActiveFeatureLayout } from "@/components/features/active-feature-layout";
import { FeatureShell } from "@/components/features/feature-shell";
import { ResultPanel } from "@/components/features/result-panel";
import { ResultSummaryGrid } from "@/components/features/result-summary-grid";
import { EmptyState, ErrorState } from "@/components/features/shared-states";
import { HistoryPanel } from "@/components/history/history-panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { useActivityHistory } from "@/hooks/use-activity-history";
import { useOpenSavedItem } from "@/hooks/use-open-saved-item";
import type { ApiResult, SearchItem, SearchResponse } from "@/lib/naver/types";
import type { SearchType } from "@/lib/search/workbench-store";

type SearchForm = {
  keyword: string;
  searchType: SearchType;
};

type ResearchSummary = {
  repeatedThemes: string[];
  sourceMix: string;
  typeMix: string;
  usefulness: string;
};

const initialForm: SearchForm = {
  keyword: "마케팅 자동화",
  searchType: "blog",
};

const presetSearches: Array<{ label: string; condition: SearchForm }> = [
  { label: "브랜드 반응", condition: { keyword: "네이버 광고", searchType: "news" } },
  { label: "콘텐츠 사례", condition: { keyword: "병원 마케팅", searchType: "blog" } },
  { label: "쇼핑 경쟁", condition: { keyword: "스마트스토어 광고", searchType: "shopping" } },
];

const stopWords = new Set([
  "그리고",
  "대한",
  "위한",
  "에서",
  "으로",
  "하는",
  "있는",
  "관련",
  "최신",
  "정리",
  "분석",
  "마케팅",
  "광고",
]);

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

function normalizeKeyword(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeText(value?: string) {
  return value && value.trim().length > 0 ? value : "-";
}

function extractTokens(text: string) {
  return text
    .toLowerCase()
    .replace(/<[^>]+>/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2 && !stopWords.has(token));
}

function buildResearchSummary(result: SearchResponse): ResearchSummary {
  const tokenCounts = new Map<string, number>();
  const sourceCounts = new Map<string, number>();
  const typeCounts = new Map<string, number>();

  for (const item of result.items) {
    for (const token of extractTokens(`${item.title} ${item.description}`)) {
      tokenCounts.set(token, (tokenCounts.get(token) ?? 0) + 1);
    }

    const source = normalizeText(item.source);
    sourceCounts.set(source, (sourceCounts.get(source) ?? 0) + 1);

    const typeLabel = getTypeLabel(item.type);
    typeCounts.set(typeLabel, (typeCounts.get(typeLabel) ?? 0) + 1);
  }

  const repeatedThemes = [...tokenCounts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([token, count]) => `${token} ${count}건`);

  const topSources = [...sourceCounts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([source, count]) => `${source} ${count}건`)
    .join(" · ");

  const typeMix = [...typeCounts.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([type, count]) => `${type} ${count}건`)
    .join(" · ");

  const hasNews = result.items.some((item) => item.type === "news");
  const hasBlog = result.items.some((item) => item.type === "blog");
  const hasShopping = result.items.some((item) => item.type === "shopping");
  const uniqueSources = sourceCounts.size;

  let usefulness = "일반 참고용 결과가 중심입니다.";
  if (hasNews && uniqueSources >= 3) {
    usefulness = "제안서와 경쟁 PT용 시장 반응 근거로 활용하기 좋습니다.";
  } else if (hasBlog && uniqueSources >= 2) {
    usefulness = "콘텐츠 톤앤매너와 레퍼런스 수집용으로 활용도가 높습니다.";
  } else if (hasShopping) {
    usefulness = "상품/커머스 키워드 조사와 경쟁 노출 확인에 적합합니다.";
  }

  return {
    repeatedThemes:
      repeatedThemes.length > 0 ? repeatedThemes : ["반복 키워드가 뚜렷하지 않습니다."],
    sourceMix: topSources || "출처 구성이 제한적입니다.",
    typeMix: typeMix || `${getTypeLabel(result.searchType)} 중심`,
    usefulness,
  };
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
      `유형: ${getTypeLabel(item.type)}`,
      `날짜: ${normalizeText(item.publishedAt)}`,
      `링크: ${item.link}`,
      "",
    ]),
  ].join("\n");
}

function escapeCsvValue(value: string) {
  return `"${value.replace(/\r?\n/g, " ").replace(/"/g, '""')}"`;
}

function buildCsvContent(result: SearchResponse) {
  const rows = [
    ["검색어", "유형", "번호", "제목", "요약", "출처", "결과유형", "날짜", "링크"],
    ...result.items.map((item, index) => [
      result.keyword,
      getTypeLabel(result.searchType),
      String(index + 1),
      item.title,
      item.description ?? "",
      item.source ?? "",
      getTypeLabel(item.type),
      item.publishedAt ?? "",
      item.link,
    ]),
  ];

  return rows.map((row) => row.map((value) => escapeCsvValue(value)).join(",")).join("\r\n");
}

function formatFileTimestamp() {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
  ].join("");
}

function UtilityButton({
  label,
  onClick,
  disabled = false,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-8 items-center justify-center rounded-lg border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-3 text-xs font-medium text-[var(--text-body)] transition hover:border-[var(--line-strong)] hover:text-[var(--text-strong)] disabled:opacity-40"
    >
      {label}
    </button>
  );
}

export function SearchResultsPanel() {
  const [form, setForm] = useState<SearchForm>(initialForm);
  const [result, setResult] = useState<ApiResult<SearchResponse> | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { records, saveRecord, removeRecord } = useActivityHistory("search-results");

  const researchSummary = useMemo(
    () => (result?.ok ? buildResearchSummary(result.data) : null),
    [result],
  );

  const submit = (override?: SearchForm) => {
    const nextForm = override ?? form;
    const keyword = normalizeKeyword(nextForm.keyword);
    if (!keyword) {
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            keyword,
            searchType: nextForm.searchType,
          }),
        });

        const data = (await response.json()) as ApiResult<SearchResponse>;
        setForm({ keyword, searchType: nextForm.searchType });
        setResult(data);
      } catch {
        setResult({
          ok: false,
          error: "검색 결과를 불러오지 못했습니다. 잠시 후 다시 시도하세요.",
        });
      }
    });
  };

  const flashAction = (message: string) => {
    setActionMessage(message);
    window.setTimeout(() => setActionMessage(null), 1600);
  };

  const copyText = async (value: string, message: string) => {
    try {
      await navigator.clipboard.writeText(value);
      flashAction(message);
    } catch {
      flashAction("복사에 실패했습니다.");
    }
  };

  const exportCsv = () => {
    if (!result?.ok || result.data.items.length === 0) {
      return;
    }

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
    flashAction("CSV를 저장했습니다.");
  };

  const saveCurrentResult = () => {
    if (!result?.ok || result.data.items.length === 0) {
      return;
    }

    saveRecord({
      featureType: "search-results",
      title: form.keyword,
      summary: `${getTypeLabel(form.searchType)} 결과 ${result.data.items.length}건을 저장했습니다.`,
      fields: [
        { label: "유형", value: getTypeLabel(form.searchType) },
        { label: "결과", value: `${result.data.items.length}건` },
        { label: "소스", value: result.meta?.source ?? "-" },
      ],
      inputSnapshot: form,
      outputSnapshot: result,
    });

    setSaveMessage("저장 완료");
    window.setTimeout(() => setSaveMessage(null), 1600);
  };

  const saveSingleItem = (item: SearchItem) => {
    saveRecord({
      featureType: "search-results",
      title: item.title,
      summary: `${normalizeText(item.source)} 출처의 ${getTypeLabel(item.type)} 결과를 저장했습니다.`,
      fields: [
        { label: "검색어", value: form.keyword },
        { label: "출처", value: normalizeText(item.source) },
        { label: "유형", value: getTypeLabel(item.type) },
      ],
      inputSnapshot: {
        ...form,
        focusLink: item.link,
      },
      outputSnapshot: {
        ok: true,
        data: {
          keyword: form.keyword,
          searchType: form.searchType,
          total: 1,
          items: [item],
        },
        meta: result && result.ok ? result.meta : undefined,
      } satisfies ApiResult<SearchResponse>,
    });

    flashAction("선택 결과를 저장했습니다.");
  };

  const applySaved = (record: (typeof records)[number]) => {
    setForm(record.inputSnapshot as SearchForm);
    setResult(record.outputSnapshot as ApiResult<SearchResponse>);
  };

  useOpenSavedItem("search-results", applySaved);

  return (
    <FeatureShell
      title="검색 결과 모음"
      description="SA/DA 실무자가 키워드, 콘텐츠, 경쟁사 레퍼런스를 빠르게 모으고 저장하는 리서치 허브입니다."
      source={result?.ok ? result.meta?.source ?? null : null}
    >
      <ActiveFeatureLayout
        controls={
          <div className="space-y-6">
            <div className="rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-4 py-4">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-[var(--text-strong)]">리서치 검색</p>
                  <p className="mt-1 text-xs text-[var(--text-dim)]">
                    제안서 근거, 콘텐츠 사례, 경쟁사 조사에 필요한 검색 결과를 빠르게 정리합니다.
                  </p>
                </div>

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
                    className="w-full rounded-lg border border-[var(--line)] bg-[var(--bg-elevated)] px-3 py-2.5 text-sm text-[var(--text-strong)] outline-none transition focus:border-[var(--line-strong)]"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[var(--text-body)]">
                    조사 유형
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
                    className="w-full rounded-lg border border-[var(--line)] bg-[var(--bg-elevated)] px-3 py-2.5 text-sm text-[var(--text-strong)] outline-none transition focus:border-[var(--line-strong)]"
                  >
                    <option value="blog">블로그</option>
                    <option value="news">뉴스</option>
                    <option value="shopping">쇼핑</option>
                  </select>
                </label>

                <div className="flex flex-wrap gap-2">
                  {presetSearches.map((preset) => (
                    <button
                      key={`${preset.label}-${preset.condition.keyword}`}
                      type="button"
                      onClick={() => {
                        setForm(preset.condition);
                        submit(preset.condition);
                      }}
                      className="inline-flex items-center rounded-lg border border-[var(--line)] bg-[var(--bg-elevated)] px-3 py-2 text-xs text-[var(--text-body)] transition hover:border-[var(--line-strong)] hover:text-[var(--text-strong)]"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <div className="grid gap-2">
                  <button
                    type="button"
                    onClick={() => submit()}
                    disabled={isPending || normalizeKeyword(form.keyword).length === 0}
                    className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--bg-soft)] text-sm font-medium text-[var(--text-strong)] transition hover:border-[var(--line-strong)] disabled:opacity-50"
                  >
                    {isPending ? "조회 중..." : "결과 조회"}
                  </button>
                  <button
                    type="button"
                    onClick={saveCurrentResult}
                    disabled={!result?.ok || result.data.items.length === 0}
                    className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-[var(--line)] bg-transparent text-sm font-medium text-[var(--text-body)] transition hover:border-[var(--line-strong)] hover:text-[var(--text-strong)] disabled:opacity-40"
                  >
                    {saveMessage ?? "현재 결과 저장"}
                  </button>
                </div>
              </div>
            </div>

            <HistoryPanel
              title="저장 결과"
              description="저장한 리서치 결과를 다시 열고 삭제할 수 있습니다."
              records={records.slice(0, 5)}
              emptyTitle="저장 항목 없음"
              emptyDescription="검색 결과를 저장하면 여기와 홈 최근 저장에서 다시 열 수 있습니다."
              onApply={applySaved}
              onRemove={removeRecord}
            />
          </div>
        }
      >
        {!result ? (
          <EmptyState
            title="검색어를 입력하세요."
            description="실무 리서치에 필요한 검색 결과를 조회하고 저장할 수 있습니다."
          />
        ) : !result.ok ? (
          <ErrorState title={result.error} description="검색어 또는 유형을 바꿔 다시 시도하세요." />
        ) : result.data.items.length === 0 ? (
          <EmptyState title="결과가 없습니다." description="다른 검색어로 다시 조회하세요." />
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
                <p className="text-[11px] tracking-[0.14em] text-[var(--text-dim)]">기준 유형</p>
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

            {researchSummary ? (
              <ResultPanel
                title="리서치 요약"
                description="AI 없이 규칙 기반으로 정리한 빠른 검토 메모입니다."
                aside={<StatusBadge tone="neutral">Rule Based</StatusBadge>}
              >
                <div className="grid gap-3 xl:grid-cols-2">
                  <div className="rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-4 py-4">
                    <p className="text-[11px] tracking-[0.14em] text-[var(--text-dim)]">반복 테마</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {researchSummary.repeatedThemes.map((theme) => (
                        <span
                          key={theme}
                          className="rounded-md border border-[var(--line)] px-2 py-1 text-xs text-[var(--text-body)]"
                        >
                          {theme}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-4 py-4">
                      <p className="text-[11px] tracking-[0.14em] text-[var(--text-dim)]">출처 구성</p>
                      <p className="mt-2 text-sm leading-6 text-[var(--text-body)]">
                        {researchSummary.sourceMix}
                      </p>
                    </div>
                    <div className="rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-4 py-4">
                      <p className="text-[11px] tracking-[0.14em] text-[var(--text-dim)]">콘텐츠 믹스</p>
                      <p className="mt-2 text-sm leading-6 text-[var(--text-body)]">
                        {researchSummary.typeMix}
                      </p>
                    </div>
                    <div className="rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-4 py-4">
                      <p className="text-[11px] tracking-[0.14em] text-[var(--text-dim)]">활용 판단</p>
                      <p className="mt-2 text-sm leading-6 text-[var(--text-body)]">
                        {researchSummary.usefulness}
                      </p>
                    </div>
                  </div>
                </div>
              </ResultPanel>
            ) : null}

            <ResultPanel
              title={`${result.data.keyword} 결과`}
              description="실무 검토에 필요한 정보와 액션을 바로 사용할 수 있습니다."
              aside={
                <div className="flex flex-wrap items-center justify-end gap-2">
                  {actionMessage ? (
                    <span className="text-xs text-[var(--text-dim)]">{actionMessage}</span>
                  ) : null}
                  <UtilityButton
                    label="전체 복사"
                    onClick={() => copyText(buildResultsText(result.data), "전체 결과를 복사했습니다.")}
                  />
                  <UtilityButton label="CSV 저장" onClick={exportCsv} />
                </div>
              }
            >
              <div className="space-y-3">
                {result.data.items.map((item, index) => (
                  <article
                    key={`${item.link}-${index}`}
                    className="rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-4 py-4"
                  >
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
                        <h3 className="mt-4 text-sm font-semibold leading-6 text-[var(--text-strong)]">
                          {item.title}
                        </h3>
                        <p className="mt-3 text-sm leading-6 text-[var(--text-body)]">
                          {item.description || "요약 없음"}
                        </p>
                        <p className="mt-3 truncate text-xs text-[var(--text-dim)]">{item.link}</p>
                      </div>
                      <div className="flex shrink-0 flex-row flex-wrap gap-2 xl:w-[220px] xl:flex-col xl:items-stretch">
                        <UtilityButton
                          label="제목 복사"
                          onClick={() => copyText(item.title, "제목을 복사했습니다.")}
                        />
                        <UtilityButton
                          label="요약 복사"
                          onClick={() =>
                            copyText(item.description || "요약 없음", "요약을 복사했습니다.")
                          }
                        />
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-8 items-center justify-center rounded-lg border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-3 text-xs font-medium text-[var(--text-body)] transition hover:border-[var(--line-strong)] hover:text-[var(--text-strong)]"
                        >
                          링크 열기
                        </a>
                        <UtilityButton label="저장" onClick={() => saveSingleItem(item)} />
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </ResultPanel>
          </>
        )}
      </ActiveFeatureLayout>
    </FeatureShell>
  );
}

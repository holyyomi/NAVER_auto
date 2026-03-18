"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { ActiveFeatureLayout } from "@/components/features/active-feature-layout";
import { FeatureShell } from "@/components/features/feature-shell";
import { ResultPanel } from "@/components/features/result-panel";
import { ResultSummaryGrid } from "@/components/features/result-summary-grid";
import { EmptyState, ErrorState } from "@/components/features/shared-states";
import { HistoryPanel } from "@/components/history/history-panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { useActivityHistory } from "@/hooks/use-activity-history";
import { useOpenSavedItem } from "@/hooks/use-open-saved-item";
import { restoreSearchResultsRecord } from "@/lib/history/restore";
import type { ApiResult, SearchItem, SearchResponse } from "@/lib/naver/types";
import type { SearchType } from "@/lib/search/workbench-store";
import {
  buildCompetitorMonitorHref,
  buildLocalBusinessResearchHref,
} from "@/lib/workflow/cross-feature-links";

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
  { label: "콘텐츠 조사", condition: { keyword: "병원 마케팅", searchType: "blog" } },
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

function normalizeText(value?: string | null) {
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
    .join(" / ");

  const typeMix = [...typeCounts.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([type, count]) => `${type} ${count}건`)
    .join(" / ");

  const hasNews = result.items.some((item) => item.type === "news");
  const hasBlog = result.items.some((item) => item.type === "blog");
  const hasShopping = result.items.some((item) => item.type === "shopping");
  const uniqueSources = sourceCounts.size;

  let usefulness = "기초 시장 조사와 제안서 레퍼런스 수집에 활용하기 좋은 결과입니다.";
  if (hasNews && uniqueSources >= 3) {
    usefulness = "시장 반응과 업계 이슈 확인에 적합해 제안 배경 정리에 바로 활용할 수 있습니다.";
  } else if (hasBlog && uniqueSources >= 2) {
    usefulness = "콘텐츠 톤앤매너와 소재 아이디어 수집용으로 활용도가 높습니다.";
  } else if (hasShopping) {
    usefulness = "상품명, 판매처, 쇼핑 노출 구성을 빠르게 파악하는 데 적합합니다.";
  }

  return {
    repeatedThemes:
      repeatedThemes.length > 0 ? repeatedThemes : ["반복 테마가 뚜렷하지 않습니다."],
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
      `일자: ${normalizeText(item.publishedAt)}`,
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
    ["검색어", "조회유형", "번호", "제목", "요약", "출처", "결과유형", "일자", "링크"],
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

function getErrorPresentation(result: Extract<ApiResult<SearchResponse>, { ok: false }>) {
  if (result.code === "unsupported_type") {
    return {
      title: "지원하지 않는 검색 유형입니다.",
      description: "블로그, 뉴스, 쇼핑 중에서 다시 선택해 주세요.",
    };
  }

  if (result.code === "validation_error") {
    return {
      title: result.error,
      description: "검색어를 입력하거나 검색 유형을 다시 선택한 뒤 재시도해 주세요.",
    };
  }

  if (result.code === "timeout_error") {
    return {
      title: "검색 응답이 지연되고 있습니다.",
      description: "네이버 검색 응답이 늦어지고 있습니다. 잠시 후 다시 시도해 주세요.",
    };
  }

  if (result.error.includes("초과")) {
    return {
      title: "호출 한도를 초과했습니다.",
      description: "오늘 사용 가능한 네이버 검색 호출 한도를 넘었습니다. 내일 다시 시도해 주세요.",
    };
  }

  if (result.code === "payload_error") {
    return {
      title: "검색 결과 형식을 확인하지 못했습니다.",
      description: "네이버 응답 형식이 예상과 달랐습니다. 잠시 후 다시 시도해 주세요.",
    };
  }

  return {
    title: result.error,
    description: "네이버 검색 API 상태 또는 입력 조건을 확인한 뒤 다시 시도해 주세요.",
  };
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
  const [restoreNotice, setRestoreNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { records, saveRecord, removeRecord } = useActivityHistory("search-results");
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const researchSummary = useMemo(
    () => (result?.ok ? buildResearchSummary(result.data) : null),
    [result],
  );

  const submit = (override?: SearchForm) => {
    const nextForm = override ?? form;
    const keyword = normalizeKeyword(nextForm.keyword);

    if (!keyword) {
      setResult({
        ok: false,
        code: "validation_error",
        error: "검색어를 입력해 주세요.",
      });
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
        setRestoreNotice(null);
      } catch {
        setResult({
          ok: false,
          code: "upstream_error",
          error: "검색 요청 중 연결 오류가 발생했습니다.",
        });
      }
    });
  };

  const flashAction = (message: string) => {
    setActionMessage(message);
    window.setTimeout(() => setActionMessage(null), 1600);
  };

  useEffect(() => {
    const keyword = normalizeKeyword(searchParams.get("keyword") ?? "");
    const searchType = searchParams.get("searchType");
    const autoRun = searchParams.get("autoRun") === "1";

    if (!keyword || (searchType !== "blog" && searchType !== "news" && searchType !== "shopping")) {
      return;
    }

    const nextForm = {
      keyword,
      searchType,
    } satisfies SearchForm;

    const timer = window.setTimeout(() => {
      setForm(nextForm);
      if (autoRun) {
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
            setForm(nextForm);
            setResult(data);
            setRestoreNotice(null);
            setActionMessage(`"${keyword}" 검색 결과를 바로 불러왔습니다.`);
            window.setTimeout(() => setActionMessage(null), 1600);
          } catch {
            setResult({
              ok: false,
              code: "upstream_error",
              error: "검색 요청 중 연결 오류가 발생했습니다.",
            });
          }
        });
      }
    }, 0);

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("keyword");
    nextParams.delete("searchType");
    nextParams.delete("autoRun");
    const nextUrl = nextParams.size > 0 ? `${pathname}?${nextParams.toString()}` : pathname;
    router.replace(nextUrl, { scroll: false });

    return () => window.clearTimeout(timer);
  }, [pathname, router, searchParams, startTransition]);

  const copyText = async (value: string, message: string) => {
    try {
      await navigator.clipboard.writeText(value);
      flashAction(message);
    } catch {
      flashAction("클립보드 복사에 실패했습니다.");
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
      title: `${form.keyword} | ${getTypeLabel(form.searchType)}`,
      summary: `${getTypeLabel(form.searchType)} 검색 결과 ${result.data.items.length}건과 리서치 요약을 저장했습니다.`,
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

  const saveAsReportReference = () => {
    if (!result?.ok || result.data.items.length === 0) {
      return;
    }

    saveRecord({
      featureType: "search-results",
      title: `${form.keyword} | 리포트 참고`,
      summary: `검색광고 리포트 보조 참고용으로 ${getTypeLabel(form.searchType)} 결과 ${result.data.items.length}건을 저장했습니다.`,
      fields: [
        { label: "용도", value: "리포트 참고" },
        { label: "유형", value: getTypeLabel(form.searchType) },
        { label: "결과", value: `${result.data.items.length}건` },
      ],
      inputSnapshot: form,
      outputSnapshot: result,
    });

    flashAction("리포트 참고용으로 저장했습니다.");
  };

  const saveSingleItem = (item: SearchItem) => {
    saveRecord({
      featureType: "search-results",
      title: `${form.keyword} | 개별 결과 저장`,
      summary: `${normalizeText(item.source)} 출처의 ${getTypeLabel(item.type)} 결과 1건을 저장했습니다.`,
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

    flashAction("선택한 결과를 저장했습니다.");
  };

  const applySaved = (record: (typeof records)[number]) => {
    const restored = restoreSearchResultsRecord<SearchForm>(record);
    if (!restored.ok) {
      setRestoreNotice(restored.message);
      return;
    }

    setForm(restored.input);
    setResult(restored.output);
    setRestoreNotice(null);
  };

  useOpenSavedItem("search-results", applySaved);

  return (
    <FeatureShell
      title="검색 결과 모음"
      description="SA/DA 실무용 키워드, 콘텐츠, 경쟁사 레퍼런스를 빠르게 모으고 저장하는 검색 작업 공간입니다."
      source={result?.ok ? result.meta?.source ?? null : null}
    >
      <ActiveFeatureLayout
        controls={
          <div className="space-y-6">
            <div className="rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-4 py-4">
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
                    {saveMessage ?? (result?.ok && result.data.items.length > 0 ? "현재 결과 저장" : "결과 생성 후 저장 가능")}
                  </button>
                </div>
                {restoreNotice ? (
                  <p className="text-xs text-[var(--warning-text)]">{restoreNotice}</p>
                ) : null}
              </div>
            </div>

            <HistoryPanel
              title="저장 결과"
              description="저장한 검색 결과를 다시 열고 삭제할 수 있습니다."
              records={records.slice(0, 5)}
              emptyTitle="저장된 항목 없음"
              emptyDescription="검색 결과를 저장하면 여기에서 최근 저장 목록을 다시 볼 수 있습니다."
              onApply={applySaved}
              onRemove={removeRecord}
            />
          </div>
        }
      >
        {!result ? (
          <EmptyState
            title="검색어를 입력해 주세요."
            description="블로그, 뉴스, 쇼핑 검색 결과를 조회해 실무 레퍼런스로 저장할 수 있습니다."
          />
        ) : !result.ok ? (
          <ErrorState
            title={getErrorPresentation(result).title}
            description={getErrorPresentation(result).description}
          />
        ) : result.data.items.length === 0 ? (
          <EmptyState
            title="검색 결과가 없습니다."
            description="현재 조건으로는 노출된 결과가 없습니다. 검색어를 더 구체적으로 바꾸거나 유형을 변경해 보세요."
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
                description="AI 없이 규칙 기반으로 정리한 빠른 검색 메모입니다."
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
              title="다음 액션"
              description="현재 검색 결과를 이어서 모니터링, 지역 조사, 보고 참고용으로 연결합니다."
              aside={<StatusBadge tone="neutral">Cross Workflow</StatusBadge>}
            >
              <div className="grid gap-3 xl:grid-cols-3">
                <Link
                  href={buildCompetitorMonitorHref({
                    keyword: result.data.keyword,
                    searchType: result.data.searchType,
                    autoRegister: true,
                  })}
                  className="rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-4 py-4 transition hover:border-[var(--line-strong)]"
                >
                  <p className="text-sm font-medium text-[var(--text-strong)]">경쟁 키워드 모니터링 등록</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-body)]">
                    현재 검색어를 모니터링 목록에 바로 등록하고 이후 변화 여부를 추적합니다.
                  </p>
                </Link>
                <Link
                  href={buildLocalBusinessResearchHref({
                    businessKeyword: result.data.keyword,
                    searchType: result.data.searchType,
                  })}
                  className="rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-4 py-4 transition hover:border-[var(--line-strong)]"
                >
                  <p className="text-sm font-medium text-[var(--text-strong)]">지역 업체 조사로 확장</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-body)]">
                    현재 검색어를 업종/키워드로 넘겨 지역 조건을 보완한 조사 흐름으로 이어갑니다.
                  </p>
                </Link>
                <button
                  type="button"
                  onClick={saveAsReportReference}
                  className="rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-4 py-4 text-left transition hover:border-[var(--line-strong)]"
                >
                  <p className="text-sm font-medium text-[var(--text-strong)]">리포트 참고용 저장</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-body)]">
                    검색광고 리포트 보조에서 참고할 수 있도록 현재 결과와 요약을 별도 저장합니다.
                  </p>
                </button>
              </div>
            </ResultPanel>

            <ResultPanel
              title={`${result.data.keyword} 결과`}
              description="실무 검토에 필요한 결과를 바로 복사, 저장, CSV 내보내기 할 수 있습니다."
              aside={
                <div className="flex flex-wrap items-center justify-end gap-2">
                  {actionMessage ? (
                    <span className="text-xs text-[var(--text-dim)]">{actionMessage}</span>
                  ) : null}
                  <UtilityButton
                    label="전체 복사"
                    onClick={() =>
                      copyText(buildResultsText(result.data), "전체 결과를 복사했습니다.")
                    }
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
                          onClick={() => copyText(item.description || "요약 없음", "요약을 복사했습니다.")}
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

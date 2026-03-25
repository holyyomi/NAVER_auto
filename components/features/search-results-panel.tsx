"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { ActiveFeatureLayout } from "@/components/features/active-feature-layout";
import { EmptyState, ErrorState } from "@/components/features/shared-states";
import { FeatureShell } from "@/components/features/feature-shell";
import { ResultPanel } from "@/components/features/result-panel";
import { ResultSummaryGrid } from "@/components/features/result-summary-grid";
import { FeatureUsageGuide } from "@/components/guidance/feature-usage-guide";
import { HistoryPanel } from "@/components/history/history-panel";
import { CopyButton } from "@/components/ui/copy-button";
import { SampleDataButton } from "@/components/ui/sample-data-button";
import { StatusBadge } from "@/components/ui/status-badge";
import { useActivityHistory } from "@/hooks/use-activity-history";
import { useOpenSavedItem } from "@/hooks/use-open-saved-item";
import { featureUsageGuides } from "@/lib/guidance";
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

const sampleForms: SearchForm[] = [
  { keyword: "병원 마케팅", searchType: "blog" },
  { keyword: "네이버 검색광고", searchType: "news" },
  { keyword: "스마트스토어 광고", searchType: "shopping" },
];

const initialForm: SearchForm = sampleForms[0];

function getTypeLabel(type: SearchType) {
  if (type === "blog") return "블로그";
  if (type === "news") return "뉴스";
  return "쇼핑";
}

function normalizeKeyword(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function buildCopyText(result: SearchResponse) {
  return [
    `검색어: ${result.keyword}`,
    `유형: ${getTypeLabel(result.searchType)}`,
    `결과 수: ${result.items.length}건`,
    "",
    ...result.items.flatMap((item, index) => [
      `${index + 1}. ${item.title}`,
      `요약: ${item.description || "-"}`,
      `링크: ${item.link}`,
      "",
    ]),
  ].join("\n");
}

async function copyText(value: string) {
  await navigator.clipboard.writeText(value);
}

export function SearchResultsPanel() {
  const [form, setForm] = useState<SearchForm>(initialForm);
  const [result, setResult] = useState<ApiResult<SearchResponse> | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [restoreNotice, setRestoreNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { records, saveRecord, removeRecord } = useActivityHistory("search-results");
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const usageGuide = featureUsageGuides["search-results-hub"];

  const flash = useCallback((text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(null), 1800);
  }, []);

  const runSearch = useCallback(
    (nextForm?: SearchForm) => {
      const target = nextForm ?? form;
      const keyword = normalizeKeyword(target.keyword);

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
          console.log("[search-results] fetch:start", {
            keyword,
            searchType: target.searchType,
          });
          const response = await fetch("/api/naver/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              keyword,
              searchType: target.searchType,
            }),
          });

          const data = (await response.json()) as ApiResult<SearchResponse>;
          console.log("[search-results] fetch:done", data);
          setForm({ keyword, searchType: target.searchType });
          setResult(data);
          setRestoreNotice(null);
        } catch {
          console.error("[search-results] fetch:error", {
            keyword,
            searchType: target.searchType,
          });
          setResult({
            ok: false,
            code: "upstream_error",
            error: "검색 결과를 불러오지 못했습니다.",
          });
        }
      });
    },
    [form, startTransition],
  );

  useEffect(() => {
    const keyword = normalizeKeyword(searchParams.get("keyword") ?? "");
    const searchType = searchParams.get("searchType");
    const autoRun = searchParams.get("autoRun") === "1";

    if (!keyword || (searchType !== "blog" && searchType !== "news" && searchType !== "shopping")) {
      return;
    }

    const nextForm = { keyword, searchType } satisfies SearchForm;
    setForm(nextForm);

    if (autoRun) {
      runSearch(nextForm);
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("keyword");
    nextParams.delete("searchType");
    nextParams.delete("autoRun");
    const nextUrl = nextParams.size > 0 ? `${pathname}?${nextParams.toString()}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [pathname, router, runSearch, searchParams]);

  const saveSnapshot = () => {
    if (!result?.ok) {
      return;
    }

    saveRecord({
      featureType: "search-results",
      title: `${form.keyword} | ${getTypeLabel(form.searchType)}`,
      summary: `${form.keyword} 검색 결과 ${result.data.items.length}건을 저장했습니다.`,
      fields: [
        { label: "검색어", value: form.keyword },
        { label: "유형", value: getTypeLabel(form.searchType) },
        { label: "결과", value: `${result.data.items.length}건` },
      ],
      inputSnapshot: form,
      outputSnapshot: result,
    });

    flash("검색 결과를 저장했습니다.");
  };

  const saveSingleItem = (item: SearchItem) => {
    saveRecord({
      featureType: "search-results",
      title: `${form.keyword} | 개별 결과`,
      summary: `${item.title} 항목을 별도로 저장했습니다.`,
      fields: [
        { label: "검색어", value: form.keyword },
        { label: "유형", value: getTypeLabel(form.searchType) },
      ],
      inputSnapshot: form,
      outputSnapshot: {
        ok: true,
        data: {
          keyword: form.keyword,
          searchType: form.searchType,
          total: 1,
          items: [item],
        },
      } satisfies ApiResult<SearchResponse>,
    });

    flash("개별 결과를 저장했습니다.");
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
      description="검색 결과를 확인하고 필요한 항목만 복사하거나 저장합니다."
      source={result?.ok ? result.meta?.source ?? null : null}
    >
      <ActiveFeatureLayout
        controls={
          <div className="space-y-6">
            <div className="surface-card px-5 py-5">
              <div className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[var(--text-body)]">검색어</span>
                  <input
                    value={form.keyword}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, keyword: event.target.value }))
                    }
                    disabled={isPending}
                    className="field-control"
                    placeholder="예: 병원 마케팅"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[var(--text-body)]">유형</span>
                  <select
                    value={form.searchType}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        searchType: event.target.value as SearchType,
                      }))
                    }
                    disabled={isPending}
                    className="field-control"
                  >
                    <option value="blog">블로그</option>
                    <option value="news">뉴스</option>
                    <option value="shopping">쇼핑</option>
                  </select>
                </label>

                <div className="flex flex-wrap gap-2">
                  <SampleDataButton onClick={() => setForm(sampleForms[0])} />
                  {sampleForms.map((sample) => (
                    <button
                      key={`${sample.keyword}-${sample.searchType}`}
                      type="button"
                      onClick={() => {
                        setForm(sample);
                        runSearch(sample);
                      }}
                      className="button-secondary inline-flex min-h-9 items-center justify-center px-3 py-2 text-xs"
                    >
                      {sample.keyword}
                    </button>
                  ))}
                </div>

                <div className="grid gap-2">
                  <button
                    type="button"
                    onClick={() => runSearch()}
                    disabled={isPending}
                    className="button-primary w-full"
                  >
                    {isPending ? "조회 중.." : "실행"}
                  </button>
                  <button
                    type="button"
                    onClick={saveSnapshot}
                    disabled={!result?.ok}
                    className="button-secondary w-full"
                  >
                    결과 저장
                  </button>
                </div>

                <p className="text-xs text-[var(--text-dim)]">입력 후 실행하고, 결과를 확인한 뒤 복사하거나 저장합니다.</p>
                {message ? <p className="text-xs text-[var(--text-dim)]">{message}</p> : null}
                {restoreNotice ? <p className="text-xs text-[var(--warning-text)]">{restoreNotice}</p> : null}
              </div>
            </div>

            <HistoryPanel
              title="최근 5개"
              description="저장한 검색 결과를 다시 엽니다."
              records={records.slice(0, 5)}
              emptyTitle="저장한 검색 결과가 없습니다"
              emptyDescription="검색 후 저장하면 최근 목록에 표시됩니다."
              onApply={applySaved}
              onRemove={removeRecord}
            />
          </div>
        }
      >
        <FeatureUsageGuide
          useWhen={usageGuide.useWhen}
          output={usageGuide.output}
          nextAction={usageGuide.nextAction}
          testPoint={usageGuide.testPoint}
        />

        {!result ? (
          <EmptyState
            title="검색어를 입력해 주세요"
            description="실행하면 결과 목록이 바로 표시됩니다."
          />
        ) : !result.ok ? (
          <ErrorState title="검색 결과를 불러오지 못했습니다." description={result.error} />
        ) : result.data.items.length === 0 ? (
          <EmptyState
            title="검색 결과가 없습니다"
            description="검색어를 바꾸거나 유형을 바꿔 다시 시도해 주세요."
          />
        ) : (
          <>
            <ResultSummaryGrid>
              <div className="kpi-card px-5 py-5">
                <p className="text-[11px] tracking-[0.14em] text-[var(--text-dim)]">검색어</p>
                <p className="mt-2 text-base font-semibold text-[var(--text-strong)]">{result.data.keyword}</p>
              </div>
              <div className="kpi-card px-5 py-5">
                <p className="text-[11px] tracking-[0.14em] text-[var(--text-dim)]">유형</p>
                <p className="mt-2 text-base font-semibold text-[var(--text-strong)]">
                  {getTypeLabel(result.data.searchType)}
                </p>
              </div>
              <div className="kpi-card px-5 py-5">
                <p className="text-[11px] tracking-[0.14em] text-[var(--text-dim)]">결과 수</p>
                <p className="mt-2 text-base font-semibold text-[var(--text-strong)]">{result.data.items.length}건</p>
              </div>
            </ResultSummaryGrid>

            <ResultPanel
              title="검색 결과"
              description="결과를 보고 복사하거나 저장합니다."
              aside={
                <CopyButton
                  label="전체 복사"
                  onClick={async () => {
                    try {
                      await copyText(buildCopyText(result.data));
                      flash("전체 결과를 복사했습니다.");
                    } catch {
                      flash("복사에 실패했습니다.");
                    }
                  }}
                />
              }
            >
              <div className="space-y-3">
                {result.data.items.map((item, index) => (
                  <article
                    key={`${item.link}-${index}`}
                    className="surface-card px-5 py-5"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge tone="neutral">{getTypeLabel(item.type)}</StatusBadge>
                          {item.source ? (
                            <span className="text-xs text-[var(--text-dim)]">{item.source}</span>
                          ) : null}
                        </div>
                        <h3 className="mt-3 text-sm font-semibold leading-6 text-[var(--text-strong)]">
                          {item.title}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-[var(--text-body)]">
                          {item.description || "요약 없음"}
                        </p>
                        <p className="mt-2 truncate text-xs text-[var(--text-dim)]">{item.link}</p>
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2 xl:w-[220px] xl:flex-col xl:items-stretch">
                        <CopyButton
                          label="제목 복사"
                          onClick={async () => {
                            try {
                              await copyText(item.title);
                              flash("제목을 복사했습니다.");
                            } catch {
                              flash("복사에 실패했습니다.");
                            }
                          }}
                        />
                        <CopyButton
                          label="요약 복사"
                          onClick={async () => {
                            try {
                              await copyText(item.description || "요약 없음");
                              flash("요약을 복사했습니다.");
                            } catch {
                              flash("복사에 실패했습니다.");
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => saveSingleItem(item)}
                          className="button-secondary min-h-9 px-3 py-2 text-xs"
                        >
                          개별 저장
                        </button>
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noreferrer"
                          className="button-secondary inline-flex min-h-9 items-center justify-center px-3 py-2 text-xs"
                        >
                          링크 열기
                        </a>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </ResultPanel>

            <ResultPanel title="다음 작업" description="현재 검색 결과를 다른 작업으로 이어서 사용할 수 있습니다.">
              <div className="grid gap-3 xl:grid-cols-2">
                <Link
                  href={buildLocalBusinessResearchHref({
                    businessKeyword: result.data.keyword,
                    searchType: result.data.searchType,
                  })}
                  className="surface-card px-5 py-5 text-sm text-[var(--text-body)]"
                >
                  지역 업체 조사로 이동
                </Link>
                <Link
                  href={buildCompetitorMonitorHref({
                    keyword: result.data.keyword,
                    searchType: result.data.searchType,
                    autoRegister: true,
                  })}
                  className="surface-card px-5 py-5 text-sm text-[var(--text-body)]"
                >
                  경쟁 키워드에 등록
                </Link>
              </div>
            </ResultPanel>
          </>
        )}
      </ActiveFeatureLayout>
    </FeatureShell>
  );
}

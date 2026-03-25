"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
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
import { restoreLocalBusinessRecord } from "@/lib/history/restore";
import type { ApiResult, SearchResponse } from "@/lib/naver/types";

type SearchType = "blog" | "news" | "shopping";

type ResearchForm = {
  region: string;
  businessKeyword: string;
  searchType: SearchType;
};

const sampleForms: ResearchForm[] = [
  {
    region: "강남",
    businessKeyword: "치과",
    searchType: "blog",
  },
  {
    region: "분당",
    businessKeyword: "필라테스",
    searchType: "news",
  },
];

const initialForm: ResearchForm = sampleForms[0];

function getTypeLabel(type: SearchType) {
  if (type === "blog") return "블로그";
  if (type === "news") return "뉴스";
  return "쇼핑";
}

function buildQuery(form: ResearchForm) {
  return [form.region.trim(), form.businessKeyword.trim()].filter(Boolean).join(" ");
}

function normalizeKeyword(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function buildCopyText(result: SearchResponse) {
  return [
    `조회어: ${result.keyword}`,
    `유형: ${getTypeLabel(result.searchType)}`,
    `결과 수: ${result.items.length}건`,
    "",
    ...result.items.flatMap((item, index) => [
      `${index + 1}. ${item.title}`,
      `요약: ${item.description || "-"}`,
      `출처: ${item.source || "-"}`,
      `링크: ${item.link}`,
      "",
    ]),
  ].join("\n");
}

async function copyText(value: string) {
  await navigator.clipboard.writeText(value);
}

export function LocalBusinessResearchPanel() {
  const [form, setForm] = useState<ResearchForm>(initialForm);
  const [result, setResult] = useState<ApiResult<SearchResponse> | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [restoreNotice, setRestoreNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { records, saveRecord, removeRecord } = useActivityHistory("local-business-research");
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const usageGuide = featureUsageGuides["local-business-research"];

  const query = useMemo(() => buildQuery(form), [form]);

  const flash = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(null), 1800);
  };

  const runSearch = useCallback(
    (nextForm?: ResearchForm) => {
      const target = nextForm ?? form;
      const keyword = normalizeKeyword(buildQuery(target));

      if (!keyword) {
        setResult({
          ok: false,
          code: "validation_error",
          error: "지역과 업종을 입력해 주세요.",
        });
        return;
      }

      startTransition(async () => {
        try {
          console.log("[local-business-research] fetch:start", {
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
          console.log("[local-business-research] fetch:done", data);
          setForm({
            ...target,
            region: target.region.trim(),
            businessKeyword: target.businessKeyword.trim(),
          });
          setResult(data);
          setRestoreNotice(null);
        } catch {
          console.error("[local-business-research] fetch:error", {
            keyword,
            searchType: target.searchType,
          });
          setResult({
            ok: false,
            code: "upstream_error",
            error: "조사 결과를 불러오지 못했습니다.",
          });
        }
      });
    },
    [form],
  );

  useEffect(() => {
    const region = normalizeKeyword(searchParams.get("region") ?? "");
    const businessKeyword = normalizeKeyword(searchParams.get("businessKeyword") ?? "");
    const searchType = searchParams.get("searchType");
    const autoRun = searchParams.get("autoRun") === "1";

    if (!region && !businessKeyword) {
      return;
    }

    if (searchType !== "blog" && searchType !== "news" && searchType !== "shopping") {
      return;
    }

    const nextForm: ResearchForm = {
      region,
      businessKeyword,
      searchType,
    };

    setForm(nextForm);

    if (autoRun) {
      runSearch(nextForm);
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("region");
    nextParams.delete("businessKeyword");
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
      featureType: "local-business-research",
      title: `${form.region} | ${form.businessKeyword}`,
      summary: `${query} 기준 결과 ${result.data.items.length}건을 저장했습니다.`,
      fields: [
        { label: "지역", value: form.region || "-" },
        { label: "업종", value: form.businessKeyword || "-" },
        { label: "유형", value: getTypeLabel(form.searchType) },
      ],
      inputSnapshot: form,
      outputSnapshot: result,
    });

    flash("조사 결과를 저장했습니다.");
  };

  const applySaved = (record: (typeof records)[number]) => {
    const restored = restoreLocalBusinessRecord<ResearchForm>(record);
    if (!restored.ok) {
      setRestoreNotice(restored.message);
      return;
    }

    setForm(restored.input);
    setResult(restored.output);
    setRestoreNotice(null);
    flash("저장한 조사 결과를 불러왔습니다.");
  };

  useOpenSavedItem("local-business-research", applySaved);

  return (
    <FeatureShell
      title="지역 업체 조사"
      description="지역과 업종 기준으로 검색 결과를 모아 제안 준비에 사용합니다."
      source={result?.ok ? result.meta?.source ?? null : null}
    >
      <ActiveFeatureLayout
        controls={
          <div className="space-y-6">
            <div className="surface-card px-5 py-5">
              <div className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[var(--text-body)]">지역</span>
                  <input
                    value={form.region}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, region: event.target.value }))
                    }
                    disabled={isPending}
                    className="field-control"
                    placeholder="예: 강남"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[var(--text-body)]">업종</span>
                  <input
                    value={form.businessKeyword}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        businessKeyword: event.target.value,
                      }))
                    }
                    disabled={isPending}
                    className="field-control"
                    placeholder="예: 치과"
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
                      key={`${sample.region}-${sample.businessKeyword}-${sample.searchType}`}
                      type="button"
                      onClick={() => {
                        setForm(sample);
                        runSearch(sample);
                      }}
                      className="button-secondary inline-flex min-h-9 items-center justify-center px-3 py-2 text-xs"
                    >
                      {sample.region} {sample.businessKeyword}
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
                    {isPending ? "조회 중..." : "업체 보기"}
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

                <p className="text-xs text-[var(--text-dim)]">조회 후 필요한 결과를 복사하거나 저장합니다.</p>
                {message ? <p className="text-xs text-[var(--text-dim)]">{message}</p> : null}
                {restoreNotice ? (
                  <p className="text-xs text-[var(--warning-text)]">{restoreNotice}</p>
                ) : null}
              </div>
            </div>

            <HistoryPanel
              title="최근 5개"
              description="저장한 조사 결과를 다시 엽니다."
              records={records.slice(0, 5)}
              emptyTitle="저장한 조사 결과가 없습니다"
              emptyDescription="결과를 저장하면 최근 목록에 표시됩니다."
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
            title="지역과 업종을 입력해 주세요"
            description="조회하면 업체 조사 결과를 바로 확인할 수 있습니다."
          />
        ) : !result.ok ? (
          <ErrorState title="조사 결과를 불러오지 못했습니다." description={result.error} />
        ) : result.data.items.length === 0 ? (
          <EmptyState
            title="검색 결과가 없습니다"
            description="지역이나 업종을 바꿔 다시 시도해 주세요."
          />
        ) : (
          <>
            <ResultSummaryGrid>
              <div className="kpi-card px-5 py-5">
                <p className="text-[11px] tracking-[0.14em] text-[var(--text-dim)]">지역</p>
                <p className="mt-2 text-base font-semibold text-[var(--text-strong)]">{form.region}</p>
              </div>
              <div className="kpi-card px-5 py-5">
                <p className="text-[11px] tracking-[0.14em] text-[var(--text-dim)]">업종</p>
                <p className="mt-2 text-base font-semibold text-[var(--text-strong)]">
                  {form.businessKeyword}
                </p>
              </div>
              <div className="kpi-card px-5 py-5">
                <p className="text-[11px] tracking-[0.14em] text-[var(--text-dim)]">결과 수</p>
                <p className="mt-2 text-base font-semibold text-[var(--text-strong)]">
                  {result.data.items.length}건
                </p>
              </div>
            </ResultSummaryGrid>

            <ResultPanel
              title="조사 결과"
              description={`${query} 기준 실무용 결과 목록입니다.`}
              aside={
                <CopyButton
                  label="전체 복사"
                  onClick={async () => {
                    try {
                      await copyText(buildCopyText(result.data));
                      flash("조사 결과를 복사했습니다.");
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
          </>
        )}
      </ActiveFeatureLayout>
    </FeatureShell>
  );
}

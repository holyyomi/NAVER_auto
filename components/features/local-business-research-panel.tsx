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
import { FeatureUsageGuide } from "@/components/guidance/feature-usage-guide";
import { useActivityHistory } from "@/hooks/use-activity-history";
import { useOpenSavedItem } from "@/hooks/use-open-saved-item";
import { featureUsageGuides } from "@/lib/guidance";
import { restoreLocalBusinessRecord } from "@/lib/history/restore";
import type { ApiResult, SearchItem, SearchResponse } from "@/lib/naver/types";
import {
  buildCompetitorMonitorHref,
  buildSearchResultsHref,
} from "@/lib/workflow/cross-feature-links";

type ResearchForm = {
  region: string;
  businessKeyword: string;
  businessName: string;
  searchType: "blog" | "news" | "shopping";
};

type LocalResearchCues = {
  regionHitRate: string;
  businessMatch: string;
  categoryMatch: string;
};

const initialForm: ResearchForm = {
  region: "강남",
  businessKeyword: "피부과",
  businessName: "",
  searchType: "blog",
};

function getTypeLabel(type: ResearchForm["searchType"]) {
  if (type === "blog") return "블로그";
  if (type === "news") return "뉴스";
  return "쇼핑";
}

function buildQuery(form: ResearchForm) {
  return [form.region.trim(), form.businessKeyword.trim(), form.businessName.trim()]
    .filter(Boolean)
    .join(" ");
}

function normalizeText(value?: string) {
  return value && value.trim().length > 0 ? value : "-";
}

function includesNormalized(text: string, keyword: string) {
  return text.toLowerCase().includes(keyword.trim().toLowerCase());
}

function buildLocalResearchCues(form: ResearchForm, items: SearchItem[]): LocalResearchCues {
  const regionKeyword = form.region.trim();
  const businessKeyword = form.businessKeyword.trim();
  const businessName = form.businessName.trim();

  const regionHits = items.filter((item) =>
    includesNormalized(`${item.title} ${item.description} ${item.source ?? ""}`, regionKeyword),
  ).length;
  const categoryHits = items.filter((item) =>
    includesNormalized(`${item.title} ${item.description}`, businessKeyword),
  ).length;
  const businessHits =
    businessName.length > 0
      ? items.filter((item) => includesNormalized(`${item.title} ${item.description}`, businessName))
          .length
      : 0;

  const regionRate =
    items.length > 0 ? Math.round((regionHits / items.length) * 100) : 0;
  const categoryRate =
    items.length > 0 ? Math.round((categoryHits / items.length) * 100) : 0;

  let businessMatch = "업체명 미입력";
  if (businessName.length > 0) {
    if (businessHits >= 3) {
      businessMatch = "업체명 직접 일치 가능성 높음";
    } else if (businessHits >= 1) {
      businessMatch = "업체명 부분 일치 가능성 있음";
    } else {
      businessMatch = "업체명 직접 노출은 제한적";
    }
  }

  let categoryMatch = "업종 일치 가능성 낮음";
  if (categoryRate >= 70) {
    categoryMatch = "업종 일치 가능성 높음";
  } else if (categoryRate >= 35) {
    categoryMatch = "업종 관련 결과가 혼합되어 있음";
  }

  return {
    regionHitRate: `지역 포함 결과 ${regionHits}/${items.length}건 (${regionRate}%)`,
    businessMatch,
    categoryMatch,
  };
}

export function LocalBusinessResearchPanel() {
  const [form, setForm] = useState<ResearchForm>(initialForm);
  const [result, setResult] = useState<ApiResult<SearchResponse> | null>(null);
  const [queryText, setQueryText] = useState(buildQuery(initialForm));
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [restoreNotice, setRestoreNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { records, saveRecord, removeRecord } = useActivityHistory("local-business-research");
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const researchCues = useMemo(
    () => (result?.ok ? buildLocalResearchCues(form, result.data.items) : null),
    [form, result],
  );

  const submit = () => {
    const query = buildQuery(form);
    if (!query) {
      return;
    }

    setQueryText(query);
    startTransition(async () => {
      try {
        const response = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            keyword: query,
            searchType: form.searchType,
          }),
        });

        const data = (await response.json()) as ApiResult<SearchResponse>;
        setResult(data);
        setRestoreNotice(null);
      } catch {
        setResult({
          ok: false,
          error: "지역 업체 조사 결과를 불러오지 못했습니다.",
        });
      }
    });
  };

  useEffect(() => {
    const region = searchParams.get("region") ?? "";
    const businessKeyword = searchParams.get("businessKeyword") ?? "";
    const businessName = searchParams.get("businessName") ?? "";
    const searchType = searchParams.get("searchType");
    const autoRun = searchParams.get("autoRun") === "1";

    if (
      !businessKeyword &&
      !region &&
      !businessName
    ) {
      return;
    }

    if (searchType !== "blog" && searchType !== "news" && searchType !== "shopping") {
      return;
    }

    const nextForm = {
      region,
      businessKeyword,
      businessName,
      searchType,
    } satisfies ResearchForm;

    const timer = window.setTimeout(() => {
      setForm(nextForm);
      setQueryText(buildQuery(nextForm));
      if (autoRun && buildQuery(nextForm)) {
        setResult(null);
        startTransition(async () => {
          try {
            const response = await fetch("/api/search", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                keyword: buildQuery(nextForm),
                searchType: nextForm.searchType,
              }),
            });

            const data = (await response.json()) as ApiResult<SearchResponse>;
            setResult(data);
            setRestoreNotice(null);
          } catch {
            setResult({
              ok: false,
              error: "지역 업체 조사 결과를 불러오지 못했습니다.",
            });
          }
        });
      }
    }, 0);

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("region");
    nextParams.delete("businessKeyword");
    nextParams.delete("businessName");
    nextParams.delete("searchType");
    nextParams.delete("autoRun");
    const nextUrl = nextParams.size > 0 ? `${pathname}?${nextParams.toString()}` : pathname;
    router.replace(nextUrl, { scroll: false });

    return () => window.clearTimeout(timer);
  }, [pathname, router, searchParams, startTransition]);

  const handleSave = () => {
    if (!result?.ok || result.data.items.length === 0) {
      return;
    }

    saveRecord({
      featureType: "local-business-research",
      title: `${form.region} | ${form.businessKeyword}`,
      summary: `${form.region} 지역의 ${form.businessKeyword} 조사 결과 ${result.data.items.length}건을 저장했습니다.`,
      fields: [
        { label: "지역", value: form.region || "-" },
        { label: "업종/키워드", value: form.businessKeyword || "-" },
        { label: "업체명", value: form.businessName || "미입력" },
      ],
      inputSnapshot: form,
      outputSnapshot: result,
    });

    setSaveMessage("조사 저장");
    window.setTimeout(() => setSaveMessage(null), 1600);
  };

  const applySaved = (record: (typeof records)[number]) => {
    const restored = restoreLocalBusinessRecord<ResearchForm>(record);
    if (!restored.ok) {
      setRestoreNotice(restored.message);
      return;
    }

    setForm(restored.input);
    setQueryText(buildQuery(restored.input));
    setResult(restored.output);
    setRestoreNotice(null);
  };

  useOpenSavedItem("local-business-research", applySaved);

  const usageGuide = featureUsageGuides["local-business-research"];

  return (
    <FeatureShell
      title="지역 업체 조사"
      description="로컬 클라이언트, 경쟁사, 제안 대상 업종의 검색 노출 패턴을 빠르게 검토하는 분석 패널입니다."
      source={result?.ok ? result.meta?.source ?? null : null}
    >
      <ActiveFeatureLayout
        controls={
          <div className="space-y-6">
            <div className="rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-4 py-4">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-[var(--text-strong)]">로컬 조사 설정</p>
                  <p className="mt-1 text-xs text-[var(--text-dim)]">
                    지역 시장 반응, 경쟁 노출, 제안서용 근거 수집에 맞춘 검색 조합을 만듭니다.
                  </p>
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[var(--text-body)]">지역</span>
                  <input
                    value={form.region}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, region: event.target.value }))
                    }
                    className="w-full rounded-lg border border-[var(--line)] bg-[var(--bg-elevated)] px-3 py-2.5 text-sm text-[var(--text-strong)] outline-none transition focus:border-[var(--line-strong)]"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[var(--text-body)]">
                    업종/키워드
                  </span>
                  <input
                    value={form.businessKeyword}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, businessKeyword: event.target.value }))
                    }
                    className="w-full rounded-lg border border-[var(--line)] bg-[var(--bg-elevated)] px-3 py-2.5 text-sm text-[var(--text-strong)] outline-none transition focus:border-[var(--line-strong)]"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[var(--text-body)]">
                    업체명
                  </span>
                  <input
                    value={form.businessName}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, businessName: event.target.value }))
                    }
                    placeholder="선택 입력"
                    className="w-full rounded-lg border border-[var(--line)] bg-[var(--bg-elevated)] px-3 py-2.5 text-sm text-[var(--text-strong)] outline-none transition focus:border-[var(--line-strong)]"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[var(--text-body)]">유형</span>
                  <select
                    value={form.searchType}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        searchType: event.target.value as ResearchForm["searchType"],
                      }))
                    }
                    className="w-full rounded-lg border border-[var(--line)] bg-[var(--bg-elevated)] px-3 py-2.5 text-sm text-[var(--text-strong)] outline-none transition focus:border-[var(--line-strong)]"
                  >
                    <option value="blog">블로그</option>
                    <option value="news">뉴스</option>
                    <option value="shopping">쇼핑</option>
                  </select>
                </label>

                <div className="grid gap-2">
                  <button
                    type="button"
                    onClick={submit}
                    disabled={isPending || buildQuery(form).length === 0}
                    className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--bg-soft)] text-sm font-medium text-[var(--text-strong)] transition hover:border-[var(--line-strong)] disabled:opacity-50"
                  >
                    {isPending ? "조사 중..." : "지역 조사 시작"}
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={!result?.ok || result.data.items.length === 0}
                    className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-[var(--line)] bg-transparent text-sm font-medium text-[var(--text-body)] transition hover:border-[var(--line-strong)] hover:text-[var(--text-strong)] disabled:opacity-40"
                  >
                    {saveMessage ?? (result?.ok && result.data.items.length > 0 ? "조사 저장" : "결과 생성 후 저장 가능")}
                  </button>
                </div>
                {restoreNotice ? (
                  <p className="text-xs text-[var(--warning-text)]">{restoreNotice}</p>
                ) : null}
              </div>
            </div>

            <HistoryPanel
              title="다시 보기"
              description="저장한 지역 조사 결과를 다시 열고 삭제할 수 있습니다."
              records={records.slice(0, 5)}
              emptyTitle="저장 항목 없음"
              emptyDescription="조사 저장 이후 여기와 홈 최근 저장에서 다시 볼 수 있습니다."
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
            title="조사 조건을 입력하세요."
            description="지역, 업종, 업체명을 조합해 로컬 시장과 경쟁 노출을 빠르게 확인할 수 있습니다."
          />
        ) : !result.ok ? (
          <ErrorState title={result.error} description="조사 조건을 조정한 뒤 다시 시도하세요." />
        ) : result.data.items.length === 0 ? (
          <EmptyState
            title="결과가 없습니다."
            description="다른 지역 또는 업종 키워드 조합으로 다시 조사해 보세요."
          />
        ) : (
          <>
            <ResultSummaryGrid>
              <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-4">
                <p className="text-[11px] tracking-[0.14em] text-[var(--text-dim)]">지역</p>
                <p className="mt-2 text-base font-semibold text-[var(--text-strong)]">{form.region}</p>
              </div>
              <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-4">
                <p className="text-[11px] tracking-[0.14em] text-[var(--text-dim)]">업종/키워드</p>
                <p className="mt-2 text-base font-semibold text-[var(--text-strong)]">
                  {form.businessKeyword}
                </p>
              </div>
              <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-4">
                <p className="text-[11px] tracking-[0.14em] text-[var(--text-dim)]">업체명 포함</p>
                <p className="mt-2 text-base font-semibold text-[var(--text-strong)]">
                  {form.businessName ? "포함" : "미포함"}
                </p>
              </div>
            </ResultSummaryGrid>

            <ResultPanel
              title="조사 요약"
              description="로컬 클라이언트 분석과 제안 준비에 필요한 핵심 지표"
              aside={<StatusBadge tone="neutral">Rule Based</StatusBadge>}
            >
              <div className="grid gap-3 xl:grid-cols-2">
                <div className="space-y-3">
                  <div className="rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-4 py-4">
                    <p className="text-[11px] tracking-[0.14em] text-[var(--text-dim)]">조회 조합</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--text-body)]">{queryText}</p>
                  </div>
                  <div className="rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-4 py-4">
                    <p className="text-[11px] tracking-[0.14em] text-[var(--text-dim)]">결과 수</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--text-body)]">
                      총 {result.data.total}건
                    </p>
                  </div>
                </div>
                {researchCues ? (
                  <div className="space-y-3">
                    <div className="rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-4 py-4">
                      <p className="text-[11px] tracking-[0.14em] text-[var(--text-dim)]">지역 신호</p>
                      <p className="mt-2 text-sm leading-6 text-[var(--text-body)]">
                        {researchCues.regionHitRate}
                      </p>
                    </div>
                    <div className="rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-4 py-4">
                      <p className="text-[11px] tracking-[0.14em] text-[var(--text-dim)]">업체명 추정</p>
                      <p className="mt-2 text-sm leading-6 text-[var(--text-body)]">
                        {researchCues.businessMatch}
                      </p>
                    </div>
                    <div className="rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-4 py-4">
                      <p className="text-[11px] tracking-[0.14em] text-[var(--text-dim)]">업종 적합성</p>
                      <p className="mt-2 text-sm leading-6 text-[var(--text-body)]">
                        {researchCues.categoryMatch}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            </ResultPanel>

            <ResultPanel
              title="조사 결과"
              description={`${form.region} / ${form.businessKeyword} 기준 검색 결과`}
              aside={<StatusBadge tone="neutral">{getTypeLabel(form.searchType)}</StatusBadge>}
            >
              <div className="space-y-3">
                {result.data.items.map((item, index) => (
                  <article
                    key={`${item.link}-${index}`}
                    className="rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge tone="neutral">{getTypeLabel(item.type)}</StatusBadge>
                          <span className="rounded-md border border-[var(--line)] px-2 py-1 text-[11px] text-[var(--text-dim)]">
                            {normalizeText(item.source)}
                          </span>
                        </div>
                        <h3 className="mt-4 text-sm font-medium text-[var(--text-strong)]">
                          {item.title}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-[var(--text-body)]">
                          {item.description || "요약 없음"}
                        </p>
                        <p className="mt-3 text-xs text-[var(--text-dim)]">
                          {normalizeText(item.publishedAt)}
                        </p>
                      </div>
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-8 shrink-0 items-center justify-center rounded-lg border border-[var(--line)] px-3 text-xs text-[var(--text-body)] transition hover:border-[var(--line-strong)] hover:text-[var(--text-strong)]"
                      >
                        링크 열기
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            </ResultPanel>

            <ResultPanel
              title="후속 액션"
              description="현재 지역 조사 결과를 모니터링이나 확장 검색으로 바로 넘길 수 있습니다."
              aside={<StatusBadge tone="neutral">Cross Workflow</StatusBadge>}
            >
              <div className="grid gap-3 xl:grid-cols-3">
                <Link
                  href={buildCompetitorMonitorHref({
                    keyword: queryText,
                    searchType: form.searchType,
                    autoRegister: true,
                  })}
                  className="rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-4 py-4 transition hover:border-[var(--line-strong)]"
                >
                  <p className="text-sm font-medium text-[var(--text-strong)]">경쟁 키워드 모니터링 등록</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-body)]">
                    현재 조사 조합을 모니터링 목록에 넘겨 반복 확인용 키워드로 등록합니다.
                  </p>
                </Link>
                <Link
                  href={buildSearchResultsHref({
                    keyword: queryText,
                    searchType: form.searchType,
                    autoRun: true,
                  })}
                  className="rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-4 py-4 transition hover:border-[var(--line-strong)]"
                >
                  <p className="text-sm font-medium text-[var(--text-strong)]">검색 결과 모음으로 확장</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-body)]">
                    현재 조사 조합을 검색 결과 모음에서 다시 열어 복사, CSV, 저장 작업으로 이어갑니다.
                  </p>
                </Link>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!result?.ok || result.data.items.length === 0}
                  className="rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-4 py-4 text-left transition hover:border-[var(--line-strong)] disabled:opacity-40"
                >
                  <p className="text-sm font-medium text-[var(--text-strong)]">조사 결과 저장</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-body)]">
                    지역 조사 스냅샷을 최근 저장에 남겨 제안 검토나 재조사 때 바로 다시 엽니다.
                  </p>
                </button>
              </div>
            </ResultPanel>
          </>
        )}
      </ActiveFeatureLayout>
    </FeatureShell>
  );
}

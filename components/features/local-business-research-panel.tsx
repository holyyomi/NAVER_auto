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

type ResearchForm = {
  region: string;
  businessKeyword: string;
  businessName: string;
  searchType: "blog" | "news" | "shopping";
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

function buildCombinedQuery(form: ResearchForm) {
  return [form.region.trim(), form.businessKeyword.trim(), form.businessName.trim()]
    .filter(Boolean)
    .join(" ");
}

function normalizeText(value?: string) {
  return value && value.trim().length > 0 ? value : "-";
}

function LocalSearchCard({ item }: { item: SearchItem }) {
  return (
    <article className="rounded-2xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-5 py-5">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge tone="neutral">{item.type === "news" ? "뉴스" : item.type === "shopping" ? "쇼핑" : "블로그"}</StatusBadge>
        <span className="rounded-md border border-[var(--line)] px-2 py-1 text-[11px] text-[var(--text-dim)]">
          {normalizeText(item.source)}
        </span>
        <span className="rounded-md border border-[var(--line)] px-2 py-1 text-[11px] text-[var(--text-dim)]">
          {normalizeText(item.publishedAt)}
        </span>
      </div>

      <h3 className="mt-4 text-base font-semibold text-[var(--text-strong)]">{item.title}</h3>
      <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--text-body)]">
        {normalizeText(item.description)}
      </p>
      <p className="mt-4 truncate text-xs text-[var(--text-dim)]">{item.link}</p>
    </article>
  );
}

export function LocalBusinessResearchPanel() {
  const [form, setForm] = useState<ResearchForm>(initialForm);
  const [result, setResult] = useState<ApiResult<SearchResponse> | null>(null);
  const [queryText, setQueryText] = useState(buildCombinedQuery(initialForm));
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { records, saveRecord, removeRecord } = useActivityHistory("local-business-research");

  const submit = () => {
    const combinedQuery = buildCombinedQuery(form);
    if (!combinedQuery) {
      return;
    }

    setQueryText(combinedQuery);

    startTransition(async () => {
      try {
        const response = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            keyword: combinedQuery,
            searchType: form.searchType,
          }),
        });

        const data = (await response.json()) as ApiResult<SearchResponse>;
        setResult(data);
      } catch {
        setResult({
          ok: false,
          error: "결과를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
        });
      }
    });
  };

  const handleSave = () => {
    if (!result?.ok || result.data.items.length === 0) {
      return;
    }

    saveRecord({
      feature: "local-business-research",
      featureLabel: "지역 업체 조사",
      title: queryText,
      description: `${getTypeLabel(form.searchType)} 결과 ${result.data.items.length}건 저장`,
      route: "/features/local-business-research",
      fields: [
        { label: "지역", value: form.region || "-" },
        { label: "업종", value: form.businessKeyword || "-" },
        { label: "업체명", value: form.businessName || "-" },
      ],
      input: form,
      snapshot: result,
    });

    setSaveMessage("저장됨");
    window.setTimeout(() => setSaveMessage(null), 1600);
  };

  const applyHistory = (record: SavedActivityRecord) => {
    const nextForm = record.input as ResearchForm;
    setForm(nextForm);
    setQueryText(buildCombinedQuery(nextForm));
    setResult(record.snapshot as ApiResult<SearchResponse>);
  };

  return (
    <FeatureShell
      title="지역 업체 조사"
      description="지역과 업종 기준으로 검색 결과 패턴을 확인합니다."
      source={result?.ok ? result.meta?.source ?? null : null}
    >
      <ActiveFeatureLayout
        controls={
          <div className="space-y-6">
            <div className="rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-[var(--text-strong)]">조사 조건</p>
                {isPending ? <StatusBadge tone="attention">조회 중</StatusBadge> : null}
              </div>

              <div className="mt-4 space-y-4">
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
                    업종 또는 키워드
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

                <button
                  type="button"
                  onClick={submit}
                  disabled={isPending || buildCombinedQuery(form).length === 0}
                  className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--bg-soft)] text-sm font-medium text-[var(--text-strong)] transition hover:border-[var(--line-strong)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isPending ? "조회 중..." : "조회"}
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!result?.ok || result.data.items.length === 0}
                  className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-[var(--line)] bg-transparent text-sm font-medium text-[var(--text-body)] transition hover:border-[var(--line-strong)] hover:text-[var(--text-strong)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {saveMessage ?? "현재 결과 저장"}
                </button>
              </div>
            </div>

            <HistoryPanel
              title="저장 결과"
              description="저장한 조사를 다시 엽니다."
              records={records.slice(0, 5)}
              emptyTitle="저장 없음"
              emptyDescription="조사 결과를 저장하면 여기에서 다시 볼 수 있습니다."
              onApply={applyHistory}
              onRemove={removeRecord}
            />
          </div>
        }
      >
        {!result ? (
          <EmptyState
            title="지역과 업종을 입력하세요"
            description="지역 조사에 필요한 검색 조합을 만들고 결과 패턴을 확인할 수 있습니다."
          />
        ) : !result.ok ? (
          <ErrorState
            title={result.error}
            description="지역, 업종, 업체명을 다시 확인한 뒤 다시 조회하세요."
          />
        ) : result.data.items.length === 0 ? (
          <EmptyState
            title="결과가 없습니다"
            description="지역이나 업종 키워드를 바꿔 다시 조회하세요."
          />
        ) : (
          <>
            <ResultSummaryGrid>
              <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-4">
                <p className="text-[11px] tracking-[0.14em] text-[var(--text-dim)]">조회어</p>
                <p className="mt-2 text-base font-semibold text-[var(--text-strong)]">{queryText}</p>
              </div>
              <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-4">
                <p className="text-[11px] tracking-[0.14em] text-[var(--text-dim)]">유형</p>
                <p className="mt-2 text-base font-semibold text-[var(--text-strong)]">
                  {getTypeLabel(form.searchType)}
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
              title="조사 요약"
              description={`${form.region || "-"} / ${form.businessKeyword || "-"} / ${form.businessName || "업체명 없음"}`}
              aside={<StatusBadge tone="neutral">지역 조사</StatusBadge>}
            >
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-4">
                  <p className="text-[11px] text-[var(--text-dim)]">지역</p>
                  <p className="mt-2 text-sm font-medium text-[var(--text-strong)]">{form.region || "-"}</p>
                </div>
                <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-4">
                  <p className="text-[11px] text-[var(--text-dim)]">업종</p>
                  <p className="mt-2 text-sm font-medium text-[var(--text-strong)]">
                    {form.businessKeyword || "-"}
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-4">
                  <p className="text-[11px] text-[var(--text-dim)]">업체명</p>
                  <p className="mt-2 text-sm font-medium text-[var(--text-strong)]">
                    {form.businessName || "-"}
                  </p>
                </div>
              </div>
            </ResultPanel>

            <ResultPanel
              title={`${queryText} 결과`}
              description="지역 조사용 검색 결과 목록"
              aside={<StatusBadge tone="active">실행됨</StatusBadge>}
            >
              <div className="space-y-3">
                {result.data.items.map((item) => (
                  <LocalSearchCard key={`${item.link}-${item.title}`} item={item} />
                ))}
              </div>
            </ResultPanel>
          </>
        )}
      </ActiveFeatureLayout>
    </FeatureShell>
  );
}

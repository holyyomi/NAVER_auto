"use client";

import { useState, useTransition } from "react";
import { ActiveFeatureLayout } from "@/components/features/active-feature-layout";
import { FeatureShell } from "@/components/features/feature-shell";
import { LineChart } from "@/components/features/line-chart";
import { ResultSummaryGrid } from "@/components/features/result-summary-grid";
import { ResultTable } from "@/components/features/result-table";
import { EmptyState, ErrorState } from "@/components/features/shared-states";
import { HistoryPanel } from "@/components/history/history-panel";
import { StatCard } from "@/components/ui/stat-card";
import { useActivityHistory } from "@/hooks/use-activity-history";
import type { SavedActivityRecord } from "@/lib/history/types";
import type { ApiResult, TrendResponse } from "@/lib/naver/types";

const initialForm = {
  keyword: "네이버 광고",
  startDate: "2026-02-15",
  endDate: "2026-03-15",
};

export function KeywordTrendPanel() {
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState<ApiResult<TrendResponse> | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { records, saveRecord, removeRecord } = useActivityHistory("keyword-trends");

  const submit = () => {
    startTransition(async () => {
      try {
        const response = await fetch("/api/trend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });

        const data = (await response.json()) as ApiResult<TrendResponse>;
        setResult(data);
      } catch {
        setResult({
          ok: false,
          error: "조회 중 오류가 발생했습니다.",
        });
      }
    });
  };

  const handleSave = () => {
    if (!result?.ok) {
      return;
    }

    saveRecord({
      feature: "keyword-trends",
      featureLabel: "키워드 트렌드",
      title: form.keyword,
      description: `${result.data.summary.periodLabel} 추이를 저장했습니다.`,
      route: "/features/keyword-trends",
      fields: [
        { label: "평균", value: String(result.data.summary.average) },
        { label: "최고", value: String(result.data.summary.peak) },
        { label: "변화", value: `${result.data.summary.changeRate}%` },
      ],
      input: form,
      snapshot: result,
    });

    setSaveMessage("저장됨");
    window.setTimeout(() => setSaveMessage(null), 1600);
  };

  const applyHistory = (record: SavedActivityRecord) => {
    setForm(record.input as typeof initialForm);
    setResult(record.snapshot as ApiResult<TrendResponse>);
  };

  return (
    <FeatureShell
      title="키워드 트렌드"
      description="검색 흐름을 보고 저장해 다시 확인합니다."
      source={result?.ok ? result.meta?.source ?? null : null}
    >
      <ActiveFeatureLayout
        controls={
          <div className="space-y-6">
            <div className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[var(--text-body)]">
                  키워드
                </span>
                <input
                  value={form.keyword}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, keyword: event.target.value }))
                  }
                  className="w-full rounded-lg border border-[var(--line)] bg-[var(--bg-elevated)] px-3 py-2.5 text-sm text-[var(--text-strong)] outline-none transition focus:border-[var(--line-strong)]"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[var(--text-body)]">
                  시작일
                </span>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, startDate: event.target.value }))
                  }
                  className="w-full rounded-lg border border-[var(--line)] bg-[var(--bg-elevated)] px-3 py-2.5 text-sm text-[var(--text-strong)] outline-none transition focus:border-[var(--line-strong)]"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[var(--text-body)]">
                  종료일
                </span>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, endDate: event.target.value }))
                  }
                  className="w-full rounded-lg border border-[var(--line)] bg-[var(--bg-elevated)] px-3 py-2.5 text-sm text-[var(--text-strong)] outline-none transition focus:border-[var(--line-strong)]"
                />
              </label>
              <button
                type="button"
                onClick={submit}
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

            <HistoryPanel
              title="최근 저장"
              description="저장한 조회를 다시 불러옵니다."
              records={records.slice(0, 5)}
              emptyTitle="저장된 조회가 없습니다"
              emptyDescription="결과를 확인한 뒤 저장하면 여기서 다시 열 수 있습니다."
              onApply={applyHistory}
              onRemove={removeRecord}
            />
          </div>
        }
      >
        {!result ? (
          <EmptyState
            title="조회 조건을 입력하세요"
            description="조회 후 차트와 표를 검토한 뒤 저장할 수 있습니다."
          />
        ) : !result.ok ? (
          <ErrorState
            title={result.error}
            description={result.issues?.join(" ") ?? "키워드와 기간을 다시 확인하세요."}
          />
        ) : result.data.points.length === 0 ? (
          <EmptyState
            title="표시할 데이터가 없습니다"
            description="다른 키워드나 기간으로 다시 조회하세요."
          />
        ) : (
          <>
            <ResultSummaryGrid>
              <StatCard
                label="평균 지수"
                value={`${result.data.summary.average}`}
                note={`키워드 ${result.data.summary.keyword}`}
              />
              <StatCard
                label="최고 지수"
                value={`${result.data.summary.peak}`}
                note={`기간 ${result.data.summary.periodLabel}`}
              />
              <StatCard
                label="변화율"
                value={`${result.data.summary.changeRate}%`}
                note="시작일 대비 종료일"
              />
            </ResultSummaryGrid>
            <LineChart
              title="기간별 추이"
              note="입력 기간 기준 추이"
              points={result.data.points.map((point) => ({
                label: point.date,
                value: point.value,
              }))}
            />
            <ResultTable
              title="일자별 결과"
              description="일자 단위 변화를 확인합니다."
              columns={["일자", "지수", "전일 대비"]}
              rows={result.data.rows.map((row) => [
                row.date,
                `${row.value}`,
                `${row.change > 0 ? "+" : ""}${row.change}`,
              ])}
            />
          </>
        )}
      </ActiveFeatureLayout>
    </FeatureShell>
  );
}

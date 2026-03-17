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
import type { ApiResult, ShoppingInsightResponse } from "@/lib/naver/types";

const initialForm = {
  keyword: "Health Supplement",
  period: "30d",
};

function getPeriodLabel(period: "7d" | "30d" | "90d") {
  if (period === "7d") return "7일";
  if (period === "30d") return "30일";
  return "90일";
}

export function ShoppingInsightsPanel() {
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState<ApiResult<ShoppingInsightResponse> | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { records, saveRecord, removeRecord } = useActivityHistory("shopping-insights");

  const submit = () => {
    startTransition(async () => {
      try {
        const response = await fetch("/api/shopping-insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });

        const data = (await response.json()) as ApiResult<ShoppingInsightResponse>;
        setResult(data);
      } catch {
        setResult({
          ok: false,
          error: "쇼핑 인사이트를 불러오지 못했습니다.",
        });
      }
    });
  };

  const handleSave = () => {
    if (!result?.ok) {
      return;
    }

    saveRecord({
      feature: "shopping-insights",
      featureLabel: "쇼핑 인사이트",
      title: form.keyword,
      description: `${getPeriodLabel(form.period as "7d" | "30d" | "90d")} 기준 쇼핑 비율 결과를 저장했습니다.`,
      route: "/features/shopping-insights",
      fields: [
        { label: "평균", value: String(result.data.summary.averageRatio) },
        { label: "피크", value: result.data.summary.peakPeriod },
        { label: "범위", value: String(result.data.summary.ratioRange) },
      ],
      input: form,
      snapshot: result,
    });

    setSaveMessage("저장됨");
    window.setTimeout(() => setSaveMessage(null), 1600);
  };

  const applyHistory = (record: SavedActivityRecord) => {
    setForm(record.input as typeof initialForm);
    setResult(record.snapshot as ApiResult<ShoppingInsightResponse>);
  };

  return (
    <FeatureShell
      title="쇼핑 인사이트"
      description="쇼핑 반응을 보고 저장해 다시 확인합니다."
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
                  기간
                </span>
                <select
                  value={form.period}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      period: event.target.value as "7d" | "30d" | "90d",
                    }))
                  }
                  className="w-full rounded-lg border border-[var(--line)] bg-[var(--bg-elevated)] px-3 py-2.5 text-sm text-[var(--text-strong)] outline-none transition focus:border-[var(--line-strong)]"
                >
                  <option value="7d">최근 7일</option>
                  <option value="30d">최근 30일</option>
                  <option value="90d">최근 90일</option>
                </select>
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
              description="저장한 쇼핑 조회를 다시 불러옵니다."
              records={records.slice(0, 5)}
              emptyTitle="저장된 조회가 없습니다"
              emptyDescription="결과를 저장하면 같은 조건과 결과를 다시 볼 수 있습니다."
              onApply={applyHistory}
              onRemove={removeRecord}
            />
          </div>
        }
      >
        {!result ? (
          <EmptyState
            title="조회 조건을 입력하세요"
            description="조회 후 비율 변화를 검토하고 저장할 수 있습니다."
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
                label="평균 비율"
                value={`${result.data.summary.averageRatio}`}
                note={`키워드 ${result.data.summary.keyword}`}
              />
              <StatCard
                label="피크 구간"
                value={result.data.summary.peakPeriod}
                note={`기간 ${getPeriodLabel(result.data.summary.period as "7d" | "30d" | "90d")}`}
              />
              <StatCard
                label="비율 범위"
                value={`${result.data.summary.ratioRange}`}
                note="최대값과 최소값 차이"
              />
            </ResultSummaryGrid>
            <LineChart
              title="비율 추이"
              note="기간별 쇼핑 비율"
              points={result.data.points.map((point) => ({
                label: point.date,
                value: point.value,
              }))}
            />
            <ResultTable
              title="구간별 결과"
              description="각 구간의 비율과 피크 대비 값을 확인합니다."
              columns={["구간", "비율", "피크 대비"]}
              rows={result.data.rows.map((row) => [
                row.period,
                `${row.ratio}`,
                `${row.peakRelativeRatio}%`,
              ])}
            />
          </>
        )}
      </ActiveFeatureLayout>
    </FeatureShell>
  );
}

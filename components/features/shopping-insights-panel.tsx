"use client";

import { useState, useTransition } from "react";
import { ActiveFeatureLayout } from "@/components/features/active-feature-layout";
import {
  ApprovalNotice,
  PendingResultState,
  QuotaExceededState,
  isApprovalPendingMessage,
  isQuotaExceededMessage,
} from "@/components/features/approval-notice";
import { FeatureShell } from "@/components/features/feature-shell";
import { LineChart } from "@/components/features/line-chart";
import { ResultSummaryGrid } from "@/components/features/result-summary-grid";
import { ResultTable } from "@/components/features/result-table";
import { EmptyState, ErrorState } from "@/components/features/shared-states";
import { HistoryPanel } from "@/components/history/history-panel";
import { LoadingPanel } from "@/components/ui/loading-panel";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { useActivityHistory } from "@/hooks/use-activity-history";
import type { SavedActivityRecord } from "@/lib/history/types";
import type { ApiResult, ShoppingInsightResponse } from "@/lib/naver/types";

const initialForm = {
  keyword: "건강기능식품",
  period: "30d" as "7d" | "30d" | "90d",
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
          error: "결과를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
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
      description: `${getPeriodLabel(form.period)} 기준 쇼핑 비율 결과를 저장했습니다.`,
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
      description="쇼핑 관심과 수요를 확인하는 준비 단계입니다."
      source={result?.ok ? result.meta?.source ?? null : null}
    >
      <ActiveFeatureLayout
        controls={
          <div className="space-y-6">
            <ApprovalNotice />

            <div className="space-y-4 rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-[var(--text-strong)]">조회 조건</p>
                {isPending ? <StatusBadge tone="attention">조회 중</StatusBadge> : null}
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[var(--text-body)]">
                  키워드
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
                  disabled={isPending}
                  className="w-full rounded-lg border border-[var(--line)] bg-[var(--bg-elevated)] px-3 py-2.5 text-sm text-[var(--text-strong)] outline-none transition focus:border-[var(--line-strong)] disabled:opacity-70"
                >
                  <option value="7d">최근 7일</option>
                  <option value="30d">최근 30일</option>
                  <option value="90d">최근 90일</option>
                </select>
              </label>

              <button
                type="button"
                onClick={submit}
                disabled={isPending || form.keyword.trim().length === 0}
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
              description="저장한 조회를 다시 엽니다."
              records={records.slice(0, 5)}
              emptyTitle="저장 없음"
              emptyDescription="결과를 저장하면 여기에서 다시 열 수 있습니다."
              onApply={applyHistory}
              onRemove={removeRecord}
            />
          </div>
        }
      >
        {isPending ? (
          <LoadingPanel />
        ) : !result ? (
          <EmptyState
            title="조회 조건을 입력하세요"
            description="승인 상태를 확인하고, 승인 완료 후 같은 화면에서 실데이터를 조회합니다."
          />
        ) : !result.ok && isApprovalPendingMessage(result.error) ? (
          <PendingResultState />
        ) : !result.ok && isQuotaExceededMessage(result.error) ? (
          <QuotaExceededState />
        ) : !result.ok ? (
          <ErrorState
            title={result.error}
            description="키워드와 기간을 다시 확인한 뒤 잠시 후 다시 시도해 주세요."
          />
        ) : result.data.points.length === 0 ? (
          <EmptyState
            title="결과가 없습니다"
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
              note="기간별 쇼핑 관심 변화"
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

"use client";

import { useMemo, useState, useTransition } from "react";
import { ActiveFeatureLayout } from "@/components/features/active-feature-layout";
import { FeatureShell } from "@/components/features/feature-shell";
import { ResultPanel } from "@/components/features/result-panel";
import { ResultSummaryGrid } from "@/components/features/result-summary-grid";
import { EmptyState } from "@/components/features/shared-states";
import { HistoryPanel } from "@/components/history/history-panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { useActivityHistory } from "@/hooks/use-activity-history";
import type { SavedActivityRecord } from "@/lib/history/types";
import {
  buildSearchAdReport,
  type RuleTone,
  type SearchAdReportInput,
  type SearchAdReportOutput,
} from "@/lib/reporting/search-ad-report-rules";

type ReportForm = {
  impressions: string;
  clicks: string;
  ctr: string;
  conversions: string;
  cvr: string;
  cpa: string;
  roas: string;
  previousCtr: string;
  previousCvr: string;
  previousCpa: string;
  previousRoas: string;
};

const initialForm: ReportForm = {
  impressions: "120000",
  clicks: "3600",
  ctr: "",
  conversions: "128",
  cvr: "",
  cpa: "28000",
  roas: "430",
  previousCtr: "2.6",
  previousCvr: "3.0",
  previousCpa: "32000",
  previousRoas: "380",
};

function parseNumber(value: string) {
  const trimmed = value.trim().replace(/,/g, "");
  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  }).format(new Date(value));
}

function getToneLabel(tone: RuleTone) {
  if (tone === "positive") return "양호";
  if (tone === "warning") return "점검 필요";
  return "보통";
}

function getToneBadge(tone: RuleTone) {
  if (tone === "positive") return "active" as const;
  if (tone === "warning") return "attention" as const;
  return "neutral" as const;
}

function toInput(form: ReportForm): SearchAdReportInput {
  return {
    impressions: parseNumber(form.impressions),
    clicks: parseNumber(form.clicks),
    ctr: parseNumber(form.ctr),
    conversions: parseNumber(form.conversions),
    cvr: parseNumber(form.cvr),
    cpa: parseNumber(form.cpa),
    roas: parseNumber(form.roas),
    previousCtr: parseNumber(form.previousCtr),
    previousCvr: parseNumber(form.previousCvr),
    previousCpa: parseNumber(form.previousCpa),
    previousRoas: parseNumber(form.previousRoas),
  };
}

function createTitle(input: SearchAdReportInput) {
  const roas = input.roas !== null ? `${input.roas}%` : "-";
  const conversions = input.conversions !== null ? `${input.conversions}건` : "-";
  return `검색광고 리포트 초안 · ROAS ${roas} · 전환 ${conversions}`;
}

function fieldText(value: string, suffix = "") {
  return value.trim() ? `${value.trim()}${suffix}` : "-";
}

function MetricCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-4">
      <p className="text-[11px] tracking-[0.14em] text-[var(--text-dim)]">{label}</p>
      <p className="mt-2 text-base font-semibold text-[var(--text-strong)]">{value}</p>
      <p className="mt-1 text-xs text-[var(--text-dim)]">{helper}</p>
    </div>
  );
}

function SummaryLine({ text }: { text: string }) {
  return (
    <li className="rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm leading-6 text-[var(--text-body)]">
      {text}
    </li>
  );
}

export function SearchAdReportAssistPanel() {
  const [form, setForm] = useState<ReportForm>(initialForm);
  const [report, setReport] = useState<SearchAdReportOutput | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { records, saveRecord, removeRecord } = useActivityHistory("search-ad-report-assist");

  const parsedInput = useMemo(() => toInput(form), [form]);
  const canGenerate = parsedInput.impressions !== null || parsedInput.clicks !== null || parsedInput.roas !== null;

  const handleGenerate = () => {
    if (!canGenerate) {
      return;
    }

    startTransition(() => {
      const next = buildSearchAdReport(parsedInput);
      setReport(next);
      setSavedAt(null);
    });
  };

  const handleSave = () => {
    if (!report) {
      return;
    }

    const saved = saveRecord({
      feature: "search-ad-report-assist",
      featureLabel: "검색광고 리포트 보조",
      title: createTitle(parsedInput),
      description: `${report.headline} · ${report.summary}`,
      route: "/features/search-ad-report-assist",
      fields: [
        { label: "노출", value: fieldText(form.impressions) },
        { label: "클릭", value: fieldText(form.clicks) },
        { label: "전환", value: fieldText(form.conversions) },
        { label: "ROAS", value: fieldText(form.roas, "%") },
      ],
      input: form,
      snapshot: report,
    });

    setSavedAt(saved.createdAt);
    setSaveMessage("저장됨");
    window.setTimeout(() => setSaveMessage(null), 1600);
  };

  const applyHistory = (record: SavedActivityRecord) => {
    setForm(record.input as ReportForm);
    setReport(record.snapshot as SearchAdReportOutput);
    setSavedAt(record.createdAt);
  };

  return (
    <FeatureShell
      title="검색광고 리포트 보조"
      description="광고 지표를 넣으면 규칙 기반 리포트 문구와 권장 액션을 정리합니다."
    >
      <ActiveFeatureLayout
        controls={
          <div className="space-y-6">
            <div className="rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-[var(--text-strong)]">입력 지표</p>
                <StatusBadge tone="neutral">규칙 기반</StatusBadge>
              </div>

              <div className="mt-4 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    ["impressions", "노출수"],
                    ["clicks", "클릭수"],
                    ["ctr", "CTR(선택)"],
                    ["conversions", "전환수"],
                    ["cvr", "CVR(선택)"],
                    ["cpa", "CPA"],
                    ["roas", "ROAS"],
                  ].map(([key, label]) => (
                    <label key={key} className="block">
                      <span className="mb-2 block text-sm font-medium text-[var(--text-body)]">
                        {label}
                      </span>
                      <input
                        value={form[key as keyof ReportForm]}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            [key]: event.target.value,
                          }))
                        }
                        inputMode="decimal"
                        className="w-full rounded-lg border border-[var(--line)] bg-[var(--bg-elevated)] px-3 py-2.5 text-sm text-[var(--text-strong)] outline-none transition focus:border-[var(--line-strong)]"
                      />
                    </label>
                  ))}
                </div>

                <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-4">
                  <p className="text-sm font-medium text-[var(--text-strong)]">전기 비교</p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {[
                      ["previousCtr", "이전 CTR"],
                      ["previousCvr", "이전 CVR"],
                      ["previousCpa", "이전 CPA"],
                      ["previousRoas", "이전 ROAS"],
                    ].map(([key, label]) => (
                      <label key={key} className="block">
                        <span className="mb-2 block text-sm font-medium text-[var(--text-body)]">
                          {label}
                        </span>
                        <input
                          value={form[key as keyof ReportForm]}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              [key]: event.target.value,
                            }))
                          }
                          inputMode="decimal"
                          className="w-full rounded-lg border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-3 py-2.5 text-sm text-[var(--text-strong)] outline-none transition focus:border-[var(--line-strong)]"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={!canGenerate || isPending}
                  className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--bg-soft)] text-sm font-medium text-[var(--text-strong)] transition hover:border-[var(--line-strong)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isPending ? "생성 중..." : "리포트 생성"}
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!report}
                  className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-[var(--line)] bg-transparent text-sm font-medium text-[var(--text-body)] transition hover:border-[var(--line-strong)] hover:text-[var(--text-strong)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {saveMessage ?? "현재 결과 저장"}
                </button>
              </div>
            </div>

            <HistoryPanel
              title="저장 결과"
              description="저장한 리포트 초안을 다시 엽니다."
              records={records.slice(0, 5)}
              emptyTitle="저장 없음"
              emptyDescription="리포트를 저장하면 여기서 다시 불러올 수 있습니다."
              onApply={applyHistory}
              onRemove={removeRecord}
            />
          </div>
        }
      >
        {!report ? (
          <EmptyState
            title="광고 지표를 입력하세요"
            description="노출, 클릭, 전환, ROAS를 넣고 리포트 생성 버튼을 눌러 초안을 만듭니다."
          />
        ) : (
          <>
            <ResultSummaryGrid>
              <MetricCard
                label="판정"
                value={getToneLabel(report.tone)}
                helper={report.headline}
              />
              <MetricCard
                label="CTR / CVR"
                value={`${report.derived.ctr ?? "-"}% / ${report.derived.cvr ?? "-"}%`}
                helper="입력값이 없으면 노출·클릭·전환 기준으로 계산"
              />
              <MetricCard
                label="저장 상태"
                value={savedAt ? "저장됨" : "미저장"}
                helper={savedAt ? formatDateTime(savedAt) : "필요 시 저장해 다시 불러옵니다."}
              />
            </ResultSummaryGrid>

            <ResultPanel
              title="리포트 한줄 요약"
              description={report.summary}
              aside={<StatusBadge tone={getToneBadge(report.tone)}>{getToneLabel(report.tone)}</StatusBadge>}
            >
              <div className="rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-4 py-4">
                <p className="text-sm leading-6 text-[var(--text-body)]">
                  {report.headline}. {report.summary}
                </p>
              </div>
            </ResultPanel>

            <ResultPanel
              title="지표 해석"
              description="주요 성과 지표를 규칙 기준으로 정리했습니다."
              aside={<StatusBadge tone="neutral">MVP</StatusBadge>}
            >
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {report.metrics.map((metric) => (
                  <div
                    key={metric.key}
                    className="rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-4 py-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-[var(--text-strong)]">{metric.label}</p>
                      <StatusBadge tone={getToneBadge(metric.tone)}>
                        {getToneLabel(metric.tone)}
                      </StatusBadge>
                    </div>
                    <p className="mt-3 text-lg font-semibold text-[var(--text-strong)]">
                      {metric.value === null ? "-" : metric.label === "CPA" ? `${metric.value.toLocaleString("ko-KR")}원` : `${metric.value}%`}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--text-body)]">{metric.comment}</p>
                  </div>
                ))}
              </div>
            </ResultPanel>

            <ResultPanel
              title="보고 문구 초안"
              description="주간·월간 보고에 바로 붙일 수 있는 문구입니다."
            >
              <div className="space-y-3">
                <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-4">
                  <p className="text-sm leading-7 text-[var(--text-body)]">
                    {report.headline}. {report.summary}
                  </p>
                </div>
                <ul className="space-y-3">
                  {report.comments.map((comment, index) => (
                    <SummaryLine key={`${comment}-${index}`} text={comment} />
                  ))}
                </ul>
              </div>
            </ResultPanel>

            <ResultPanel
              title="권장 액션"
              description="다음 점검 항목만 짧게 정리했습니다."
            >
              <ul className="space-y-3">
                {report.actions.map((action, index) => (
                  <SummaryLine key={`${action}-${index}`} text={action} />
                ))}
              </ul>
            </ResultPanel>
          </>
        )}
      </ActiveFeatureLayout>
    </FeatureShell>
  );
}

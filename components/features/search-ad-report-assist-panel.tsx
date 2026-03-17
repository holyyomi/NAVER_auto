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

function formatPercent(value: number | null) {
  return value === null ? "-" : `${value.toLocaleString("ko-KR")}%`;
}

function formatWon(value: number | null) {
  return value === null ? "-" : `${value.toLocaleString("ko-KR")}원`;
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

function BulletLine({ text }: { text: string }) {
  return (
    <li className="rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm leading-6 text-[var(--text-body)]">
      {text}
    </li>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-[var(--text-body)]">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        inputMode="decimal"
        className="w-full rounded-lg border border-[var(--line)] bg-[var(--bg-elevated)] px-3 py-2.5 text-sm text-[var(--text-strong)] outline-none transition focus:border-[var(--line-strong)]"
      />
    </label>
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
  const preview = useMemo(() => buildSearchAdReport(parsedInput), [parsedInput]);
  const canGenerate =
    parsedInput.impressions !== null ||
    parsedInput.clicks !== null ||
    parsedInput.conversions !== null ||
    parsedInput.cpa !== null ||
    parsedInput.roas !== null;

  const handleGenerate = () => {
    if (!canGenerate) {
      return;
    }

    startTransition(() => {
      setReport(preview);
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
      description: `${report.headline} ${report.summary}`,
      route: "/features/search-ad-report-assist",
      fields: [
        { label: "노출", value: fieldText(form.impressions, "회") },
        { label: "클릭", value: fieldText(form.clicks, "회") },
        { label: "전환", value: fieldText(form.conversions, "건") },
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
      description="광고 지표를 넣으면 규칙 기반으로 내부 보고용 요약, 점검 포인트, 권장 액션을 정리합니다."
    >
      <ActiveFeatureLayout
        controls={
          <div className="space-y-6">
            <div className="rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-[var(--text-strong)]">입력 지표</p>
                  <p className="mt-1 text-xs text-[var(--text-dim)]">
                    비어 있는 CTR, CVR은 가능한 경우 자동 계산됩니다.
                  </p>
                </div>
                <StatusBadge tone="neutral">규칙 기반</StatusBadge>
              </div>

              <div className="mt-4 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <InputField
                    label="노출수"
                    value={form.impressions}
                    onChange={(value) =>
                      setForm((current) => ({ ...current, impressions: value }))
                    }
                    placeholder="예: 120000"
                  />
                  <InputField
                    label="클릭수"
                    value={form.clicks}
                    onChange={(value) => setForm((current) => ({ ...current, clicks: value }))}
                    placeholder="예: 3600"
                  />
                  <InputField
                    label="CTR"
                    value={form.ctr}
                    onChange={(value) => setForm((current) => ({ ...current, ctr: value }))}
                    placeholder="비우면 자동 계산"
                  />
                  <InputField
                    label="전환수"
                    value={form.conversions}
                    onChange={(value) =>
                      setForm((current) => ({ ...current, conversions: value }))
                    }
                    placeholder="예: 128"
                  />
                  <InputField
                    label="CVR"
                    value={form.cvr}
                    onChange={(value) => setForm((current) => ({ ...current, cvr: value }))}
                    placeholder="비우면 자동 계산"
                  />
                  <InputField
                    label="CPA"
                    value={form.cpa}
                    onChange={(value) => setForm((current) => ({ ...current, cpa: value }))}
                    placeholder="예: 28000"
                  />
                  <InputField
                    label="ROAS"
                    value={form.roas}
                    onChange={(value) => setForm((current) => ({ ...current, roas: value }))}
                    placeholder="예: 430"
                  />
                </div>

                <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-[var(--text-strong)]">전기 비교</p>
                      <p className="mt-1 text-xs text-[var(--text-dim)]">
                        선택 입력입니다. 넣으면 개선/악화 문구가 함께 생성됩니다.
                      </p>
                    </div>
                    <StatusBadge tone="pending">선택</StatusBadge>
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <InputField
                      label="이전 CTR"
                      value={form.previousCtr}
                      onChange={(value) =>
                        setForm((current) => ({ ...current, previousCtr: value }))
                      }
                    />
                    <InputField
                      label="이전 CVR"
                      value={form.previousCvr}
                      onChange={(value) =>
                        setForm((current) => ({ ...current, previousCvr: value }))
                      }
                    />
                    <InputField
                      label="이전 CPA"
                      value={form.previousCpa}
                      onChange={(value) =>
                        setForm((current) => ({ ...current, previousCpa: value }))
                      }
                    />
                    <InputField
                      label="이전 ROAS"
                      value={form.previousRoas}
                      onChange={(value) =>
                        setForm((current) => ({ ...current, previousRoas: value }))
                      }
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-4">
                  <p className="text-sm font-medium text-[var(--text-strong)]">자동 계산 미리보기</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <MetricCard
                      label="계산 CTR"
                      value={formatPercent(preview.derived.ctr)}
                      helper="노출수와 클릭수로 계산"
                    />
                    <MetricCard
                      label="계산 CVR"
                      value={formatPercent(preview.derived.cvr)}
                      helper="클릭수와 전환수로 계산"
                    />
                    <MetricCard
                      label="추정 광고비"
                      value={formatWon(preview.derived.estimatedSpend)}
                      helper="전환수 × CPA 기준"
                    />
                    <MetricCard
                      label="추정 매출"
                      value={formatWon(preview.derived.estimatedRevenue)}
                      helper="추정 광고비 × ROAS 기준"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={!canGenerate || isPending}
                  className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--bg-soft)] text-sm font-medium text-[var(--text-strong)] transition hover:border-[var(--line-strong)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isPending ? "생성 중..." : "리포트 초안 생성"}
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
              description="저장한 리포트 초안을 다시 불러옵니다."
              records={records.slice(0, 5)}
              emptyTitle="저장 이력 없음"
              emptyDescription="리포트를 저장하면 여기서 다시 불러올 수 있습니다."
              onApply={applyHistory}
              onRemove={removeRecord}
            />
          </div>
        }
      >
        {!report ? (
          <EmptyState
            title="광고 지표를 입력해 주세요."
            description="노출수, 클릭수, 전환수, CPA, ROAS를 넣고 리포트 초안 생성 버튼을 누르면 내부 보고용 문구를 정리합니다."
          />
        ) : (
          <>
            <ResultSummaryGrid>
              <MetricCard
                label="종합 판단"
                value={getToneLabel(report.tone)}
                helper={report.headline}
              />
              <MetricCard
                label="핵심 효율"
                value={`${formatPercent(report.derived.ctr)} / ${formatPercent(report.derived.cvr)}`}
                helper="CTR / CVR 기준"
              />
              <MetricCard
                label="저장 상태"
                value={savedAt ? "저장됨" : "미저장"}
                helper={savedAt ? formatDateTime(savedAt) : "필요 시 결과를 저장해 다시 불러올 수 있습니다."}
              />
            </ResultSummaryGrid>

            <ResultPanel
              title="핵심 요약"
              description="내부 리포트 첫 문단에 바로 옮길 수 있는 요약입니다."
              aside={<StatusBadge tone={getToneBadge(report.tone)}>{getToneLabel(report.tone)}</StatusBadge>}
            >
              <div className="space-y-3">
                <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-4">
                  <p className="text-sm leading-7 text-[var(--text-body)]">
                    {report.headline} {report.summary}
                  </p>
                </div>
                <ul className="space-y-3">
                  {report.keySummary.map((line, index) => (
                    <BulletLine key={`${line}-${index}`} text={line} />
                  ))}
                </ul>
              </div>
            </ResultPanel>

            <ResultPanel
              title="지표 해석"
              description="핵심 효율 지표를 규칙 기준으로 해석합니다."
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
                      {metric.unit === "원"
                        ? formatWon(metric.value)
                        : formatPercent(metric.value)}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--text-body)]">{metric.comment}</p>
                    <p className="mt-2 text-xs leading-5 text-[var(--text-dim)]">
                      {metric.comparison ?? "전기 비교 값이 없어 증감 문구는 생성하지 않았습니다."}
                    </p>
                  </div>
                ))}
              </div>
            </ResultPanel>

            <ResultPanel
              title="좋은 점"
              description="현재 성과에서 유지하거나 확장할 수 있는 부분입니다."
            >
              <ul className="space-y-3">
                {report.strengths.map((item, index) => (
                  <BulletLine key={`${item}-${index}`} text={item} />
                ))}
              </ul>
            </ResultPanel>

            <ResultPanel
              title="점검 포인트"
              description="리포트에 함께 적어둘 만한 리스크와 확인 항목입니다."
            >
              <ul className="space-y-3">
                {report.watchPoints.map((item, index) => (
                  <BulletLine key={`${item}-${index}`} text={item} />
                ))}
              </ul>
            </ResultPanel>

            <ResultPanel
              title="권장 액션"
              description="다음 운영 액션으로 바로 옮길 수 있는 제안입니다."
            >
              <ul className="space-y-3">
                {report.actions.map((action, index) => (
                  <BulletLine key={`${action}-${index}`} text={action} />
                ))}
              </ul>
            </ResultPanel>

            <ResultPanel
              title="보고 문구 초안"
              description="메신저나 주간 보고 문서에 바로 붙여 넣기 쉬운 형태입니다."
            >
              <div className="rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-4 py-4">
                <p className="text-sm leading-7 text-[var(--text-body)]">
                  {report.headline} {report.summary}{" "}
                  {report.strengths[0] ? `${report.strengths[0]} ` : ""}
                  {report.watchPoints[0] ? `${report.watchPoints[0]} ` : ""}
                  {report.actions[0] ? `다음 액션으로는 ${report.actions[0]}` : ""}
                </p>
              </div>
            </ResultPanel>
          </>
        )}
      </ActiveFeatureLayout>
    </FeatureShell>
  );
}

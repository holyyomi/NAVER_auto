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
  buildAdOperationsAssist,
  type AdOperationsInput,
  type AdOperationsOutput,
  type OperationStatus,
  type RuleTone,
  type TrendDirection,
} from "@/lib/operations/ad-operations-assist-rules";

type OperationForm = {
  ctr: string;
  cpc: string;
  cvr: string;
  cpa: string;
  roas: string;
  budgetBurnRate: string;
  impressionsTrend: TrendDirection | "";
  clicksTrend: TrendDirection | "";
  conversionsTrend: TrendDirection | "";
};

const initialForm: OperationForm = {
  ctr: "2.4",
  cpc: "980",
  cvr: "2.8",
  cpa: "42000",
  roas: "310",
  budgetBurnRate: "88",
  impressionsTrend: "flat",
  clicksTrend: "up",
  conversionsTrend: "flat",
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

function getStatusLabel(status: OperationStatus) {
  if (status === "risk") return "위험";
  if (status === "review") return "점검 필요";
  return "정상";
}

function getStatusTone(status: OperationStatus) {
  if (status === "risk") return "attention" as const;
  if (status === "review") return "pending" as const;
  return "active" as const;
}

function getRuleToneLabel(tone: RuleTone) {
  if (tone === "warning") return "점검";
  if (tone === "positive") return "양호";
  return "보통";
}

function getRuleToneBadge(tone: RuleTone) {
  if (tone === "warning") return "attention" as const;
  if (tone === "positive") return "active" as const;
  return "neutral" as const;
}

function toInput(form: OperationForm): AdOperationsInput {
  return {
    ctr: parseNumber(form.ctr),
    cpc: parseNumber(form.cpc),
    cvr: parseNumber(form.cvr),
    cpa: parseNumber(form.cpa),
    roas: parseNumber(form.roas),
    budgetBurnRate: parseNumber(form.budgetBurnRate),
    impressionsTrend: form.impressionsTrend || null,
    clicksTrend: form.clicksTrend || null,
    conversionsTrend: form.conversionsTrend || null,
  };
}

function createTitle(input: AdOperationsInput) {
  return `광고 운영 점검 · ROAS ${input.roas ?? "-"}% · CPA ${input.cpa ?? "-"}원`;
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

function TrendSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: TrendDirection | "";
  onChange: (value: TrendDirection | "") => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-[var(--text-body)]">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as TrendDirection | "")}
        className="w-full rounded-lg border border-[var(--line)] bg-[var(--bg-elevated)] px-3 py-2.5 text-sm text-[var(--text-strong)] outline-none transition focus:border-[var(--line-strong)]"
      >
        <option value="">선택 안 함</option>
        <option value="up">상승</option>
        <option value="flat">유지</option>
        <option value="down">하락</option>
      </select>
    </label>
  );
}

export function AdOperationsAssistPanel() {
  const [form, setForm] = useState<OperationForm>(initialForm);
  const [result, setResult] = useState<AdOperationsOutput | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { records, saveRecord, removeRecord } = useActivityHistory("ad-operations-assist");

  const parsedInput = useMemo(() => toInput(form), [form]);
  const preview = useMemo(() => buildAdOperationsAssist(parsedInput), [parsedInput]);
  const canGenerate =
    parsedInput.ctr !== null ||
    parsedInput.cpc !== null ||
    parsedInput.cvr !== null ||
    parsedInput.cpa !== null ||
    parsedInput.roas !== null ||
    parsedInput.budgetBurnRate !== null;

  const handleGenerate = () => {
    if (!canGenerate) {
      return;
    }

    startTransition(() => {
      setResult(preview);
      setSavedAt(null);
    });
  };

  const handleSave = () => {
    if (!result) {
      return;
    }

    const saved = saveRecord({
      feature: "ad-operations-assist",
      featureLabel: "광고 운영 보조",
      title: createTitle(parsedInput),
      description: `${result.headline} ${result.summary}`,
      route: "/features/ad-operations-assist",
      fields: [
        { label: "CTR", value: fieldText(form.ctr, "%") },
        { label: "CPA", value: fieldText(form.cpa, "원") },
        { label: "ROAS", value: fieldText(form.roas, "%") },
        { label: "소진율", value: fieldText(form.budgetBurnRate, "%") },
      ],
      input: form,
      snapshot: result,
    });

    setSavedAt(saved.createdAt);
    setSaveMessage("저장됨");
    window.setTimeout(() => setSaveMessage(null), 1600);
  };

  const applyHistory = (record: SavedActivityRecord) => {
    setForm(record.input as OperationForm);
    setResult(record.snapshot as AdOperationsOutput);
    setSavedAt(record.createdAt);
  };

  return (
    <FeatureShell
      title="광고 운영 보조"
      description="캠페인 성과와 집행 흐름을 넣으면 운영 상태, 문제 가능 구간, 바로 할 액션을 규칙 기반으로 정리합니다."
    >
      <ActiveFeatureLayout
        controls={
          <div className="space-y-6">
            <div className="rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-[var(--text-strong)]">운영 점검 입력</p>
                  <p className="mt-1 text-xs text-[var(--text-dim)]">
                    캠페인 운영 상태 판단에 필요한 핵심 지표만 입력합니다.
                  </p>
                </div>
                <StatusBadge tone="neutral">규칙 기반</StatusBadge>
              </div>

              <div className="mt-4 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <InputField
                    label="CTR"
                    value={form.ctr}
                    onChange={(value) => setForm((current) => ({ ...current, ctr: value }))}
                    placeholder="예: 2.4"
                  />
                  <InputField
                    label="CPC"
                    value={form.cpc}
                    onChange={(value) => setForm((current) => ({ ...current, cpc: value }))}
                    placeholder="예: 980"
                  />
                  <InputField
                    label="CVR"
                    value={form.cvr}
                    onChange={(value) => setForm((current) => ({ ...current, cvr: value }))}
                    placeholder="예: 2.8"
                  />
                  <InputField
                    label="CPA"
                    value={form.cpa}
                    onChange={(value) => setForm((current) => ({ ...current, cpa: value }))}
                    placeholder="예: 42000"
                  />
                  <InputField
                    label="ROAS"
                    value={form.roas}
                    onChange={(value) => setForm((current) => ({ ...current, roas: value }))}
                    placeholder="예: 310"
                  />
                  <InputField
                    label="예산 소진율"
                    value={form.budgetBurnRate}
                    onChange={(value) =>
                      setForm((current) => ({ ...current, budgetBurnRate: value }))
                    }
                    placeholder="예: 88"
                  />
                </div>

                <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-[var(--text-strong)]">추세 방향</p>
                      <p className="mt-1 text-xs text-[var(--text-dim)]">
                        선택 입력입니다. 최근 흐름을 함께 넣으면 원인 후보가 더 구체화됩니다.
                      </p>
                    </div>
                    <StatusBadge tone="pending">선택</StatusBadge>
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-3">
                    <TrendSelect
                      label="노출 추세"
                      value={form.impressionsTrend}
                      onChange={(value) =>
                        setForm((current) => ({ ...current, impressionsTrend: value }))
                      }
                    />
                    <TrendSelect
                      label="클릭 추세"
                      value={form.clicksTrend}
                      onChange={(value) =>
                        setForm((current) => ({ ...current, clicksTrend: value }))
                      }
                    />
                    <TrendSelect
                      label="전환 추세"
                      value={form.conversionsTrend}
                      onChange={(value) =>
                        setForm((current) => ({ ...current, conversionsTrend: value }))
                      }
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={!canGenerate || isPending}
                  className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--bg-soft)] text-sm font-medium text-[var(--text-strong)] transition hover:border-[var(--line-strong)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isPending ? "분석 중..." : "운영 상태 점검"}
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!result}
                  className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-[var(--line)] bg-transparent text-sm font-medium text-[var(--text-body)] transition hover:border-[var(--line-strong)] hover:text-[var(--text-strong)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {saveMessage ?? "현재 결과 저장"}
                </button>
              </div>
            </div>

            <HistoryPanel
              title="저장 결과"
              description="저장한 운영 점검 결과를 다시 불러옵니다."
              records={records.slice(0, 5)}
              emptyTitle="저장 이력 없음"
              emptyDescription="운영 점검 결과를 저장하면 여기서 다시 불러올 수 있습니다."
              onApply={applyHistory}
              onRemove={removeRecord}
            />
          </div>
        }
      >
        {!result ? (
          <EmptyState
            title="캠페인 지표를 입력해 주세요."
            description="CTR, CPC, CVR, CPA, ROAS, 예산 소진율을 넣고 운영 상태 점검 버튼을 누르면 현재 상태와 액션을 정리합니다."
          />
        ) : (
          <>
            <ResultSummaryGrid>
              <MetricCard
                label="현재 상태"
                value={getStatusLabel(result.status)}
                helper={result.headline}
              />
              <MetricCard
                label="주요 효율"
                value={`${formatPercent(parsedInput.ctr)} / ${formatPercent(parsedInput.roas)}`}
                helper="CTR / ROAS 기준"
              />
              <MetricCard
                label="저장 상태"
                value={savedAt ? "저장됨" : "미저장"}
                helper={savedAt ? formatDateTime(savedAt) : "필요 시 결과를 저장해 다시 확인할 수 있습니다."}
              />
            </ResultSummaryGrid>

            <ResultPanel
              title="현재 상태"
              description="운영자가 먼저 확인할 현재 판단입니다."
              aside={<StatusBadge tone={getStatusTone(result.status)}>{getStatusLabel(result.status)}</StatusBadge>}
            >
              <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-4">
                <p className="text-sm leading-7 text-[var(--text-body)]">
                  {result.headline} {result.summary}
                </p>
              </div>
            </ResultPanel>

            <ResultPanel
              title="지표 점검"
              description="입력한 지표를 운영 기준으로 빠르게 해석합니다."
              aside={<StatusBadge tone="neutral">MVP</StatusBadge>}
            >
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {result.metrics.map((metric) => (
                  <div
                    key={metric.key}
                    className="rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-4 py-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-[var(--text-strong)]">{metric.label}</p>
                      <StatusBadge tone={getRuleToneBadge(metric.tone)}>
                        {getRuleToneLabel(metric.tone)}
                      </StatusBadge>
                    </div>
                    <p className="mt-3 text-lg font-semibold text-[var(--text-strong)]">
                      {metric.unit === "원"
                        ? formatWon(metric.value)
                        : formatPercent(metric.value)}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--text-body)]">{metric.comment}</p>
                  </div>
                ))}
              </div>
            </ResultPanel>

            <ResultPanel
              title="문제 가능 구간"
              description="효율 저하 원인 후보를 짧게 정리합니다."
            >
              <ul className="space-y-3">
                {result.causes.map((cause, index) => (
                  <BulletLine key={`${cause}-${index}`} text={cause} />
                ))}
              </ul>
            </ResultPanel>

            <ResultPanel
              title="권장 운영 액션"
              description="바로 실행할 수 있는 액션만 우선 정리했습니다."
            >
              <ul className="space-y-3">
                {result.actions.map((action, index) => (
                  <BulletLine key={`${action}-${index}`} text={action} />
                ))}
              </ul>
            </ResultPanel>

            <ResultPanel
              title="운영 메모"
              description="내부 메신저나 운영 코멘트에 바로 붙일 수 있는 짧은 문구입니다."
            >
              <div className="rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-4 py-4">
                <p className="text-sm leading-7 text-[var(--text-body)]">
                  {result.note}
                </p>
              </div>
            </ResultPanel>
          </>
        )}
      </ActiveFeatureLayout>
    </FeatureShell>
  );
}

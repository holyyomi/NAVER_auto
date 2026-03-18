"use client";

import { useMemo, useState } from "react";
import { ActiveFeatureLayout } from "@/components/features/active-feature-layout";
import { FeatureShell } from "@/components/features/feature-shell";
import { ResultPanel } from "@/components/features/result-panel";
import { ResultSummaryGrid } from "@/components/features/result-summary-grid";
import { EmptyState } from "@/components/features/shared-states";
import { HistoryPanel } from "@/components/history/history-panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { useActivityHistory } from "@/hooks/use-activity-history";
import { useOpenSavedItem } from "@/hooks/use-open-saved-item";
import { restoreAdOperationsRecord } from "@/lib/history/restore";
import {
  buildAdOperationsAssist,
  type AdOperationsInput,
  type AdOperationsOutput,
  type OperationStatus,
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
  const parsed = Number(value.trim().replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
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

function formatNumber(value: number | null, suffix = "") {
  return value === null ? "-" : `${value.toLocaleString("ko-KR")}${suffix}`;
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

function buildOperationSummaryCopy(result: AdOperationsOutput) {
  return [
    `[현재 상태]`,
    `${result.headline} ${result.summary}`,
    "",
    `[문제 가능 구간]`,
    ...result.causes.map((item) => `- ${item}`),
    "",
    `[바로 할 액션]`,
    ...result.actions.map((item) => `- ${item}`),
    "",
    `[운영 메모]`,
    result.note,
  ].join("\n");
}

function ActionList({ items }: { items: string[] }) {
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div
          key={`${item}-${index}`}
          className="rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm leading-6 text-[var(--text-body)]"
        >
          {item}
        </div>
      ))}
    </div>
  );
}

export function AdOperationsAssistPanel() {
  const [form, setForm] = useState<OperationForm>(initialForm);
  const [result, setResult] = useState<AdOperationsOutput | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [restoreNotice, setRestoreNotice] = useState<string | null>(null);
  const { records, saveRecord, removeRecord } = useActivityHistory("ad-operations-assist");
  const parsedInput = useMemo(() => toInput(form), [form]);

  const handleAnalyze = () => {
    setResult(buildAdOperationsAssist(parsedInput));
    setRestoreNotice(null);
  };

  const flashCopy = (message: string) => {
    setCopyMessage(message);
    window.setTimeout(() => setCopyMessage(null), 1600);
  };

  const handleCopySummary = async () => {
    if (!result) return;

    try {
      await navigator.clipboard.writeText(buildOperationSummaryCopy(result));
      flashCopy("운영 요약을 복사했습니다.");
    } catch {
      flashCopy("클립보드 복사에 실패했습니다.");
    }
  };

  const handleSave = () => {
    if (!result) {
      return;
    }

    saveRecord({
      featureType: "ad-operations-assist",
      title: `광고 운영 점검 | ROAS ${formatNumber(parsedInput.roas, "%")}`,
      summary: `${result.headline} 문제 구간과 바로 할 액션 메모를 저장했습니다.`,
      fields: [
        { label: "CTR", value: formatNumber(parsedInput.ctr, "%") },
        { label: "CPA", value: formatNumber(parsedInput.cpa, "원") },
        { label: "ROAS", value: formatNumber(parsedInput.roas, "%") },
        { label: "소진율", value: formatNumber(parsedInput.budgetBurnRate, "%") },
      ],
      inputSnapshot: form,
      outputSnapshot: result,
    });

    setSaveMessage("저장 완료");
    window.setTimeout(() => setSaveMessage(null), 1600);
  };

  const applySaved = (record: (typeof records)[number]) => {
    const restored = restoreAdOperationsRecord<OperationForm>(record);
    if (!restored.ok) {
      setRestoreNotice(restored.message);
      return;
    }

    setForm(restored.input);
    setResult(restored.output);
    setRestoreNotice(null);
  };

  useOpenSavedItem("ad-operations-assist", applySaved);

  return (
    <FeatureShell
      title="광고 운영 보조"
      description="캠페인 상태를 빠르게 점검하고 바로 실행할 운영 액션을 정리하는 규칙 기반 점검 도구입니다."
    >
      <ActiveFeatureLayout
        controls={
          <div className="space-y-6">
            <div className="rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-4 py-4">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-[var(--text-strong)]">운영 지표 입력</p>
                  <p className="mt-1 text-xs text-[var(--text-dim)]">
                    효율 지표와 추세를 함께 넣으면 현재 상태, 문제 가능 구간, 바로 할 액션을 정리합니다.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    ["CTR", "ctr"],
                    ["CPC", "cpc"],
                    ["CVR", "cvr"],
                    ["CPA", "cpa"],
                    ["ROAS", "roas"],
                    ["예산 소진율", "budgetBurnRate"],
                  ].map(([label, key]) => (
                    <label key={key} className="block">
                      <span className="mb-2 block text-sm font-medium text-[var(--text-body)]">
                        {label}
                      </span>
                      <input
                        value={form[key as keyof OperationForm] as string}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, [key]: event.target.value }))
                        }
                        className="w-full rounded-lg border border-[var(--line)] bg-[var(--bg-elevated)] px-3 py-2.5 text-sm text-[var(--text-strong)] outline-none transition focus:border-[var(--line-strong)]"
                      />
                    </label>
                  ))}
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    ["노출 추세", "impressionsTrend"],
                    ["클릭 추세", "clicksTrend"],
                    ["전환 추세", "conversionsTrend"],
                  ].map(([label, key]) => (
                    <label key={key} className="block">
                      <span className="mb-2 block text-sm font-medium text-[var(--text-body)]">
                        {label}
                      </span>
                      <select
                        value={form[key as keyof OperationForm] as string}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            [key]: event.target.value as TrendDirection | "",
                          }))
                        }
                        className="w-full rounded-lg border border-[var(--line)] bg-[var(--bg-elevated)] px-3 py-2.5 text-sm text-[var(--text-strong)] outline-none transition focus:border-[var(--line-strong)]"
                      >
                        <option value="">선택 안 함</option>
                        <option value="up">상승</option>
                        <option value="flat">유지</option>
                        <option value="down">하락</option>
                      </select>
                    </label>
                  ))}
                </div>

                <div className="grid gap-2">
                  <button
                    type="button"
                    onClick={handleAnalyze}
                    className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--bg-soft)] text-sm font-medium text-[var(--text-strong)] transition hover:border-[var(--line-strong)]"
                  >
                    운영 상태 점검
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={!result}
                    className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-[var(--line)] bg-transparent text-sm font-medium text-[var(--text-body)] transition hover:border-[var(--line-strong)] hover:text-[var(--text-strong)] disabled:opacity-40"
                  >
                    {saveMessage ?? (result ? "현재 결과 저장" : "점검 생성 후 저장 가능")}
                  </button>
                </div>
                {restoreNotice ? (
                  <p className="text-xs text-[var(--warning-text)]">{restoreNotice}</p>
                ) : null}
              </div>
            </div>

            <HistoryPanel
              title="다시 보기"
              description="저장한 운영 점검 결과를 다시 열고 삭제할 수 있습니다."
              records={records.slice(0, 5)}
              emptyTitle="저장 항목 없음"
              emptyDescription="운영 점검 결과를 저장하면 최근 저장과 이 영역에서 다시 열 수 있습니다."
              onApply={applySaved}
              onRemove={removeRecord}
            />
          </div>
        }
      >
        {!result ? (
          <EmptyState
            title="운영 지표를 입력해 주세요."
            description="현재 캠페인 상태를 점검하고 바로 실행할 운영 액션을 정리할 수 있습니다."
          />
        ) : (
          <>
            <ResultSummaryGrid>
              <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-4">
                <p className="text-[11px] tracking-[0.14em] text-[var(--text-dim)]">상태</p>
                <p className="mt-2 text-base font-semibold text-[var(--text-strong)]">
                  {getStatusLabel(result.status)}
                </p>
              </div>
              <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-4">
                <p className="text-[11px] tracking-[0.14em] text-[var(--text-dim)]">ROAS</p>
                <p className="mt-2 text-base font-semibold text-[var(--text-strong)]">
                  {formatNumber(parsedInput.roas, "%")}
                </p>
              </div>
              <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-4">
                <p className="text-[11px] tracking-[0.14em] text-[var(--text-dim)]">CPA</p>
                <p className="mt-2 text-base font-semibold text-[var(--text-strong)]">
                  {formatNumber(parsedInput.cpa, "원")}
                </p>
              </div>
            </ResultSummaryGrid>

            <ResultPanel
              title="현재 상태"
              description="현재 캠페인 상태를 내부 공유용으로 바로 전달할 수 있는 요약입니다."
              aside={
                <div className="flex flex-wrap items-center gap-2">
                  {copyMessage ? <span className="text-xs text-[var(--text-dim)]">{copyMessage}</span> : null}
                  <button
                    type="button"
                    onClick={handleCopySummary}
                    className="inline-flex h-8 items-center justify-center rounded-lg border border-[var(--line)] px-3 text-xs font-medium text-[var(--text-body)] transition hover:border-[var(--line-strong)] hover:text-[var(--text-strong)]"
                  >
                    운영 요약 복사
                  </button>
                  <StatusBadge tone={getStatusTone(result.status)}>{getStatusLabel(result.status)}</StatusBadge>
                </div>
              }
            >
              <div className="rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-4 py-4 text-sm leading-7 text-[var(--text-body)]">
                {result.headline} {result.summary}
              </div>
            </ResultPanel>

            <ResultPanel
              title="문제 가능 구간"
              description="현재 효율 저하나 운영 리스크가 발생할 가능성이 높은 구간입니다."
            >
              <ActionList items={result.causes} />
            </ResultPanel>

            <ResultPanel
              title="바로 할 액션"
              description="실무자가 바로 점검하거나 조정할 수 있는 우선 액션입니다."
            >
              <ActionList items={result.actions} />
            </ResultPanel>

            <ResultPanel
              title="운영 메모"
              description="내부 코멘트나 일일 운영 메모에 바로 붙여 넣기 쉬운 정리 문장입니다."
            >
              <div className="rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-4 py-4 text-sm leading-7 text-[var(--text-body)]">
                {result.note}
              </div>
            </ResultPanel>
          </>
        )}
      </ActiveFeatureLayout>
    </FeatureShell>
  );
}

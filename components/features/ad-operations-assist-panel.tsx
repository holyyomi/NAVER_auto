"use client";

import { useMemo, useState, useTransition } from "react";
import { ActiveFeatureLayout } from "@/components/features/active-feature-layout";
import { EmptyState } from "@/components/features/shared-states";
import { FeatureShell } from "@/components/features/feature-shell";
import { ResultPanel } from "@/components/features/result-panel";
import { FeatureUsageGuide } from "@/components/guidance/feature-usage-guide";
import { HistoryPanel } from "@/components/history/history-panel";
import { CopyButton } from "@/components/ui/copy-button";
import { SampleDataButton } from "@/components/ui/sample-data-button";
import { useActivityHistory } from "@/hooks/use-activity-history";
import { useOpenSavedItem } from "@/hooks/use-open-saved-item";
import { featureUsageGuides } from "@/lib/guidance";
import { restoreAdOperationsRecord } from "@/lib/history/restore";
import {
  buildAdOperationsAssist,
  type AdOperationsInput,
  type AdOperationsOutput,
} from "@/lib/operations/ad-operations-assist-rules";

type OperationForm = {
  mediaPlatform: string;
  campaignName: string;
  period: string;
  ctrDrop: boolean;
  cpcIncrease: boolean;
  conversionDrop: boolean;
  lowImpressions: boolean;
  creativeFatigue: boolean;
  budgetIssue: boolean;
  landingIssue: boolean;
  notes: string;
};

const sampleForm: OperationForm = {
  mediaPlatform: "네이버 검색광고",
  campaignName: "병원 브랜드 캠페인",
  period: "2026-03-25",
  ctrDrop: true,
  cpcIncrease: true,
  conversionDrop: true,
  lowImpressions: false,
  creativeFatigue: true,
  budgetIssue: false,
  landingIssue: false,
  notes: "최근 3일간 전환이 줄고 CPC가 올랐습니다.",
};

const issueOptions: Array<{ key: keyof Pick<OperationForm,
  "ctrDrop" | "cpcIncrease" | "conversionDrop" | "lowImpressions" | "creativeFatigue" | "budgetIssue" | "landingIssue"
>; label: string }> = [
  { key: "ctrDrop", label: "CTR 하락" },
  { key: "cpcIncrease", label: "CPC 상승" },
  { key: "conversionDrop", label: "전환 감소" },
  { key: "lowImpressions", label: "노출 감소" },
  { key: "creativeFatigue", label: "소재 피로" },
  { key: "landingIssue", label: "랜딩 문제 의심" },
  { key: "budgetIssue", label: "예산 문제" },
];

type AiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function toInput(form: OperationForm): AdOperationsInput {
  return {
    mediaPlatform: form.mediaPlatform.trim(),
    campaignName: form.campaignName.trim(),
    period: form.period.trim(),
    ctrDrop: form.ctrDrop,
    cpcIncrease: form.cpcIncrease,
    conversionDrop: form.conversionDrop,
    lowImpressions: form.lowImpressions,
    creativeFatigue: form.creativeFatigue,
    budgetIssue: form.budgetIssue,
    landingIssue: form.landingIssue,
    notes: form.notes.trim(),
  };
}

function isOperationInputValid(input: AdOperationsInput) {
  if (!input.mediaPlatform || !input.campaignName || !input.period) {
    return false;
  }

  return (
    input.ctrDrop ||
    input.cpcIncrease ||
    input.conversionDrop ||
    input.lowImpressions ||
    input.creativeFatigue ||
    input.budgetIssue ||
    input.landingIssue ||
    Boolean(input.notes)
  );
}

function buildCopyText(result: AdOperationsOutput) {
  return [
    "[문제 요약]",
    result.problemSummary,
    "",
    "[원인 가설]",
    ...result.causeHypotheses.map((item) => `- ${item}`),
    "",
    "[오늘 해야 할 액션]",
    ...result.todayActions.map((item) => `- ${item}`),
    "",
    "[내일 확인할 지표]",
    ...result.tomorrowMetrics.map((item) => `- ${item}`),
  ].join("\n");
}

function OutputList({ items }: { items: string[] }) {
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div
          key={`${item}-${index}`}
          className="rounded-xl border border-[var(--line)] bg-[var(--bg-muted)] px-4 py-3 text-sm leading-6 text-[var(--text-body)]"
        >
          {item}
        </div>
      ))}
    </div>
  );
}

export function AdOperationsAssistPanel() {
  const [form, setForm] = useState<OperationForm>(sampleForm);
  const [result, setResult] = useState<AdOperationsOutput | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [restoreNotice, setRestoreNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { records, saveRecord, removeRecord } = useActivityHistory("ad-operations-assist");
  const usageGuide = featureUsageGuides["ad-operations-assist"];
  const parsedInput = useMemo(() => toInput(form), [form]);

  const flash = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(null), 1800);
  };

  const generate = () => {
    if (!isOperationInputValid(parsedInput)) {
      flash("매체명, 캠페인명, 기간을 입력하고 이슈나 메모를 남겨 주세요.");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/ai/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: "operations",
            payload: parsedInput,
          }),
        });

        const data = (await response.json()) as AiResponse<AdOperationsOutput>;
        if (data.ok) {
          setResult(data.data);
          setRestoreNotice(null);
          flash("운영 액션을 정리했습니다.");
          return;
        }

        setResult(buildAdOperationsAssist(parsedInput));
        setRestoreNotice(null);
        flash(`${data.error} 기본 결과로 대신 정리했습니다.`);
      } catch {
        setResult(buildAdOperationsAssist(parsedInput));
        setRestoreNotice(null);
        flash("AI 응답 없이 기본 결과로 정리했습니다.");
      }
    });
  };

  const saveCurrent = () => {
    if (!result) {
      return;
    }

    const issueCount = issueOptions.filter(({ key }) => form[key]).length;

    saveRecord({
      featureType: "ad-operations-assist",
      title: `${form.campaignName || "캠페인"} | ${form.period || "기간 미입력"}`,
      summary: result.problemSummary,
      fields: [
        { label: "매체", value: form.mediaPlatform || "-" },
        { label: "이슈 수", value: String(issueCount) },
      ],
      inputSnapshot: form,
      outputSnapshot: result,
    });

    flash("운영 메모를 저장했습니다.");
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
    flash("저장한 운영 메모를 불러왔습니다.");
  };

  useOpenSavedItem("ad-operations-assist", applySaved);

  return (
    <FeatureShell
      title="광고 운영 보조"
      description="운영 이슈를 정리하면 오늘 액션과 내일 확인할 지표를 만듭니다."
    >
      <ActiveFeatureLayout
        controls={
          <div className="space-y-6">
            <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-4">
              <div className="space-y-4">
                <div className="grid gap-4">
                  {[
                    ["매체명", "mediaPlatform"],
                    ["캠페인명", "campaignName"],
                    ["기간", "period"],
                  ].map(([label, key]) => (
                    <label key={key} className="block">
                      <span className="mb-2 block text-sm font-medium text-[var(--text-body)]">{label}</span>
                      <input
                        value={form[key as keyof OperationForm] as string}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, [key]: event.target.value }))
                        }
                        className="w-full rounded-lg border border-[var(--line)] bg-[var(--bg-muted)] px-3 py-2.5 text-sm text-[var(--text-strong)] outline-none transition focus:border-[var(--line-strong)]"
                        placeholder={
                          key === "mediaPlatform"
                            ? "예: 네이버 검색광고"
                            : key === "campaignName"
                              ? "예: 병원 브랜드 캠페인"
                              : "예: 2026-03-25"
                        }
                      />
                    </label>
                  ))}
                </div>

                <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-muted)] px-4 py-4">
                  <p className="text-sm font-medium text-[var(--text-strong)]">운영 이슈</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {issueOptions.map(({ label, key }) => (
                      <label key={key} className="flex items-center gap-2 text-sm text-[var(--text-body)]">
                        <input
                          type="checkbox"
                          checked={form[key]}
                          onChange={(event) =>
                            setForm((current) => ({ ...current, [key]: event.target.checked }))
                          }
                          className="h-4 w-4 rounded border-[var(--line)]"
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[var(--text-body)]">추가 메모</span>
                  <textarea
                    value={form.notes}
                    onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                    rows={3}
                    className="w-full rounded-lg border border-[var(--line)] bg-[var(--bg-muted)] px-3 py-2.5 text-sm text-[var(--text-strong)] outline-none transition focus:border-[var(--line-strong)]"
                    placeholder="상황이나 참고 메모가 있으면 짧게 적어 주세요."
                  />
                </label>

                <div className="flex flex-wrap gap-2">
                  <SampleDataButton onClick={() => setForm(sampleForm)} />
                </div>

                <div className="grid gap-2">
                  <button type="button" onClick={generate} disabled={isPending} className="button-primary w-full">
                    {isPending ? "정리 중..." : "액션 정리"}
                  </button>
                  <button type="button" onClick={saveCurrent} disabled={!result} className="button-secondary w-full">
                    결과 저장
                  </button>
                </div>

                <p className="text-xs text-[var(--text-dim)]">입력 후 액션을 만들고, 복사하거나 저장합니다.</p>
                {message ? <p className="text-xs text-[var(--text-dim)]">{message}</p> : null}
                {restoreNotice ? (
                  <p className="text-xs text-[var(--warning-text)]">{restoreNotice}</p>
                ) : null}
              </div>
            </div>

            <HistoryPanel
              title="최근 5개"
              description="저장한 운영 메모를 다시 엽니다."
              records={records.slice(0, 5)}
              emptyTitle="저장한 운영 메모가 없습니다"
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
            title="운영 상태를 입력해 주세요"
            description="이슈를 선택하고 액션 정리를 누르면 결과가 나옵니다."
          />
        ) : (
          <>
            <ResultPanel
              title="문제 요약"
              description="오늘 공유할 한 줄 요약입니다."
              aside={
                <CopyButton
                  label="전체 복사"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(buildCopyText(result));
                      flash("운영 메모를 복사했습니다.");
                    } catch {
                      flash("복사에 실패했습니다.");
                    }
                  }}
                />
              }
            >
              <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-muted)] px-4 py-4 text-sm leading-7 text-[var(--text-body)]">
                {result.problemSummary}
              </div>
            </ResultPanel>

            <ResultPanel title="원인 가설">
              <OutputList items={result.causeHypotheses} />
            </ResultPanel>

            <ResultPanel title="오늘 해야 할 액션">
              <OutputList items={result.todayActions} />
            </ResultPanel>

            <ResultPanel title="내일 확인할 지표">
              <OutputList items={result.tomorrowMetrics} />
            </ResultPanel>
          </>
        )}
      </ActiveFeatureLayout>
    </FeatureShell>
  );
}

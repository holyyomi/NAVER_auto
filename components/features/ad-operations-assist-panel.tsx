"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
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
import { buildAdOperationsAssist, type AdOperationsInput, type AdOperationsOutput } from "@/lib/operations/ad-operations-assist-rules";
import { buildSearchAdReportAssistHref } from "@/lib/workflow/cross-feature-links";

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

const issueOptions: Array<{
  key: keyof Pick<OperationForm, "ctrDrop" | "cpcIncrease" | "conversionDrop" | "lowImpressions" | "creativeFatigue" | "budgetIssue" | "landingIssue">;
  label: string;
}> = [
  { key: "ctrDrop", label: "CTR 하락" },
  { key: "cpcIncrease", label: "CPC 상승" },
  { key: "conversionDrop", label: "전환 감소" },
  { key: "creativeFatigue", label: "소재 피로" },
  { key: "landingIssue", label: "랜딩 문제" },
  { key: "budgetIssue", label: "예산 문제" },
];

const issuePresets: Array<{ label: string; form: OperationForm }> = [
  { label: "CTR 하락", form: { mediaPlatform: "네이버 검색광고", campaignName: "병원 브랜드 캠페인", period: "2026-03-25", ctrDrop: true, cpcIncrease: false, conversionDrop: false, lowImpressions: false, creativeFatigue: false, budgetIssue: false, landingIssue: false, notes: "최근 3일 동안 CTR이 낮아져 제목과 소재 반응 점검이 필요합니다." } },
  { label: "CPC 상승", form: { mediaPlatform: "네이버 검색광고", campaignName: "병원 브랜드 캠페인", period: "2026-03-25", ctrDrop: false, cpcIncrease: true, conversionDrop: false, lowImpressions: false, creativeFatigue: false, budgetIssue: false, landingIssue: false, notes: "경쟁 입찰이 높아지며 CPC가 빠르게 올라 효율 확인이 필요합니다." } },
  { label: "전환 감소", form: { mediaPlatform: "네이버 검색광고", campaignName: "피부과 리드 캠페인", period: "2026-03-25", ctrDrop: false, cpcIncrease: false, conversionDrop: true, lowImpressions: false, creativeFatigue: false, budgetIssue: false, landingIssue: false, notes: "유입은 유지되지만 전환 수가 줄어 랜딩과 문의 흐름 확인이 필요합니다." } },
  { label: "소재 피로", form: { mediaPlatform: "네이버 검색광고", campaignName: "병원 브랜드 캠페인", period: "2026-03-25", ctrDrop: true, cpcIncrease: false, conversionDrop: false, lowImpressions: false, creativeFatigue: true, budgetIssue: false, landingIssue: false, notes: "같은 문안과 소재 노출이 길어져 반응 하락이 확인됩니다." } },
  { label: "랜딩 문제", form: { mediaPlatform: "네이버 검색광고", campaignName: "피부과 리드 캠페인", period: "2026-03-25", ctrDrop: false, cpcIncrease: false, conversionDrop: true, lowImpressions: false, creativeFatigue: false, budgetIssue: false, landingIssue: true, notes: "클릭은 유지되지만 문의 전환이 줄어 랜딩 흐름 점검이 필요합니다." } },
  { label: "예산 문제", form: { mediaPlatform: "네이버 검색광고", campaignName: "병원 브랜드 캠페인", period: "2026-03-25", ctrDrop: false, cpcIncrease: true, conversionDrop: false, lowImpressions: false, creativeFatigue: false, budgetIssue: true, landingIssue: false, notes: "예산 소진 속도가 빨라 주요 시간대 집행이 약해지는 상황입니다." } },
];

type AiResponse<T> = { ok: true; data: T } | { ok: false; error: string };

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
  if (!input.mediaPlatform || !input.campaignName || !input.period) return false;
  return input.ctrDrop || input.cpcIncrease || input.conversionDrop || input.lowImpressions || input.creativeFatigue || input.budgetIssue || input.landingIssue || Boolean(input.notes);
}

function buildCopyText(result: AdOperationsOutput) {
  return [
    "[문제 요약]",
    result.problemSummary,
    "",
    "[원인 가설]",
    ...result.causeHypotheses.map((item) => `- ${item}`),
    "",
    "[오늘 액션]",
    ...result.todayActions.map((item) => `- ${item}`),
    "",
    "[내일 확인 지표]",
    ...result.tomorrowMetrics.map((item) => `- ${item}`),
  ].join("\n");
}

function OutputList({ items }: { items: string[] }) {
  return <div className="space-y-3">{items.map((item, index) => <div key={`${item}-${index}`} className="rounded-xl border border-[var(--line)] bg-[var(--bg-muted)] px-4 py-3 text-sm leading-6 text-[var(--text-body)]">{item}</div>)}</div>;
}

export function AdOperationsAssistPanel() {
  const [form, setForm] = useState<OperationForm>(issuePresets[0].form);
  const [result, setResult] = useState<AdOperationsOutput | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [restoreNotice, setRestoreNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { records, saveRecord, removeRecord } = useActivityHistory("ad-operations-assist");
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const usageGuide = featureUsageGuides["ad-operations-assist"];

  const flash = (text: string) => { setMessage(text); window.setTimeout(() => setMessage(null), 1800); };

  const generate = useCallback((nextForm?: OperationForm) => {
    const targetForm = nextForm ?? form;
    const nextInput = toInput(targetForm);
    if (!isOperationInputValid(nextInput)) { flash("매체명, 캠페인명, 기간과 운영 이슈를 입력해 주세요."); return; }

    startTransition(async () => {
      try {
        const response = await fetch("/api/ai/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "operations", payload: nextInput }) });
        const data = (await response.json()) as AiResponse<AdOperationsOutput>;
        if (data.ok) { setForm(targetForm); setResult(data.data); setRestoreNotice(null); flash("운영 액션을 정리했습니다."); return; }
        setForm(targetForm); setResult(buildAdOperationsAssist(nextInput)); setRestoreNotice(null); flash(`${data.error} 기본 결과로 정리했습니다.`);
      } catch {
        setForm(targetForm); setResult(buildAdOperationsAssist(nextInput)); setRestoreNotice(null); flash("AI 응답 없이 기본 결과로 정리했습니다.");
      }
    });
  }, [form]);

  const saveCurrent = () => {
    if (!result) return;
    const issueCount = issueOptions.filter(({ key }) => form[key]).length;
    saveRecord({ featureType: "ad-operations-assist", title: `${form.campaignName || "캠페인"} | ${form.period || "기간 미입력"}`, summary: result.problemSummary, fields: [{ label: "매체", value: form.mediaPlatform || "-" }, { label: "이슈 수", value: String(issueCount) }], inputSnapshot: form, outputSnapshot: result });
    flash("운영 메모를 저장했습니다.");
  };

  const applySaved = (record: (typeof records)[number]) => {
    const restored = restoreAdOperationsRecord<OperationForm>(record);
    if (!restored.ok) { setRestoreNotice(restored.message); return; }
    setForm(restored.input); setResult(restored.output); setRestoreNotice(null); flash("저장한 운영 메모를 불러왔습니다.");
  };

  const rerunSaved = (record: (typeof records)[number]) => {
    const restored = restoreAdOperationsRecord<OperationForm>(record);
    if (!restored.ok) { setRestoreNotice(restored.message); return; }
    setRestoreNotice(null); generate(restored.input);
  };

  useOpenSavedItem("ad-operations-assist", applySaved);

  useEffect(() => {
    const nextForm: OperationForm = {
      mediaPlatform: searchParams.get("mediaPlatform") ?? "",
      campaignName: searchParams.get("campaignName") ?? "",
      period: searchParams.get("period") ?? "",
      ctrDrop: searchParams.get("ctrDrop") === "1",
      cpcIncrease: searchParams.get("cpcIncrease") === "1",
      conversionDrop: searchParams.get("conversionDrop") === "1",
      lowImpressions: searchParams.get("lowImpressions") === "1",
      creativeFatigue: searchParams.get("creativeFatigue") === "1",
      budgetIssue: searchParams.get("budgetIssue") === "1",
      landingIssue: searchParams.get("landingIssue") === "1",
      notes: searchParams.get("notes") ?? "",
    };

    const hasPrefill = nextForm.mediaPlatform || nextForm.campaignName || nextForm.period || nextForm.notes || nextForm.ctrDrop || nextForm.cpcIncrease || nextForm.conversionDrop || nextForm.lowImpressions || nextForm.creativeFatigue || nextForm.budgetIssue || nextForm.landingIssue;
    const autoRun = searchParams.get("autoRun") === "1";
    if (!hasPrefill) return;

    const mergedForm = { ...form, ...nextForm };
    setForm(mergedForm);
    if (autoRun) generate(mergedForm);

    const nextParams = new URLSearchParams(searchParams.toString());
    ["mediaPlatform", "campaignName", "period", "ctrDrop", "cpcIncrease", "conversionDrop", "lowImpressions", "creativeFatigue", "budgetIssue", "landingIssue", "notes", "autoRun"].forEach((key) => nextParams.delete(key));
    const nextUrl = nextParams.size > 0 ? `${pathname}?${nextParams.toString()}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [form, generate, pathname, router, searchParams]);

  return (
    <FeatureShell title="" description="">
      <ActiveFeatureLayout
        controls={
          <div className="space-y-6">
            <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-4">
              <div className="space-y-4">
                <div className="grid gap-4">
                  {[["매체", "mediaPlatform"], ["캠페인명", "campaignName"], ["기간", "period"]].map(([label, key]) => (
                    <label key={key} className="block">
                      <span className="mb-2 block text-sm font-medium text-[var(--text-body)]">{label}</span>
                      <input value={form[key as keyof OperationForm] as string} onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))} className="field-control" placeholder={key === "mediaPlatform" ? "예: 네이버 검색광고" : key === "campaignName" ? "예: 병원 브랜드 캠페인" : "예: 2026-03-25"} />
                    </label>
                  ))}
                </div>

                <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-muted)] px-4 py-4">
                  <p className="text-sm font-medium text-[var(--text-strong)]">운영 이슈</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {issueOptions.map(({ label, key }) => (
                      <label key={key} className="flex items-center gap-2 text-sm text-[var(--text-body)]">
                        <input type="checkbox" checked={form[key]} onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.checked }))} className="h-4 w-4 rounded border-[var(--line)]" />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[var(--text-body)]">추가 메모</span>
                  <textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} rows={3} className="field-control" placeholder="상황이나 참고 메모가 있으면 적어 주세요." />
                </label>

                <div className="flex flex-wrap gap-2">
                  <SampleDataButton onClick={() => setForm(issuePresets[0].form)} label="대표 샘플" />
                  {issuePresets.map((preset) => (
                    <button key={preset.label} type="button" onClick={() => setForm(preset.form)} className="button-secondary inline-flex min-h-9 items-center justify-center px-3 py-2 text-xs">{preset.label}</button>
                  ))}
                </div>

                <div className="grid gap-2">
                  <button type="button" onClick={() => generate()} disabled={isPending} className="button-primary w-full">{isPending ? "정리 중..." : "액션 정리"}</button>
                  <button type="button" onClick={saveCurrent} disabled={!result} className="button-secondary w-full">결과 저장</button>
                </div>

                <p className="text-xs text-[var(--text-dim)]">이슈 프리셋은 CTR, CPC, 전환, 소재, 랜딩, 예산 점검 흐름에 맞춰 바로 불러올 수 있습니다.</p>
                {message ? <p className="text-xs text-[var(--text-dim)]">{message}</p> : null}
                {restoreNotice ? <p className="text-xs text-[var(--warning-text)]">{restoreNotice}</p> : null}
              </div>
            </div>
          </div>
        }
      >
        <FeatureUsageGuide useWhen={usageGuide.useWhen} output={usageGuide.output} nextAction={usageGuide.nextAction} testPoint={usageGuide.testPoint} />

        {!result ? (
          <EmptyState title="운영 상태를 입력해 주세요" description="운영 이슈를 선택하면 문제 요약과 오늘 액션까지 함께 정리합니다." />
        ) : (
          <>
            <ResultPanel title="핵심 요약" description="가장 먼저 공유할 운영 요약입니다." aside={<CopyButton label="전체 복사" onClick={async () => { try { await navigator.clipboard.writeText(buildCopyText(result)); flash("운영 메모 전체를 복사했습니다."); } catch { flash("복사에 실패했습니다."); } }} />}>
              <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-muted)] px-4 py-4 text-sm leading-7 text-[var(--text-body)]">{result.problemSummary}</div>
            </ResultPanel>
            <ResultPanel title="원인 가설"><OutputList items={result.causeHypotheses} /></ResultPanel>
            <ResultPanel title="오늘 액션"><OutputList items={result.todayActions} /></ResultPanel>
            <ResultPanel title="내일 확인 지표"><OutputList items={result.tomorrowMetrics} /></ResultPanel>
            <ResultPanel title="다음 작업" description="운영 정리 후 리포트 보조로 바로 이어갈 수 있습니다.">
              <div className="grid gap-3 xl:grid-cols-1">
                <Link href={buildSearchAdReportAssistHref({ template: "internal", mediaPlatform: form.mediaPlatform, campaignName: form.campaignName, period: form.period, comparisonNotes: result.problemSummary })} className="surface-card px-5 py-5 text-sm text-[var(--text-body)]">리포트 보조로 이어가기</Link>
              </div>
            </ResultPanel>
          </>
        )}

        <HistoryPanel title="최근 운영 기록" description="같은 입력값을 다시 불러오고 바로 재실행할 수 있습니다." records={records.slice(0, 5)} emptyTitle="저장된 운영 기록이 없습니다" emptyDescription="운영 메모를 저장하면 최근 기록에서 다시 실행하거나 수정할 수 있습니다." onApply={applySaved} onRerun={rerunSaved} onRemove={removeRecord} />
      </ActiveFeatureLayout>
    </FeatureShell>
  );
}

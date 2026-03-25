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
import { restoreSearchAdReportRecord } from "@/lib/history/restore";
import {
  buildSearchAdReport,
  type ReportTemplate,
  type SearchAdReportInput,
  type SearchAdReportOutput,
} from "@/lib/reporting/search-ad-report-rules";

type ReportForm = {
  template: ReportTemplate;
  mediaPlatform: string;
  campaignName: string;
  period: string;
  impressions: string;
  clicks: string;
  cost: string;
  conversions: string;
  revenue: string;
  ctr: string;
  cpc: string;
  cpa: string;
  roas: string;
  comparisonNotes: string;
};

const sampleInternal: ReportForm = {
  template: "internal",
  mediaPlatform: "네이버 검색광고",
  campaignName: "병원 브랜드 캠페인",
  period: "2026-03-01 ~ 2026-03-07",
  impressions: "120000",
  clicks: "3650",
  cost: "3560000",
  conversions: "112",
  revenue: "15400000",
  ctr: "",
  cpc: "",
  cpa: "",
  roas: "",
  comparisonNotes: "직전 주 대비 CTR이 소폭 상승했고 전환은 유지됐습니다.",
};

const sampleClient: ReportForm = {
  ...sampleInternal,
  template: "client",
  campaignName: "진료 키워드 캠페인",
  comparisonNotes: "직전 기간 대비 주요 수치는 안정적으로 유지됐습니다.",
};

const initialForm = sampleInternal;

type AiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function parseNumber(value: string) {
  const parsed = Number(value.trim().replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function deriveRatio(numerator: number | null, denominator: number | null, multiplier = 1) {
  if (numerator === null || denominator === null || denominator === 0) {
    return null;
  }

  return Number(((numerator / denominator) * multiplier).toFixed(2));
}

function toInput(form: ReportForm): SearchAdReportInput {
  const impressions = parseNumber(form.impressions);
  const clicks = parseNumber(form.clicks);
  const cost = parseNumber(form.cost);
  const conversions = parseNumber(form.conversions);
  const revenue = parseNumber(form.revenue);

  const ctr = parseNumber(form.ctr) ?? deriveRatio(clicks, impressions, 100);
  const cpc = parseNumber(form.cpc) ?? deriveRatio(cost, clicks);
  const cpa = parseNumber(form.cpa) ?? deriveRatio(cost, conversions);
  const roas = parseNumber(form.roas) ?? deriveRatio(revenue, cost, 100);

  return {
    template: form.template,
    mediaPlatform: form.mediaPlatform.trim(),
    campaignName: form.campaignName.trim(),
    period: form.period.trim(),
    impressions,
    clicks,
    ctr,
    cost,
    cpc,
    conversions,
    cpa,
    revenue,
    roas,
    comparisonNotes: form.comparisonNotes.trim(),
  };
}

function isReportInputValid(input: SearchAdReportInput) {
  if (!input.mediaPlatform || !input.campaignName || !input.period) {
    return false;
  }

  return [input.impressions, input.clicks, input.cost, input.conversions, input.revenue].some(
    (value) => value !== null,
  );
}

function buildCopyText(report: SearchAdReportOutput) {
  return [
    "[한 줄 요약]",
    report.oneLineSummary,
    "",
    "[잘된 점]",
    ...report.strengths.map((item) => `- ${item}`),
    "",
    "[문제점]",
    ...report.issues.map((item) => `- ${item}`),
    "",
    "[다음 액션]",
    ...report.nextActions.map((item) => `- ${item}`),
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

export function SearchAdReportAssistPanel() {
  const [form, setForm] = useState<ReportForm>(initialForm);
  const [report, setReport] = useState<SearchAdReportOutput | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [restoreNotice, setRestoreNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { records, saveRecord, removeRecord } = useActivityHistory("search-ad-report-assist");
  const usageGuide = featureUsageGuides["search-ad-report-assist"];
  const parsedInput = useMemo(() => toInput(form), [form]);

  const flash = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(null), 1800);
  };

  const generate = () => {
    if (!isReportInputValid(parsedInput)) {
      flash("매체명, 캠페인명, 기간과 기본 수치를 입력해 주세요.");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/ai/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: "report",
            payload: parsedInput,
          }),
        });

        const data = (await response.json()) as AiResponse<SearchAdReportOutput>;
        if (data.ok) {
          setReport({
            template: form.template,
            ...data.data,
          });
          setRestoreNotice(null);
          flash("보고서 초안을 만들었습니다.");
          return;
        }

        setReport(buildSearchAdReport(parsedInput));
        setRestoreNotice(null);
        flash(`${data.error} 기본 결과로 대신 만들었습니다.`);
      } catch {
        setReport(buildSearchAdReport(parsedInput));
        setRestoreNotice(null);
        flash("AI 응답 없이 기본 결과로 만들었습니다.");
      }
    });
  };

  const saveCurrent = () => {
    if (!report) {
      return;
    }

    saveRecord({
      featureType: "search-ad-report-assist",
      title: `${form.campaignName || "캠페인"} | ${form.period || "기간 미입력"}`,
      summary: report.oneLineSummary,
      fields: [
        { label: "매체", value: form.mediaPlatform || "-" },
        { label: "템플릿", value: form.template === "internal" ? "내부 공유용" : "클라이언트용" },
        { label: "ROAS", value: parsedInput.roas !== null ? `${parsedInput.roas}%` : "-" },
      ],
      inputSnapshot: form,
      outputSnapshot: report,
    });

    flash("보고서를 저장했습니다.");
  };

  const applySaved = (record: (typeof records)[number]) => {
    const restored = restoreSearchAdReportRecord<ReportForm>(record);
    if (!restored.ok) {
      setRestoreNotice(restored.message);
      return;
    }

    setForm(restored.input);
    setReport(restored.output);
    setRestoreNotice(null);
  };

  useOpenSavedItem("search-ad-report-assist", applySaved);

  return (
    <FeatureShell
      title="검색광고 리포트 보조"
      description="광고 수치를 입력하면 공유용 보고 문안을 정리합니다."
    >
      <ActiveFeatureLayout
        controls={
          <div className="space-y-6">
            <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-4">
              <div className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[var(--text-body)]">템플릿</span>
                  <select
                    value={form.template}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        template: event.target.value as ReportTemplate,
                      }))
                    }
                    className="w-full rounded-lg border border-[var(--line)] bg-[var(--bg-muted)] px-3 py-2.5 text-sm text-[var(--text-strong)] outline-none transition focus:border-[var(--line-strong)]"
                  >
                    <option value="internal">내부 공유용</option>
                    <option value="client">클라이언트용</option>
                  </select>
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    ["매체명", "mediaPlatform"],
                    ["캠페인명", "campaignName"],
                    ["기간", "period"],
                    ["노출", "impressions"],
                    ["클릭", "clicks"],
                    ["비용", "cost"],
                    ["전환", "conversions"],
                    ["매출", "revenue"],
                    ["CTR", "ctr"],
                    ["CPC", "cpc"],
                    ["CPA", "cpa"],
                    ["ROAS", "roas"],
                  ].map(([label, key]) => (
                    <label key={key} className="block">
                      <span className="mb-2 block text-sm font-medium text-[var(--text-body)]">{label}</span>
                      <input
                        value={form[key as keyof ReportForm]}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            [key]: event.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-[var(--line)] bg-[var(--bg-muted)] px-3 py-2.5 text-sm text-[var(--text-strong)] outline-none transition focus:border-[var(--line-strong)]"
                      />
                    </label>
                  ))}
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[var(--text-body)]">비교 메모</span>
                  <textarea
                    value={form.comparisonNotes}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, comparisonNotes: event.target.value }))
                    }
                    rows={3}
                    className="w-full rounded-lg border border-[var(--line)] bg-[var(--bg-muted)] px-3 py-2.5 text-sm text-[var(--text-strong)] outline-none transition focus:border-[var(--line-strong)]"
                    placeholder="직전 기간 대비 변화나 참고 메모를 적어 주세요."
                  />
                </label>

                <div className="flex flex-wrap gap-2">
                  <SampleDataButton
                    onClick={() => setForm(form.template === "client" ? sampleClient : sampleInternal)}
                  />
                </div>

                <div className="grid gap-2">
                  <button type="button" onClick={generate} disabled={isPending} className="button-primary w-full">
                    {isPending ? "생성 중.." : "보고서 만들기"}
                  </button>
                  <button type="button" onClick={saveCurrent} disabled={!report} className="button-secondary w-full">
                    결과 저장
                  </button>
                </div>

                <p className="text-xs text-[var(--text-dim)]">
                  입력 후 보고서를 만들고 복사하거나 저장합니다. 비어 있는 비율 지표는 가능한 경우 자동 계산합니다.
                </p>
                {message ? <p className="text-xs text-[var(--text-dim)]">{message}</p> : null}
                {restoreNotice ? (
                  <p className="text-xs text-[var(--warning-text)]">{restoreNotice}</p>
                ) : null}
              </div>
            </div>

            <HistoryPanel
              title="최근 5개"
              description="저장한 보고서를 다시 엽니다."
              records={records.slice(0, 5)}
              emptyTitle="저장한 보고서가 없습니다"
              emptyDescription="보고서를 저장하면 최근 목록에 표시됩니다."
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

        {!report ? (
          <EmptyState
            title="광고 수치를 입력해 주세요"
            description="보고서 만들기 버튼을 누르면 결과가 표시됩니다."
          />
        ) : (
          <>
            <ResultPanel
              title="한 줄 요약"
              description="공유용 첫 문장으로 바로 사용할 수 있습니다."
              aside={
                <CopyButton
                  label="전체 복사"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(buildCopyText(report));
                      flash("보고서 내용을 복사했습니다.");
                    } catch {
                      flash("복사에 실패했습니다.");
                    }
                  }}
                />
              }
            >
              <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-muted)] px-4 py-4 text-sm leading-7 text-[var(--text-body)]">
                {report.oneLineSummary}
              </div>
            </ResultPanel>

            <ResultPanel title="잘된 점">
              <OutputList items={report.strengths} />
            </ResultPanel>

            <ResultPanel title="문제점">
              <OutputList items={report.issues} />
            </ResultPanel>

            <ResultPanel title="다음 액션">
              <OutputList items={report.nextActions} />
            </ResultPanel>
          </>
        )}
      </ActiveFeatureLayout>
    </FeatureShell>
  );
}

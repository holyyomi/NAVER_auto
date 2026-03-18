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
import {
  buildSearchAdReport,
  type RuleTone,
  type SearchAdReportInput,
  type SearchAdReportOutput,
} from "@/lib/reporting/search-ad-report-rules";

type ReportForm = {
  impressions: string;
  clicks: string;
  conversions: string;
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
  conversions: "128",
  cpa: "28000",
  roas: "430",
  previousCtr: "2.6",
  previousCvr: "3.0",
  previousCpa: "32000",
  previousRoas: "380",
};

function parseNumber(value: string) {
  const parsed = Number(value.trim().replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function toInput(form: ReportForm): SearchAdReportInput {
  return {
    impressions: parseNumber(form.impressions),
    clicks: parseNumber(form.clicks),
    ctr: null,
    conversions: parseNumber(form.conversions),
    cvr: null,
    cpa: parseNumber(form.cpa),
    roas: parseNumber(form.roas),
    previousCtr: parseNumber(form.previousCtr),
    previousCvr: parseNumber(form.previousCvr),
    previousCpa: parseNumber(form.previousCpa),
    previousRoas: parseNumber(form.previousRoas),
  };
}

function formatNumber(value: number | null, suffix = "") {
  return value === null ? "-" : `${value.toLocaleString("ko-KR")}${suffix}`;
}

function getToneBadge(tone: RuleTone) {
  if (tone === "positive") return "active" as const;
  if (tone === "warning") return "attention" as const;
  return "neutral" as const;
}

function buildFullReportCopy(report: SearchAdReportOutput) {
  return [
    `핵심 요약`,
    `${report.headline} ${report.summary}`,
    "",
    `좋은 점`,
    ...report.strengths.map((item, index) => `${index + 1}. ${item}`),
    "",
    `점검 포인트`,
    ...report.watchPoints.map((item, index) => `${index + 1}. ${item}`),
    "",
    `권장 액션`,
    ...report.actions.map((item, index) => `${index + 1}. ${item}`),
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

export function SearchAdReportAssistPanel() {
  const [form, setForm] = useState<ReportForm>(initialForm);
  const [report, setReport] = useState<SearchAdReportOutput | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const { records, saveRecord, removeRecord } = useActivityHistory("search-ad-report-assist");
  const parsedInput = useMemo(() => toInput(form), [form]);

  const handleGenerate = () => {
    setReport(buildSearchAdReport(parsedInput));
  };

  const flashAction = (message: string) => {
    setActionMessage(message);
    window.setTimeout(() => setActionMessage(null), 1600);
  };

  const copyText = async (value: string, message: string) => {
    try {
      await navigator.clipboard.writeText(value);
      flashAction(message);
    } catch {
      flashAction("복사에 실패했습니다.");
    }
  };

  const handleSave = () => {
    if (!report) {
      return;
    }

    saveRecord({
      featureType: "search-ad-report-assist",
      title: `검색광고 리포트 | ROAS ${formatNumber(parsedInput.roas, "%")}`,
      summary: `${report.headline} ${report.summary}`,
      fields: [
        { label: "노출", value: formatNumber(parsedInput.impressions, "회") },
        { label: "클릭", value: formatNumber(parsedInput.clicks, "회") },
        { label: "전환", value: formatNumber(parsedInput.conversions, "건") },
        { label: "ROAS", value: formatNumber(parsedInput.roas, "%") },
      ],
      inputSnapshot: form,
      outputSnapshot: report,
    });

    setSaveMessage("저장 완료");
    window.setTimeout(() => setSaveMessage(null), 1600);
  };

  const applySaved = (record: (typeof records)[number]) => {
    setForm(record.inputSnapshot as ReportForm);
    setReport(record.outputSnapshot as SearchAdReportOutput);
  };

  useOpenSavedItem("search-ad-report-assist", applySaved);

  return (
    <FeatureShell
      title="검색광고 리포트 보조"
      description="AE와 운영 담당자가 내부 공유용, 클라이언트 공유용 초안을 빠르게 정리하는 규칙 기반 리포트 패널입니다."
    >
      <ActiveFeatureLayout
        controls={
          <div className="space-y-6">
            <div className="rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-4 py-4">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-[var(--text-strong)]">성과 입력</p>
                  <p className="mt-1 text-xs text-[var(--text-dim)]">
                    기본 성과와 전기 지표를 넣으면 비교 코멘트가 포함된 리포트 초안을 만듭니다.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    ["노출수", "impressions"],
                    ["클릭수", "clicks"],
                    ["전환수", "conversions"],
                    ["CPA", "cpa"],
                    ["ROAS", "roas"],
                  ].map(([label, key]) => (
                    <label key={key} className="block">
                      <span className="mb-2 block text-sm font-medium text-[var(--text-body)]">
                        {label}
                      </span>
                      <input
                        value={form[key as keyof ReportForm]}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, [key]: event.target.value }))
                        }
                        className="w-full rounded-lg border border-[var(--line)] bg-[var(--bg-elevated)] px-3 py-2.5 text-sm text-[var(--text-strong)] outline-none transition focus:border-[var(--line-strong)]"
                      />
                    </label>
                  ))}
                </div>

                <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-[var(--text-strong)]">전기 비교</p>
                      <p className="mt-1 text-xs text-[var(--text-dim)]">
                        입력 시 비교 코멘트가 좋은 점과 점검 포인트에 자동 반영됩니다.
                      </p>
                    </div>
                    <StatusBadge tone="pending">선택</StatusBadge>
                  </div>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {[
                      ["이전 CTR", "previousCtr"],
                      ["이전 CVR", "previousCvr"],
                      ["이전 CPA", "previousCpa"],
                      ["이전 ROAS", "previousRoas"],
                    ].map(([label, key]) => (
                      <label key={key} className="block">
                        <span className="mb-2 block text-sm font-medium text-[var(--text-body)]">
                          {label}
                        </span>
                        <input
                          value={form[key as keyof ReportForm]}
                          onChange={(event) =>
                            setForm((current) => ({ ...current, [key]: event.target.value }))
                          }
                          className="w-full rounded-lg border border-[var(--line)] bg-[var(--bg-elevated)] px-3 py-2.5 text-sm text-[var(--text-strong)] outline-none transition focus:border-[var(--line-strong)]"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid gap-2">
                  <button
                    type="button"
                    onClick={handleGenerate}
                    className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--bg-soft)] text-sm font-medium text-[var(--text-strong)] transition hover:border-[var(--line-strong)]"
                  >
                    리포트 초안 생성
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={!report}
                    className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-[var(--line)] bg-transparent text-sm font-medium text-[var(--text-body)] transition hover:border-[var(--line-strong)] hover:text-[var(--text-strong)] disabled:opacity-40"
                  >
                    {saveMessage ?? "현재 결과 저장"}
                  </button>
                </div>
              </div>
            </div>

            <HistoryPanel
              title="다시 보기"
              description="저장한 리포트 초안을 다시 열고 삭제할 수 있습니다."
              records={records.slice(0, 5)}
              emptyTitle="저장 항목 없음"
              emptyDescription="초안을 저장하면 홈 최근 저장과 이 패널에서 다시 열 수 있습니다."
              onApply={applySaved}
              onRemove={removeRecord}
            />
          </div>
        }
      >
        {!report ? (
          <EmptyState
            title="광고 성과를 입력하세요."
            description="성과 지표를 입력하면 내부 공유용/클라이언트 공유용 리포트 초안을 바로 정리할 수 있습니다."
          />
        ) : (
          <>
            <ResultSummaryGrid>
              <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-4">
                <p className="text-[11px] tracking-[0.14em] text-[var(--text-dim)]">핵심 진단</p>
                <p className="mt-2 text-base font-semibold text-[var(--text-strong)]">
                  {report.headline}
                </p>
              </div>
              <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-4">
                <p className="text-[11px] tracking-[0.14em] text-[var(--text-dim)]">CTR / CVR</p>
                <p className="mt-2 text-base font-semibold text-[var(--text-strong)]">
                  {formatNumber(report.derived.ctr, "%")} / {formatNumber(report.derived.cvr, "%")}
                </p>
              </div>
              <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-4">
                <p className="text-[11px] tracking-[0.14em] text-[var(--text-dim)]">추정 광고비</p>
                <p className="mt-2 text-base font-semibold text-[var(--text-strong)]">
                  {formatNumber(report.derived.estimatedSpend, "원")}
                </p>
              </div>
            </ResultSummaryGrid>

            <ResultPanel
              title="핵심 요약"
              description="보고서 첫 문단이나 내부 공유 메시지에 바로 붙여 넣기 좋은 문장입니다."
              aside={
                <div className="flex flex-wrap gap-2">
                  {actionMessage ? (
                    <span className="self-center text-xs text-[var(--text-dim)]">{actionMessage}</span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => copyText(buildFullReportCopy(report), "전체 내용을 복사했습니다.")}
                    className="inline-flex h-8 items-center justify-center rounded-lg border border-[var(--line)] px-3 text-xs font-medium text-[var(--text-body)] transition hover:border-[var(--line-strong)] hover:text-[var(--text-strong)]"
                  >
                    전체 복사
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      copyText(`${report.headline} ${report.summary}`, "핵심 요약을 복사했습니다.")
                    }
                    className="inline-flex h-8 items-center justify-center rounded-lg border border-[var(--line)] px-3 text-xs font-medium text-[var(--text-body)] transition hover:border-[var(--line-strong)] hover:text-[var(--text-strong)]"
                  >
                    핵심 요약 복사
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      copyText(report.actions.map((item, index) => `${index + 1}. ${item}`).join("\n"), "권장 액션을 복사했습니다.")
                    }
                    className="inline-flex h-8 items-center justify-center rounded-lg border border-[var(--line)] px-3 text-xs font-medium text-[var(--text-body)] transition hover:border-[var(--line-strong)] hover:text-[var(--text-strong)]"
                  >
                    권장 액션 복사
                  </button>
                </div>
              }
            >
              <div className="space-y-3">
                <div className="rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-4 py-4 text-sm leading-7 text-[var(--text-body)]">
                  {report.headline} {report.summary}
                </div>
                <ActionList items={report.keySummary} />
              </div>
            </ResultPanel>

            <ResultPanel
              title="좋은 점"
              description="리포트에서 먼저 강조할 수 있는 강점입니다."
              aside={<StatusBadge tone={getToneBadge(report.tone)}>보고용</StatusBadge>}
            >
              <ActionList items={report.strengths} />
            </ResultPanel>

            <ResultPanel
              title="점검 포인트"
              description="내부 코멘트나 운영 메모에 넣기 좋은 체크 항목입니다."
            >
              <ActionList items={report.watchPoints} />
            </ResultPanel>

            <ResultPanel
              title="권장 액션"
              description="다음 운영 액션으로 바로 연결할 수 있는 제안입니다."
            >
              <ActionList items={report.actions} />
            </ResultPanel>
          </>
        )}
      </ActiveFeatureLayout>
    </FeatureShell>
  );
}

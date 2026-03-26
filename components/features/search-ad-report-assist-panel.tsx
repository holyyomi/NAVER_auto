"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
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
import { useSearchAdReportLocalTools } from "@/hooks/use-search-ad-report-local-tools";
import { featureUsageGuides } from "@/lib/guidance";
import { restoreSearchAdReportRecord } from "@/lib/history/restore";
import {
  buildSearchAdReport,
  type ReportTemplate,
  type SearchAdReportInput,
  type SearchAdReportOutput,
} from "@/lib/reporting/search-ad-report-rules";
import { buildAdOperationsAssistHref } from "@/lib/workflow/cross-feature-links";

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
  campaignName: "강남치과 브랜드 캠페인",
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
  comparisonNotes: "전주 대비 CTR은 유지되지만 전환 효율 보완이 필요합니다.",
};

const sampleClient: ReportForm = {
  ...sampleInternal,
  template: "client",
  campaignName: "피부과 리드 캠페인",
  comparisonNotes: "클라이언트 공유용으로 성과와 다음 액션을 간결하게 정리합니다.",
};

const sampleDirector: ReportForm = {
  ...sampleInternal,
  template: "internal",
  campaignName: "강남치과 원장님 보고",
  period: "2026-03-01 ~ 2026-03-31",
  impressions: "420000",
  clicks: "9240",
  cost: "8120000",
  conversions: "286",
  revenue: "32800000",
  comparisonNotes: "원장님 보고용으로 월간 흐름과 비용 효율, 다음 조정 포인트만 정리합니다.",
};

const initialForm = sampleInternal;
const autocompleteSuggestions = [
  "강남 치과",
  "피부과 광고",
  "정형외과 마케팅",
  "네이버 검색광고",
  "스마트스토어 광고",
  "CTR 하락",
  "CPC 상승",
];

type AiResponse<T> = { ok: true; data: T } | { ok: false; error: string };

function isSameForm(left: ReportForm, right: ReportForm) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function parseNumber(value: string) {
  const parsed = Number(value.trim().replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function deriveRatio(numerator: number | null, denominator: number | null, multiplier = 1) {
  if (numerator === null || denominator === null || denominator === 0) return null;
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
  if (!input.mediaPlatform || !input.campaignName || !input.period) return false;
  return [input.impressions, input.clicks, input.cost, input.conversions, input.revenue].some((value) => value !== null);
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
        <div key={`${item}-${index}`} className="rounded-xl border border-[var(--line)] bg-[var(--bg-muted)] px-4 py-3 text-sm leading-6 text-[var(--text-body)]">
          {item}
        </div>
      ))}
    </div>
  );
}

function formatLocalDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(parsed);
}

export function SearchAdReportAssistPanel() {
  const [form, setForm] = useState<ReportForm>(initialForm);
  const [report, setReport] = useState<SearchAdReportOutput | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [restoreNotice, setRestoreNotice] = useState<string | null>(null);
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { records, saveRecord, removeRecord } = useActivityHistory("search-ad-report-assist");
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const usageGuide = featureUsageGuides["search-ad-report-assist"];
  const parsedInput = useMemo(() => toInput(form), [form]);
  const formRef = useRef(form);
  const hasRestoredLastFormRef = useRef(false);
  const reportText = useMemo(() => (report ? buildCopyText(report) : ""), [report]);
  const filteredSuggestions = useMemo(() => {
    const keyword = form.campaignName.trim().toLowerCase();
    if (!keyword) {
      return autocompleteSuggestions.slice(0, 5);
    }

    return autocompleteSuggestions
      .filter((item) => item.toLowerCase().includes(keyword))
      .slice(0, 5);
  }, [form.campaignName]);

  useEffect(() => {
    formRef.current = form;
  }, [form]);

  useEffect(() => {
    if (hasRestoredLastFormRef.current) {
      return;
    }

    try {
      if (searchParamsString.includes("campaignName=") || searchParamsString.includes("template=")) {
        hasRestoredLastFormRef.current = true;
        return;
      }

      const saved = window.localStorage.getItem("searchAdReport:lastForm");
      if (!saved) {
        hasRestoredLastFormRef.current = true;
        return;
      }

      const parsed = JSON.parse(saved) as ReportForm;
      setForm((prev) => (isSameForm(prev, parsed) ? prev : parsed));
    } catch {
      // ignore invalid localStorage payload
    } finally {
      hasRestoredLastFormRef.current = true;
    }
  }, [searchParamsString]);

  useEffect(() => {
    if (!hasRestoredLastFormRef.current) {
      return;
    }

    try {
      window.localStorage.setItem("searchAdReport:lastForm", JSON.stringify(form));
    } catch {
      // ignore localStorage write failure
    }
  }, [form]);

  const flash = useCallback((text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(null), 1800);
  }, []);

  const { history: localHistory, templates, saveTemplate } = useSearchAdReportLocalTools({
    form,
    resultText: reportText,
  });

  const generate = useCallback((nextForm?: ReportForm) => {
    const targetForm = nextForm ?? formRef.current;
    const nextInput = toInput(targetForm);

    if (!isReportInputValid(nextInput)) {
      flash("매체명, 캠페인명, 기간과 주요 수치를 입력해 주세요.");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/ai/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind: "report", payload: nextInput }),
        });

        const data = (await response.json()) as AiResponse<SearchAdReportOutput>;
        if (data.ok) {
          setForm((prev) => (isSameForm(prev, targetForm) ? prev : targetForm));
          setReport({ template: targetForm.template, ...data.data });
          setRestoreNotice(null);
          flash("리포트를 만들었습니다.");
          return;
        }

        setForm((prev) => (isSameForm(prev, targetForm) ? prev : targetForm));
        setReport(buildSearchAdReport(nextInput));
        setRestoreNotice(null);
        flash(`${data.error} 기본 템플릿으로 결과를 만들었습니다.`);
      } catch {
        setForm((prev) => (isSameForm(prev, targetForm) ? prev : targetForm));
        setReport(buildSearchAdReport(nextInput));
        setRestoreNotice(null);
        flash("AI 응답 없이 기본 템플릿으로 결과를 만들었습니다.");
      }
    });
  }, [flash]);

  const saveCurrent = () => {
    if (!report) return;

    const templateLabel =
      form.campaignName.includes("원장님") ? "원장님 보고용" : form.template === "internal" ? "내부 공유용" : "클라이언트용";

    saveRecord({
      featureType: "search-ad-report-assist",
      title: `${form.campaignName || "캠페인"} | ${form.period || "기간 미입력"}`,
      summary: report.oneLineSummary,
      fields: [
        { label: "매체", value: form.mediaPlatform || "-" },
        { label: "템플릿", value: templateLabel },
        { label: "ROAS", value: parsedInput.roas !== null ? `${parsedInput.roas}%` : "-" },
      ],
      inputSnapshot: form,
      outputSnapshot: report,
    });

    flash("리포트를 저장했습니다.");
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
    flash("저장한 리포트를 불러왔습니다.");
  };

  const rerunSaved = (record: (typeof records)[number]) => {
    const restored = restoreSearchAdReportRecord<ReportForm>(record);
    if (!restored.ok) {
      setRestoreNotice(restored.message);
      return;
    }

    setRestoreNotice(null);
    generate(restored.input);
  };

  const handleCopyResult = useCallback(async () => {
    if (!report) {
      alert("결과가 없습니다.");
      return;
    }

    try {
      await navigator.clipboard.writeText(reportText);
      flash("결과를 복사했습니다.");
    } catch {
      flash("복사에 실패했습니다.");
    }
  }, [flash, report, reportText]);

  const handleGenerateClick = useCallback(() => {
    if (!form.campaignName.trim()) {
      alert("캠페인명을 입력해 주세요.");
      return;
    }

    generate();
  }, [form.campaignName, generate]);

  const handleSaveTemplate = useCallback(() => {
    const name = window.prompt("템플릿 이름을 입력해 주세요.");
    if (!name) {
      return;
    }

    if (saveTemplate(name)) {
      flash("템플릿을 저장했습니다.");
      return;
    }

    flash("템플릿 이름을 입력해 주세요.");
  }, [flash, saveTemplate]);

  const handleApplyLocalHistory = useCallback(
    (item: (typeof localHistory)[number]) => {
      setForm((prev) => (isSameForm(prev, item.form) ? prev : item.form));
      flash("최근 기록을 불러왔습니다.");
    },
    [flash],
  );

  const handleRerunLocalHistory = useCallback(
    (item: (typeof localHistory)[number]) => {
      setForm((prev) => (isSameForm(prev, item.form) ? prev : item.form));
      generate(item.form);
    },
    [generate],
  );

  const handleApplyTemplate = useCallback(
    (item: (typeof templates)[number]) => {
      setForm((prev) => (isSameForm(prev, item.form) ? prev : item.form));
      flash(`"${item.name}" 템플릿을 적용했습니다.`);
    },
    [flash],
  );

  const handleSuggestionSelect = useCallback((value: string) => {
    setForm((prev) => {
      const merged = {
        ...prev,
        campaignName: value,
      };

      return isSameForm(prev, merged) ? prev : merged;
    });
    setIsAutocompleteOpen(false);
  }, []);

  useOpenSavedItem("search-ad-report-assist", applySaved);

  const prefillState = useMemo(() => {
    const params = new URLSearchParams(searchParamsString);
    const nextForm: ReportForm = {
      template: params.get("template") === "client" ? "client" : "internal",
      mediaPlatform: params.get("mediaPlatform") ?? "",
      campaignName: params.get("campaignName") ?? "",
      period: params.get("period") ?? "",
      impressions: params.get("impressions") ?? "",
      clicks: params.get("clicks") ?? "",
      cost: params.get("cost") ?? "",
      conversions: params.get("conversions") ?? "",
      revenue: params.get("revenue") ?? "",
      ctr: params.get("ctr") ?? "",
      cpc: params.get("cpc") ?? "",
      cpa: params.get("cpa") ?? "",
      roas: params.get("roas") ?? "",
      comparisonNotes: params.get("comparisonNotes") ?? "",
    };

    const hasPrefill = Object.values(nextForm).some((value) => value !== "");
    const autoRun = params.get("autoRun") === "1";

    params.delete("template");
    params.delete("mediaPlatform");
    params.delete("campaignName");
    params.delete("period");
    params.delete("impressions");
    params.delete("clicks");
    params.delete("cost");
    params.delete("conversions");
    params.delete("revenue");
    params.delete("ctr");
    params.delete("cpc");
    params.delete("cpa");
    params.delete("roas");
    params.delete("comparisonNotes");
    params.delete("autoRun");

    return {
      hasPrefill,
      autoRun,
      nextForm,
      nextUrl: params.size > 0 ? `${pathname}?${params.toString()}` : pathname,
    };
  }, [pathname, searchParamsString]);

  useEffect(() => {
    if (!prefillState.hasPrefill) return;

    const mergedForm = {
      ...formRef.current,
      ...prefillState.nextForm,
      template: prefillState.nextForm.template,
    };

    setForm((prev) => (isSameForm(prev, mergedForm) ? prev : mergedForm));
    if (prefillState.autoRun) generate(mergedForm);

    router.replace(prefillState.nextUrl, { scroll: false });
  }, [generate, prefillState, router]);

  return (
    <FeatureShell title="" description="">
      <ActiveFeatureLayout
        controls={
          <div className="space-y-6">
            <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-4">
              <div className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[var(--text-body)]">템플릿</span>
                  <select value={form.template} onChange={(event) => setForm((current) => ({ ...current, template: event.target.value as ReportTemplate }))} className="field-control">
                    <option value="internal">내부 공유용</option>
                    <option value="client">클라이언트용</option>
                  </select>
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    ["매체", "mediaPlatform"], ["캠페인명", "campaignName"], ["기간", "period"], ["노출", "impressions"],
                    ["클릭", "clicks"], ["비용", "cost"], ["전환", "conversions"], ["매출", "revenue"],
                    ["CTR", "ctr"], ["CPC", "cpc"], ["CPA", "cpa"], ["ROAS", "roas"],
                  ].map(([label, key]) => (
                    <label key={key} className="block">
                      <span className="mb-2 block text-sm font-medium text-[var(--text-body)]">{label}</span>
                      <input
                        value={form[key as keyof ReportForm]}
                        onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
                        onFocus={key === "campaignName" ? () => setIsAutocompleteOpen(true) : undefined}
                        onBlur={
                          key === "campaignName"
                            ? () => window.setTimeout(() => setIsAutocompleteOpen(false), 120)
                            : undefined
                        }
                        className="field-control"
                        autoComplete="off"
                      />
                      {key === "campaignName" && isAutocompleteOpen && filteredSuggestions.length > 0 ? (
                        <div className="mt-2 rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] p-2 shadow-[var(--shadow-panel)]">
                          {filteredSuggestions.map((item) => (
                            <button
                              key={item}
                              type="button"
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => handleSuggestionSelect(item)}
                              className="flex w-full items-center rounded-lg px-3 py-2 text-left text-xs text-[var(--text-body)] transition hover:bg-[var(--bg-muted)] hover:text-[var(--text-strong)]"
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </label>
                  ))}
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[var(--text-body)]">비교 메모</span>
                  <textarea value={form.comparisonNotes} onChange={(event) => setForm((current) => ({ ...current, comparisonNotes: event.target.value }))} rows={3} className="field-control" placeholder="전주 대비 변화나 공유 포인트를 적어 주세요." />
                </label>

                <div className="flex flex-wrap gap-2">
                  <SampleDataButton onClick={() => setForm(sampleInternal)} label="대표 샘플" />
                  <button type="button" onClick={() => setForm(sampleInternal)} className="button-secondary inline-flex min-h-9 items-center justify-center px-3 py-2 text-xs">내부 공유용</button>
                  <button type="button" onClick={() => setForm(sampleClient)} className="button-secondary inline-flex min-h-9 items-center justify-center px-3 py-2 text-xs">클라이언트용</button>
                  <button type="button" onClick={() => setForm(sampleDirector)} className="button-secondary inline-flex min-h-9 items-center justify-center px-3 py-2 text-xs">원장님 보고용</button>
                </div>

                <div className="grid gap-2">
                  <button type="button" onClick={handleGenerateClick} disabled={isPending} aria-busy={isPending} className="button-primary w-full">{isPending ? "생성 중..." : "생성하기"}</button>
                  <button type="button" onClick={saveCurrent} disabled={!report} className="button-secondary w-full">결과 저장</button>
                  <button type="button" onClick={handleSaveTemplate} className="button-secondary w-full">템플릿 저장</button>
                  <button type="button" onClick={handleCopyResult} disabled={!report} className="button-secondary w-full">결과 복사</button>
                </div>

                <p className="text-xs text-[var(--text-dim)]">템플릿은 내부 공유, 클라이언트 공유, 원장님 보고 흐름에 맞춰 바로 불러올 수 있습니다.</p>
                {message ? <p className="text-xs text-[var(--text-dim)]">{message}</p> : null}
                {restoreNotice ? <p className="text-xs text-[var(--warning-text)]">{restoreNotice}</p> : null}
              </div>
            </div>

            <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-[var(--text-strong)]">최근 임시 저장</p>
                <span className="text-xs text-[var(--text-dim)]">{localHistory.length}개</span>
              </div>
              <div className="mt-3 space-y-2">
                {localHistory.length === 0 ? (
                  <p className="text-xs text-[var(--text-dim)]">자동 저장된 기록이 없습니다.</p>
                ) : (
                  localHistory.map((item) => (
                    <div key={item.id} className="rounded-lg border border-[var(--line)] bg-[var(--bg-muted)] px-3 py-3">
                      <p className="text-xs font-medium text-[var(--text-strong)]">{formatLocalDate(item.date)}</p>
                      <p className="mt-1 truncate text-xs text-[var(--text-body)]">
                        {item.form.campaignName || "캠페인 미입력"}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button type="button" onClick={() => handleApplyLocalHistory(item)} className="button-secondary px-3 py-2 text-xs">
                          불러오기
                        </button>
                        <button type="button" onClick={() => handleRerunLocalHistory(item)} className="button-secondary px-3 py-2 text-xs">
                          다시 생성
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-[var(--text-strong)]">저장한 템플릿</p>
                <span className="text-xs text-[var(--text-dim)]">{templates.length}개</span>
              </div>
              <div className="mt-3 space-y-2">
                {templates.length === 0 ? (
                  <p className="text-xs text-[var(--text-dim)]">저장된 템플릿이 없습니다.</p>
                ) : (
                  templates.map((item) => (
                    <div key={item.id} className="rounded-lg border border-[var(--line)] bg-[var(--bg-muted)] px-3 py-3">
                      <p className="text-xs font-medium text-[var(--text-strong)]">{item.name}</p>
                      <p className="mt-1 truncate text-xs text-[var(--text-body)]">
                        {item.form.campaignName || "캠페인 미입력"}
                      </p>
                      <div className="mt-2">
                        <button type="button" onClick={() => handleApplyTemplate(item)} className="button-secondary px-3 py-2 text-xs">
                          템플릿 적용
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        }
      >
        <FeatureUsageGuide useWhen={usageGuide.useWhen} output={usageGuide.output} nextAction={usageGuide.nextAction} testPoint={usageGuide.testPoint} />

        {!report ? (
          <EmptyState title="리포트 입력값을 채워 주세요" description="주요 수치를 입력하면 한 줄 요약과 다음 액션까지 함께 정리합니다." />
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-4">
                <p className="section-label">문제</p>
                <p className="mt-2 text-sm leading-6 text-[var(--text-body)]">
                  핵심 요약과 문제점을 먼저 확인하세요.
                </p>
              </div>
              <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-4">
                <p className="section-label">원인</p>
                <p className="mt-2 text-sm leading-6 text-[var(--text-body)]">
                  잘된 점과 비교 메모를 함께 읽으면 맥락을 빠르게 파악할 수 있습니다.
                </p>
              </div>
              <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-4">
                <p className="section-label">해결</p>
                <p className="mt-2 text-sm leading-6 text-[var(--text-body)]">
                  다음 액션을 복사해 바로 공유하거나 운영 보조로 이어가세요.
                </p>
              </div>
            </div>

            <ResultPanel title="핵심 요약" description="리포트에서 가장 먼저 공유할 문장입니다." aside={<CopyButton label="전체 복사" onClick={async () => { try { await navigator.clipboard.writeText(buildCopyText(report)); flash("리포트 전체를 복사했습니다."); } catch { flash("복사에 실패했습니다."); } }} />}>
              <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-muted)] px-4 py-4 text-sm leading-7 text-[var(--text-body)]">{report.oneLineSummary}</div>
            </ResultPanel>
            <ResultPanel title="잘된 점"><OutputList items={report.strengths} /></ResultPanel>
            <ResultPanel title="문제점"><OutputList items={report.issues} /></ResultPanel>
            <ResultPanel title="다음 액션"><OutputList items={report.nextActions} /></ResultPanel>
            <ResultPanel title="다음 작업" description="리포트 정리 후 운영 보조로 바로 이어갈 수 있습니다.">
              <div className="grid gap-3 xl:grid-cols-1">
                <Link href={buildAdOperationsAssistHref({ mediaPlatform: form.mediaPlatform, campaignName: form.campaignName, period: form.period, notes: report.oneLineSummary })} className="surface-card px-5 py-5 text-sm text-[var(--text-body)]">운영 보조로 이어가기</Link>
              </div>
            </ResultPanel>
          </>
        )}

        <HistoryPanel title="최근 리포트 기록" description="이전 리포트를 다시 열고 같은 입력값으로 바로 재생성할 수 있습니다." records={records.slice(0, 5)} emptyTitle="저장된 리포트가 없습니다" emptyDescription="리포트를 저장하면 최근 기록에서 바로 불러오고 다시 실행할 수 있습니다." onApply={applySaved} onRerun={rerunSaved} onRemove={removeRecord} />
      </ActiveFeatureLayout>
    </FeatureShell>
  );
}

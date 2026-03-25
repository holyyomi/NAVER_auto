"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ActiveFeatureLayout } from "@/components/features/active-feature-layout";
import { EmptyState } from "@/components/features/shared-states";
import { FeatureShell } from "@/components/features/feature-shell";
import { ResultPanel } from "@/components/features/result-panel";
import { ResultSummaryGrid } from "@/components/features/result-summary-grid";
import { FeatureUsageGuide } from "@/components/guidance/feature-usage-guide";
import { CopyButton } from "@/components/ui/copy-button";
import { SampleDataButton } from "@/components/ui/sample-data-button";
import { StatusBadge } from "@/components/ui/status-badge";
import { featureUsageGuides } from "@/lib/guidance";
import { useKeywordMonitor } from "@/hooks/use-keyword-monitor";
import type { ApiResult, SearchResponse } from "@/lib/naver/types";
import {
  toMonitorSummary,
  type MonitorHealthStatus,
  type MonitorSearchType,
  type MonitoredKeywordRecord,
} from "@/lib/monitoring/keyword-monitor-store";

const initialForm = {
  keyword: "",
  searchType: "blog" as MonitorSearchType,
};

const sampleKeywords = [
  { keyword: "강남 치과", searchType: "blog" as const },
  { keyword: "분당 필라테스", searchType: "news" as const },
];

function getTypeLabel(type: MonitorSearchType) {
  if (type === "blog") return "블로그";
  if (type === "news") return "뉴스";
  return "쇼핑";
}

function getHealthLabel(status: MonitorHealthStatus) {
  if (status === "normal") return "노출 유지";
  if (status === "changed") return "결과 변화";
  return "확인 필요";
}

function getHealthTone(status: MonitorHealthStatus) {
  if (status === "normal") return "active" as const;
  if (status === "changed") return "attention" as const;
  return "neutral" as const;
}

function formatTimestamp(timestamp: string | null) {
  if (!timestamp) {
    return "기록 없음";
  }

  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) {
    return "기록 없음";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(parsed);
}

function getUserMessage(result: ApiResult<SearchResponse>) {
  if (result.ok) {
    return null;
  }

  if (result.error.includes("노출") || result.error.includes("초과")) {
    return "조회 제한으로 비교를 마치지 못했습니다.";
  }

  return result.error;
}

function buildCountLabel(record: MonitoredKeywordRecord) {
  if (!record.latestSummary) {
    return "-";
  }

  if (!record.previousSummary) {
    return `${record.latestSummary.total}건`;
  }

  return `${record.previousSummary.total}건 -> ${record.latestSummary.total}건`;
}

function buildCopyText(record: MonitoredKeywordRecord) {
  return [
    `키워드: ${record.keyword}`,
    `유형: ${getTypeLabel(record.searchType)}`,
    `상태: ${getHealthLabel(record.healthStatus)}`,
    `비교 요약: ${record.changeSummary}`,
    `현재 확인: ${formatTimestamp(record.latestCheckedAt)}`,
    `이전 확인: ${formatTimestamp(record.previousCheckedAt)}`,
    `노출 수: ${buildCountLabel(record)}`,
    `현재 상단 결과: ${record.latestSummary?.topTitle ?? "-"}`,
  ].join("\n");
}

async function fetchSearchSnapshot(
  keyword: string,
  searchType: MonitorSearchType,
): Promise<ApiResult<SearchResponse>> {
  const response = await fetch("/api/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keyword, searchType }),
  });

  return (await response.json()) as ApiResult<SearchResponse>;
}

function MonitorCard({
  record,
  isChecking,
  onCheck,
  onRemove,
  onCopy,
}: {
  record: MonitoredKeywordRecord;
  isChecking: boolean;
  onCheck: (record: MonitoredKeywordRecord) => void;
  onRemove: (id: string) => void;
  onCopy: (record: MonitoredKeywordRecord) => void;
}) {
  return (
    <article className="rounded-xl border border-[var(--line)] bg-[var(--bg-muted)] px-4 py-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={getHealthTone(record.healthStatus)}>
              {getHealthLabel(record.healthStatus)}
            </StatusBadge>
            <span className="text-xs text-[var(--text-dim)]">{getTypeLabel(record.searchType)}</span>
          </div>

          <h3 className="mt-3 text-sm font-semibold text-[var(--text-strong)]">{record.keyword}</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--text-body)]">{record.changeSummary}</p>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-[var(--line)] bg-[var(--bg-elevated)] px-3 py-3 text-sm text-[var(--text-body)]">
              <p>현재 확인: {formatTimestamp(record.latestCheckedAt)}</p>
              <p className="mt-1">이전 확인: {formatTimestamp(record.previousCheckedAt)}</p>
              <p className="mt-1">노출 수: {buildCountLabel(record)}</p>
            </div>
            <div className="rounded-lg border border-[var(--line)] bg-[var(--bg-elevated)] px-3 py-3 text-sm text-[var(--text-body)]">
              <p className="truncate">현재 상단: {record.latestSummary?.topTitle ?? "-"}</p>
              <p className="mt-1">출처: {record.latestSummary?.topSource ?? "-"}</p>
            </div>
          </div>

          {record.lastMessage && record.healthStatus === "needs-review" ? (
            <p className="mt-3 text-xs text-[var(--warning-text)]">{record.lastMessage}</p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 xl:w-[190px] xl:flex-col">
          <button
            type="button"
            onClick={() => onCheck(record)}
            disabled={isChecking}
            className="button-primary h-8"
          >
            {isChecking ? "확인 중..." : "변화 확인"}
          </button>
          <CopyButton label="요약 복사" onClick={() => onCopy(record)} />
          {record.latestSummary?.topLink ? (
            <a
              href={record.latestSummary.topLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-8 items-center justify-center rounded-lg border border-[var(--line)] px-3 text-xs font-medium text-[var(--text-body)] transition hover:border-[var(--line-strong)] hover:text-[var(--text-strong)]"
            >
              링크 열기
            </a>
          ) : null}
          <button type="button" onClick={() => onRemove(record.id)} className="button-secondary h-8">
            삭제
          </button>
        </div>
      </div>
    </article>
  );
}

export function CompetitorKeywordMonitoringPanel() {
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState<string | null>(null);
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const { state, addKeyword, removeKeyword, updateCheckResult } = useKeywordMonitor();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const usageGuide = featureUsageGuides["competitor-keyword-monitoring"];

  const stats = useMemo(() => {
    const total = state.records.length;
    const checked = state.records.filter((record) => record.latestCheckedAt).length;
    const changed = state.records.filter((record) => record.healthStatus === "changed").length;
    return { total, checked, changed };
  }, [state.records]);

  const flash = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(null), 1800);
  };

  useEffect(() => {
    const keyword = (searchParams.get("keyword") ?? "").trim();
    const searchType = searchParams.get("searchType");
    const autoRegister = searchParams.get("autoRegister") === "1";

    if (!keyword || (searchType !== "blog" && searchType !== "news" && searchType !== "shopping")) {
      return;
    }

    setForm({
      keyword,
      searchType,
    });

    if (autoRegister) {
      flash(`"${keyword}" 키워드를 불러왔습니다. 현재 결과 저장을 눌러 스냅샷을 만드세요.`);
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("keyword");
    nextParams.delete("searchType");
    nextParams.delete("autoRegister");
    const nextUrl = nextParams.size > 0 ? `${pathname}?${nextParams.toString()}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [pathname, router, searchParams]);

  const handleCopy = async (record: MonitoredKeywordRecord) => {
    try {
      await navigator.clipboard.writeText(buildCopyText(record));
      flash("비교 요약을 복사했습니다.");
    } catch {
      flash("복사에 실패했습니다.");
    }
  };

  const runCheck = async (record: MonitoredKeywordRecord) => {
    setCheckingId(record.id);

    try {
      const result = await fetchSearchSnapshot(record.keyword, record.searchType);
      const checkedAt = new Date().toISOString();

      if (result.ok) {
        updateCheckResult({
          id: record.id,
          checkedAt,
          status: result.data.items.length > 0 ? "success" : "empty",
          summary: result.data.items.length > 0 ? toMonitorSummary(result.data) : null,
          message: result.data.items.length > 0 ? null : "이번 조회에서는 결과가 없습니다.",
        });

        flash(
          record.latestSummary
            ? `"${record.keyword}" 키워드 변화를 확인했습니다.`
            : `"${record.keyword}" 첫 스냅샷을 저장했습니다.`,
        );
      } else {
        updateCheckResult({
          id: record.id,
          checkedAt,
          status: result.error.includes("노출") || result.error.includes("초과") ? "quota" : "error",
          summary: null,
          message: getUserMessage(result),
        });
        flash(`"${record.keyword}" 조회 결과를 확인하지 못했습니다.`);
      }
    } catch {
      updateCheckResult({
        id: record.id,
        checkedAt: new Date().toISOString(),
        status: "error",
        summary: null,
        message: "검색 결과를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
      });
      flash("현재 결과 저장에 실패했습니다.");
    } finally {
      setCheckingId(null);
    }
  };

  const handleSaveSnapshot = async () => {
    const keyword = form.keyword.trim();
    if (!keyword) {
      flash("키워드를 입력해 주세요.");
      return;
    }

    const nextState = addKeyword({
      keyword,
      searchType: form.searchType,
    });

    const record = nextState.records.find(
      (item) => item.keyword === keyword && item.searchType === form.searchType,
    );

    if (!record) {
      flash("키워드 저장에 실패했습니다.");
      return;
    }

    await runCheck(record);
    setForm((current) => ({ ...current, keyword: "" }));
  };

  return (
    <FeatureShell
      title="경쟁 키워드 모니터링"
      description="저장한 검색 결과와 현재 결과를 비교해 노출 변화를 확인합니다."
    >
      <ActiveFeatureLayout
        controls={
          <div className="space-y-6">
            <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-4">
              <div className="space-y-4">
                <p className="rounded-lg border border-[var(--line)] bg-[var(--bg-muted)] px-3 py-3 text-xs leading-6 text-[var(--text-body)]">
                  정확한 순위 추적 기능이 아니라, 이전 결과 대비 노출 여부 변화를 확인하는 기능입니다.
                </p>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[var(--text-body)]">키워드</span>
                  <input
                    value={form.keyword}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, keyword: event.target.value }))
                    }
                    className="w-full rounded-lg border border-[var(--line)] bg-[var(--bg-muted)] px-3 py-2.5 text-sm text-[var(--text-strong)] outline-none transition focus:border-[var(--line-strong)]"
                    placeholder="예: 강남 치과"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[var(--text-body)]">유형</span>
                  <select
                    value={form.searchType}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        searchType: event.target.value as MonitorSearchType,
                      }))
                    }
                    className="w-full rounded-lg border border-[var(--line)] bg-[var(--bg-muted)] px-3 py-2.5 text-sm text-[var(--text-strong)] outline-none transition focus:border-[var(--line-strong)]"
                  >
                    <option value="blog">블로그</option>
                    <option value="news">뉴스</option>
                    <option value="shopping">쇼핑</option>
                  </select>
                </label>

                <div className="flex flex-wrap gap-2">
                  <SampleDataButton onClick={() => setForm(sampleKeywords[0])} />
                  {sampleKeywords.map((sample) => (
                    <button
                      key={`${sample.keyword}-${sample.searchType}`}
                      type="button"
                      onClick={() => setForm(sample)}
                      className="inline-flex h-8 items-center justify-center rounded-lg border border-[var(--line)] px-3 text-xs font-medium text-[var(--text-body)] transition hover:border-[var(--line-strong)] hover:text-[var(--text-strong)]"
                    >
                      {sample.keyword}
                    </button>
                  ))}
                </div>

                <button type="button" onClick={handleSaveSnapshot} className="button-primary w-full">
                  현재 결과 저장
                </button>

                <p className="text-xs text-[var(--text-dim)]">현재 결과를 저장한 뒤 다시 확인하면 이전 결과와 비교합니다.</p>
                {message ? <p className="text-xs text-[var(--text-dim)]">{message}</p> : null}
              </div>
            </div>
          </div>
        }
      >
        <FeatureUsageGuide
          useWhen={usageGuide.useWhen}
          output={usageGuide.output}
          nextAction={usageGuide.nextAction}
          testPoint={usageGuide.testPoint}
        />

        <ResultSummaryGrid>
          <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-4">
            <p className="text-[11px] tracking-[0.14em] text-[var(--text-dim)]">저장 수</p>
            <p className="mt-2 text-base font-semibold text-[var(--text-strong)]">{stats.total}개</p>
          </div>
          <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-4">
            <p className="text-[11px] tracking-[0.14em] text-[var(--text-dim)]">비교 완료</p>
            <p className="mt-2 text-base font-semibold text-[var(--text-strong)]">{stats.checked}개</p>
          </div>
          <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-4">
            <p className="text-[11px] tracking-[0.14em] text-[var(--text-dim)]">변화 있음</p>
            <p className="mt-2 text-base font-semibold text-[var(--text-strong)]">{stats.changed}개</p>
          </div>
        </ResultSummaryGrid>

        {state.records.length === 0 ? (
          <EmptyState
            title="저장한 키워드가 없습니다"
            description="키워드를 저장하면 다음 확인부터 이전 결과와 비교합니다."
          />
        ) : (
          <ResultPanel
            title="최근 5개 키워드"
            description="저장한 검색 결과와 현재 결과를 비교합니다."
          >
            <div className="space-y-3">
              {state.records.map((record) => (
                <MonitorCard
                  key={record.id}
                  record={record}
                  isChecking={checkingId === record.id}
                  onCheck={runCheck}
                  onRemove={removeKeyword}
                  onCopy={handleCopy}
                />
              ))}
            </div>
          </ResultPanel>
        )}
      </ActiveFeatureLayout>
    </FeatureShell>
  );
}

"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ActiveFeatureLayout } from "@/components/features/active-feature-layout";
import { EmptyState } from "@/components/features/shared-states";
import { FeatureShell } from "@/components/features/feature-shell";
import { ResultPanel } from "@/components/features/result-panel";
import { ResultSummaryGrid } from "@/components/features/result-summary-grid";
import { FeatureUsageGuide } from "@/components/guidance/feature-usage-guide";
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

function getTypeLabel(type: MonitorSearchType) {
  if (type === "blog") return "블로그";
  if (type === "news") return "뉴스";
  return "쇼핑";
}

function getHealthLabel(status: MonitorHealthStatus) {
  if (status === "normal") return "정상";
  if (status === "changed") return "변화 있음";
  return "확인 필요";
}

function getHealthTone(status: MonitorHealthStatus) {
  if (status === "normal") return "active" as const;
  if (status === "changed") return "attention" as const;
  return "neutral" as const;
}

function formatTimestamp(timestamp: string | null) {
  if (!timestamp) {
    return "확인 이력 없음";
  }

  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) {
    return "확인 이력 없음";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(parsed);
}

function buildCountDiff(record: MonitoredKeywordRecord) {
  if (!record.latestSummary) {
    return "최신 결과 없음";
  }

  if (!record.previousSummary) {
    return "첫 비교 전";
  }

  const diff = record.latestSummary.total - record.previousSummary.total;
  if (diff > 0) {
    return `+${diff}건`;
  }

  if (diff < 0) {
    return `${diff}건`;
  }

  return "변화 없음";
}

function buildStatusReason(record: MonitoredKeywordRecord) {
  if (record.healthStatus === "needs-review") {
    if (record.lastStatus === "quota") {
      return "호출 한도 이슈로 이번 비교를 완료하지 못했습니다.";
    }

    if (record.lastStatus === "error") {
      return "검색 요청 오류로 최신 비교 기준을 만들지 못했습니다.";
    }

    if (!record.latestSummary) {
      return "아직 비교 기준이 없어서 먼저 첫 확인이 필요합니다.";
    }

    return "비교 기준이 부족해 추가 확인이 필요합니다.";
  }

  if (!record.previousSummary) {
    return "첫 확인 기준이 저장된 상태입니다. 다음 확인부터 변화 비교가 가능합니다.";
  }

  if (record.healthStatus === "changed") {
    return record.changeSummary;
  }

  return "이전 확인과 비교해 결과 수와 상위 노출 구성이 안정적입니다.";
}

function buildTopResultDiff(record: MonitoredKeywordRecord) {
  if (!record.latestSummary) {
    return "최신 상위 결과가 없습니다.";
  }

  if (!record.previousSummary) {
    return "이전 비교 기준이 없어 다음 확인부터 상위 결과 변화를 확인할 수 있습니다.";
  }

  const titleChanged = record.latestSummary.topTitle !== record.previousSummary.topTitle;
  const sourceChanged = record.latestSummary.topSource !== record.previousSummary.topSource;

  if (!titleChanged && !sourceChanged) {
    return "상위 제목과 출처가 이전 확인과 동일합니다.";
  }

  if (titleChanged && sourceChanged) {
    return "상위 제목과 출처가 모두 변경되었습니다.";
  }

  if (titleChanged) {
    return "상위 제목이 변경되었습니다.";
  }

  return "상위 출처가 변경되었습니다.";
}

function getUserMessage(result: ApiResult<SearchResponse>) {
  if (result.ok) {
    return null;
  }

  if (result.error.includes("호출 한도") || result.error.includes("초과")) {
    return "오늘 사용 가능한 검색 호출 한도를 초과했습니다. 내일 다시 확인해 주세요.";
  }

  return result.error;
}

function downloadCsv(records: MonitoredKeywordRecord[]) {
  if (records.length === 0) {
    return;
  }

  const header = [
    "keyword",
    "searchType",
    "healthStatus",
    "latestCheckedAt",
    "previousCheckedAt",
    "latestResultCount",
    "previousResultCount",
    "changeSummary",
    "statusReason",
    "latestTopTitle",
    "previousTopTitle",
    "latestTopSource",
    "previousTopSource",
  ];

  const escapeCell = (value: string | number | null | undefined) =>
    `"${String(value ?? "").replaceAll('"', '""')}"`;

  const rows = records.map((record) =>
    [
      record.keyword,
      getTypeLabel(record.searchType),
      getHealthLabel(record.healthStatus),
      record.latestCheckedAt,
      record.previousCheckedAt,
      record.latestSummary?.total ?? "",
      record.previousSummary?.total ?? "",
      record.changeSummary,
      buildStatusReason(record),
      record.latestSummary?.topTitle ?? "",
      record.previousSummary?.topTitle ?? "",
      record.latestSummary?.topSource ?? "",
      record.previousSummary?.topSource ?? "",
    ]
      .map(escapeCell)
      .join(","),
  );

  const csv = [header.join(","), ...rows].join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `competitor-monitor-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

async function copySummary(record: MonitoredKeywordRecord) {
  const lines = [
    `키워드: ${record.keyword}`,
    `유형: ${getTypeLabel(record.searchType)}`,
    `상태: ${getHealthLabel(record.healthStatus)}`,
    `상태 이유: ${buildStatusReason(record)}`,
    `최신 확인: ${formatTimestamp(record.latestCheckedAt)}`,
    `이전 확인: ${formatTimestamp(record.previousCheckedAt)}`,
    `최신 결과 수: ${record.latestSummary?.total ?? "-"}`,
    `이전 결과 수: ${record.previousSummary?.total ?? "-"}`,
    `결과 수 차이: ${buildCountDiff(record)}`,
    `상위 결과 비교: ${buildTopResultDiff(record)}`,
    `변화 요약: ${record.changeSummary}`,
  ];

  await navigator.clipboard.writeText(lines.join("\n"));
}

function SnapshotCard({
  title,
  checkedAt,
  summary,
  highlight,
}: {
  title: string;
  checkedAt: string | null;
  summary: MonitoredKeywordRecord["latestSummary"];
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border px-4 py-4 ${
        highlight
          ? "border-[var(--line-strong)] bg-[rgba(255,255,255,0.04)]"
          : "border-[var(--line)] bg-[var(--bg-elevated)]"
      }`}
    >
      <p className="text-[11px] tracking-[0.12em] text-[var(--text-dim)]">{title}</p>
      <div className="mt-3 space-y-1 text-sm text-[var(--text-body)]">
        <p>확인 시각: {formatTimestamp(checkedAt)}</p>
        <p>결과 수: {summary?.total ?? "-"}</p>
        <p className="truncate">상위 제목: {summary?.topTitle ?? "비교 기준 없음"}</p>
        <p>출처: {summary?.topSource ?? "비교 기준 없음"}</p>
      </div>
    </div>
  );
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
    <article className="rounded-2xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-5 py-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={getHealthTone(record.healthStatus)}>
              {getHealthLabel(record.healthStatus)}
            </StatusBadge>
            <span className="rounded-md border border-[var(--line)] px-2 py-1 text-[11px] text-[var(--text-dim)]">
              {getTypeLabel(record.searchType)}
            </span>
            <span className="rounded-md border border-[var(--line)] px-2 py-1 text-[11px] text-[var(--text-dim)]">
              결과 수 {buildCountDiff(record)}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-[var(--text-strong)]">{record.keyword}</h3>
              <p className="mt-1 text-sm text-[var(--text-dim)]">{buildStatusReason(record)}</p>
            </div>
            {record.lastMessage && record.healthStatus === "needs-review" ? (
              <p className="max-w-md text-sm text-[var(--warning-text)]">{record.lastMessage}</p>
            ) : null}
          </div>

          <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <SnapshotCard
              title={isChecking ? "최신 스냅샷 갱신 중" : "최신 스냅샷"}
              checkedAt={record.latestCheckedAt}
              summary={record.latestSummary}
              highlight
            />
            <SnapshotCard
              title="이전 스냅샷"
              checkedAt={record.previousCheckedAt}
              summary={record.previousSummary}
            />
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-4">
              <p className="text-[11px] tracking-[0.12em] text-[var(--text-dim)]">변화 비교</p>
              <div className="mt-3 space-y-2 text-sm leading-6 text-[var(--text-body)]">
                <p>{record.changeSummary}</p>
                <p>{buildTopResultDiff(record)}</p>
              </div>
            </div>
            <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-4">
              <p className="text-[11px] tracking-[0.12em] text-[var(--text-dim)]">실무 활용 메모</p>
              <div className="mt-3 space-y-2 text-sm leading-6 text-[var(--text-body)]">
                <p>제안 준비: 키워드별 노출 안정성 여부를 빠르게 확인할 수 있습니다.</p>
                <p>경쟁 추적: 상위 제목과 출처 변경 여부를 기준으로 이상 징후를 잡아낼 수 있습니다.</p>
                <p>로컬 점검: 지역 키워드 조합의 반복 확인용 기준으로 활용할 수 있습니다.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-row flex-wrap gap-2 xl:w-[180px] xl:flex-col">
          <button
            type="button"
            onClick={() => onCheck(record)}
            disabled={isChecking}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--bg-soft)] px-4 text-sm font-medium text-[var(--text-strong)] transition hover:border-[var(--line-strong)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isChecking ? "확인 중..." : "지금 확인"}
          </button>
          <button
            type="button"
            onClick={() => onCopy(record)}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-[var(--line)] px-4 text-sm font-medium text-[var(--text-body)] transition hover:border-[var(--line-strong)] hover:text-[var(--text-strong)]"
          >
            비교 요약 복사
          </button>
          {record.latestSummary?.topLink ? (
            <a
              href={record.latestSummary.topLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-[var(--line)] px-4 text-sm font-medium text-[var(--text-body)] transition hover:border-[var(--line-strong)] hover:text-[var(--text-strong)]"
            >
              상위 결과 열기
            </a>
          ) : null}
          <button
            type="button"
            onClick={() => onRemove(record.id)}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-[var(--line)] px-4 text-sm font-medium text-[var(--text-body)] transition hover:border-[var(--line-strong)] hover:text-[var(--text-strong)]"
          >
            제거
          </button>
        </div>
      </div>
    </article>
  );
}

export function CompetitorKeywordMonitoringPanel() {
  const [form, setForm] = useState(initialForm);
  const [panelMessage, setPanelMessage] = useState<string | null>(null);
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const { state, addKeyword, removeKeyword, updateCheckResult } = useKeywordMonitor();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const stats = useMemo(() => {
    const total = state.records.length;
    const checked = state.records.filter((record) => record.latestCheckedAt).length;
    const changed = state.records.filter((record) => record.healthStatus === "changed").length;
    const review = state.records.filter((record) => record.healthStatus === "needs-review").length;

    return { total, checked, changed, review };
  }, [state.records]);

  const usageGuide = featureUsageGuides["competitor-keyword-monitoring"];

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
      const beforeCount = state.records.length;
      const next = addKeyword({
        keyword,
        searchType,
      });

      setPanelMessage(
        next.records.length === beforeCount
          ? `"${keyword}" 키워드는 이미 모니터링 목록에 있습니다.`
          : `"${keyword}" 키워드를 모니터링 목록에 등록했습니다.`,
      );
      window.setTimeout(() => setPanelMessage(null), 1800);
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("keyword");
    nextParams.delete("searchType");
    nextParams.delete("autoRegister");
    const nextUrl = nextParams.size > 0 ? `${pathname}?${nextParams.toString()}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [addKeyword, pathname, router, searchParams, state.records.length]);

  const handleAdd = () => {
    const keyword = form.keyword.trim();
    if (!keyword) {
      setPanelMessage("키워드를 입력해 주세요.");
      return;
    }

    const beforeCount = state.records.length;
    const next = addKeyword({
      keyword,
      searchType: form.searchType,
    });

    setForm((current) => ({ ...current, keyword: "" }));
    setPanelMessage(
      next.records.length === beforeCount
        ? "이미 등록된 키워드입니다."
        : "모니터링 목록에 추가했습니다.",
    );
    window.setTimeout(() => setPanelMessage(null), 1800);
  };

  const handleExport = () => {
    if (state.records.length === 0) {
      setPanelMessage("내보낼 모니터링 목록이 없습니다.");
      window.setTimeout(() => setPanelMessage(null), 1800);
      return;
    }

    downloadCsv(state.records);
    setPanelMessage("현재 모니터링 목록을 CSV로 저장했습니다.");
    window.setTimeout(() => setPanelMessage(null), 1800);
  };

  const handleCopy = async (record: MonitoredKeywordRecord) => {
    try {
      await copySummary(record);
      setPanelMessage(`"${record.keyword}" 비교 요약을 복사했습니다.`);
    } catch {
      setPanelMessage("클립보드 복사에 실패했습니다.");
    } finally {
      window.setTimeout(() => setPanelMessage(null), 1800);
    }
  };

  const runCheck = async (record: MonitoredKeywordRecord) => {
    setCheckingId(record.id);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: record.keyword,
          searchType: record.searchType,
        }),
      });

      const result = (await response.json()) as ApiResult<SearchResponse>;
      const checkedAt = new Date().toISOString();

      if (result.ok) {
        updateCheckResult({
          id: record.id,
          checkedAt,
          status: result.data.items.length > 0 ? "success" : "empty",
          summary: result.data.items.length > 0 ? toMonitorSummary(result.data) : { total: 0 },
          message: result.data.items.length > 0 ? null : "이번 확인에서는 결과가 없습니다.",
        });
        setPanelMessage(`"${record.keyword}" 최신 결과를 다시 확인했습니다.`);
      } else {
        updateCheckResult({
          id: record.id,
          checkedAt,
          status: result.error.includes("호출 한도") || result.error.includes("초과") ? "quota" : "error",
          summary: null,
          message: getUserMessage(result),
        });
        setPanelMessage(`"${record.keyword}" 확인 결과 점검이 필요한 상태입니다.`);
      }
    } catch {
      updateCheckResult({
        id: record.id,
        checkedAt: new Date().toISOString(),
        status: "error",
        summary: null,
        message: "결과를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
      });
      setPanelMessage(`"${record.keyword}" 확인에 실패했습니다.`);
    } finally {
      setCheckingId(null);
      window.setTimeout(() => setPanelMessage(null), 1800);
    }
  };

  return (
    <FeatureShell
      title="경쟁 키워드 모니터링"
      description="제안 준비, 경쟁 추적, 지역 시장 점검에 필요한 키워드를 저장하고 이전 대비 변화 여부를 비교해서 확인합니다."
    >
      <ActiveFeatureLayout
        controls={
          <div className="space-y-6">
            <div className="rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-[var(--text-strong)]">모니터링 등록</p>
                <StatusBadge tone="neutral">로컬 MVP</StatusBadge>
              </div>

              <div className="mt-4 space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[var(--text-body)]">
                    키워드
                  </span>
                  <input
                    value={form.keyword}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, keyword: event.target.value }))
                    }
                    placeholder="예: 강남 피부과"
                    className="w-full rounded-lg border border-[var(--line)] bg-[var(--bg-elevated)] px-3 py-2.5 text-sm text-[var(--text-strong)] outline-none transition focus:border-[var(--line-strong)]"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[var(--text-body)]">
                    유형
                  </span>
                  <select
                    value={form.searchType}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        searchType: event.target.value as MonitorSearchType,
                      }))
                    }
                    className="w-full rounded-lg border border-[var(--line)] bg-[var(--bg-elevated)] px-3 py-2.5 text-sm text-[var(--text-strong)] outline-none transition focus:border-[var(--line-strong)]"
                  >
                    <option value="blog">블로그</option>
                    <option value="news">뉴스</option>
                    <option value="shopping">쇼핑</option>
                  </select>
                </label>

                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={handleAdd}
                    className="inline-flex h-11 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--bg-soft)] text-sm font-medium text-[var(--text-strong)] transition hover:border-[var(--line-strong)]"
                  >
                    모니터 추가
                  </button>
                  <button
                    type="button"
                    onClick={handleExport}
                    className="inline-flex h-11 items-center justify-center rounded-lg border border-[var(--line)] text-sm font-medium text-[var(--text-body)] transition hover:border-[var(--line-strong)] hover:text-[var(--text-strong)]"
                  >
                    목록 CSV 저장
                  </button>
                </div>

                {panelMessage ? (
                  <p className="text-sm text-[var(--text-dim)]">{panelMessage}</p>
                ) : null}
              </div>
            </div>

            <div className="rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-4 py-4">
              <p className="text-sm font-medium text-[var(--text-strong)]">활용 포인트</p>
              <div className="mt-3 space-y-2 text-sm text-[var(--text-body)]">
                <p>1. 제안 대상 업종, 지역 키워드, 경쟁사 관련어를 묶어서 비교 기준으로 관리합니다.</p>
                <p>2. 이전 스냅샷과 최신 스냅샷을 비교해 결과 수와 상위 결과 변화를 바로 확인합니다.</p>
                <p>3. 변화 있음과 확인 필요 상태를 우선 검토해 제안 메모나 운영 액션 후보로 넘깁니다.</p>
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
            <p className="text-[11px] tracking-[0.14em] text-[var(--text-dim)]">등록 키워드</p>
            <p className="mt-2 text-base font-semibold text-[var(--text-strong)]">{stats.total}개</p>
          </div>
          <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-4">
            <p className="text-[11px] tracking-[0.14em] text-[var(--text-dim)]">최근 확인 완료</p>
            <p className="mt-2 text-base font-semibold text-[var(--text-strong)]">{stats.checked}개</p>
          </div>
          <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-4">
            <p className="text-[11px] tracking-[0.14em] text-[var(--text-dim)]">변화 있음</p>
            <p className="mt-2 text-base font-semibold text-[var(--text-strong)]">{stats.changed}개</p>
          </div>
          <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-4">
            <p className="text-[11px] tracking-[0.14em] text-[var(--text-dim)]">확인 필요</p>
            <p className="mt-2 text-base font-semibold text-[var(--text-strong)]">{stats.review}개</p>
          </div>
        </ResultSummaryGrid>

        {state.records.length === 0 ? (
          <EmptyState
            title="등록된 모니터링 키워드가 없습니다"
            description="좌측에서 키워드와 유형을 등록하면 비교 중심 모니터링 목록이 생성됩니다."
          />
        ) : (
          <ResultPanel
            title="모니터링 목록"
            description="각 키워드의 최신 스냅샷과 이전 스냅샷을 나란히 비교해 변화 여부를 빠르게 점검합니다."
            aside={<StatusBadge tone="neutral">비교 스냅샷</StatusBadge>}
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

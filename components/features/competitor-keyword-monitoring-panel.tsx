"use client";

import { useMemo, useState } from "react";
import { ActiveFeatureLayout } from "@/components/features/active-feature-layout";
import { EmptyState } from "@/components/features/shared-states";
import { FeatureShell } from "@/components/features/feature-shell";
import { ResultPanel } from "@/components/features/result-panel";
import { ResultSummaryGrid } from "@/components/features/result-summary-grid";
import { StatusBadge } from "@/components/ui/status-badge";
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

function buildCountChangeLabel(record: MonitoredKeywordRecord) {
  if (!record.latestSummary) {
    return "최신 결과 없음";
  }

  if (!record.previousSummary) {
    return "첫 비교 기준";
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

function getUserMessage(result: ApiResult<SearchResponse>) {
  if (result.ok) {
    return null;
  }

  if (result.error.includes("호출 시도")) {
    return "오늘 사용 가능한 호출 시도를 초과했습니다. 내일 다시 확인해 주세요.";
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
    "latestTopTitle",
    "previousTopTitle",
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
      record.latestSummary?.topTitle ?? "",
      record.previousSummary?.topTitle ?? "",
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
    `최신 확인: ${formatTimestamp(record.latestCheckedAt)}`,
    `이전 확인: ${formatTimestamp(record.previousCheckedAt)}`,
    `최신 결과 수: ${record.latestSummary?.total ?? "-"}`,
    `이전 결과 수: ${record.previousSummary?.total ?? "-"}`,
    `변화 요약: ${record.changeSummary}`,
  ];

  await navigator.clipboard.writeText(lines.join("\n"));
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
              결과 변화 {buildCountChangeLabel(record)}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-[var(--text-strong)]">{record.keyword}</h3>
              <p className="mt-1 text-sm text-[var(--text-dim)]">
                {record.changeSummary}
              </p>
            </div>
            {record.lastMessage && record.healthStatus === "needs-review" ? (
              <p className="max-w-md text-sm text-[var(--warning-text)]">{record.lastMessage}</p>
            ) : null}
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-4">
              <p className="text-[11px] tracking-[0.12em] text-[var(--text-dim)]">최신 스냅샷</p>
              <div className="mt-3 space-y-1 text-sm text-[var(--text-body)]">
                <p>확인 시각: {isChecking ? "확인 중..." : formatTimestamp(record.latestCheckedAt)}</p>
                <p>결과 수: {record.latestSummary?.total ?? "-"}</p>
                <p className="truncate">상위 제목: {record.latestSummary?.topTitle ?? "-"}</p>
                <p>출처: {record.latestSummary?.topSource ?? "-"}</p>
              </div>
            </div>

            <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-4">
              <p className="text-[11px] tracking-[0.12em] text-[var(--text-dim)]">이전 스냅샷</p>
              <div className="mt-3 space-y-1 text-sm text-[var(--text-body)]">
                <p>확인 시각: {formatTimestamp(record.previousCheckedAt)}</p>
                <p>결과 수: {record.previousSummary?.total ?? "-"}</p>
                <p className="truncate">상위 제목: {record.previousSummary?.topTitle ?? "-"}</p>
                <p>출처: {record.previousSummary?.topSource ?? "-"}</p>
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
            요약 복사
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

  const stats = useMemo(() => {
    const total = state.records.length;
    const checked = state.records.filter((record) => record.latestCheckedAt).length;
    const changed = state.records.filter((record) => record.healthStatus === "changed").length;
    const review = state.records.filter((record) => record.healthStatus === "needs-review").length;

    return { total, checked, changed, review };
  }, [state.records]);

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
      setPanelMessage(`"${record.keyword}" 요약을 복사했습니다.`);
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
          status: result.error.includes("호출 시도") ? "quota" : "error",
          summary: null,
          message: getUserMessage(result),
        });
        setPanelMessage(`"${record.keyword}" 확인 중 점검이 필요한 상태가 감지되었습니다.`);
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
      description="제안 검토, 경쟁사 추적, 로컬 시장 점검에 필요한 키워드를 저장하고 변화 여부를 비교해서 확인합니다."
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
                <p>1. 제안 대상 업종, 지역 키워드, 경쟁사 관련어를 묶어서 관리합니다.</p>
                <p>2. 최신 확인과 이전 확인을 비교해 노출 수 변화와 상위 결과 변화를 바로 봅니다.</p>
                <p>3. 변화 있음과 확인 필요 상태를 우선 검토해 보고서나 운영 액션 후보로 넘깁니다.</p>
              </div>
            </div>
          </div>
        }
      >
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
            description="각 키워드의 최신 스냅샷과 이전 스냅샷을 비교해 변화 여부를 빠르게 점검합니다."
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

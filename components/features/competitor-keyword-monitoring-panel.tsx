"use client";

import { useMemo, useState, useTransition } from "react";
import { ActiveFeatureLayout } from "@/components/features/active-feature-layout";
import { FeatureShell } from "@/components/features/feature-shell";
import { EmptyState } from "@/components/features/shared-states";
import { ResultPanel } from "@/components/features/result-panel";
import { ResultSummaryGrid } from "@/components/features/result-summary-grid";
import { StatusBadge } from "@/components/ui/status-badge";
import { useKeywordMonitor } from "@/hooks/use-keyword-monitor";
import type { ApiResult, SearchResponse } from "@/lib/naver/types";
import {
  toMonitorSummary,
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

function getStatusLabel(status: MonitoredKeywordRecord["lastStatus"]) {
  if (status === "success") return "정상";
  if (status === "empty") return "결과 없음";
  if (status === "quota") return "한도 초과";
  if (status === "error") return "확인 필요";
  if (status === "loading") return "조회 중";
  return "대기";
}

function getStatusTone(status: MonitoredKeywordRecord["lastStatus"]) {
  if (status === "success") return "active" as const;
  if (status === "idle") return "neutral" as const;
  return "attention" as const;
}

function formatTimestamp(timestamp: string | null) {
  if (!timestamp) {
    return "아직 조회하지 않음";
  }

  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) {
    return "아직 조회하지 않음";
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

  if (result.error.includes("호출 한도")) {
    return "오늘 사용 가능한 호출 한도를 초과했습니다. 내일 다시 시도해 주세요.";
  }

  return result.error;
}

function MonitorCard({
  record,
  isChecking,
  onCheck,
  onRemove,
}: {
  record: MonitoredKeywordRecord;
  isChecking: boolean;
  onCheck: (record: MonitoredKeywordRecord) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <article className="rounded-2xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-5 py-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={getStatusTone(isChecking ? "loading" : record.lastStatus)}>
              {getStatusLabel(isChecking ? "loading" : record.lastStatus)}
            </StatusBadge>
            <span className="rounded-md border border-[var(--line)] px-2 py-1 text-[11px] text-[var(--text-dim)]">
              {getTypeLabel(record.searchType)}
            </span>
          </div>

          <h3 className="mt-4 text-base font-semibold text-[var(--text-strong)]">{record.keyword}</h3>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-3">
              <p className="text-[11px] text-[var(--text-dim)]">등록일</p>
              <p className="mt-1 text-sm text-[var(--text-body)]">{formatTimestamp(record.createdAt)}</p>
            </div>
            <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-3">
              <p className="text-[11px] text-[var(--text-dim)]">마지막 확인</p>
              <p className="mt-1 text-sm text-[var(--text-body)]">
                {isChecking ? "조회 중..." : formatTimestamp(record.lastCheckedAt)}
              </p>
            </div>
          </div>

          <div className="mt-3 rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-3">
            <p className="text-[11px] text-[var(--text-dim)]">최신 요약</p>
            {record.latestSummary ? (
              <div className="mt-2 space-y-1 text-sm text-[var(--text-body)]">
                <p>결과 수 {record.latestSummary.total}건</p>
                <p className="truncate">상위 제목 {record.latestSummary.topTitle ?? "-"}</p>
                <p>출처 {record.latestSummary.topSource ?? "-"}</p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-[var(--text-dim)]">
                {record.lastMessage ?? "아직 확인한 결과가 없습니다."}
              </p>
            )}
          </div>

          {record.lastMessage && record.lastStatus !== "success" ? (
            <p className="mt-3 text-sm text-[var(--text-dim)]">{record.lastMessage}</p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-row flex-wrap gap-2 xl:w-[160px] xl:flex-col">
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
            onClick={() => onRemove(record.id)}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-[var(--line)] px-4 text-sm font-medium text-[var(--text-body)] transition hover:border-[var(--line-strong)] hover:text-[var(--text-strong)]"
          >
            삭제
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
  const [isPending, startTransition] = useTransition();
  const { state, addKeyword, removeKeyword, updateCheckResult } = useKeywordMonitor();

  const stats = useMemo(() => {
    const total = state.records.length;
    const checked = state.records.filter(
      (record: MonitoredKeywordRecord) => record.lastCheckedAt,
    ).length;
    const alert = state.records.filter(
      (record: MonitoredKeywordRecord) =>
        record.lastStatus === "quota" || record.lastStatus === "error",
    ).length;

    return { total, checked, alert };
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
      next.records.length === beforeCount ? "이미 등록된 키워드입니다." : "모니터링 목록에 추가했습니다.",
    );
    window.setTimeout(() => setPanelMessage(null), 1800);
  };

  const runCheck = (record: MonitoredKeywordRecord) => {
    setCheckingId(record.id);

    startTransition(async () => {
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
            message: result.data.items.length > 0 ? null : "결과가 없습니다.",
          });
        } else {
          updateCheckResult({
            id: record.id,
            checkedAt,
            status: result.error.includes("호출 한도") ? "quota" : "error",
            summary: null,
            message: getUserMessage(result),
          });
        }
      } catch {
        updateCheckResult({
          id: record.id,
          checkedAt: new Date().toISOString(),
          status: "error",
          summary: null,
          message: "결과를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
        });
      } finally {
        setCheckingId(null);
      }
    });
  };

  return (
    <FeatureShell
      title="경쟁 키워드 모니터링"
      description="등록한 키워드를 수동으로 반복 확인하는 MVP입니다."
    >
      <ActiveFeatureLayout
        controls={
          <div className="space-y-6">
            <div className="rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-[var(--text-strong)]">모니터 등록</p>
                {isPending ? <StatusBadge tone="attention">확인 중</StatusBadge> : null}
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

                <button
                  type="button"
                  onClick={handleAdd}
                  className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--bg-soft)] text-sm font-medium text-[var(--text-strong)] transition hover:border-[var(--line-strong)]"
                >
                  모니터 추가
                </button>

                {panelMessage ? (
                  <p className="text-sm text-[var(--text-dim)]">{panelMessage}</p>
                ) : null}
              </div>
            </div>

            <div className="rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-4 py-4">
              <p className="text-sm font-medium text-[var(--text-strong)]">사용 방식</p>
              <div className="mt-3 space-y-2 text-sm text-[var(--text-body)]">
                <p>1. 키워드와 유형을 등록합니다.</p>
                <p>2. 필요한 시점에 지금 확인을 눌러 다시 조회합니다.</p>
                <p>3. 마지막 확인 시각과 최신 요약을 비교합니다.</p>
              </div>
            </div>
          </div>
        }
      >
        <ResultSummaryGrid>
          <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-4">
            <p className="text-[11px] tracking-[0.14em] text-[var(--text-dim)]">등록 수</p>
            <p className="mt-2 text-base font-semibold text-[var(--text-strong)]">{stats.total}개</p>
          </div>
          <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-4">
            <p className="text-[11px] tracking-[0.14em] text-[var(--text-dim)]">최근 확인</p>
            <p className="mt-2 text-base font-semibold text-[var(--text-strong)]">{stats.checked}개</p>
          </div>
          <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-4">
            <p className="text-[11px] tracking-[0.14em] text-[var(--text-dim)]">확인 필요</p>
            <p className="mt-2 text-base font-semibold text-[var(--text-strong)]">{stats.alert}개</p>
          </div>
        </ResultSummaryGrid>

        {state.records.length === 0 ? (
          <EmptyState
            title="등록된 키워드가 없습니다"
            description="왼쪽에서 키워드를 추가하면 수동 확인 목록이 만들어집니다."
          />
        ) : (
          <ResultPanel
            title="모니터 목록"
            description="키워드별 최신 확인 상태를 봅니다."
            aside={<StatusBadge tone="neutral">수동 MVP</StatusBadge>}
          >
            <div className="space-y-3">
              {state.records.map((record: MonitoredKeywordRecord) => (
                <MonitorCard
                  key={record.id}
                  record={record}
                  isChecking={checkingId === record.id}
                  onCheck={runCheck}
                  onRemove={removeKeyword}
                />
              ))}
            </div>
          </ResultPanel>
        )}
      </ActiveFeatureLayout>
    </FeatureShell>
  );
}

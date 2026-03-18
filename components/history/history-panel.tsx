"use client";

import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  buildSavedItemHref,
  getSavedFeatureMeta,
  type SavedItemRecord,
} from "@/lib/history/types";

function formatSavedAt(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  }).format(new Date(value));
}

type HistoryPanelProps = {
  title: string;
  description: string;
  records: SavedItemRecord[];
  emptyTitle: string;
  emptyDescription: string;
  onApply?: (record: SavedItemRecord) => void;
  onRemove?: (id: string) => void;
};

export function HistoryPanel({
  title,
  description,
  records,
  emptyTitle,
  emptyDescription,
  onApply,
  onRemove,
}: HistoryPanelProps) {
  const hasRecords = records.length > 0;

  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)]">
      <div className={`border-b border-[var(--line)] px-5 ${hasRecords ? "py-4" : "py-3"}`}>
        <p className="text-sm font-medium text-[var(--text-strong)]">{title}</p>
        <p className="mt-1 text-xs text-[var(--text-dim)]">{description}</p>
      </div>

      <div className={`px-5 ${hasRecords ? "py-5" : "py-3"}`}>
        {!hasRecords ? (
          <div className="rounded-lg border border-dashed border-[var(--line)] bg-[rgba(255,255,255,0.015)] px-4 py-4">
            <p className="text-sm font-medium text-[var(--text-strong)]">{emptyTitle}</p>
            <p className="mt-1 text-sm text-[var(--text-body)]">{emptyDescription}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((record) => {
              const feature = getSavedFeatureMeta(record.featureType);

              return (
                <article
                  key={record.id}
                  className="rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge tone="neutral">{feature.label}</StatusBadge>
                        <span className="text-xs text-[var(--text-dim)]">
                          최근 저장 {formatSavedAt(record.updatedAt)}
                        </span>
                      </div>
                      <p className="mt-3 text-sm font-medium text-[var(--text-strong)]">{record.title}</p>
                    </div>
                    <Link
                      href={buildSavedItemHref(record)}
                      className="text-xs font-medium text-[var(--text-muted)] transition hover:text-[var(--text-strong)]"
                    >
                      페이지 열기
                    </Link>
                  </div>

                  <p className="mt-2 text-sm leading-6 text-[var(--text-body)]">{record.summary}</p>

                  {record.fields.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {record.fields.map((field) => (
                        <span
                          key={`${record.id}-${field.label}`}
                          className="rounded-md border border-[var(--line)] px-2 py-1 text-[11px] text-[var(--text-dim)]"
                        >
                          {field.label}: {field.value}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-2">
                    {onApply ? (
                      <button
                        type="button"
                        onClick={() => onApply(record)}
                        className="inline-flex h-8 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--bg-soft)] px-3 text-xs font-medium text-[var(--text-strong)] transition hover:border-[var(--line-strong)]"
                      >
                        바로 불러오기
                      </button>
                    ) : null}
                    {onRemove ? (
                      <button
                        type="button"
                        onClick={() => onRemove(record.id)}
                        className="inline-flex h-8 items-center justify-center rounded-lg border border-[var(--line)] bg-transparent px-3 text-xs font-medium text-[var(--text-body)] transition hover:border-[var(--line-strong)]"
                      >
                        삭제
                      </button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

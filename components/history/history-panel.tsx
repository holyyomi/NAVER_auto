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
    <div className="space-y-5">
      <div>
        <p className="section-label">History</p>
        <p className="mt-2 text-[16px] font-semibold text-[var(--text-strong)]">{title}</p>
        <p className="mt-2 text-sm leading-6 text-[var(--text-body)]">{description}</p>
      </div>

      {!hasRecords ? (
        <div className="rounded-[12px] border border-dashed border-[var(--line)] bg-[var(--bg-muted)] px-5 py-5">
          <p className="text-sm font-semibold text-[var(--text-strong)]">{emptyTitle}</p>
          <p className="mt-2 text-sm leading-6 text-[var(--text-body)]">{emptyDescription}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((record) => {
            const feature = getSavedFeatureMeta(record.featureType);

            return (
              <article
                key={record.id}
                className="rounded-[12px] border border-[var(--line)] bg-[var(--bg-muted)] px-5 py-5 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-panel)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge tone="neutral">{feature.label}</StatusBadge>
                      <span className="text-xs text-[var(--text-dim)]">
                        저장 {formatSavedAt(record.updatedAt)}
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-[var(--text-strong)]">
                      {record.title}
                    </p>
                  </div>
                  <Link
                    href={buildSavedItemHref(record)}
                    className="text-xs font-semibold text-[var(--accent)] transition hover:text-[var(--accent-strong)]"
                  >
                    다시 열기
                  </Link>
                </div>

                <p className="mt-3 text-sm leading-6 text-[var(--text-body)]">{record.summary}</p>

                {record.fields.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {record.fields.map((field) => (
                      <span
                        key={`${record.id}-${field.label}`}
                        className="rounded-full border border-[var(--line)] bg-white px-3 py-1 text-[11px] font-medium text-[var(--text-muted)]"
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
                      className="button-primary px-3 py-2 text-xs"
                    >
                      현재 화면에 적용
                    </button>
                  ) : null}
                  {onRemove ? (
                    <button
                      type="button"
                      onClick={() => onRemove(record.id)}
                      className="button-secondary px-3 py-2 text-xs"
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
  );
}

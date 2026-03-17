"use client";

import { HistoryPanel } from "@/components/history/history-panel";
import { useActivityHistory } from "@/hooks/use-activity-history";

export function RecentActivitySection() {
  const { records, removeRecord } = useActivityHistory();

  return (
    <HistoryPanel
      title="최근 저장"
      description="다시 볼 작업"
      records={records.slice(0, 6)}
      emptyTitle="저장 없음"
      emptyDescription="저장한 작업이 여기에 표시됩니다."
      onRemove={removeRecord}
    />
  );
}

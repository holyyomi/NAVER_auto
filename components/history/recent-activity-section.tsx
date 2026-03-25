"use client";

import { HistoryPanel } from "@/components/history/history-panel";
import { useActivityHistory } from "@/hooks/use-activity-history";

export function RecentActivitySection() {
  const { records, removeRecord } = useActivityHistory();

  return (
    <HistoryPanel
      title="최근 작업"
      description="저장한 결과와 보고서, 운영 메모를 빠르게 다시 열 수 있습니다."
      records={records.slice(0, 5)}
      emptyTitle="최근 작업이 없습니다"
      emptyDescription="각 기능에서 결과를 저장하면 이 영역에 최근 기록이 표시됩니다."
      onRemove={removeRecord}
    />
  );
}

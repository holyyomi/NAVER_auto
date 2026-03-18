"use client";

import { HistoryPanel } from "@/components/history/history-panel";
import { useActivityHistory } from "@/hooks/use-activity-history";

export function RecentActivitySection() {
  const { records, removeRecord } = useActivityHistory();

  return (
    <HistoryPanel
      title="최근 저장"
      description="기능별 저장 결과를 다시 열고 정리합니다."
      records={records.slice(0, 6)}
      emptyTitle="저장 항목 없음"
      emptyDescription="리서치와 운영 결과를 저장하면 여기에서 최근 항목을 바로 열 수 있습니다."
      onRemove={removeRecord}
    />
  );
}

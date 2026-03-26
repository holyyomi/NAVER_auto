"use client";

import { HistoryPanel } from "@/components/history/history-panel";
import { useActivityHistory } from "@/hooks/use-activity-history";

export function RecentActivitySection() {
  const { records, removeRecord } = useActivityHistory();

  return (
    <HistoryPanel
      title="최근 실행 작업"
      description="방금 정리한 결과를 다시 열거나 삭제할 수 있습니다."
      records={records.slice(0, 3)}
      emptyTitle="최근 실행 작업이 없습니다"
      emptyDescription="각 기능에서 결과를 저장하면 이 영역에서 최근 작업을 바로 확인할 수 있습니다."
      onRemove={removeRecord}
    />
  );
}

"use client";

import { HistoryPanel } from "@/components/history/history-panel";
import { useActivityHistory } from "@/hooks/use-activity-history";

export function RecentActivitySection() {
  const { records, removeRecord } = useActivityHistory();

  return (
    <HistoryPanel
      title="최근 저장"
      description="리서치, 리포트, 운영 점검 결과를 다시 열기 쉬운 순서로 모아둡니다."
      records={records.slice(0, 6)}
      emptyTitle="저장된 항목이 없습니다"
      emptyDescription="기능별 결과를 저장하면 홈에서 최근 작업을 바로 다시 열 수 있습니다."
      onRemove={removeRecord}
    />
  );
}

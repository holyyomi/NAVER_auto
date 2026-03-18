"use client";

import { FeatureShell } from "@/components/features/feature-shell";
import { ApprovalNotice } from "@/components/features/approval-notice";
import { HistoryPanel } from "@/components/history/history-panel";
import { useActivityHistory } from "@/hooks/use-activity-history";

export function ShoppingInsightsPanel() {
  const { records, removeRecord } = useActivityHistory("shopping-insights");

  return (
    <FeatureShell
      title="쇼핑 인사이트"
      description="승인 대기 기능입니다. 저장된 예전 결과만 다시 확인할 수 있습니다."
    >
      <div className="space-y-6">
        <ApprovalNotice />
        <HistoryPanel
          title="최근 저장"
          description="기존에 저장된 쇼핑 인사이트 결과를 다시 열 수 있습니다."
          records={records.slice(0, 5)}
          emptyTitle="저장 항목 없음"
          emptyDescription="승인 이후 조회와 저장 기능이 다시 열립니다."
          onRemove={removeRecord}
        />
      </div>
    </FeatureShell>
  );
}

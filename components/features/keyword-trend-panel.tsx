"use client";

import { FeatureShell } from "@/components/features/feature-shell";
import { PendingResultState } from "@/components/features/approval-notice";

export function KeywordTrendPanel() {
  return (
    <FeatureShell
      title="키워드 트렌드"
      description="현재 운영 범위에서 제외된 기능입니다."
    >
      <PendingResultState />
    </FeatureShell>
  );
}

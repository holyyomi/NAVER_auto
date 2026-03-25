"use client";

import { FeatureShell } from "@/components/features/feature-shell";
import { PendingResultState } from "@/components/features/approval-notice";

export function ShoppingInsightsPanel() {
  return (
    <FeatureShell
      title="쇼핑 인사이트"
      description="현재 운영 범위에서 제외된 기능입니다."
    >
      <PendingResultState />
    </FeatureShell>
  );
}

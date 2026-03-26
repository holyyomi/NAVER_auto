"use client";

import { StatusBadge } from "@/components/ui/status-badge";

type FeatureShellProps = {
  title: string;
  description: string;
  source?: "naver" | "mock" | null;
  children: React.ReactNode;
};

export function FeatureShell({ source, children }: FeatureShellProps) {
  return (
    <div className="space-y-6">
      {source ? (
        <section className="panel panel-history rounded-[20px] px-6 py-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[15px] font-semibold text-[var(--text-strong)]">현재 조회 상태</p>
            <StatusBadge tone={source === "naver" ? "active" : "attention"}>
              {source === "naver" ? "실데이터" : "샘플 데이터"}
            </StatusBadge>
          </div>
        </section>
      ) : null}
      {children}
    </div>
  );
}

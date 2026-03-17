"use client";

import { SectionHeading } from "@/components/ui/section-heading";
import { StatusBadge } from "@/components/ui/status-badge";

type FeatureShellProps = {
  title: string;
  description: string;
  source?: "naver" | "mock" | null;
  children: React.ReactNode;
};

export function FeatureShell({ title, description, source, children }: FeatureShellProps) {
  return (
    <div className="space-y-6">
      <section className="panel rounded-2xl px-6 py-6">
        <SectionHeading
          eyebrow="기능"
          title={title}
          description={description}
          aside={
            source ? (
              <StatusBadge tone={source === "naver" ? "active" : "attention"}>
                {source === "naver" ? "실데이터" : "테스트 데이터"}
              </StatusBadge>
            ) : undefined
          }
        />
      </section>
      {children}
    </div>
  );
}

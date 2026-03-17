import Link from "next/link";
import { SectionHeading } from "@/components/ui/section-heading";
import { StatusBadge } from "@/components/ui/status-badge";
import type { FeatureDefinition } from "@/lib/features";

type PlaceholderFeaturePanelProps = {
  feature: FeatureDefinition;
};

export function PlaceholderFeaturePanel({ feature }: PlaceholderFeaturePanelProps) {
  return (
    <div className="space-y-6">
      <section className="panel rounded-2xl px-6 py-6">
        <SectionHeading
          eyebrow="준비 중"
          title={feature.title}
          description="아직 사용할 수 없습니다."
          aside={<StatusBadge tone="pending">준비 중</StatusBadge>}
        />

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-3">
            <p className="text-xs text-[var(--text-dim)]">상태</p>
            <p className="mt-1 text-sm font-medium text-[var(--text-strong)]">출시 전</p>
          </div>
          <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-3">
            <p className="text-xs text-[var(--text-dim)]">분류</p>
            <p className="mt-1 text-sm font-medium text-[var(--text-strong)]">{feature.group}</p>
          </div>
        </div>
      </section>

      <section className="panel rounded-2xl px-6 py-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[var(--text-strong)]">준비 중인 기능입니다.</p>
            <p className="mt-2 text-sm text-[var(--text-body)]">홈으로 돌아가 다른 작업을 선택하세요.</p>
          </div>
          <Link
            href="/"
            className="inline-flex h-10 items-center rounded-lg border border-[var(--line)] bg-[var(--bg-elevated)] px-4 text-sm font-medium text-[var(--text-strong)] transition-colors hover:bg-[var(--bg-soft)]"
          >
            홈으로
          </Link>
        </div>
      </section>
    </div>
  );
}

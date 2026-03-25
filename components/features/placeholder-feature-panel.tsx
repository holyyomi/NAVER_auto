import Link from "next/link";
import { SectionHeading } from "@/components/ui/section-heading";
import { StatusBadge } from "@/components/ui/status-badge";
import { getFeatureStatusMeta, type FeatureDefinition } from "@/lib/features";

type PlaceholderFeaturePanelProps = {
  feature: FeatureDefinition;
};

export function PlaceholderFeaturePanel({ feature }: PlaceholderFeaturePanelProps) {
  const statusMeta = getFeatureStatusMeta(feature.status);

  return (
    <div className="space-y-6">
      <section className="panel rounded-2xl px-6 py-6">
        <SectionHeading
          eyebrow={statusMeta.sectionLabel}
          title={feature.title}
          description="현재 운영 범위에 포함되지 않은 기능입니다."
          aside={<StatusBadge tone={statusMeta.tone}>{statusMeta.label}</StatusBadge>}
        />

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-3">
            <p className="text-xs text-[var(--text-dim)]">상태</p>
            <p className="mt-1 text-sm font-medium text-[var(--text-strong)]">{statusMeta.label}</p>
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
            <p className="text-sm font-medium text-[var(--text-strong)]">현재 사용 가능한 기능으로 이동해 주세요.</p>
            <p className="mt-2 text-sm text-[var(--text-body)]">
              이 기능은 이번 MVP 범위에 포함되지 않습니다. 홈에서 현재 사용 가능한 작업으로 이동할 수 있습니다.
            </p>
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

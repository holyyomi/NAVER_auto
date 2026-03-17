import Link from "next/link";
import { RecentActivitySection } from "@/components/history/recent-activity-section";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  getFeatureStatusMeta,
  pendingFeatures,
  plannedFeatures,
  usableFeatures,
} from "@/lib/features";

const launchpadCopy: Record<
  string,
  {
    useFor: string;
    timing: string;
    cta: string;
  }
> = {
  "search-results-hub": {
    useFor: "검색 결과를 한 번에 모아 비교할 때",
    timing: "콘텐츠와 노출 현황을 빠르게 훑어야 할 때",
    cta: "열기",
  },
  "local-business-research": {
    useFor: "지역 키워드와 업체 구성을 조사할 때",
    timing: "로컬 검색 결과를 정리해야 할 때",
    cta: "조사 시작",
  },
  "competitor-keyword-monitoring": {
    useFor: "경쟁 키워드 변화를 반복 점검할 때",
    timing: "같은 검색어를 주기적으로 확인할 때",
    cta: "모니터링 열기",
  },
  "search-ad-report-assist": {
    useFor: "검색광고 보고 초안을 정리할 때",
    timing: "주간 또는 월간 운영 리포트가 필요할 때",
    cta: "리포트 작성",
  },
  "ad-operations-assist": {
    useFor: "캠페인 운영 상태를 빠르게 점검할 때",
    timing: "효율 저하 원인과 다음 액션을 정리해야 할 때",
    cta: "운영 점검",
  },
};

export default function HomePage() {
  return (
    <div className="space-y-6 pt-1">
      <section className="panel rounded-2xl px-6 py-6">
        <div className="flex items-end justify-between gap-4 border-b border-[var(--line)] pb-5">
          <div>
            <p className="section-label">사용 가능</p>
            <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.03em] text-[var(--text-strong)]">
              바로 시작할 작업
            </h2>
          </div>
          <StatusBadge tone="active">{usableFeatures.length}개</StatusBadge>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-2 2xl:grid-cols-4">
          {usableFeatures.map((feature) => {
            const copy = launchpadCopy[feature.slug];

            return (
              <Link
                key={feature.slug}
                href={feature.href}
                className="group flex min-h-[260px] flex-col rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)] px-5 py-5 transition-all hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:bg-[var(--bg-soft)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-[var(--line)] bg-[rgba(255,255,255,0.03)] px-3 text-xs font-semibold text-[var(--text-muted)]">
                    {feature.index}
                  </span>
                  <StatusBadge tone={getFeatureStatusMeta(feature.status).tone}>
                    {getFeatureStatusMeta(feature.status).shortLabel}
                  </StatusBadge>
                </div>

                <div className="mt-7">
                  <h3 className="text-xl font-semibold tracking-[-0.03em] text-[var(--text-strong)]">
                    {feature.title}
                  </h3>
                </div>

                <div className="mt-6 space-y-4">
                  <div>
                    <p className="text-[11px] tracking-[0.14em] text-[var(--text-dim)]">용도</p>
                    <p className="mt-1 text-sm text-[var(--text-body)]">{copy.useFor}</p>
                  </div>
                  <div>
                    <p className="text-[11px] tracking-[0.14em] text-[var(--text-dim)]">적합한 시점</p>
                    <p className="mt-1 text-sm text-[var(--text-body)]">{copy.timing}</p>
                  </div>
                </div>

                <div className="mt-auto pt-8">
                  <span className="inline-flex items-center rounded-lg border border-[var(--line-strong)] bg-[rgba(255,255,255,0.03)] px-4 py-2 text-sm font-medium text-[var(--text-strong)] transition-colors group-hover:bg-[rgba(255,255,255,0.06)]">
                    {copy.cta}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div className="panel rounded-2xl px-6 py-6">
          <RecentActivitySection />
        </div>

        <div className="panel rounded-2xl px-6 py-6">
          <div className="flex items-end justify-between gap-4 border-b border-[var(--line)] pb-5">
            <div>
              <p className="section-label">상태 점검</p>
              <h2 className="mt-2 text-[20px] font-semibold tracking-[-0.03em] text-[var(--text-strong)]">
                승인 대기 및 준비 중
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge tone="attention">{pendingFeatures.length}개 승인 대기</StatusBadge>
              <StatusBadge tone="pending">{plannedFeatures.length}개 준비 중</StatusBadge>
            </div>
          </div>

          <div className="mt-5 space-y-5">
            {pendingFeatures.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-[var(--text-strong)]">승인 대기</p>
                  <StatusBadge tone="attention">{pendingFeatures.length}개</StatusBadge>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {pendingFeatures.map((feature) => (
                    <Link
                      key={feature.slug}
                      href={feature.href}
                      className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-4 transition-colors hover:border-[var(--line-strong)] hover:bg-[var(--bg-soft)]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-[var(--text-strong)]">
                            {feature.title}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-[var(--text-body)]">
                            {feature.shortDescription}
                          </p>
                        </div>
                        <StatusBadge tone="attention">승인 대기</StatusBadge>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}

            {plannedFeatures.length > 0 ? (
              <div className="space-y-3 border-t border-[var(--line)] pt-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-[var(--text-strong)]">준비 중</p>
                  <StatusBadge tone="pending">{plannedFeatures.length}개</StatusBadge>
                </div>

                <div className="grid gap-3">
                  {plannedFeatures.map((feature) => (
                    <Link
                      key={feature.slug}
                      href={feature.href}
                      className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-4 transition-colors hover:border-[var(--line-strong)] hover:bg-[var(--bg-soft)]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-[var(--text-strong)]">
                            {feature.title}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-[var(--text-body)]">
                            {feature.shortDescription}
                          </p>
                        </div>
                        <StatusBadge tone="pending">준비 중</StatusBadge>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}

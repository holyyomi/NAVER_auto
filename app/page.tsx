import Link from "next/link";
import { RecentActivitySection } from "@/components/history/recent-activity-section";
import { StatusBadge } from "@/components/ui/status-badge";
import { activeFeatures, upcomingFeatures } from "@/lib/features";

const launchpadCopy: Record<
  string,
  {
    useFor: string;
    timing: string;
    cta: string;
  }
> = {
  "keyword-trends": {
    useFor: "검색 수요 흐름 확인",
    timing: "수요 변화를 볼 때",
    cta: "열기",
  },
  "search-results-hub": {
    useFor: "상위 검색 결과 비교",
    timing: "노출 결과를 검토할 때",
    cta: "열기",
  },
  "shopping-insights": {
    useFor: "쇼핑 관심과 수요 확인",
    timing: "상품 관심을 볼 때",
    cta: "열기",
  },
  "local-business-research": {
    useFor: "지역 업체 검색 패턴 조사",
    timing: "지역 조사가 필요할 때",
    cta: "열기",
  },
  "competitor-keyword-monitoring": {
    useFor: "경쟁 키워드 반복 확인",
    timing: "같은 키워드를 다시 볼 때",
    cta: "열기",
  },
  "search-ad-report-assist": {
    useFor: "광고 지표 리포트 초안 작성",
    timing: "주간·월간 보고 문구가 필요할 때",
    cta: "열기",
  },
};

export default function HomePage() {
  return (
    <div className="space-y-6 pt-1">
      <section className="panel rounded-2xl px-6 py-6">
        <div className="flex items-end justify-between gap-4 border-b border-[var(--line)] pb-5">
          <div>
            <p className="section-label">활성</p>
            <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.03em] text-[var(--text-strong)]">
              바로 할 작업
            </h2>
          </div>
          <StatusBadge tone="active">{activeFeatures.length}개</StatusBadge>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-3 2xl:grid-cols-6">
          {activeFeatures.map((feature) => {
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
                  <StatusBadge tone="active">사용</StatusBadge>
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
                    <p className="text-[11px] tracking-[0.14em] text-[var(--text-dim)]">시점</p>
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
              <p className="section-label">예정</p>
              <h2 className="mt-2 text-[20px] font-semibold tracking-[-0.03em] text-[var(--text-strong)]">
                준비 중
              </h2>
            </div>
            <StatusBadge tone="pending">{upcomingFeatures.length}개</StatusBadge>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {upcomingFeatures.map((feature) => (
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
                  <StatusBadge tone="pending">예정</StatusBadge>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

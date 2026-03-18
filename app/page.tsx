import Link from "next/link";
import { RecentActivitySection } from "@/components/history/recent-activity-section";
import { StatusBadge } from "@/components/ui/status-badge";
import { employeeWorkGuides, qaChecklist } from "@/lib/guidance";
import {
  getFeatureStatusMeta,
  pendingFeatures,
  plannedFeatures,
} from "@/lib/features";
import {
  buildCompetitorMonitorHref,
  buildSearchResultsHref,
} from "@/lib/workflow/cross-feature-links";

const todayTasks = [
  {
    title: "신규 고객사 제안 준비",
    description: "검색 레퍼런스와 업종 반응을 빠르게 모아 제안 전 조사 메모를 정리합니다.",
    support: "검색 결과 모음 사용",
    href: buildSearchResultsHref({
      keyword: "병원 마케팅",
      searchType: "blog",
      autoRun: true,
    }),
    cta: "시작",
  },
  {
    title: "지역 업종 조사",
    description: "로컬 시장 검색 패턴과 경쟁 업체 노출 구성을 확인해 제안 배경 자료를 만듭니다.",
    support: "지역 업체 조사 사용",
    href: "/features/local-business-research",
    cta: "조사 시작",
  },
  {
    title: "경쟁사 추적",
    description: "반복 확인이 필요한 키워드를 등록해 노출 수와 상위 결과 변화를 추적합니다.",
    support: "경쟁 키워드 모니터링 사용",
    href: buildCompetitorMonitorHref({
      keyword: "강남 피부과",
      searchType: "blog",
    }),
    cta: "열기",
  },
  {
    title: "주간 보고 초안 작성",
    description: "성과 수치를 넣고 바로 공유 가능한 요약, 강점, 점검 포인트, 액션 초안을 만듭니다.",
    support: "검색광고 리포트 보조 사용",
    href: "/features/search-ad-report-assist",
    cta: "바로가기",
  },
  {
    title: "광고 운영 점검",
    description: "오늘 운영에서 먼저 봐야 할 위험 구간과 바로 실행할 액션을 빠르게 정리합니다.",
    support: "광고 운영 보조 사용",
    href: "/features/ad-operations-assist",
    cta: "점검 시작",
  },
];

const quickStarts = [
  { label: "검색 결과 모음 열기", href: "/features/search-results-hub" },
  { label: "지역 업체 조사 시작", href: "/features/local-business-research" },
  {
    label: "경쟁 키워드 등록",
    href: buildCompetitorMonitorHref({
      keyword: "브랜드 검색광고",
      searchType: "news",
    }),
  },
  { label: "리포트 초안 작성", href: "/features/search-ad-report-assist" },
  { label: "운영 상태 점검", href: "/features/ad-operations-assist" },
];

const outputValues = [
  {
    title: "제안 전 조사 메모",
    description: "검색 결과와 지역 조사 결과를 모아 업종 반응, 지역성, 레퍼런스 흐름을 바로 정리합니다.",
  },
  {
    title: "경쟁사 체크 결과",
    description: "경쟁 키워드별 최근 변화 여부와 상위 노출 차이를 빠르게 비교해 팀 공유용 메모로 남깁니다.",
  },
  {
    title: "보고용 문장 초안",
    description: "성과 요약, 좋은 점, 점검 포인트, 권장 액션을 보고서에 바로 붙일 수 있는 문장으로 정리합니다.",
  },
  {
    title: "운영 액션 메모",
    description: "소재 CTR 점검, 입찰 조정, 랜딩 점검, 예산 재배분 등 실제 운영 액션 중심으로 정리합니다.",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-6 pt-1">
      <section className="panel rounded-2xl px-6 py-6">
        <div className="flex flex-col gap-4 border-b border-[var(--line)] pb-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="section-label">오늘 바로 쓰는 업무</p>
            <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.03em] text-[var(--text-strong)]">
              SA/DA 실무를 바로 시작하는 작업 대시보드
            </h1>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-[var(--text-body)]">
              신규 제안 조사, 지역 업종 분석, 경쟁 추적, 주간 보고 초안, 광고 운영 점검까지
              실무자가 오늘 바로 해야 할 일을 기준으로 시작할 수 있게 정리했습니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone="active">사용 가능 {todayTasks.length}개 작업</StatusBadge>
            <StatusBadge tone="neutral">저장/재오픈 지원</StatusBadge>
          </div>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
          {todayTasks.map((task) => (
            <div
              key={task.title}
              className="flex min-h-[220px] flex-col rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)] px-5 py-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold tracking-[-0.03em] text-[var(--text-strong)]">
                    {task.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-body)]">{task.description}</p>
                </div>
                <StatusBadge tone="active">실행 가능</StatusBadge>
              </div>

              <div className="mt-5 rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-4 py-3">
                <p className="text-[11px] tracking-[0.14em] text-[var(--text-dim)]">연결 기능</p>
                <p className="mt-2 text-sm text-[var(--text-body)]">{task.support}</p>
              </div>

              <div className="mt-auto pt-6">
                <Link
                  href={task.href}
                  className="inline-flex items-center rounded-lg border border-[var(--line-strong)] bg-[rgba(255,255,255,0.03)] px-4 py-2 text-sm font-medium text-[var(--text-strong)] transition-colors hover:bg-[rgba(255,255,255,0.06)]"
                >
                  {task.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel rounded-2xl px-6 py-6">
        <div className="flex flex-col gap-4 border-b border-[var(--line)] pb-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="section-label">테스트 안내</p>
            <h2 className="mt-2 text-[20px] font-semibold tracking-[-0.03em] text-[var(--text-strong)]">
              직원 테스트 체크리스트
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-body)]">
              내부 테스트 때는 기능 수보다 실제 업무에 바로 쓰이는지가 중요합니다. 아래 항목만
              확인해도 기본 QA는 빠르게 끝낼 수 있습니다.
            </p>
          </div>
          <StatusBadge tone="neutral">내부 QA용</StatusBadge>
        </div>

        <div className="mt-5 grid gap-3 xl:grid-cols-2">
          {qaChecklist.map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-4"
            >
              <p className="text-sm font-medium text-[var(--text-strong)]">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-[var(--text-body)]">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="panel rounded-2xl px-6 py-6">
        <div className="flex flex-col gap-4 border-b border-[var(--line)] pb-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="section-label">사용 안내</p>
            <h2 className="mt-2 text-[20px] font-semibold tracking-[-0.03em] text-[var(--text-strong)]">
              이 도구는 이렇게 사용합니다
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-body)]">
              어떤 기능을 열어야 할지 헷갈릴 때는 업무 상황부터 고르면 됩니다. 아래 시나리오를
              보고 바로 맞는 기능으로 들어가세요.
            </p>
          </div>
          <StatusBadge tone="neutral">업무 기준 안내</StatusBadge>
        </div>

        <div className="mt-5 grid gap-3 xl:grid-cols-2">
          {employeeWorkGuides.map((guide) => (
            <div
              key={guide.title}
              className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-[var(--text-strong)]">{guide.title}</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-body)]">{guide.description}</p>
                </div>
                <StatusBadge tone="active">{guide.featureLabel}</StatusBadge>
              </div>
              <div className="mt-4 rounded-lg border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-3 py-3">
                <p className="text-[11px] tracking-[0.14em] text-[var(--text-dim)]">얻는 결과</p>
                <p className="mt-2 text-sm text-[var(--text-body)]">{guide.output}</p>
              </div>
              <div className="mt-4">
                <Link
                  href={guide.href}
                  className="inline-flex items-center rounded-lg border border-[var(--line)] px-4 py-2 text-sm font-medium text-[var(--text-body)] transition hover:border-[var(--line-strong)] hover:text-[var(--text-strong)]"
                >
                  {guide.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="panel rounded-2xl px-6 py-6">
          <div className="flex items-end justify-between gap-4 border-b border-[var(--line)] pb-5">
            <div>
              <p className="section-label">빠른 시작</p>
              <h2 className="mt-2 text-[20px] font-semibold tracking-[-0.03em] text-[var(--text-strong)]">
                자주 쓰는 작업 바로가기
              </h2>
            </div>
            <StatusBadge tone="active">즉시 실행</StatusBadge>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            {quickStarts.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-4 text-sm font-medium text-[var(--text-body)] transition-colors hover:border-[var(--line-strong)] hover:bg-[var(--bg-soft)] hover:text-[var(--text-strong)]"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="panel rounded-2xl px-6 py-6">
          <div className="border-b border-[var(--line)] pb-5">
            <p className="section-label">바로 얻는 결과</p>
            <h2 className="mt-2 text-[20px] font-semibold tracking-[-0.03em] text-[var(--text-strong)]">
              이 도구로 바로 남길 수 있는 산출물
            </h2>
          </div>

          <div className="mt-5 space-y-3">
            {outputValues.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-4"
              >
                <p className="text-sm font-medium text-[var(--text-strong)]">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--text-body)]">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="panel rounded-2xl px-6 py-6">
          <RecentActivitySection />
        </div>

        <div className="panel rounded-2xl px-6 py-6">
          <div className="flex items-end justify-between gap-4 border-b border-[var(--line)] pb-5">
            <div>
              <p className="section-label">승인 대기 / 준비 중</p>
              <h2 className="mt-2 text-[20px] font-semibold tracking-[-0.03em] text-[var(--text-strong)]">
                다음에 열릴 작업 영역
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge tone="attention">승인 대기 {pendingFeatures.length}개</StatusBadge>
              <StatusBadge tone="pending">준비 중 {plannedFeatures.length}개</StatusBadge>
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
                        <StatusBadge tone={getFeatureStatusMeta(feature.status).tone}>
                          {getFeatureStatusMeta(feature.status).shortLabel}
                        </StatusBadge>
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
                        <StatusBadge tone={getFeatureStatusMeta(feature.status).tone}>
                          {getFeatureStatusMeta(feature.status).shortLabel}
                        </StatusBadge>
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

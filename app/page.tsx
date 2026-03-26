import Link from "next/link";
import { RecentActivitySection } from "@/components/history/recent-activity-section";

const quickStarts = [
  {
    title: "검색 결과 모음",
    description: "키워드 반응과 상단 노출 결과를 빠르게 확인합니다.",
    href: "/features/search-results-hub",
    cta: "결과 보기",
  },
  {
    title: "검색광고 리포트 보조",
    description: "성과 수치를 입력해 공유용 리포트 초안을 바로 정리합니다.",
    href: "/features/search-ad-report-assist",
    cta: "리포트 만들기",
  },
  {
    title: "광고 운영 보조",
    description: "운영 이슈를 점검하고 오늘 액션을 바로 정리합니다.",
    href: "/features/ad-operations-assist",
    cta: "액션 정리",
  },
];

const todaySummary = [
  { label: "오늘 조회 수", value: "120,000", note: "최근 검색 기준" },
  { label: "실행 작업 수", value: "36", note: "저장과 생성 포함" },
  { label: "추천 액션 수", value: "08", note: "우선 확인 필요" },
];

const kpis = [
  { label: "노출", value: "120,000" },
  { label: "클릭", value: "3,650" },
  { label: "전환", value: "112" },
];

const todayFocus = [
  {
    title: "CTR 하락 구간 점검",
    description:
      "검색 결과 모음에서 상단 제목을 확인하고 운영 보조에서 오늘 액션으로 이어가세요.",
    href: "/features/search-results-hub",
    cta: "검색 결과 보기",
  },
  {
    title: "제안 전 지역 조사 정리",
    description:
      "강남 치과, 분당 필라테스처럼 지역과 업종 기준 결과를 빠르게 비교해 보세요.",
    href: "/features/local-business-research",
    cta: "조사 시작",
  },
  {
    title: "최근 작업 다시 활용",
    description:
      "최근 실행 작업에서 같은 조건으로 다시 열고 필요한 문장만 복사해 바로 공유할 수 있습니다.",
    href: "#recent-activity",
    cta: "최근 작업 보기",
  },
];

const recommendedActions = [
  {
    problem: "CTR 하락 구간 발생",
    action: "상단 노출 제목과 광고 문안을 함께 비교해 제목 문구를 먼저 조정하세요.",
  },
  {
    problem: "경쟁 콘텐츠 대비 키워드 부족",
    action: "지역명과 서비스 키워드를 추가한 뒤 다시 검색 결과를 확인하세요.",
  },
  {
    problem: "전환 대비 CPC 부담",
    action: "고비용 키워드와 랜딩 CTA를 함께 점검해 운영 메모로 정리하세요.",
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-full flex-col gap-6">
      <section className="dashboard-card dashboard-hero overflow-hidden px-6 py-7 sm:px-7">
        <div className="flex flex-col gap-7 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="section-label">Marketing Dashboard</p>
            <h1 className="mt-3 text-[30px] font-bold tracking-[-0.04em] text-[var(--text-strong)] sm:text-[34px]">
              오늘 필요한 작업을 바로 시작하는 마케팅 운영 대시보드
            </h1>
            <p className="mt-4 max-w-2xl text-[15px] leading-7 text-[var(--text-body)]">
              검색 확인, 지역 조사, 리포트 작성, 운영 메모를 한 흐름으로 연결해 다음 작업까지
              빠르게 이어갑니다.
            </p>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-3 xl:max-w-[760px]">
            {todaySummary.map((item) => (
              <div key={item.label} className="kpi-card px-5 py-5">
                <p className="section-label">{item.label}</p>
                <p className="kpi-value mt-4">{item.value}</p>
                <p className="mt-3 text-sm text-[var(--text-body)]">{item.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.95fr)]">
        <div className="dashboard-card px-6 py-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="section-label">Quick Start</p>
              <h2 className="mt-2 text-[20px] font-semibold tracking-[-0.03em] text-[var(--text-strong)]">
                바로 시작 작업
              </h2>
            </div>
            <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent)]">
              3개 추천
            </span>
          </div>

          <div className="mt-5 grid gap-3 xl:grid-cols-3">
            {quickStarts.map((item) => (
              <article key={item.title} className="surface-card px-5 py-5">
                <h3 className="text-[17px] font-semibold tracking-[-0.02em] text-[var(--text-strong)]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--text-body)]">{item.description}</p>
                <div className="mt-5">
                  <Link href={item.href} className="button-primary">
                    {item.cta}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>

        <section className="dashboard-card px-6 py-6">
          <div>
            <p className="section-label">Today Focus</p>
            <h2 className="mt-2 text-[20px] font-semibold tracking-[-0.03em] text-[var(--text-strong)]">
              오늘 추천 액션
            </h2>
          </div>

          <div className="mt-5 space-y-3">
            {todayFocus.map((item) => (
              <article
                key={item.title}
                className="rounded-[14px] border border-[var(--line)] bg-[var(--bg-muted)] px-4 py-4"
              >
                <p className="text-sm font-semibold text-[var(--text-strong)]">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--text-body)]">{item.description}</p>
                <div className="mt-4">
                  <Link href={item.href} className="button-secondary">
                    {item.cta}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.25fr)]">
        <div className="dashboard-card px-6 py-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="section-label">Performance Snapshot</p>
              <h2 className="mt-2 text-[20px] font-semibold tracking-[-0.03em] text-[var(--text-strong)]">
                핵심 KPI
              </h2>
            </div>
            <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent)]">
              Today
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {kpis.map((item) => (
              <div key={item.label} className="surface-card px-5 py-5">
                <p className="kpi-value">{item.value}</p>
                <p className="kpi-label">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <section className="dashboard-card px-6 py-6">
          <div>
            <p className="section-label">Recommended Actions</p>
            <h2 className="mt-2 text-[20px] font-semibold tracking-[-0.03em] text-[var(--text-strong)]">
              실행 우선순위
            </h2>
          </div>
          <div className="mt-5 space-y-3">
            {recommendedActions.map((item) => (
              <div
                key={item.problem}
                className="rounded-[14px] border border-[var(--line)] bg-[var(--bg-muted)] px-4 py-4"
              >
                <p className="text-sm font-semibold text-[var(--text-strong)]">{item.problem}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--text-body)]">{item.action}</p>
              </div>
            ))}
          </div>
        </section>
      </section>

      <section id="recent-activity" className="dashboard-card px-5 py-5">
        <RecentActivitySection />
      </section>
    </div>
  );
}

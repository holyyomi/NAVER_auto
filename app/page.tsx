import Link from "next/link";
import { RecentActivitySection } from "@/components/history/recent-activity-section";

const tools = [
  {
    title: "검색 결과 모음",
    description: "검색 결과를 빠르게 확인하고 제목, 요약, 링크를 정리합니다.",
    href: "/features/search-results-hub",
    cta: "결과 보기",
  },
  {
    title: "검색광고 리포트 보조",
    description: "광고 수치를 바탕으로 공유용 리포트 초안을 만듭니다.",
    href: "/features/search-ad-report-assist",
    cta: "리포트 만들기",
  },
  {
    title: "광고 운영 보조",
    description: "운영 이슈를 정리하고 오늘 실행할 액션을 추천합니다.",
    href: "/features/ad-operations-assist",
    cta: "액션 정리",
  },
  {
    title: "지역 업체 조사",
    description: "지역과 업종 기준으로 시장 조사 결과를 빠르게 모읍니다.",
    href: "/features/local-business-research",
    cta: "조사 시작",
  },
  {
    title: "경쟁 키워드 모니터링",
    description: "반복 조회한 키워드의 노출 변화와 이상 징후를 추적합니다.",
    href: "/features/competitor-keyword-monitoring",
    cta: "모니터링 열기",
  },
];

const todaySummary = [
  { label: "조회 수", value: "120,000", note: "오늘 누적 노출" },
  { label: "실행된 작업 수", value: "36", note: "저장 및 생성 기준" },
  { label: "추천 액션 수", value: "08", note: "우선 검토 필요" },
];

const kpis = [
  { label: "노출", value: "120,000" },
  { label: "클릭", value: "3,650" },
  { label: "전환", value: "112" },
];

const actionItems = [
  {
    problem: "CTR 낮음",
    action: "상위 노출 제목 표현을 비교해 광고 문안과 블로그 제목을 재정비하세요.",
  },
  {
    problem: "경쟁 콘텐츠 대비 키워드 부족",
    action: "지역명과 진료 특화 키워드를 추가한 신규 조합을 테스트하세요.",
  },
  {
    problem: "전환 대비 CPC 상승",
    action: "비효율 키워드를 정리하고 랜딩 핵심 CTA를 더 선명하게 맞추세요.",
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-full flex-col gap-6">
      <section className="dashboard-card overflow-hidden px-6 py-6 sm:px-7">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="section-label">Marketing Dashboard</p>
            <h1 className="mt-3 text-[24px] font-bold tracking-[-0.035em] text-[var(--text-strong)] sm:text-[28px]">
              마케팅 대시보드
            </h1>
            <p className="mt-3 text-sm leading-7 text-[var(--text-body)]">
              네이버 검색 기반 워크플로를 한 번에 보고, 필요한 작업으로 빠르게 이동할 수 있도록
              구성된 운영 허브입니다.
            </p>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-3 xl:max-w-[720px]">
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

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)]">
        <div className="dashboard-card px-6 py-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="section-label">Performance</p>
              <h2 className="mt-2 text-[18px] font-semibold text-[var(--text-strong)]">핵심 KPI</h2>
            </div>
            <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent)]">
              Today
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
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
            <h2 className="mt-2 text-[18px] font-semibold text-[var(--text-strong)]">추천 액션</h2>
          </div>
          <div className="mt-5 space-y-3">
            {actionItems.map((item) => (
              <div
                key={item.problem}
                className="rounded-[12px] border border-[var(--line)] bg-[var(--bg-muted)] px-4 py-4"
              >
                <p className="text-sm font-semibold text-[var(--text-strong)]">{item.problem}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--text-body)]">{item.action}</p>
              </div>
            ))}
          </div>
        </section>
      </section>

      <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {tools.map((tool) => (
          <article key={tool.title} className="dashboard-card px-5 py-5">
            <p className="section-label">Workflow</p>
            <h2 className="mt-3 text-[18px] font-semibold tracking-[-0.02em] text-[var(--text-strong)]">
              {tool.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--text-body)]">{tool.description}</p>
            <div className="mt-6">
              <Link href={tool.href} className="button-primary">
                {tool.cta}
              </Link>
            </div>
          </article>
        ))}
      </section>

      <section className="dashboard-card px-5 py-5">
        <RecentActivitySection />
      </section>
    </div>
  );
}

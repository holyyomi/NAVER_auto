export type FeatureDefinition = {
  index: string;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  available: boolean;
  href: string;
  group: string;
};

export const allFeatures: FeatureDefinition[] = [
  {
    index: "01",
    slug: "keyword-trends",
    title: "키워드 트렌드",
    shortDescription: "검색 수요 흐름을 봅니다.",
    description: "기간별 검색 흐름을 확인하는 화면입니다.",
    available: true,
    href: "/features/keyword-trends",
    group: "분석",
  },
  {
    index: "02",
    slug: "search-results-hub",
    title: "검색 결과 모음",
    shortDescription: "상위 검색 결과를 비교합니다.",
    description: "검색 결과를 모아 검토하고 재사용하는 화면입니다.",
    available: true,
    href: "/features/search-results-hub",
    group: "분석",
  },
  {
    index: "03",
    slug: "shopping-insights",
    title: "쇼핑 인사이트",
    shortDescription: "쇼핑 관심과 수요를 봅니다.",
    description: "쇼핑 관심도와 수요를 확인하는 화면입니다.",
    available: true,
    href: "/features/shopping-insights",
    group: "인사이트",
  },
  {
    index: "04",
    slug: "local-business-research",
    title: "지역 업체 조사",
    shortDescription: "지역과 업종 키워드로 검색 패턴을 봅니다.",
    description: "지역 업체 검색 결과를 수동 조사하는 화면입니다.",
    available: true,
    href: "/features/local-business-research",
    group: "조사",
  },
  {
    index: "05",
    slug: "competitor-keyword-monitoring",
    title: "경쟁 키워드 모니터링",
    shortDescription: "등록한 키워드를 반복 확인합니다.",
    description: "경쟁 키워드 검색 결과를 수동 점검하는 화면입니다.",
    available: true,
    href: "/features/competitor-keyword-monitoring",
    group: "모니터링",
  },
  {
    index: "06",
    slug: "search-ad-report-assist",
    title: "검색광고 리포트 보조",
    shortDescription: "지표를 넣고 보고 문구를 빠르게 만듭니다.",
    description: "성과 지표를 바탕으로 리포트 초안을 정리하는 화면입니다.",
    available: true,
    href: "/features/search-ad-report-assist",
    group: "광고",
  },
  {
    index: "07",
    slug: "ad-operations-assist",
    title: "광고 운영 보조",
    shortDescription: "운영 보조 기능 준비 중입니다.",
    description: "반복 운영 업무를 정리하고 처리하는 기능입니다.",
    available: false,
    href: "/features/ad-operations-assist",
    group: "광고",
  },
];

export const activeFeatures = allFeatures.filter((feature) => feature.available);
export const upcomingFeatures = allFeatures.filter((feature) => !feature.available);

export const appSummary = [
  {
    title: "활성 기능",
    description: "지금 바로 사용할 수 있는 기능입니다.",
  },
  {
    title: "준비 기능",
    description: "다음 단계에서 추가될 기능입니다.",
  },
  {
    title: "작업 흐름",
    description: "조회 후 저장하고 다시 불러옵니다.",
  },
];

export const featureCategories = [
  {
    title: "분석",
    count: "3개",
    description: "트렌드, 검색 결과, 쇼핑 기능을 사용합니다.",
  },
  {
    title: "조사·모니터링",
    count: "2개",
    description: "지역 조사와 경쟁 키워드 점검을 포함합니다.",
  },
  {
    title: "광고",
    count: "2개",
    description: "리포트와 운영 보조 기능을 다룹니다.",
  },
];

export function getFeatureBySlug(slug: string) {
  return allFeatures.find((feature) => feature.slug === slug);
}

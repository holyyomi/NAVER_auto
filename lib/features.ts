export type FeatureStatus = "usable" | "pending" | "planned";

export type FeatureDefinition = {
  index: string;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  status: FeatureStatus;
  href: string;
  group: string;
};

type StatusTone = "active" | "pending" | "neutral" | "attention";

type FeatureStatusMeta = {
  label: string;
  shortLabel: string;
  sectionLabel: string;
  tone: StatusTone;
};

export const featureStatusMeta: Record<FeatureStatus, FeatureStatusMeta> = {
  usable: {
    label: "사용 가능",
    shortLabel: "사용 가능",
    sectionLabel: "사용 가능",
    tone: "active",
  },
  pending: {
    label: "승인 대기",
    shortLabel: "승인 대기",
    sectionLabel: "승인 대기",
    tone: "attention",
  },
  planned: {
    label: "준비 중",
    shortLabel: "준비 중",
    sectionLabel: "준비 중",
    tone: "pending",
  },
};

export const allFeatures: FeatureDefinition[] = [
  {
    index: "01",
    slug: "keyword-trends",
    title: "키워드 트렌드",
    shortDescription: "트렌드 데이터 연동 확인 후 확장 예정인 수요 추이 조회 기능입니다.",
    description: "기간별 검색 수요 흐름을 확인하는 기능입니다.",
    status: "pending",
    href: "/features/keyword-trends",
    group: "분석",
  },
  {
    index: "02",
    slug: "search-results-hub",
    title: "검색 결과 모음",
    shortDescription: "검색 결과를 모아 비교하고 정리하는 작업 허브입니다.",
    description: "검색 결과를 모아 조사하고 정리하는 기능입니다.",
    status: "usable",
    href: "/features/search-results-hub",
    group: "분석",
  },
  {
    index: "03",
    slug: "shopping-insights",
    title: "쇼핑 인사이트",
    shortDescription: "쇼핑 관련 인사이트를 정리할 확장 기능으로 준비 중입니다.",
    description: "쇼핑 관심도와 수요를 확인하는 기능입니다.",
    status: "pending",
    href: "/features/shopping-insights",
    group: "인사이트",
  },
  {
    index: "04",
    slug: "local-business-research",
    title: "지역 업체 조사",
    shortDescription: "지역과 업종 키워드로 로컬 시장 검색 결과를 조사하는 기능입니다.",
    description: "지역 업체 검색 결과를 실무용으로 조사하는 기능입니다.",
    status: "usable",
    href: "/features/local-business-research",
    group: "조사",
  },
  {
    index: "05",
    slug: "competitor-keyword-monitoring",
    title: "경쟁 키워드 모니터링",
    shortDescription: "등록한 경쟁 키워드를 반복 확인하고 변화 여부를 비교하는 기능입니다.",
    description: "경쟁 키워드 검색 결과를 반복 점검하는 기능입니다.",
    status: "usable",
    href: "/features/competitor-keyword-monitoring",
    group: "모니터링",
  },
  {
    index: "06",
    slug: "search-ad-report-assist",
    title: "검색광고 리포트 보조",
    shortDescription: "성과 데이터를 바탕으로 내부/클라이언트 공유용 초안을 정리하는 기능입니다.",
    description: "성과 데이터를 바탕으로 리포트 초안을 정리하는 기능입니다.",
    status: "usable",
    href: "/features/search-ad-report-assist",
    group: "광고",
  },
  {
    index: "07",
    slug: "ad-operations-assist",
    title: "광고 운영 보조",
    shortDescription: "캠페인 상태를 점검하고 다음 운영 액션을 정리하는 기능입니다.",
    description: "반복 운영 업무를 정리하고 처리하는 기능입니다.",
    status: "usable",
    href: "/features/ad-operations-assist",
    group: "광고",
  },
];

export const usableFeatures = allFeatures.filter((feature) => feature.status === "usable");
export const pendingFeatures = allFeatures.filter((feature) => feature.status === "pending");
export const plannedFeatures = allFeatures.filter((feature) => feature.status === "planned");

export function getFeatureStatusMeta(status: FeatureStatus) {
  return featureStatusMeta[status];
}

export function getFeatureBySlug(slug: string) {
  return allFeatures.find((feature) => feature.slug === slug);
}

export function getFeatureByHref(href: string) {
  return allFeatures.find((feature) => feature.href === href);
}

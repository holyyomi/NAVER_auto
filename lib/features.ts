export type FeatureStatus = "usable" | "pending" | "planned";
export type FeatureVisibility = "visible" | "hidden";

export type FeatureDefinition = {
  index: string;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  status: FeatureStatus;
  href: string;
  group: string;
  visibility: FeatureVisibility;
  priority: "core" | "secondary" | "hidden";
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
    shortLabel: "사용",
    sectionLabel: "사용 가능",
    tone: "active",
  },
  pending: {
    label: "확인 필요",
    shortLabel: "확인",
    sectionLabel: "확인 필요",
    tone: "attention",
  },
  planned: {
    label: "준비 중",
    shortLabel: "준비",
    sectionLabel: "준비 중",
    tone: "pending",
  },
};

export const allFeatures: FeatureDefinition[] = [
  {
    index: "01",
    slug: "search-results-hub",
    title: "검색 결과 모음",
    shortDescription: "검색 결과를 모아서 보고 복사하거나 저장합니다.",
    description: "키워드별 검색 결과를 빠르게 확인하고 필요한 항목만 정리하는 화면입니다.",
    status: "usable",
    href: "/features/search-results-hub",
    group: "조사",
    visibility: "visible",
    priority: "core",
  },
  {
    index: "02",
    slug: "search-ad-report-assist",
    title: "검색광고 리포트 보조",
    shortDescription: "성과 수치를 입력하면 공유용 리포트 초안을 정리합니다.",
    description: "검색광고 성과 데이터를 기준으로 요약, 문제점, 다음 액션을 정리하는 화면입니다.",
    status: "usable",
    href: "/features/search-ad-report-assist",
    group: "리포트",
    visibility: "visible",
    priority: "core",
  },
  {
    index: "03",
    slug: "ad-operations-assist",
    title: "광고 운영 보조",
    shortDescription: "운영 이슈를 입력하면 오늘 액션을 정리합니다.",
    description: "광고 운영 상태를 점검하고 오늘과 내일 확인할 항목을 정리하는 화면입니다.",
    status: "usable",
    href: "/features/ad-operations-assist",
    group: "운영",
    visibility: "visible",
    priority: "core",
  },
  {
    index: "04",
    slug: "local-business-research",
    title: "지역 업체 조사",
    shortDescription: "지역과 업종 기준으로 실무형 검색 결과를 확인합니다.",
    description: "지역명과 업종 키워드를 기준으로 제안 준비용 결과를 조사하는 화면입니다.",
    status: "usable",
    href: "/features/local-business-research",
    group: "조사",
    visibility: "visible",
    priority: "secondary",
  },
  {
    index: "05",
    slug: "competitor-keyword-monitoring",
    title: "경쟁 키워드 모니터링",
    shortDescription: "저장한 키워드의 노출 변화를 반복 확인합니다.",
    description: "이전 검색 결과와 현재 결과를 비교해 노출 변화를 확인하는 화면입니다.",
    status: "usable",
    href: "/features/competitor-keyword-monitoring",
    group: "모니터링",
    visibility: "visible",
    priority: "secondary",
  },
  {
    index: "06",
    slug: "keyword-trends",
    title: "키워드 트렌드",
    shortDescription: "현재 범위에서는 제외된 기능입니다.",
    description: "현재 운영 범위에 포함되지 않은 기능입니다.",
    status: "pending",
    href: "/features/keyword-trends",
    group: "제외",
    visibility: "hidden",
    priority: "hidden",
  },
  {
    index: "07",
    slug: "shopping-insights",
    title: "쇼핑 인사이트",
    shortDescription: "현재 범위에서는 제외된 기능입니다.",
    description: "현재 운영 범위에 포함되지 않은 기능입니다.",
    status: "pending",
    href: "/features/shopping-insights",
    group: "제외",
    visibility: "hidden",
    priority: "hidden",
  },
];

export const visibleFeatures = allFeatures.filter((feature) => feature.visibility === "visible");
export const usableFeatures = visibleFeatures.filter((feature) => feature.status === "usable");
export const pendingFeatures = visibleFeatures.filter((feature) => feature.status === "pending");
export const plannedFeatures = visibleFeatures.filter((feature) => feature.status === "planned");
export const coreFeatures = visibleFeatures.filter((feature) => feature.priority === "core");
export const secondaryFeatures = visibleFeatures.filter(
  (feature) => feature.priority === "secondary",
);

export function getFeatureStatusMeta(status: FeatureStatus) {
  return featureStatusMeta[status];
}

export function getFeatureBySlug(slug: string) {
  return allFeatures.find((feature) => feature.slug === slug);
}

export function getFeatureByHref(href: string) {
  return allFeatures.find((feature) => feature.href === href);
}

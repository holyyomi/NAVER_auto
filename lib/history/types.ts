export type SavedFeatureType =
  | "keyword-trends"
  | "search-results"
  | "shopping-insights"
  | "local-business-research"
  | "search-ad-report-assist"
  | "ad-operations-assist";

export type SaveField = {
  label: string;
  value: string;
};

export type SavedItemRecord = {
  id: string;
  featureType: SavedFeatureType;
  title: string;
  summary: string;
  inputSnapshot: unknown;
  outputSnapshot: unknown;
  createdAt: string;
  updatedAt: string;
  fields: SaveField[];
};

export type SaveItemInput = Omit<SavedItemRecord, "id" | "createdAt" | "updatedAt"> & {
  id?: string;
};

export type SaveStore = {
  list(featureType?: SavedFeatureType): SavedItemRecord[];
  get(id: string): SavedItemRecord | null;
  save(input: SaveItemInput): SavedItemRecord;
  remove(id: string): void;
};

export const SAVED_ITEM_QUERY_KEY = "saved";

export const savedFeatureMeta: Record<
  SavedFeatureType,
  {
    label: string;
    href: string;
  }
> = {
  "keyword-trends": {
    label: "키워드 트렌드",
    href: "/features/keyword-trends",
  },
  "search-results": {
    label: "검색 결과 모음",
    href: "/features/search-results-hub",
  },
  "shopping-insights": {
    label: "쇼핑 인사이트",
    href: "/features/shopping-insights",
  },
  "local-business-research": {
    label: "지역 업체 조사",
    href: "/features/local-business-research",
  },
  "search-ad-report-assist": {
    label: "검색광고 리포트 보조",
    href: "/features/search-ad-report-assist",
  },
  "ad-operations-assist": {
    label: "광고 운영 보조",
    href: "/features/ad-operations-assist",
  },
};

export function getSavedFeatureMeta(featureType: SavedFeatureType) {
  return savedFeatureMeta[featureType];
}

export function buildSavedItemHref(record: Pick<SavedItemRecord, "id" | "featureType">) {
  const meta = getSavedFeatureMeta(record.featureType);
  return `${meta.href}?${SAVED_ITEM_QUERY_KEY}=${encodeURIComponent(record.id)}`;
}

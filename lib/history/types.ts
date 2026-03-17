export type ActiveFeatureKey =
  | "keyword-trends"
  | "search-results-hub"
  | "shopping-insights"
  | "local-business-research"
  | "search-ad-report-assist";

export type HistoryField = {
  label: string;
  value: string;
};

export type SavedActivityRecord = {
  id: string;
  feature: ActiveFeatureKey;
  featureLabel: string;
  title: string;
  description: string;
  route: string;
  createdAt: string;
  fields: HistoryField[];
  input: unknown;
  snapshot: unknown;
};

export type SaveActivityInput = Omit<SavedActivityRecord, "id" | "createdAt">;

export type ActivityStore = {
  list(feature?: ActiveFeatureKey): SavedActivityRecord[];
  save(input: SaveActivityInput): SavedActivityRecord;
  remove(id: string): void;
};

import type { SavedFeatureType, SavedItemRecord } from "@/lib/history/types";

export const MAX_RECENT_RECORDS_PER_FEATURE = 5;
export const MAX_RECENT_RECORDS_TOTAL = 25;

export function sortRecentRecords(records: SavedItemRecord[]) {
  return [...records].sort(
    (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
  );
}

export function trimRecentRecords(
  records: SavedItemRecord[],
  options?: {
    perFeatureLimit?: number;
    totalLimit?: number;
  },
) {
  const perFeatureLimit = options?.perFeatureLimit ?? MAX_RECENT_RECORDS_PER_FEATURE;
  const totalLimit = options?.totalLimit ?? MAX_RECENT_RECORDS_TOTAL;
  const counters = new Map<SavedFeatureType, number>();

  return sortRecentRecords(records)
    .filter((record) => {
      const nextCount = (counters.get(record.featureType) ?? 0) + 1;
      counters.set(record.featureType, nextCount);
      return nextCount <= perFeatureLimit;
    })
    .slice(0, totalLimit);
}

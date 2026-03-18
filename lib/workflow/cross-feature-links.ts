import type { SearchType } from "@/lib/search/workbench-store";

function buildHref(pathname: string, values: Record<string, string | null | undefined>) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(values)) {
    if (!value) continue;
    params.set(key, value);
  }

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function buildCompetitorMonitorHref(input: {
  keyword: string;
  searchType: SearchType;
  autoRegister?: boolean;
}) {
  return buildHref("/features/competitor-keyword-monitoring", {
    keyword: input.keyword,
    searchType: input.searchType,
    autoRegister: input.autoRegister ? "1" : undefined,
  });
}

export function buildLocalBusinessResearchHref(input: {
  region?: string;
  businessKeyword: string;
  businessName?: string;
  searchType: SearchType;
  autoRun?: boolean;
}) {
  return buildHref("/features/local-business-research", {
    region: input.region,
    businessKeyword: input.businessKeyword,
    businessName: input.businessName,
    searchType: input.searchType,
    autoRun: input.autoRun ? "1" : undefined,
  });
}

export function buildSearchResultsHref(input: {
  keyword: string;
  searchType: SearchType;
  autoRun?: boolean;
}) {
  return buildHref("/features/search-results-hub", {
    keyword: input.keyword,
    searchType: input.searchType,
    autoRun: input.autoRun ? "1" : undefined,
  });
}

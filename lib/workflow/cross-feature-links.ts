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

export function buildSearchAdReportAssistHref(input: {
  template?: "internal" | "client";
  mediaPlatform?: string;
  campaignName?: string;
  period?: string;
  impressions?: string;
  clicks?: string;
  cost?: string;
  conversions?: string;
  revenue?: string;
  ctr?: string;
  cpc?: string;
  cpa?: string;
  roas?: string;
  comparisonNotes?: string;
  autoRun?: boolean;
}) {
  return buildHref("/features/search-ad-report-assist", {
    template: input.template,
    mediaPlatform: input.mediaPlatform,
    campaignName: input.campaignName,
    period: input.period,
    impressions: input.impressions,
    clicks: input.clicks,
    cost: input.cost,
    conversions: input.conversions,
    revenue: input.revenue,
    ctr: input.ctr,
    cpc: input.cpc,
    cpa: input.cpa,
    roas: input.roas,
    comparisonNotes: input.comparisonNotes,
    autoRun: input.autoRun ? "1" : undefined,
  });
}

export function buildAdOperationsAssistHref(input: {
  mediaPlatform?: string;
  campaignName?: string;
  period?: string;
  ctrDrop?: boolean;
  cpcIncrease?: boolean;
  conversionDrop?: boolean;
  lowImpressions?: boolean;
  creativeFatigue?: boolean;
  budgetIssue?: boolean;
  landingIssue?: boolean;
  notes?: string;
  autoRun?: boolean;
}) {
  return buildHref("/features/ad-operations-assist", {
    mediaPlatform: input.mediaPlatform,
    campaignName: input.campaignName,
    period: input.period,
    ctrDrop: input.ctrDrop ? "1" : undefined,
    cpcIncrease: input.cpcIncrease ? "1" : undefined,
    conversionDrop: input.conversionDrop ? "1" : undefined,
    lowImpressions: input.lowImpressions ? "1" : undefined,
    creativeFatigue: input.creativeFatigue ? "1" : undefined,
    budgetIssue: input.budgetIssue ? "1" : undefined,
    landingIssue: input.landingIssue ? "1" : undefined,
    notes: input.notes,
    autoRun: input.autoRun ? "1" : undefined,
  });
}

import { notFound } from "next/navigation";
import { CompetitorKeywordMonitoringPanel } from "@/components/features/competitor-keyword-monitoring-panel";
import { KeywordTrendPanel } from "@/components/features/keyword-trend-panel";
import { LocalBusinessResearchPanel } from "@/components/features/local-business-research-panel";
import { PlaceholderFeaturePanel } from "@/components/features/placeholder-feature-panel";
import { SearchAdReportAssistPanel } from "@/components/features/search-ad-report-assist-panel";
import { SearchResultsPanel } from "@/components/features/search-results-panel";
import { ShoppingInsightsPanel } from "@/components/features/shopping-insights-panel";
import { allFeatures, getFeatureBySlug } from "@/lib/features";

type FeaturePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return allFeatures.map((feature) => ({ slug: feature.slug }));
}

export default async function FeaturePage({ params }: FeaturePageProps) {
  const { slug } = await params;
  const feature = getFeatureBySlug(slug);

  if (!feature) {
    notFound();
  }

  if (slug === "keyword-trends") {
    return <KeywordTrendPanel />;
  }

  if (slug === "search-results-hub") {
    return <SearchResultsPanel />;
  }

  if (slug === "shopping-insights") {
    return <ShoppingInsightsPanel />;
  }

  if (slug === "local-business-research") {
    return <LocalBusinessResearchPanel />;
  }

  if (slug === "competitor-keyword-monitoring") {
    return <CompetitorKeywordMonitoringPanel />;
  }

  if (slug === "search-ad-report-assist") {
    return <SearchAdReportAssistPanel />;
  }

  return <PlaceholderFeaturePanel feature={feature} />;
}

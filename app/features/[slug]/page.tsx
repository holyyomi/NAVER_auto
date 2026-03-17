import { AdOperationsAssistPanel } from "@/components/features/ad-operations-assist-panel";
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

const featurePanels = {
  "keyword-trends": KeywordTrendPanel,
  "search-results-hub": SearchResultsPanel,
  "shopping-insights": ShoppingInsightsPanel,
  "local-business-research": LocalBusinessResearchPanel,
  "competitor-keyword-monitoring": CompetitorKeywordMonitoringPanel,
  "search-ad-report-assist": SearchAdReportAssistPanel,
  "ad-operations-assist": AdOperationsAssistPanel,
} as const;

export function generateStaticParams() {
  return allFeatures.map((feature) => ({ slug: feature.slug }));
}

export default async function FeaturePage({ params }: FeaturePageProps) {
  const { slug } = await params;
  const feature = getFeatureBySlug(slug);

  if (!feature) {
    notFound();
  }

  const Panel = featurePanels[slug as keyof typeof featurePanels];

  if (Panel) {
    return <Panel />;
  }

  return <PlaceholderFeaturePanel feature={feature} />;
}

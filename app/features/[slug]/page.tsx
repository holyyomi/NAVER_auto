import { notFound } from "next/navigation";
import { KeywordTrendPanel } from "@/components/features/keyword-trend-panel";
import { PlaceholderFeaturePanel } from "@/components/features/placeholder-feature-panel";
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

  return <PlaceholderFeaturePanel feature={feature} />;
}

import {
  createSeed,
  listDateRange,
  percentageChange,
} from "@/lib/naver/utils";
import type {
  SearchResponse,
  ShoppingInsightResponse,
  TrendResponse,
} from "@/lib/naver/types";

export function createMockTrendData(input: {
  keyword: string;
  startDate: Date;
  endDate: Date;
}): TrendResponse {
  const dates = listDateRange(input.startDate, input.endDate);
  const seed = createSeed(input.keyword);

  const points = dates.map((date, index) => {
    const base = 42 + (seed % 21);
    const wave = Math.sin((index + seed) / 2.7) * 14;
    const trend = index * 1.2;
    return {
      date,
      value: Math.max(8, Math.round(base + wave + trend)),
    };
  });

  const rows = points.map((point, index) => ({
    date: point.date,
    value: point.value,
    change: index === 0 ? 0 : point.value - points[index - 1].value,
  }));

  const average = Math.round(
    points.reduce((acc, point) => acc + point.value, 0) / points.length,
  );
  const peak = Math.max(...points.map((point) => point.value));

  return {
    summary: {
      keyword: input.keyword,
      periodLabel: `${points[0]?.date ?? ""} ~ ${points.at(-1)?.date ?? ""}`,
      average,
      peak,
      changeRate: percentageChange(points[0]?.value ?? 0, points.at(-1)?.value ?? 0),
    },
    points,
    rows,
  };
}

export function createMockSearchData(input: {
  keyword: string;
  searchType: "blog" | "news" | "shopping";
}): SearchResponse {
  const sourceMap = {
    blog: "NAVER Blog",
    news: "NAVER News",
    shopping: "NAVER Shopping",
  } as const;

  const items = Array.from({ length: 8 }, (_, index) => ({
    title: `${input.keyword} ${sourceMap[input.searchType]} sample ${index + 1}`,
    link: `https://example.com/${input.searchType}/${encodeURIComponent(input.keyword)}/${index + 1}`,
    description:
      input.searchType === "shopping"
        ? `Demo shopping result for ${input.keyword} to preview layout safely without live NAVER credentials.`
        : `Demo search result for ${input.keyword} to preview layout safely without live NAVER credentials.`,
    source: sourceMap[input.searchType],
    type: input.searchType,
    publishedAt: `2026-03-${String(index + 1).padStart(2, "0")}`,
  }));

  return {
    keyword: input.keyword,
    searchType: input.searchType,
    total: items.length,
    items,
  };
}

export function createMockShoppingInsightData(input: {
  keyword: string;
  period: "7d" | "30d" | "90d";
}): ShoppingInsightResponse {
  const lengthMap = {
    "7d": 7,
    "30d": 10,
    "90d": 12,
  } as const;
  const seed = createSeed(input.keyword);
  const count = lengthMap[input.period];

  const points = Array.from({ length: count }, (_, index) => ({
    date: `${index + 1}${input.period === "7d" ? "d" : "w"}`,
    value: Math.max(15, Math.round(55 + Math.sin((index + seed) / 1.9) * 18 + index * 2)),
  }));

  const peakValue = Math.max(...points.map((point) => point.value));
  const minValue = Math.min(...points.map((point) => point.value));
  const peakPoint = points.find((point) => point.value === peakValue);

  return {
    summary: {
      keyword: input.keyword,
      period: input.period,
      averageRatio: Math.round(
        points.reduce((acc, point) => acc + point.value, 0) / points.length,
      ),
      peakPeriod: peakPoint?.date ?? "-",
      ratioRange: peakValue - minValue,
    },
    points,
    rows: points.map((point) => ({
      period: point.date,
      ratio: point.value,
      peakRelativeRatio: Number(((point.value / peakValue) * 100).toFixed(1)),
    })),
  };
}

import { fetchNaverJson } from "@/lib/naver/client";
import { assertProductionReadyNaverConfig, getNaverEnv } from "@/lib/naver/env";
import { logServerError, toApiErrorResult } from "@/lib/naver/errors";
import type { ApiResult, ShoppingInsightResponse } from "@/lib/naver/types";
import {
  type NaverShoppingKeywordResponse,
  validateShoppingPayload,
} from "@/lib/naver/validation";

const DEFAULT_SHOPPING_CATEGORY = "50000000";

function getPeriodConfig(period: "7d" | "30d" | "90d") {
  const today = new Date();
  const endDate = today.toISOString().slice(0, 10);
  const start = new Date(today);

  if (period === "7d") {
    start.setDate(start.getDate() - 6);
    return {
      startDate: start.toISOString().slice(0, 10),
      endDate,
      timeUnit: "date" as const,
    };
  }

  if (period === "30d") {
    start.setDate(start.getDate() - 29);
    return {
      startDate: start.toISOString().slice(0, 10),
      endDate,
      timeUnit: "date" as const,
    };
  }

  start.setDate(start.getDate() - 89);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate,
    timeUnit: "week" as const,
  };
}

function normalizeShoppingResponse(
  input: { keyword: string; period: "7d" | "30d" | "90d" },
  raw: NaverShoppingKeywordResponse,
): ShoppingInsightResponse {
  const primary = raw.results[0];
  const points = (primary?.data ?? []).map((item) => ({
    date: item.period,
    value: Number(item.ratio.toFixed(2)),
  }));

  const averageRatio =
    points.length > 0
      ? Number(
          (
            points.reduce((sum, point) => sum + point.value, 0) / points.length
          ).toFixed(2),
        )
      : 0;

  const peakValue = points.length > 0 ? Math.max(...points.map((point) => point.value)) : 0;
  const minValue = points.length > 0 ? Math.min(...points.map((point) => point.value)) : 0;
  const peakPoint = points.find((point) => point.value === peakValue);

  return {
    summary: {
      keyword: input.keyword,
      period: input.period,
      averageRatio,
      peakPeriod: peakPoint?.date ?? "-",
      ratioRange: Number((peakValue - minValue).toFixed(2)),
    },
    points,
    rows: points.map((point) => ({
      period: point.date,
      ratio: point.value,
      peakRelativeRatio:
        peakValue > 0 ? Number(((point.value / peakValue) * 100).toFixed(1)) : 0,
    })),
  };
}

export async function getShoppingInsights(input: {
  keyword: string;
  period: "7d" | "30d" | "90d";
}): Promise<ApiResult<ShoppingInsightResponse>> {
  const { mode } = getNaverEnv();

  try {
    assertProductionReadyNaverConfig("Shopping insights");

    const config = getPeriodConfig(input.period);
    const raw = await fetchNaverJson<NaverShoppingKeywordResponse>(
      "https://openapi.naver.com/v1/datalab/shopping/category/keywords",
      {
        operation: "shopping-insights",
        method: "POST",
        body: JSON.stringify({
          startDate: config.startDate,
          endDate: config.endDate,
          timeUnit: config.timeUnit,
          category: DEFAULT_SHOPPING_CATEGORY,
          keyword: [
            {
              name: input.keyword,
              param: [input.keyword],
            },
          ],
          device: "",
          gender: "",
          ages: [],
        }),
        validate: validateShoppingPayload,
      },
    );

    return {
      ok: true,
      data: normalizeShoppingResponse(input, raw),
      meta: { source: "naver", mode: "real" },
    };
  } catch (error) {
    logServerError("feature:shopping", error, { mode });
    return toApiErrorResult<ShoppingInsightResponse>("Shopping insights", error);
  }
}

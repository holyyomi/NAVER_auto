import { fetchNaverJson } from "@/lib/naver/client";
import { assertProductionReadyNaverConfig, getNaverEnv } from "@/lib/naver/env";
import { logServerError, toApiErrorResult } from "@/lib/naver/errors";
import { percentageChange } from "@/lib/naver/utils";
import type { ApiResult, TrendResponse } from "@/lib/naver/types";
import {
  type NaverTrendResponse,
  validateTrendPayload,
} from "@/lib/naver/validation";

function normalizeTrendResponse(
  input: { keyword: string },
  raw: NaverTrendResponse,
): TrendResponse {
  const primary = raw.results[0];
  const points = (primary?.data ?? []).map((item) => ({
    date: item.period,
    value: Number(item.ratio.toFixed(2)),
  }));

  const rows = points.map((point, index) => ({
    date: point.date,
    value: point.value,
    change:
      index === 0 ? 0 : Number((point.value - points[index - 1].value).toFixed(2)),
  }));

  const average =
    points.length > 0
      ? Number(
          (
            points.reduce((sum, point) => sum + point.value, 0) / points.length
          ).toFixed(2),
        )
      : 0;
  const peak = points.length > 0 ? Math.max(...points.map((point) => point.value)) : 0;

  return {
    summary: {
      keyword: input.keyword,
      periodLabel: `${raw.startDate} ~ ${raw.endDate}`,
      average,
      peak,
      changeRate: percentageChange(points[0]?.value ?? 0, points.at(-1)?.value ?? 0),
    },
    points,
    rows,
  };
}

export async function getTrendAnalysis(input: {
  keyword: string;
  startDate: Date;
  endDate: Date;
}): Promise<ApiResult<TrendResponse>> {
  const { mode } = getNaverEnv();

  try {
    assertProductionReadyNaverConfig("Trend analysis");

    const body = {
      startDate: input.startDate.toISOString().slice(0, 10),
      endDate: input.endDate.toISOString().slice(0, 10),
      timeUnit: "date" as const,
      keywordGroups: [
        {
          groupName: input.keyword,
          keywords: [input.keyword],
        },
      ],
    };

    const raw = await fetchNaverJson<NaverTrendResponse>(
      "https://openapi.naver.com/v1/datalab/search",
      {
        operation: "trend",
        method: "POST",
        body: JSON.stringify(body),
        validate: validateTrendPayload,
      },
    );

    return {
      ok: true,
      data: normalizeTrendResponse({ keyword: input.keyword }, raw),
      meta: { source: "naver", mode: "real" },
    };
  } catch (error) {
    logServerError("feature:trend", error, { mode });
    return toApiErrorResult<TrendResponse>("Trend analysis", error);
  }
}

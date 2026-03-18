import { fetchNaverJson } from "@/lib/naver/client";
import { isDemoMode, assertRealModeNaverConfig, getNaverEnv } from "@/lib/naver/env";
import { logServerError, toApiErrorResult } from "@/lib/naver/errors";
import { createMockSearchData } from "@/lib/naver/mock";
import type { ApiResult, SearchResponse } from "@/lib/naver/types";
import {
  type NaverSearchRawItem,
  type NaverSearchRawResponse,
  validateSearchPayload,
} from "@/lib/naver/validation";
import { normalizePublishedDate, sanitizeText } from "@/lib/naver/utils";

type SearchType = "blog" | "news" | "shopping";

function getSearchApiPath(searchType: SearchType) {
  if (searchType === "shopping") {
    return "shop";
  }

  return searchType;
}

function normalizeSource(inputType: SearchType, item: NaverSearchRawItem) {
  if (inputType === "blog") return sanitizeText(item.bloggername ?? "블로그");
  if (inputType === "shopping") return sanitizeText(item.mallName ?? "쇼핑");
  return "뉴스";
}

function normalizeSearchResponse(
  input: { keyword: string; searchType: SearchType },
  raw: NaverSearchRawResponse,
): SearchResponse {
  return {
    keyword: input.keyword,
    searchType: input.searchType,
    total: raw.total,
    items: raw.items.map((item) => ({
      title: sanitizeText(item.title),
      link: item.link || item.originallink || "#",
      description: sanitizeText(item.description),
      source: normalizeSource(input.searchType, item),
      type: input.searchType,
      publishedAt: input.searchType === "shopping" ? undefined : normalizePublishedDate(item.pubDate),
    })),
  };
}

export async function getSearchResults(input: {
  keyword: string;
  searchType: SearchType;
}): Promise<ApiResult<SearchResponse>> {
  const { mode } = getNaverEnv();

  if (isDemoMode()) {
    return {
      ok: true,
      data: createMockSearchData(input),
      meta: { source: "mock", mode: "demo" },
    };
  }

  try {
    assertRealModeNaverConfig();

    const apiPath = getSearchApiPath(input.searchType);
    const endpoint = `https://openapi.naver.com/v1/search/${apiPath}.json?query=${encodeURIComponent(input.keyword)}&display=10&start=1&sort=sim`;
    const raw = await fetchNaverJson<NaverSearchRawResponse>(endpoint, {
      operation: `search:${input.searchType}`,
      validate: validateSearchPayload,
    });

    return {
      ok: true,
      data: normalizeSearchResponse(input, raw),
      meta: { source: "naver", mode: "real" },
    };
  } catch (error) {
    logServerError("feature:search", error, {
      mode,
      searchType: input.searchType,
    });
    return toApiErrorResult<SearchResponse>("Search results", error);
  }
}

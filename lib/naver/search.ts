import { fetchNaverJson } from "@/lib/naver/client";
import { isDemoMode, assertRealModeNaverConfig, getNaverEnv } from "@/lib/naver/env";
import { logServerError, toApiErrorResult } from "@/lib/naver/errors";
import { createMockSearchData } from "@/lib/naver/mock";
import type { ApiResult, SearchResponse } from "@/lib/naver/types";
import { normalizePublishedDate, sanitizeText } from "@/lib/naver/utils";
import {
  type NaverSearchRawItem,
  type NaverSearchRawResponse,
  validateSearchPayload,
} from "@/lib/naver/validation";
import { sanitizeDisplayText, sanitizeOptionalDisplayText } from "@/lib/text/display-text";

type SearchType = "blog" | "news" | "shopping";

function getSearchApiPath(searchType: SearchType) {
  if (searchType === "shopping") {
    return "shop";
  }

  return searchType;
}

function normalizeSource(inputType: SearchType, item: NaverSearchRawItem) {
  if (inputType === "blog") {
    return sanitizeDisplayText(sanitizeText(item.bloggername ?? ""), "블로그");
  }

  if (inputType === "shopping") {
    return sanitizeDisplayText(sanitizeText(item.mallName ?? ""), "쇼핑");
  }

  return "뉴스";
}

function buildShoppingDescription(item: NaverSearchRawItem) {
  const summary = sanitizeText(item.description ?? "");
  if (summary) {
    return sanitizeDisplayText(summary);
  }

  const price = sanitizeText(item.lprice ?? "");
  const mallName = sanitizeText(item.mallName ?? "");
  const brand = sanitizeText(item.brand ?? "");
  const maker = sanitizeText(item.maker ?? "");
  const categories = [item.category1, item.category2, item.category3, item.category4]
    .map((value) => sanitizeText(value ?? ""))
    .filter(Boolean);

  const segments = [
    price ? `${price}원` : "",
    mallName,
    brand || maker,
    categories.join(" > "),
  ].filter(Boolean);

  return sanitizeOptionalDisplayText(segments.join(" | "));
}

function normalizeSearchResponse(
  input: { keyword: string; searchType: SearchType },
  raw: NaverSearchRawResponse,
): SearchResponse {
  return {
    keyword: sanitizeDisplayText(input.keyword, "검색어"),
    searchType: input.searchType,
    total: raw.total,
    items: raw.items.map((item) => ({
      title: sanitizeDisplayText(sanitizeText(item.title)),
      link: item.link || item.originallink || "#",
      description:
        input.searchType === "shopping"
          ? sanitizeDisplayText(buildShoppingDescription(item), "상품 정보가 없습니다.")
          : sanitizeDisplayText(sanitizeText(item.description ?? "")),
      source: sanitizeOptionalDisplayText(normalizeSource(input.searchType, item)),
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

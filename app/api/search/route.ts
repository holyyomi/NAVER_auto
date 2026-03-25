import { NextResponse } from "next/server";
import { getApiErrorStatus } from "@/lib/naver/errors";
import { getNaverEnv } from "@/lib/naver/env";
import { getSearchResults } from "@/lib/naver/search";

export const runtime = "nodejs";

const supportedTypes = new Set(["blog", "news", "shopping"]);

export async function POST(request: Request) {
  const body = (await request.json()) as {
    keyword?: string;
    searchType?: string;
  };

  const keyword = typeof body.keyword === "string" ? body.keyword.trim() : "";
  const searchType = typeof body.searchType === "string" ? body.searchType.trim() : "";

  if (!keyword) {
    return NextResponse.json(
      {
        ok: false,
        code: "validation_error",
        error: "검색어를 입력해 주세요.",
        issues: ["keyword"],
      },
      { status: 400 },
    );
  }

  if (!supportedTypes.has(searchType)) {
    return NextResponse.json(
      {
        ok: false,
        code: "unsupported_type",
        error: "지원하지 않는 검색 유형입니다.",
        issues: ["searchType"],
      },
      { status: 400 },
    );
  }

  console.log("[api/search] request", { keyword, searchType });
  const { mode, clientId, clientSecret } = getNaverEnv();
  console.log("[api/search] env", {
    mode,
    hasClientId: Boolean(clientId),
    hasClientSecret: Boolean(clientSecret),
    clientIdLength: clientId.length,
    clientSecretLength: clientSecret.length,
  });

  const result = await getSearchResults({
    keyword,
    searchType: searchType as "blog" | "news" | "shopping",
  });

  if (result.ok) {
    console.log("[api/search] success", {
      keyword,
      searchType,
      total: result.data.total,
      itemCount: result.data.items.length,
      source: result.meta?.source,
    });
  } else {
    console.error("[api/search] failed", {
      keyword,
      searchType,
      code: result.code,
      error: result.error,
    });
  }

  return NextResponse.json(result, {
    status: result.ok ? 200 : getApiErrorStatus(result.code),
  });
}

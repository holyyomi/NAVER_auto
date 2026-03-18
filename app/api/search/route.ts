import { NextResponse } from "next/server";
import { getApiErrorStatus } from "@/lib/naver/errors";
import { getSearchResults } from "@/lib/naver/search";

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

  const result = await getSearchResults({
    keyword,
    searchType: searchType as "blog" | "news" | "shopping",
  });

  return NextResponse.json(result, {
    status: result.ok ? 200 : getApiErrorStatus(result.code),
  });
}

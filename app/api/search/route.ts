import { NextResponse } from "next/server";
import { getApiErrorStatus } from "@/lib/naver/errors";
import { getSearchResults } from "@/lib/naver/search";
import { validateSearchInput } from "@/lib/naver/validation";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    keyword?: string;
    searchType?: string;
  };

  const validation = validateSearchInput({
    keyword: body.keyword ?? "",
    searchType: body.searchType ?? "",
  });

  if (!validation.value) {
    return NextResponse.json(
      {
        ok: false,
        code: "validation_error",
        error: "입력값을 확인해 주세요.",
      },
      { status: 400 },
    );
  }

  const result = await getSearchResults(validation.value);

  return NextResponse.json(result, {
    status: result.ok ? 200 : getApiErrorStatus(result.code),
  });
}

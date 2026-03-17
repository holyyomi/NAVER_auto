import { NextResponse } from "next/server";
import { getApiErrorStatus } from "@/lib/naver/errors";
import { getTrendAnalysis } from "@/lib/naver/trend";
import { validateTrendInput } from "@/lib/naver/validation";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    keyword?: string;
    startDate?: string;
    endDate?: string;
  };

  const validation = validateTrendInput({
    keyword: body.keyword ?? "",
    startDate: body.startDate ?? "",
    endDate: body.endDate ?? "",
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

  const result = await getTrendAnalysis(validation.value);

  return NextResponse.json(result, {
    status: result.ok ? 200 : getApiErrorStatus(result.code),
  });
}

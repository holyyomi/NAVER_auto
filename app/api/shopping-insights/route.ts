import { NextResponse } from "next/server";
import { getApiErrorStatus } from "@/lib/naver/errors";
import { getShoppingInsights } from "@/lib/naver/shopping";
import { validateShoppingInput } from "@/lib/naver/validation";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    keyword?: string;
    period?: string;
  };

  const validation = validateShoppingInput({
    keyword: body.keyword ?? "",
    period: body.period ?? "",
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

  const result = await getShoppingInsights(validation.value);

  return NextResponse.json(result, {
    status: result.ok ? 200 : getApiErrorStatus(result.code),
  });
}

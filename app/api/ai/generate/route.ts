import { NextResponse } from "next/server";

type ReportPayload = {
  template: "internal" | "client";
  mediaPlatform: string;
  campaignName: string;
  period: string;
  impressions: number | null;
  clicks: number | null;
  ctr: number | null;
  cost: number | null;
  cpc: number | null;
  conversions: number | null;
  cpa: number | null;
  revenue: number | null;
  roas: number | null;
  comparisonNotes: string;
};

type OperationsPayload = {
  mediaPlatform: string;
  campaignName: string;
  period: string;
  ctrDrop: boolean;
  cpcIncrease: boolean;
  conversionDrop: boolean;
  lowImpressions: boolean;
  creativeFatigue: boolean;
  budgetIssue: boolean;
  landingIssue: boolean;
  notes: string;
};

function extractJson(text: string) {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1] ?? text;
  return JSON.parse(candidate);
}

function hasMetricValue(payload: ReportPayload) {
  return [
    payload.impressions,
    payload.clicks,
    payload.ctr,
    payload.cost,
    payload.cpc,
    payload.conversions,
    payload.cpa,
    payload.revenue,
    payload.roas,
  ].some((value) => value !== null);
}

function validateReportPayload(payload: ReportPayload) {
  if (!payload.mediaPlatform.trim() || !payload.campaignName.trim() || !payload.period.trim()) {
    return "매체명, 캠페인명, 기간을 입력해 주세요.";
  }

  if (!hasMetricValue(payload)) {
    return "최소 한 개 이상의 성과 수치를 입력해 주세요.";
  }

  return null;
}

function validateOperationsPayload(payload: OperationsPayload) {
  if (!payload.mediaPlatform.trim() || !payload.campaignName.trim() || !payload.period.trim()) {
    return "매체명, 캠페인명, 기간을 입력해 주세요.";
  }

  const hasIssue =
    payload.ctrDrop ||
    payload.cpcIncrease ||
    payload.conversionDrop ||
    payload.lowImpressions ||
    payload.creativeFatigue ||
    payload.budgetIssue ||
    payload.landingIssue;

  if (!hasIssue && !payload.notes.trim()) {
    return "최소 한 개 이상의 운영 이슈를 선택하거나 메모를 입력해 주세요.";
  }

  return null;
}

function getPrompt(kind: "report" | "operations", payload: ReportPayload | OperationsPayload) {
  if (kind === "report") {
    return `
당신은 실무형 마케팅 운영 도구의 검색광고 리포트 작성 보조입니다.
반드시 JSON 객체만 반환해 주세요.
설명 문장, 코드 블록, 인사말 없이 JSON만 반환해 주세요.

작성 원칙:
- 짧고 명확한 실무형 문장
- 과장 표현 금지
- 내부 공유용과 클라이언트용 톤 차이 반영
- 각 배열은 1~4개 항목

JSON 스키마:
{
  "oneLineSummary": "string",
  "strengths": ["string"],
  "issues": ["string"],
  "nextActions": ["string"]
}

입력 데이터:
${JSON.stringify(payload, null, 2)}
`;
  }

  return `
당신은 실무형 마케팅 운영 도구의 광고 운영 보조입니다.
반드시 JSON 객체만 반환해 주세요.
설명 문장, 코드 블록, 인사말 없이 JSON만 반환해 주세요.

작성 원칙:
- 짧고 명확한 실무형 문장
- 오늘 바로 확인할 운영 메모 형태
- 과장 표현 금지
- 각 배열은 1~4개 항목

JSON 스키마:
{
  "problemSummary": "string",
  "causeHypotheses": ["string"],
  "todayActions": ["string"],
  "tomorrowMetrics": ["string"]
}

입력 데이터:
${JSON.stringify(payload, null, 2)}
`;
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    kind?: "report" | "operations";
    payload?: ReportPayload | OperationsPayload;
  };

  if (!body.kind || !body.payload) {
    return NextResponse.json({ ok: false, error: "AI 요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const validationError =
    body.kind === "report"
      ? validateReportPayload(body.payload as ReportPayload)
      : validateOperationsPayload(body.payload as OperationsPayload);

  if (validationError) {
    return NextResponse.json({ ok: false, error: validationError }, { status: 400 });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || "openai/gpt-oss-20b:free";

  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: "OPENROUTER_API_KEY가 설정되어 있지 않습니다." },
      { status: 503 },
    );
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: getPrompt(body.kind, body.payload) }],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ ok: false, error: `OpenRouter 응답 오류: ${errorText}` }, { status: 502 });
    }

    const result = (await response.json()) as {
      choices?: Array<{
        message?: {
          content?: string;
        };
      }>;
    };

    const content = result.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ ok: false, error: "AI 응답이 비어 있습니다." }, { status: 502 });
    }

    try {
      return NextResponse.json({ ok: true, data: extractJson(content) });
    } catch {
      return NextResponse.json({ ok: false, error: "AI 응답을 JSON으로 해석하지 못했습니다." }, { status: 502 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI 요청 중 오류가 발생했습니다.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

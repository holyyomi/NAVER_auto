export type TrendDirection = "up" | "down" | "flat";
export type RuleTone = "positive" | "neutral" | "warning";

export type SearchAdReportInput = {
  impressions: number | null;
  clicks: number | null;
  ctr: number | null;
  conversions: number | null;
  cvr: number | null;
  cpa: number | null;
  roas: number | null;
  previousCtr: number | null;
  previousCvr: number | null;
  previousCpa: number | null;
  previousRoas: number | null;
};

export type SearchAdReportMetric = {
  key: "ctr" | "cvr" | "cpa" | "roas";
  label: string;
  value: number | null;
  tone: RuleTone;
  comment: string;
};

export type SearchAdReportOutput = {
  tone: RuleTone;
  headline: string;
  summary: string;
  metrics: SearchAdReportMetric[];
  comments: string[];
  actions: string[];
  derived: {
    ctr: number | null;
    cvr: number | null;
  };
  comparisons: {
    ctr: string | null;
    cvr: string | null;
    cpa: string | null;
    roas: string | null;
  };
};

function roundMetric(value: number | null, digits = 2) {
  if (value === null || Number.isNaN(value)) {
    return null;
  }

  return Number(value.toFixed(digits));
}

function toDisplayNumber(value: number | null, suffix = "") {
  if (value === null || Number.isNaN(value)) {
    return "-";
  }

  return `${value.toLocaleString("ko-KR")}${suffix}`;
}

function compareValue(current: number | null, previous: number | null, inverse = false) {
  if (current === null || previous === null || previous === 0) {
    return null;
  }

  const change = ((current - previous) / Math.abs(previous)) * 100;
  const normalized = inverse ? -change : change;

  let direction: TrendDirection = "flat";
  if (normalized >= 5) direction = "up";
  if (normalized <= -5) direction = "down";

  return {
    change,
    direction,
  };
}

function formatComparison(
  label: string,
  current: number | null,
  previous: number | null,
  inverse = false,
  suffix = "%",
) {
  const compared = compareValue(current, previous, inverse);
  if (!compared) {
    return null;
  }

  const amount = Math.abs(compared.change).toFixed(1);

  if (compared.direction === "flat") {
    return `${label}은 이전과 비슷합니다.`;
  }

  if (compared.direction === "up") {
    return `${label} ${amount}${suffix} 개선`;
  }

  return `${label} ${amount}${suffix} 하락`;
}

function classifyHigherBetter(value: number | null, strong: number, ok: number) {
  if (value === null) {
    return "neutral" as const;
  }

  if (value >= strong) {
    return "positive" as const;
  }

  if (value >= ok) {
    return "neutral" as const;
  }

  return "warning" as const;
}

function classifyLowerBetter(value: number | null, strong: number, ok: number) {
  if (value === null) {
    return "neutral" as const;
  }

  if (value <= strong) {
    return "positive" as const;
  }

  if (value <= ok) {
    return "neutral" as const;
  }

  return "warning" as const;
}

function metricComment(label: string, value: number | null, tone: RuleTone, suffix = "%") {
  const formatted = toDisplayNumber(value, suffix);

  if (tone === "positive") {
    return `${label} ${formatted}로 양호합니다.`;
  }

  if (tone === "warning") {
    return `${label} ${formatted}로 점검이 필요합니다.`;
  }

  return `${label} ${formatted}로 보통 수준입니다.`;
}

export function buildSearchAdReport(input: SearchAdReportInput): SearchAdReportOutput {
  const derivedCtr =
    input.ctr ?? (input.impressions && input.clicks !== null
      ? (input.clicks / input.impressions) * 100
      : null);
  const derivedCvr =
    input.cvr ?? (input.clicks && input.conversions !== null
      ? (input.conversions / input.clicks) * 100
      : null);

  const ctr = roundMetric(derivedCtr);
  const cvr = roundMetric(derivedCvr);
  const cpa = roundMetric(input.cpa);
  const roas = roundMetric(input.roas);

  const ctrTone = classifyHigherBetter(ctr, 3, 1.5);
  const cvrTone = classifyHigherBetter(cvr, 4, 2);
  const cpaTone = classifyLowerBetter(cpa, 30000, 60000);
  const roasTone = classifyHigherBetter(roas, 400, 250);

  const metrics: SearchAdReportMetric[] = [
    { key: "ctr", label: "CTR", value: ctr, tone: ctrTone, comment: metricComment("CTR", ctr, ctrTone) },
    { key: "cvr", label: "CVR", value: cvr, tone: cvrTone, comment: metricComment("CVR", cvr, cvrTone) },
    {
      key: "cpa",
      label: "CPA",
      value: cpa,
      tone: cpaTone,
      comment: metricComment("CPA", cpa, cpaTone, "원"),
    },
    {
      key: "roas",
      label: "ROAS",
      value: roas,
      tone: roasTone,
      comment: metricComment("ROAS", roas, roasTone, "%"),
    },
  ];

  const warningCount = metrics.filter((metric) => metric.tone === "warning").length;
  const positiveCount = metrics.filter((metric) => metric.tone === "positive").length;

  let tone: RuleTone = "neutral";
  let headline = "성과 흐름 점검";
  let summary = "주요 지표는 대체로 유지 중입니다.";

  if (warningCount >= 2) {
    tone = "warning";
    headline = "효율 점검 필요";
    summary = "클릭 이후 전환 흐름과 비용 효율을 우선 점검해야 합니다.";
  } else if (positiveCount >= 3) {
    tone = "positive";
    headline = "성과 안정 구간";
    summary = "핵심 지표가 양호해 현재 운영 방향을 유지할 수 있습니다.";
  }

  const comments = metrics.map((metric) => metric.comment);
  const comparisons = {
    ctr: formatComparison("CTR", ctr, input.previousCtr),
    cvr: formatComparison("CVR", cvr, input.previousCvr),
    cpa: formatComparison("CPA", cpa, input.previousCpa, true),
    roas: formatComparison("ROAS", roas, input.previousRoas),
  };

  Object.values(comparisons).forEach((line) => {
    if (line) {
      comments.push(line);
    }
  });

  const actions: string[] = [];

  if (ctrTone === "warning") {
    actions.push("노출 대비 클릭이 낮아 소재와 키워드 매칭을 먼저 조정하세요.");
  }

  if (cvrTone === "warning") {
    actions.push("유입 이후 전환이 약해 랜딩 페이지와 전환 동선을 점검하세요.");
  }

  if (cpaTone === "warning") {
    actions.push("비용이 높아 입찰가와 예산 배분을 재조정하세요.");
  }

  if (roasTone === "warning") {
    actions.push("매출 효율이 낮아 고효율 키워드 중심으로 예산을 재배치하세요.");
  }

  if (actions.length === 0) {
    actions.push("현재 구조를 유지하되 다음 주 동일 기준으로 다시 비교하세요.");
  }

  return {
    tone,
    headline,
    summary,
    metrics,
    comments,
    actions,
    derived: {
      ctr,
      cvr,
    },
    comparisons,
  };
}

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
  unit: "%" | "원";
  tone: RuleTone;
  comment: string;
  comparison: string | null;
};

export type SearchAdReportOutput = {
  tone: RuleTone;
  headline: string;
  summary: string;
  keySummary: string[];
  strengths: string[];
  watchPoints: string[];
  actions: string[];
  metrics: SearchAdReportMetric[];
  derived: {
    ctr: number | null;
    cvr: number | null;
    estimatedSpend: number | null;
    estimatedRevenue: number | null;
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

  const rawChange = ((current - previous) / Math.abs(previous)) * 100;
  const normalized = inverse ? -rawChange : rawChange;

  let direction: TrendDirection = "flat";
  if (normalized >= 5) direction = "up";
  if (normalized <= -5) direction = "down";

  return {
    rawChange,
    direction,
  };
}

function formatComparison(
  label: string,
  current: number | null,
  previous: number | null,
  inverse = false,
) {
  const compared = compareValue(current, previous, inverse);
  if (!compared) {
    return null;
  }

  const amount = Math.abs(compared.rawChange).toFixed(1);

  if (compared.direction === "flat") {
    return `${label}은(는) 전기와 유사한 수준입니다.`;
  }

  if (compared.direction === "up") {
    return `${label}은(는) 전기 대비 ${amount}% 개선되었습니다.`;
  }

  return `${label}은(는) 전기 대비 ${amount}% 악화되었습니다.`;
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

function getMetricComment(label: string, tone: RuleTone) {
  if (tone === "positive") {
    return `${label}은(는) 현재 기준에서 긍정적으로 해석할 수 있습니다.`;
  }

  if (tone === "warning") {
    return `${label}은(는) 우선 점검이 필요한 수준입니다.`;
  }

  return `${label}은(는) 안정권이지만 추가 개선 여지는 있습니다.`;
}

function pushUnique(target: string[], value: string) {
  if (!target.includes(value)) {
    target.push(value);
  }
}

export function buildSearchAdReport(input: SearchAdReportInput): SearchAdReportOutput {
  const derivedCtr =
    input.ctr ??
    (input.impressions !== null &&
    input.impressions > 0 &&
    input.clicks !== null
      ? (input.clicks / input.impressions) * 100
      : null);
  const derivedCvr =
    input.cvr ??
    (input.clicks !== null &&
    input.clicks > 0 &&
    input.conversions !== null
      ? (input.conversions / input.clicks) * 100
      : null);
  const derivedSpend =
    input.conversions !== null && input.cpa !== null ? input.conversions * input.cpa : null;
  const derivedRevenue =
    derivedSpend !== null && input.roas !== null ? derivedSpend * (input.roas / 100) : null;

  const ctr = roundMetric(derivedCtr);
  const cvr = roundMetric(derivedCvr);
  const cpa = roundMetric(input.cpa);
  const roas = roundMetric(input.roas);
  const estimatedSpend = roundMetric(derivedSpend, 0);
  const estimatedRevenue = roundMetric(derivedRevenue, 0);

  const ctrTone = classifyHigherBetter(ctr, 3, 1.5);
  const cvrTone = classifyHigherBetter(cvr, 4, 2);
  const cpaTone = classifyLowerBetter(cpa, 30000, 60000);
  const roasTone = classifyHigherBetter(roas, 400, 250);

  const comparisons = {
    ctr: formatComparison("CTR", ctr, input.previousCtr),
    cvr: formatComparison("CVR", cvr, input.previousCvr),
    cpa: formatComparison("CPA", cpa, input.previousCpa, true),
    roas: formatComparison("ROAS", roas, input.previousRoas),
  };

  const metrics: SearchAdReportMetric[] = [
    {
      key: "ctr",
      label: "CTR",
      value: ctr,
      unit: "%",
      tone: ctrTone,
      comment: getMetricComment("CTR", ctrTone),
      comparison: comparisons.ctr,
    },
    {
      key: "cvr",
      label: "CVR",
      value: cvr,
      unit: "%",
      tone: cvrTone,
      comment: getMetricComment("CVR", cvrTone),
      comparison: comparisons.cvr,
    },
    {
      key: "cpa",
      label: "CPA",
      value: cpa,
      unit: "원",
      tone: cpaTone,
      comment: getMetricComment("CPA", cpaTone),
      comparison: comparisons.cpa,
    },
    {
      key: "roas",
      label: "ROAS",
      value: roas,
      unit: "%",
      tone: roasTone,
      comment: getMetricComment("ROAS", roasTone),
      comparison: comparisons.roas,
    },
  ];

  const positiveCount = metrics.filter((metric) => metric.tone === "positive").length;
  const warningCount = metrics.filter((metric) => metric.tone === "warning").length;

  let tone: RuleTone = "neutral";
  let headline = "주요 지표는 대체로 안정권입니다.";
  let summary = "성과 유지와 세부 효율 개선을 함께 검토할 수 있는 상태입니다.";

  if (warningCount >= 2) {
    tone = "warning";
    headline = "효율 저하 신호가 확인되어 우선 점검이 필요합니다.";
    summary = "유입 이후 전환 효율과 비용 구조를 함께 보정하는 접근이 필요합니다.";
  } else if (positiveCount >= 3 && warningCount === 0) {
    tone = "positive";
    headline = "성과 흐름이 양호하여 현재 운영 방향을 유지할 수 있습니다.";
    summary = "효율 지표가 전반적으로 안정적이어서 확장 또는 유지 전략 검토가 가능합니다.";
  }

  const keySummary: string[] = [];
  const strengths: string[] = [];
  const watchPoints: string[] = [];
  const actions: string[] = [];

  if (input.impressions !== null || input.clicks !== null || input.conversions !== null) {
    keySummary.push(
      `이번 구간은 노출 ${toDisplayNumber(input.impressions, "회")}, 클릭 ${toDisplayNumber(input.clicks, "회")}, 전환 ${toDisplayNumber(input.conversions, "건")} 기준으로 정리했습니다.`,
    );
  }

  keySummary.push(
    `핵심 효율 지표는 CTR ${toDisplayNumber(ctr, "%")}, CVR ${toDisplayNumber(cvr, "%")}, CPA ${toDisplayNumber(cpa, "원")}, ROAS ${toDisplayNumber(roas, "%")}입니다.`,
  );

  if (estimatedSpend !== null) {
    keySummary.push(`전환수와 CPA 기준 추정 광고비는 ${toDisplayNumber(estimatedSpend, "원")}입니다.`);
  }

  if (estimatedRevenue !== null) {
    keySummary.push(`ROAS 기준 추정 매출은 ${toDisplayNumber(estimatedRevenue, "원")} 수준으로 볼 수 있습니다.`);
  }

  if (ctrTone === "positive") {
    pushUnique(strengths, `CTR ${toDisplayNumber(ctr, "%")}로 유입 반응이 양호합니다.`);
  } else if (ctrTone === "warning") {
    pushUnique(watchPoints, `CTR ${toDisplayNumber(ctr, "%")}로 소재 또는 키워드 매칭 점검이 필요합니다.`);
    pushUnique(actions, "노출 대비 클릭 반응이 낮은 키워드와 소재를 우선 점검하고, 제목·설명문구 테스트를 진행해 주세요.");
  }

  if (cvrTone === "positive") {
    pushUnique(strengths, `CVR ${toDisplayNumber(cvr, "%")}로 유입 이후 전환 연결이 안정적입니다.`);
  } else if (cvrTone === "warning") {
    pushUnique(watchPoints, `CVR ${toDisplayNumber(cvr, "%")}로 랜딩 이후 전환 흐름 개선이 필요합니다.`);
    pushUnique(actions, "랜딩페이지 메시지와 전환 동선을 점검하고, 검색 의도와 맞지 않는 키워드 유입은 축소해 주세요.");
  }

  if (cpaTone === "positive") {
    pushUnique(strengths, `CPA ${toDisplayNumber(cpa, "원")}로 비용 효율이 양호합니다.`);
  } else if (cpaTone === "warning") {
    pushUnique(watchPoints, `CPA ${toDisplayNumber(cpa, "원")}로 전환당 비용 부담이 큰 편입니다.`);
    pushUnique(actions, "고비용 저효율 그룹은 입찰가와 예산 배분을 조정하고, 전환 기여가 낮은 키워드는 제외 검토해 주세요.");
  }

  if (roasTone === "positive") {
    pushUnique(strengths, `ROAS ${toDisplayNumber(roas, "%")}로 매출 기여 효율이 안정적입니다.`);
  } else if (roasTone === "warning") {
    pushUnique(watchPoints, `ROAS ${toDisplayNumber(roas, "%")}로 매출 회수력이 약합니다.`);
    pushUnique(actions, "ROAS가 낮은 캠페인은 예산 확대를 보류하고, 전환 가치가 높은 상품군 또는 키워드 중심으로 재배분해 주세요.");
  }

  for (const comparison of Object.values(comparisons)) {
    if (!comparison) {
      continue;
    }

    if (comparison.includes("개선")) {
      pushUnique(strengths, comparison);
    } else if (comparison.includes("악화")) {
      pushUnique(watchPoints, comparison);
    } else {
      pushUnique(keySummary, comparison);
    }
  }

  if (strengths.length === 0) {
    pushUnique(strengths, "뚜렷한 강점 지표는 제한적이지만, 일부 지표는 유지 가능한 수준입니다.");
  }

  if (watchPoints.length === 0) {
    pushUnique(watchPoints, "즉시 대응이 필요한 경고 지표는 크지 않으며 현재 운영 흐름을 유지해도 무방합니다.");
  }

  if (actions.length === 0) {
    pushUnique(actions, "현재 구조를 유지하면서 다음 기간 동일 기준으로 재측정해 추세를 비교해 주세요.");
  }

  return {
    tone,
    headline,
    summary,
    keySummary,
    strengths,
    watchPoints,
    actions,
    metrics,
    derived: {
      ctr,
      cvr,
      estimatedSpend,
      estimatedRevenue,
    },
    comparisons,
  };
}

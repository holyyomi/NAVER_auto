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
    return `${label}은(는) 전기 대비 큰 변화가 없습니다.`;
  }

  if (compared.direction === "up") {
    return `${label}은(는) 전기 대비 ${amount}% 개선됐습니다.`;
  }

  return `${label}은(는) 전기 대비 ${amount}% 악화됐습니다.`;
}

function classifyHigherBetter(value: number | null, strong: number, ok: number) {
  if (value === null) return "neutral" as const;
  if (value >= strong) return "positive" as const;
  if (value >= ok) return "neutral" as const;
  return "warning" as const;
}

function classifyLowerBetter(value: number | null, strong: number, ok: number) {
  if (value === null) return "neutral" as const;
  if (value <= strong) return "positive" as const;
  if (value <= ok) return "neutral" as const;
  return "warning" as const;
}

function getMetricComment(label: string, tone: RuleTone) {
  if (tone === "positive") {
    return `${label} 기준으로는 운영 효율이 안정적인 편입니다.`;
  }

  if (tone === "warning") {
    return `${label} 기준으로는 빠른 점검이 필요한 구간입니다.`;
  }

  return `${label}은(는) 보통 수준으로 추가 최적화 여지가 있습니다.`;
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
  const comparisonCount = Object.values(comparisons).filter(Boolean).length;

  let tone: RuleTone = "neutral";
  let headline = "주요 효율 지표는 보통 수준이며 추가 최적화 여지가 있습니다.";
  let summary = "반응 지표와 비용 지표가 혼재돼 있어 성과 유지와 개선 포인트를 함께 관리할 필요가 있습니다.";

  if (warningCount >= 2) {
    tone = "warning";
    headline = "효율 저하 신호가 확인돼 우선 점검이 필요한 상태입니다.";
    summary = "유입 이후 전환 흐름과 비용 구조를 함께 점검하는 것이 우선입니다.";
  } else if (positiveCount >= 3 && warningCount === 0) {
    tone = "positive";
    headline = "주요 효율 지표가 안정적이어서 현재 운영 방향을 유지할 수 있습니다.";
    summary = "효율이 고르게 유지되고 있어 확장 테스트나 예산 재배분 검토가 가능한 구간입니다.";
  }

  if (comparisonCount >= 2 && warningCount >= 1) {
    summary = "전기 대비 악화된 지표가 확인돼 개선 우선순위를 빠르게 반영할 필요가 있습니다.";
  } else if (comparisonCount >= 2 && positiveCount >= 2) {
    summary = "전기 대비 개선 흐름이 확인돼 현재 운영 방향을 유지하되 성과 유지 조건을 함께 점검하는 것이 좋습니다.";
  }

  const keySummary: string[] = [];
  const strengths: string[] = [];
  const watchPoints: string[] = [];
  const actions: string[] = [];

  if (input.impressions !== null || input.clicks !== null || input.conversions !== null) {
    keySummary.push(
      `이번 구간 기준 노출 ${toDisplayNumber(input.impressions, "회")}, 클릭 ${toDisplayNumber(input.clicks, "회")}, 전환 ${toDisplayNumber(input.conversions, "건")}입니다.`,
    );
  }

  keySummary.push(
    `핵심 효율은 CTR ${toDisplayNumber(ctr, "%")}, CVR ${toDisplayNumber(cvr, "%")}, CPA ${toDisplayNumber(cpa, "원")}, ROAS ${toDisplayNumber(roas, "%")}입니다.`,
  );

  if (estimatedSpend !== null) {
    keySummary.push(`전환 수와 CPA 기준 추정 광고비는 ${toDisplayNumber(estimatedSpend, "원")}입니다.`);
  }

  if (estimatedRevenue !== null) {
    keySummary.push(`ROAS 기준 추정 매출은 ${toDisplayNumber(estimatedRevenue, "원")} 수준입니다.`);
  }

  if (ctrTone === "positive") {
    pushUnique(strengths, `CTR ${toDisplayNumber(ctr, "%")}로 유입 반응은 안정적으로 확보되고 있습니다.`);
  } else if (ctrTone === "warning") {
    pushUnique(watchPoints, `CTR ${toDisplayNumber(ctr, "%")}로 소재 반응 또는 키워드 적합도 점검이 필요합니다.`);
    pushUnique(actions, "소재별 CTR을 점검하고 반응이 낮은 문안은 교체 또는 테스트 대상에 포함해 주세요.");
  }

  if (cvrTone === "positive") {
    pushUnique(strengths, `CVR ${toDisplayNumber(cvr, "%")}로 유입 이후 전환 연결은 비교적 안정적입니다.`);
  } else if (cvrTone === "warning") {
    pushUnique(watchPoints, `CVR ${toDisplayNumber(cvr, "%")}로 랜딩 이후 전환 흐름 점검이 필요합니다.`);
    pushUnique(actions, "랜딩 메시지와 전환 동선을 점검하고 검색 의도와 맞지 않는 유입은 정리해 주세요.");
  }

  if (cpaTone === "positive") {
    pushUnique(strengths, `CPA ${toDisplayNumber(cpa, "원")} 수준으로 비용 효율은 안정적인 편입니다.`);
  } else if (cpaTone === "warning") {
    pushUnique(watchPoints, `CPA ${toDisplayNumber(cpa, "원")}로 전환당 비용 부담이 커진 상태입니다.`);
    pushUnique(actions, "고비용 그룹의 입찰가와 예산 비중을 조정하고 비효율 키워드 정리를 검토해 주세요.");
  }

  if (roasTone === "positive") {
    pushUnique(strengths, `ROAS ${toDisplayNumber(roas, "%")}로 매출 기여 효율은 양호합니다.`);
  } else if (roasTone === "warning") {
    pushUnique(watchPoints, `ROAS ${toDisplayNumber(roas, "%")}로 매출 회수 효율 보완이 필요합니다.`);
    pushUnique(actions, "ROAS가 낮은 그룹은 예산을 보수적으로 운영하고 성과 유지 가능 그룹에 우선 배분해 주세요.");
  }

  for (const comparison of Object.values(comparisons)) {
    if (!comparison) continue;

    if (comparison.includes("개선")) {
      pushUnique(strengths, comparison);
    } else if (comparison.includes("악화")) {
      pushUnique(watchPoints, comparison);
    } else {
      pushUnique(keySummary, comparison);
    }
  }

  if (comparisons.ctr?.includes("개선") && comparisons.cvr?.includes("개선")) {
    pushUnique(strengths, "유입 반응과 전환 연결이 함께 개선돼 성과 흐름은 긍정적입니다.");
  }

  if (comparisons.cpa?.includes("개선") && comparisons.roas?.includes("개선")) {
    pushUnique(strengths, "비용 효율과 매출 효율이 함께 개선돼 현재 운영 방향 유지 가능성이 높습니다.");
  }

  if (comparisons.ctr?.includes("악화") && comparisons.cvr?.includes("악화")) {
    pushUnique(watchPoints, "유입 반응과 전환 연결이 함께 약화돼 소재와 랜딩을 동시에 점검할 필요가 있습니다.");
  }

  if (comparisons.cpa?.includes("악화") || comparisons.roas?.includes("악화")) {
    pushUnique(watchPoints, "비용 또는 회수 효율이 약화돼 예산 배분 기준을 다시 확인할 필요가 있습니다.");
  }

  if (comparisonCount >= 2) {
    pushUnique(
      keySummary,
      "전기 비교 지표가 입력돼 유지 항목과 보완 항목을 함께 정리할 수 있는 상태입니다.",
    );
  }

  if (strengths.length === 0) {
    pushUnique(strengths, "즉시 강조할 강점은 제한적이지만 주요 지표는 현재 수준을 유지하고 있습니다.");
  }

  if (watchPoints.length === 0) {
    pushUnique(watchPoints, "즉시 위험으로 보이는 항목은 크지 않으며 현재 효율 흐름을 유지 점검하면 됩니다.");
  }

  if (actions.length === 0) {
    pushUnique(actions, "현재 운영 구조를 유지하되 다음 보고 구간에서도 동일 기준으로 비교 점검해 주세요.");
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

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
    return `${label} 기준으로는 현재 효율이 안정적으로 유지되고 있습니다.`;
  }

  if (tone === "warning") {
    return `${label} 기준으로는 즉시 점검이 필요한 구간입니다.`;
  }

  return `${label} 기준으로는 보통 수준이며 추가 개선 여지가 있습니다.`;
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
  let headline = "핵심 지표는 전반적으로 보통 수준이며 추가 개선 포인트가 남아 있습니다.";
  let summary = "소재 반응과 전환 효율을 함께 보면서 안정적인 성과 구간을 넓히는 접근이 적절합니다.";

  if (warningCount >= 2) {
    tone = "warning";
    headline = "효율 저하 신호가 보여 우선 순위 점검이 필요한 상태입니다.";
    summary = "유입 이후 전환 효율과 비용 구조를 함께 손보는 쪽이 빠른 개선에 유리합니다.";
  } else if (positiveCount >= 3 && warningCount === 0) {
    tone = "positive";
    headline = "성과 흐름이 안정적이어서 현재 운영 방향을 유지해도 무리가 없습니다.";
    summary = "효율 지표가 고르게 유지되고 있어 확장 테스트나 예산 확대 검토가 가능한 구간입니다.";
  }

  if (comparisonCount >= 2 && warningCount >= 1) {
    summary = "전기 대비 비교에서도 약세가 확인돼 단기 개선 액션을 빠르게 반영하는 것이 좋습니다.";
  } else if (comparisonCount >= 2 && positiveCount >= 2) {
    summary = "전기 대비 흐름까지 함께 보면 성과 개선 방향이 비교적 명확하게 유지되고 있습니다.";
  }

  const keySummary: string[] = [];
  const strengths: string[] = [];
  const watchPoints: string[] = [];
  const actions: string[] = [];

  if (input.impressions !== null || input.clicks !== null || input.conversions !== null) {
    keySummary.push(
      `이번 구간 집계는 노출 ${toDisplayNumber(input.impressions, "회")}, 클릭 ${toDisplayNumber(input.clicks, "회")}, 전환 ${toDisplayNumber(input.conversions, "건")} 기준입니다.`,
    );
  }

  keySummary.push(
    `핵심 성과 지표는 CTR ${toDisplayNumber(ctr, "%")}, CVR ${toDisplayNumber(cvr, "%")}, CPA ${toDisplayNumber(cpa, "원")}, ROAS ${toDisplayNumber(roas, "%")}입니다.`,
  );

  if (estimatedSpend !== null) {
    keySummary.push(`전환 수와 CPA 기준 추정 광고비는 ${toDisplayNumber(estimatedSpend, "원")}입니다.`);
  }

  if (estimatedRevenue !== null) {
    keySummary.push(`ROAS 기준 추정 매출은 ${toDisplayNumber(estimatedRevenue, "원")} 수준으로 볼 수 있습니다.`);
  }

  if (ctrTone === "positive") {
    pushUnique(strengths, `CTR ${toDisplayNumber(ctr, "%")}로 유입 반응이 안정적으로 확보되고 있습니다.`);
  } else if (ctrTone === "warning") {
    pushUnique(watchPoints, `CTR ${toDisplayNumber(ctr, "%")}로 소재 또는 키워드 반응 점검이 필요합니다.`);
    pushUnique(actions, "노출 대비 클릭 반응이 낮은 소재와 키워드를 우선 점검하고 제목/설명 문구 테스트를 진행하세요.");
  }

  if (cvrTone === "positive") {
    pushUnique(strengths, `CVR ${toDisplayNumber(cvr, "%")}로 유입 이후 전환 연결 흐름이 양호합니다.`);
  } else if (cvrTone === "warning") {
    pushUnique(watchPoints, `CVR ${toDisplayNumber(cvr, "%")}로 랜딩 이후 설득 흐름 보완이 필요합니다.`);
    pushUnique(actions, "랜딩 메시지와 전환 동선을 정리하고 검색 의도와 맞지 않는 유입 키워드는 축소하세요.");
  }

  if (cpaTone === "positive") {
    pushUnique(strengths, `CPA ${toDisplayNumber(cpa, "원")} 수준으로 비용 효율이 안정적입니다.`);
  } else if (cpaTone === "warning") {
    pushUnique(watchPoints, `CPA ${toDisplayNumber(cpa, "원")}로 전환당 비용 부담이 커지고 있습니다.`);
    pushUnique(actions, "고비용 그룹의 예산 비중을 조정하고 전환 기여가 낮은 키워드는 제외 검토가 필요합니다.");
  }

  if (roasTone === "positive") {
    pushUnique(strengths, `ROAS ${toDisplayNumber(roas, "%")}로 매출 기여 효율이 긍정적입니다.`);
  } else if (roasTone === "warning") {
    pushUnique(watchPoints, `ROAS ${toDisplayNumber(roas, "%")}로 매출 회수 효율이 부족합니다.`);
    pushUnique(actions, "ROAS가 낮은 그룹은 예산을 보수적으로 운영하고 전환 가치가 높은 키워드 중심으로 재배분하세요.");
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

  if (comparisonCount >= 2) {
    pushUnique(
      keySummary,
      "전기 대비 지표가 함께 입력되어 비교 코멘트를 포함한 리포트 초안으로 정리했습니다.",
    );
  }

  if (strengths.length === 0) {
    pushUnique(strengths, "즉시 강조할 강점은 제한적이지만 일부 지표는 안정적으로 유지되고 있습니다.");
  }

  if (watchPoints.length === 0) {
    pushUnique(watchPoints, "즉시 위험으로 보이는 지표는 크지 않으며 현재 흐름을 유지하면서 추세 확인이 필요합니다.");
  }

  if (actions.length === 0) {
    pushUnique(actions, "현재 운영 구조를 유지하되 다음 보고 구간에서도 동일 기준으로 비교해 추세를 확인하세요.");
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

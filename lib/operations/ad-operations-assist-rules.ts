export type RuleTone = "positive" | "neutral" | "warning";
export type OperationStatus = "normal" | "review" | "risk";
export type TrendDirection = "up" | "flat" | "down";

export type AdOperationsInput = {
  ctr: number | null;
  cpc: number | null;
  cvr: number | null;
  cpa: number | null;
  roas: number | null;
  budgetBurnRate: number | null;
  impressionsTrend: TrendDirection | null;
  clicksTrend: TrendDirection | null;
  conversionsTrend: TrendDirection | null;
};

export type OperationMetric = {
  key: "ctr" | "cpc" | "cvr" | "cpa" | "roas" | "budgetBurnRate";
  label: string;
  value: number | null;
  unit: "%" | "원";
  tone: RuleTone;
  comment: string;
};

export type AdOperationsOutput = {
  status: OperationStatus;
  headline: string;
  summary: string;
  causes: string[];
  actions: string[];
  note: string;
  metrics: OperationMetric[];
};

function toDisplayNumber(value: number | null, suffix = "") {
  if (value === null || Number.isNaN(value)) {
    return "-";
  }

  return `${value.toLocaleString("ko-KR")}${suffix}`;
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

function classifyBudgetBurnRate(value: number | null) {
  if (value === null) return "neutral" as const;
  if (value >= 60 && value <= 95) return "positive" as const;
  if ((value >= 40 && value < 60) || (value > 95 && value <= 105)) return "neutral" as const;
  return "warning" as const;
}

function metricComment(label: string, tone: RuleTone) {
  if (tone === "positive") {
    return `${label} 기준으로는 현재 운영이 안정적인 편입니다.`;
  }

  if (tone === "warning") {
    return `${label} 기준으로는 우선 점검이 필요한 상태입니다.`;
  }

  return `${label} 기준으로는 유지 가능하지만 추가 최적화 여지가 있습니다.`;
}

function pushUnique(target: string[], value: string) {
  if (!target.includes(value)) {
    target.push(value);
  }
}

function getRiskScore(metrics: OperationMetric[]) {
  return metrics.filter((metric) => metric.tone === "warning").length;
}

export function buildAdOperationsAssist(input: AdOperationsInput): AdOperationsOutput {
  const ctrTone = classifyHigherBetter(input.ctr, 3, 1.5);
  const cpcTone = classifyLowerBetter(input.cpc, 800, 1500);
  const cvrTone = classifyHigherBetter(input.cvr, 4, 2);
  const cpaTone = classifyLowerBetter(input.cpa, 30000, 60000);
  const roasTone = classifyHigherBetter(input.roas, 400, 250);
  const budgetTone = classifyBudgetBurnRate(input.budgetBurnRate);

  const metrics: OperationMetric[] = [
    { key: "ctr", label: "CTR", value: input.ctr, unit: "%", tone: ctrTone, comment: metricComment("CTR", ctrTone) },
    { key: "cpc", label: "CPC", value: input.cpc, unit: "원", tone: cpcTone, comment: metricComment("CPC", cpcTone) },
    { key: "cvr", label: "CVR", value: input.cvr, unit: "%", tone: cvrTone, comment: metricComment("CVR", cvrTone) },
    { key: "cpa", label: "CPA", value: input.cpa, unit: "원", tone: cpaTone, comment: metricComment("CPA", cpaTone) },
    { key: "roas", label: "ROAS", value: input.roas, unit: "%", tone: roasTone, comment: metricComment("ROAS", roasTone) },
    {
      key: "budgetBurnRate",
      label: "예산 소진율",
      value: input.budgetBurnRate,
      unit: "%",
      tone: budgetTone,
      comment: metricComment("예산 소진율", budgetTone),
    },
  ];

  const causes: string[] = [];
  const actions: string[] = [];
  const warnings = getRiskScore(metrics);

  if (ctrTone === "warning") {
    pushUnique(causes, `CTR ${toDisplayNumber(input.ctr, "%")}로 소재 반응이나 키워드 적합성이 약한 구간으로 보입니다.`);
    pushUnique(actions, "소재 CTR 점검: 노출 대비 클릭 반응이 낮은 소재와 문구를 우선 교체 또는 테스트하세요.");
  }

  if (cpcTone === "warning") {
    pushUnique(causes, `CPC ${toDisplayNumber(input.cpc, "원")}로 입찰 경쟁 부담이 커진 상태입니다.`);
    pushUnique(actions, "입찰가 점검: 고비용 키워드와 그룹의 입찰가를 단계적으로 조정하세요.");
  }

  if (cvrTone === "warning") {
    pushUnique(causes, `CVR ${toDisplayNumber(input.cvr, "%")}로 랜딩 이후 전환 연결이 약해진 신호가 있습니다.`);
    pushUnique(actions, "랜딩 전환 흐름 점검: 랜딩 메시지와 전환 동선을 확인하고 검색 의도와 맞지 않는 유입을 줄이세요.");
  }

  if (cpaTone === "warning") {
    pushUnique(causes, `CPA ${toDisplayNumber(input.cpa, "원")}로 전환당 비용이 부담되는 수준입니다.`);
    pushUnique(actions, "예산 배분 재검토: 고CPA 그룹은 축소하고 전환 기여가 높은 그룹으로 예산을 옮기세요.");
  }

  if (roasTone === "warning") {
    pushUnique(causes, `ROAS ${toDisplayNumber(input.roas, "%")}로 매출 회수 효율이 부족합니다.`);
    pushUnique(actions, "수익성 점검: ROAS가 낮은 그룹은 유지 필요성을 다시 판단하고 예산을 보수적으로 운영하세요.");
  }

  if (budgetTone === "warning") {
    if (input.budgetBurnRate !== null && input.budgetBurnRate > 105) {
      pushUnique(causes, `예산 소진율 ${toDisplayNumber(input.budgetBurnRate, "%")}로 예산이 빠르게 소진되고 있습니다.`);
      pushUnique(actions, "예산 배분 재검토: 과소진 그룹은 일예산과 입찰 강도를 즉시 낮추세요.");
    } else {
      pushUnique(causes, `예산 소진율 ${toDisplayNumber(input.budgetBurnRate, "%")}로 집행 속도가 부족합니다.`);
      pushUnique(actions, "노출 확장 점검: 성과 유지 그룹 중심으로 예산 또는 입찰가 상향을 검토하세요.");
    }
  }

  if (input.impressionsTrend === "down" && input.clicksTrend === "down") {
    pushUnique(causes, "노출과 클릭이 함께 하락해 전체 유입 볼륨이 줄어드는 흐름입니다.");
    pushUnique(actions, "입찰가와 노출 지면 점검: 예산, 입찰, 소재 노출 상태를 함께 확인하세요.");
  }

  if (input.clicksTrend === "up" && input.conversionsTrend === "down") {
    pushUnique(causes, "클릭은 늘었지만 전환이 줄어 유입 품질 저하 가능성이 있습니다.");
    pushUnique(actions, "랜딩 전환 흐름 점검: 유입 키워드와 랜딩 메시지 일치 여부를 우선 확인하세요.");
  }

  if (actions.length === 0) {
    pushUnique(actions, "현재 성과 구조를 유지하되 상위 성과 그룹 중심으로 미세 조정하세요.");
    pushUnique(actions, "다음 점검 시 동일 기준으로 추세 변화를 다시 확인하세요.");
  }

  if (causes.length === 0) {
    pushUnique(causes, "현재 입력 기준에서는 즉시 위험 신호가 뚜렷하지 않습니다.");
  }

  let status: OperationStatus = "normal";
  let headline = "현재 운영 상태는 대체로 안정적입니다.";
  let summary = "주요 효율 지표와 집행 속도가 큰 무리 없이 유지되는 구간입니다.";

  if (
    warnings >= 3 ||
    (roasTone === "warning" && cpaTone === "warning") ||
    (budgetTone === "warning" && roasTone === "warning")
  ) {
    status = "risk";
    headline = "성과 저하와 예산 리스크가 함께 보여 즉시 대응이 필요한 상태입니다.";
    summary = "비용 효율과 집행 속도를 동시에 조정하지 않으면 손실이 커질 가능성이 있습니다.";
  } else if (warnings >= 1 || causes.length >= 2) {
    status = "review";
    headline = "운영 점검이 필요한 신호가 일부 확인됩니다.";
    summary = "즉시 중단 수준은 아니지만 성과 저하 원인을 정리하고 빠른 조정이 필요합니다.";
  }

  const note =
    status === "risk"
      ? "운영 메모: 예산, 입찰, 랜딩 흐름을 우선 순위로 점검하고 고비용 그룹은 즉시 통제하세요."
      : status === "review"
        ? "운영 메모: 주요 경고 지표의 원인을 정리하고 다음 점검 전까지 조정 결과를 비교하세요."
        : "운영 메모: 현재 구조를 유지하되 추세 변화가 생기는지 주기적으로 모니터링하세요.";

  return {
    status,
    headline,
    summary,
    causes,
    actions: actions.slice(0, 4),
    note,
    metrics,
  };
}

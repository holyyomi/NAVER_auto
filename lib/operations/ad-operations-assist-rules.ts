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
    return `${label} 기준으로는 현재 운영 흐름이 안정적입니다.`;
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
    pushUnique(causes, `CTR ${toDisplayNumber(input.ctr, "%")}로 소재 반응 또는 키워드 적합도 저하 가능성이 있습니다.`);
    pushUnique(actions, "소재 CTR 점검: 노출 대비 클릭이 낮은 소재는 즉시 교체 후보로 분류하고 문안/이미지 테스트를 진행해 주세요.");
    pushUnique(actions, "키워드 확장/제외 점검: 반응이 낮은 검색어는 제외 검토하고 반응이 좋은 유사 키워드 확장을 확인해 주세요.");
  }

  if (cpcTone === "warning") {
    pushUnique(causes, `CPC ${toDisplayNumber(input.cpc, "원")}로 입찰 경쟁 부담이 커진 상태입니다.`);
    pushUnique(actions, "입찰가 점검: 고비용 키워드와 그룹의 입찰가를 단계적으로 낮추고 상위 노출 집착 구간을 조정해 주세요.");
  }

  if (cvrTone === "warning") {
    pushUnique(causes, `CVR ${toDisplayNumber(input.cvr, "%")}로 랜딩 이후 전환 연결이 약해진 흐름입니다.`);
    pushUnique(actions, "랜딩 전환 흐름 점검: 랜딩 메시지, 폼/버튼 위치, 전환 동선을 다시 확인해 주세요.");
  }

  if (cpaTone === "warning") {
    pushUnique(causes, `CPA ${toDisplayNumber(input.cpa, "원")}로 전환당 비용 부담이 커진 상태입니다.`);
    pushUnique(actions, "예산 배분 재검토: 고CPA 그룹은 축소하고 전환 기여가 높은 그룹에 예산을 우선 배분해 주세요.");
  }

  if (roasTone === "warning") {
    pushUnique(causes, `ROAS ${toDisplayNumber(input.roas, "%")}로 매출 회수 효율 보완이 필요합니다.`);
    pushUnique(actions, "키워드 확장/제외 점검: 매출 기여가 낮은 그룹은 제외 기준을 강화하고 전환 기여 키워드를 중심으로 확장해 주세요.");
  }

  if (budgetTone === "warning") {
    if (input.budgetBurnRate !== null && input.budgetBurnRate > 105) {
      pushUnique(causes, `예산 소진율 ${toDisplayNumber(input.budgetBurnRate, "%")}로 예산이 빠르게 소진되고 있습니다.`);
      pushUnique(actions, "예산 배분 재검토: 과소진 그룹은 일예산 또는 입찰 강도를 낮추고 유지 가치가 낮은 그룹은 즉시 보수 운영해 주세요.");
    } else {
      pushUnique(causes, `예산 소진율 ${toDisplayNumber(input.budgetBurnRate, "%")}로 집행 강도가 부족합니다.`);
      pushUnique(actions, "입찰가 점검: 성과 유지 그룹 중심으로 입찰가와 일예산을 상향할 여지가 있는지 확인해 주세요.");
    }
  }

  if (input.impressionsTrend === "down" && input.clicksTrend === "down") {
    pushUnique(causes, "노출과 클릭이 함께 하락해 유입 볼륨 자체가 줄어드는 흐름입니다.");
    pushUnique(actions, "추세 재확인 일정 제안: 오늘 조정 후 다음 영업일 오전에 노출/클릭 추세를 다시 확인해 주세요.");
  }

  if (input.clicksTrend === "up" && input.conversionsTrend === "down") {
    pushUnique(causes, "클릭은 늘고 있지만 전환은 줄어 유입 품질 저하 가능성이 있습니다.");
    pushUnique(actions, "랜딩 전환 흐름 점검: 유입 키워드와 랜딩 메시지 일치 여부를 먼저 점검해 주세요.");
  }

  if (input.conversionsTrend === "down" && (roasTone === "warning" || cpaTone === "warning")) {
    pushUnique(causes, "전환 감소와 효율 저하가 함께 나타나 즉시 운영 보정이 필요한 구간입니다.");
    pushUnique(actions, "추세 재확인 일정 제안: 조정 적용 후 24시간 내 전환/CPA/ROAS 재확인을 권장합니다.");
  }

  if (actions.length === 0) {
    pushUnique(actions, "소재 CTR 점검: 상위 소재 반응이 유지되는지 주 1회 기준으로 확인해 주세요.");
    pushUnique(actions, "추세 재확인 일정 제안: 다음 점검 시점에 동일 기준으로 ROAS와 CPA를 다시 비교해 주세요.");
  }

  if (causes.length === 0) {
    pushUnique(causes, "현재 입력 기준에서는 즉시 위험 신호가 크지 않습니다.");
  }

  let status: OperationStatus = "normal";
  let headline = "현재 운영 상태는 전반적으로 안정적입니다.";
  let summary = "주요 효율 지표와 집행 강도는 현재 수준을 유지하면서 추세 재확인 중심으로 관리하면 됩니다.";

  if (
    warnings >= 3 ||
    (roasTone === "warning" && cpaTone === "warning") ||
    (budgetTone === "warning" && roasTone === "warning")
  ) {
    status = "risk";
    headline = "성과 효율과 예산 운영 모두 즉시 조정이 필요한 위험 구간입니다.";
    summary = "입찰, 예산, 랜딩 흐름을 동시에 손보지 않으면 비용 부담이 빠르게 커질 가능성이 높습니다.";
  } else if (warnings >= 1 || causes.length >= 2) {
    status = "review";
    headline = "운영 점검이 필요한 신호가 확인됐습니다.";
    summary = "즉시 중단 수준은 아니지만 소재, 입찰, 랜딩 중 우선순위를 정해 빠르게 보정할 필요가 있습니다.";
  }

  const note =
    status === "risk"
      ? "운영 메모: 오늘 안에 입찰가, 예산, 랜딩 점검을 같이 진행하고 고비용 그룹은 임시 보수 운영으로 전환해 주세요."
      : status === "review"
        ? "운영 메모: 우선 한두 개 액션만 먼저 적용한 뒤 다음 점검 시점에 동일 지표로 재확인하는 것이 효율적입니다."
        : "운영 메모: 현재 구조를 유지하되 주간 단위로 소재 반응과 추세 변화를 확인하면 충분합니다.";

  return {
    status,
    headline,
    summary,
    causes,
    actions: actions.slice(0, 5),
    note,
    metrics,
  };
}

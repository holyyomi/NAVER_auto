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

function classifyBudgetBurnRate(value: number | null) {
  if (value === null) {
    return "neutral" as const;
  }

  if (value >= 60 && value <= 95) {
    return "positive" as const;
  }

  if ((value >= 40 && value < 60) || (value > 95 && value <= 105)) {
    return "neutral" as const;
  }

  return "warning" as const;
}

function metricComment(label: string, tone: RuleTone) {
  if (tone === "positive") {
    return `${label}은 현재 운영 기준에서 양호합니다.`;
  }

  if (tone === "warning") {
    return `${label}은 우선 점검이 필요한 수준입니다.`;
  }

  return `${label}은 유지 가능하지만 추가 최적화 여지가 있습니다.`;
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
    {
      key: "ctr",
      label: "CTR",
      value: input.ctr,
      unit: "%",
      tone: ctrTone,
      comment: metricComment("CTR", ctrTone),
    },
    {
      key: "cpc",
      label: "CPC",
      value: input.cpc,
      unit: "원",
      tone: cpcTone,
      comment: metricComment("CPC", cpcTone),
    },
    {
      key: "cvr",
      label: "CVR",
      value: input.cvr,
      unit: "%",
      tone: cvrTone,
      comment: metricComment("CVR", cvrTone),
    },
    {
      key: "cpa",
      label: "CPA",
      value: input.cpa,
      unit: "원",
      tone: cpaTone,
      comment: metricComment("CPA", cpaTone),
    },
    {
      key: "roas",
      label: "ROAS",
      value: input.roas,
      unit: "%",
      tone: roasTone,
      comment: metricComment("ROAS", roasTone),
    },
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
    pushUnique(causes, `CTR ${toDisplayNumber(input.ctr, "%")}로 소재 반응 또는 키워드 정합성이 약할 가능성이 있습니다.`);
    pushUnique(actions, "클릭 반응이 낮은 소재와 키워드를 우선 정리하고, 문안 테스트를 다시 진행해 주세요.");
  }

  if (cpcTone === "warning") {
    pushUnique(causes, `CPC ${toDisplayNumber(input.cpc, "원")}로 입찰 경쟁 부담이 커진 상태일 수 있습니다.`);
    pushUnique(actions, "상위 입찰가 구간을 재검토하고, 효율이 낮은 그룹은 입찰가를 단계적으로 낮춰 주세요.");
  }

  if (cvrTone === "warning") {
    pushUnique(causes, `CVR ${toDisplayNumber(input.cvr, "%")}로 랜딩 이후 전환 연결이 약할 수 있습니다.`);
    pushUnique(actions, "랜딩페이지 메시지와 전환 동선을 점검하고, 전환 의도가 낮은 검색어는 제외해 주세요.");
  }

  if (cpaTone === "warning") {
    pushUnique(causes, `CPA ${toDisplayNumber(input.cpa, "원")}로 전환당 비용 부담이 커졌습니다.`);
    pushUnique(actions, "고비용 저전환 캠페인 또는 키워드는 예산 축소와 정리 우선순위로 관리해 주세요.");
  }

  if (roasTone === "warning") {
    pushUnique(causes, `ROAS ${toDisplayNumber(input.roas, "%")}로 매출 회수 효율이 낮을 수 있습니다.`);
    pushUnique(actions, "ROAS가 낮은 그룹은 예산 확대를 보류하고, 매출 기여가 높은 그룹 중심으로 재배분해 주세요.");
  }

  if (budgetTone === "warning") {
    if (input.budgetBurnRate !== null && input.budgetBurnRate > 105) {
      pushUnique(causes, `예산 소진율 ${toDisplayNumber(input.budgetBurnRate, "%")}로 예산이 빠르게 소진되고 있을 가능성이 있습니다.`);
      pushUnique(actions, "예산 초과 소진이 발생한 그룹은 일예산과 입찰 강도를 즉시 조정해 주세요.");
    } else {
      pushUnique(causes, `예산 소진율 ${toDisplayNumber(input.budgetBurnRate, "%")}로 집행 속도가 느릴 수 있습니다.`);
      pushUnique(actions, "성과가 유지되는 그룹은 노출 확보를 위해 예산 또는 입찰 강도 상향을 검토해 주세요.");
    }
  }

  if (input.impressionsTrend === "down" && input.clicksTrend === "down") {
    pushUnique(causes, "노출과 클릭이 함께 하락해 전체 유입 규모가 줄어드는 흐름일 수 있습니다.");
    pushUnique(actions, "노출 감소가 큰 캠페인은 예산, 입찰, 소재 노출 상태를 함께 점검해 주세요.");
  }

  if (input.clicksTrend === "up" && input.conversionsTrend === "down") {
    pushUnique(causes, "클릭은 증가하지만 전환은 감소해 유입 품질 저하 가능성이 있습니다.");
    pushUnique(actions, "클릭 증가 구간의 검색어 보고서와 랜딩 전환율을 함께 확인해 저품질 유입을 정리해 주세요.");
  }

  if (input.impressionsTrend === "up" && ctrTone === "warning") {
    pushUnique(causes, "노출은 늘고 있지만 CTR이 낮아 비효율 노출이 쌓이고 있을 수 있습니다.");
  }

  if (input.conversionsTrend === "down" && (cvrTone === "warning" || roasTone === "warning")) {
    pushUnique(causes, "전환 하락과 효율 지표 저하가 함께 나타나 운영 보정이 필요한 구간일 수 있습니다.");
  }

  if (actions.length === 0) {
    pushUnique(actions, "현재 효율을 유지하면서 상위 성과 그룹 중심으로 운영 폭을 미세 조정해 주세요.");
    pushUnique(actions, "다음 점검 시 동일 기준으로 지표 추세를 다시 확인해 주세요.");
  }

  let status: OperationStatus = "normal";
  let headline = "현재 운영 상태는 정상 범위로 판단됩니다.";
  let summary = "핵심 효율과 집행 흐름이 큰 이슈 없이 유지되는 구간입니다.";

  if (
    warnings >= 3 ||
    (roasTone === "warning" && cpaTone === "warning") ||
    (budgetTone === "warning" && roasTone === "warning")
  ) {
    status = "risk";
    headline = "운영 리스크가 커져 즉시 점검이 필요한 상태입니다.";
    summary = "예산 집행과 성과 회수 구조를 함께 조정하지 않으면 비효율이 확대될 수 있습니다.";
  } else if (warnings >= 1 || causes.length >= 2) {
    status = "review";
    headline = "일부 지표에서 점검이 필요한 신호가 확인됩니다.";
    summary = "즉시 중단이 필요한 수준은 아니지만, 효율 저하 요인을 선제적으로 정리하는 편이 안전합니다.";
  }

  if (causes.length === 0) {
    pushUnique(causes, "현재 입력 기준에서는 뚜렷한 이상 신호가 크지 않습니다.");
  }

  const note =
    status === "risk"
      ? "비효율 확대 가능성이 보여 예산, 입찰, 전환 흐름을 우선 순위로 재점검해 주세요."
      : status === "review"
        ? "운영은 가능하지만 세부 지표 저하가 누적되지 않도록 원인 점검과 작은 조정을 병행해 주세요."
        : "현재 구조를 유지하되 다음 점검 시 추세 변화 여부를 중심으로 확인해 주세요.";

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

export type AdOperationsInput = {
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

export type AdOperationsOutput = {
  problemSummary: string;
  causeHypotheses: string[];
  todayActions: string[];
  tomorrowMetrics: string[];
};

function pushIfMissing(target: string[], value: string) {
  if (!target.includes(value)) target.push(value);
}

export function buildAdOperationsAssist(input: AdOperationsInput): AdOperationsOutput {
  const causeHypotheses: string[] = [];
  const todayActions: string[] = [];
  const tomorrowMetrics: string[] = [];
  const campaignName = input.campaignName || "캠페인";
  const issueCount = [
    input.ctrDrop,
    input.cpcIncrease,
    input.conversionDrop,
    input.lowImpressions,
    input.creativeFatigue,
    input.budgetIssue,
    input.landingIssue,
  ].filter(Boolean).length;

  if (input.ctrDrop) {
    pushIfMissing(causeHypotheses, "소재 반응 저하 또는 문구 경쟁력 약화 가능성이 있습니다.");
    pushIfMissing(todayActions, "CTR이 낮은 소재를 먼저 교체하고 제목 문구를 점검합니다.");
    pushIfMissing(tomorrowMetrics, "CTR, 클릭 수");
  }

  if (input.cpcIncrease) {
    pushIfMissing(causeHypotheses, "입찰 경쟁 심화 또는 고비용 키워드 비중 증가 가능성이 있습니다.");
    pushIfMissing(todayActions, "고비용 키워드와 광고그룹 입찰가를 다시 확인합니다.");
    pushIfMissing(tomorrowMetrics, "CPC, 비용");
  }

  if (input.conversionDrop) {
    pushIfMissing(causeHypotheses, "유입 이후 랜딩 또는 문의 흐름에 이탈 문제가 있을 수 있습니다.");
    pushIfMissing(todayActions, "전환이 줄어든 키워드와 랜딩 페이지 흐름을 함께 점검합니다.");
    pushIfMissing(tomorrowMetrics, "전환 수, CVR");
  }

  if (input.lowImpressions) {
    pushIfMissing(causeHypotheses, "검색량 감소 또는 노출 경쟁 약화로 노출이 줄었을 수 있습니다.");
    pushIfMissing(todayActions, "노출이 낮은 그룹의 입찰가와 예산 상태를 먼저 확인합니다.");
    pushIfMissing(tomorrowMetrics, "노출 수, 평균 CPC");
  }

  if (input.creativeFatigue) {
    pushIfMissing(causeHypotheses, "같은 소재 노출이 반복되며 반응이 떨어졌을 수 있습니다.");
    pushIfMissing(todayActions, "소재 문구와 확장소재를 새 버전으로 교체합니다.");
    pushIfMissing(tomorrowMetrics, "CTR, 신규 소재 클릭 수");
  }

  if (input.budgetIssue) {
    pushIfMissing(causeHypotheses, "예산 소진 속도 문제로 집행 기회가 줄었을 수 있습니다.");
    pushIfMissing(todayActions, "예산 분배와 시간대 설정을 다시 조정합니다.");
    pushIfMissing(tomorrowMetrics, "비용, 예산 소진율");
  }

  if (input.landingIssue) {
    pushIfMissing(causeHypotheses, "랜딩 페이지 이탈 또는 문의 흐름 문제가 있을 수 있습니다.");
    pushIfMissing(todayActions, "랜딩 로딩 속도와 문의 동선을 직접 확인합니다.");
    pushIfMissing(tomorrowMetrics, "CVR, 이탈률");
  }

  if (input.notes.trim()) {
    pushIfMissing(causeHypotheses, `추가 메모 기준: ${input.notes.trim()}`);
  }

  if (causeHypotheses.length === 0) causeHypotheses.push("입력한 정보를 기준으로 즉시 확인할 운영 이슈는 크지 않습니다.");
  if (todayActions.length === 0) todayActions.push("주요 광고그룹 지표를 다시 확인하고 변동이 큰 항목만 우선 조정합니다.");
  if (tomorrowMetrics.length === 0) tomorrowMetrics.push("CTR, CPC, 전환 수");

  const problemSummary =
    issueCount >= 3
      ? `${campaignName}은 오늘 바로 확인해야 할 운영 이슈가 여러 개 있습니다.`
      : issueCount >= 1
        ? `${campaignName}은 일부 운영 이슈가 있어 우선 조정이 필요합니다.`
        : `${campaignName}은 현재 큰 운영 이슈 없이 관리 중입니다.`;

  return {
    problemSummary,
    causeHypotheses: causeHypotheses.slice(0, 4),
    todayActions: todayActions.slice(0, 4),
    tomorrowMetrics: tomorrowMetrics.slice(0, 4),
  };
}

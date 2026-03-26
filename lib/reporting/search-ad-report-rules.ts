export type ReportTemplate = "internal" | "client";

export type SearchAdReportInput = {
  template: ReportTemplate;
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

export type SearchAdReportOutput = {
  template: ReportTemplate;
  oneLineSummary: string;
  strengths: string[];
  issues: string[];
  nextActions: string[];
};

function formatNumber(value: number | null, suffix = "") {
  if (value === null || Number.isNaN(value)) return "-";
  return `${value.toLocaleString("ko-KR")}${suffix}`;
}

function pushIfMissing(target: string[], value: string) {
  if (!target.includes(value)) target.push(value);
}

function buildToneSummary(input: SearchAdReportInput) {
  const roas = input.roas ?? 0;
  const ctr = input.ctr ?? 0;
  const conversions = input.conversions ?? 0;
  const campaignName = input.campaignName || "캠페인";

  if (roas >= 400 && conversions >= 10) {
    return `${campaignName}은 성과가 안정적으로 유지되고 있습니다.`;
  }

  if (roas < 250 || conversions < 3 || ctr < 1.5) {
    return `${campaignName}은 주요 지표 보완이 필요한 상태입니다.`;
  }

  return `${campaignName}은 큰 문제는 없지만 추가 최적화 여지가 있습니다.`;
}

export function buildSearchAdReport(input: SearchAdReportInput): SearchAdReportOutput {
  const strengths: string[] = [];
  const issues: string[] = [];
  const nextActions: string[] = [];

  if ((input.roas ?? 0) >= 400) {
    pushIfMissing(strengths, `ROAS ${formatNumber(input.roas, "%")}로 수익성이 안정적입니다.`);
  } else if ((input.roas ?? 0) > 0) {
    pushIfMissing(issues, `ROAS ${formatNumber(input.roas, "%")}로 수익성 보완이 필요합니다.`);
    pushIfMissing(nextActions, "ROAS가 낮은 그룹은 예산과 입찰가를 다시 확인합니다.");
  }

  if ((input.ctr ?? 0) >= 2.5) {
    pushIfMissing(strengths, `CTR ${formatNumber(input.ctr, "%")}로 광고 반응이 양호합니다.`);
  } else if ((input.ctr ?? 0) > 0) {
    pushIfMissing(issues, `CTR ${formatNumber(input.ctr, "%")}로 소재 반응이 낮습니다.`);
    pushIfMissing(nextActions, "소재 문구와 확장소재를 우선 교체합니다.");
  }

  if ((input.conversions ?? 0) >= 10) {
    pushIfMissing(strengths, `전환 ${formatNumber(input.conversions, "건")}으로 운영 기준을 충족합니다.`);
  } else {
    pushIfMissing(issues, `전환 ${formatNumber(input.conversions, "건")}으로 전환량이 부족합니다.`);
    pushIfMissing(nextActions, "전환이 낮은 키워드와 랜딩 흐름을 함께 점검합니다.");
  }

  if ((input.cpa ?? 0) >= 60000) {
    pushIfMissing(issues, `CPA ${formatNumber(input.cpa, "원")}으로 비용 부담이 있습니다.`);
    pushIfMissing(nextActions, "CPA가 높은 그룹은 예산을 줄이거나 제외 키워드를 추가합니다.");
  } else if ((input.cpa ?? 0) > 0) {
    pushIfMissing(strengths, `CPA ${formatNumber(input.cpa, "원")} 수준으로 비용 통제가 가능합니다.`);
  }

  if (input.comparisonNotes.trim()) {
    pushIfMissing(issues, `비교 메모: ${input.comparisonNotes.trim()}`);
  }

  if (strengths.length === 0) strengths.push("핵심 지표는 더 확인이 필요하지만 기본 흐름은 유지되고 있습니다.");
  if (issues.length === 0) issues.push("즉시 수정이 필요한 큰 문제는 보이지 않습니다.");
  if (nextActions.length === 0) nextActions.push("다음 보고 시점까지 같은 기준으로 수치를 다시 확인합니다.");

  const audiencePrefix = input.template === "client" ? "클라이언트 공유 기준으로" : "내부 공유 기준으로";

  return {
    template: input.template,
    oneLineSummary: `${audiencePrefix} ${buildToneSummary(input)}`,
    strengths: strengths.slice(0, 4),
    issues: issues.slice(0, 4),
    nextActions: nextActions.slice(0, 4),
  };
}

export type WorkGuideItem = {
  title: string;
  description: string;
  output: string;
  href: string;
  cta: string;
  featureLabel: string;
};

export type FeatureGuide = {
  useWhen: string;
  output: string;
  nextAction: string;
  testPoint: string;
};

export type QaChecklistItem = {
  title: string;
  description: string;
};

export const employeeWorkGuides: WorkGuideItem[] = [
  {
    title: "검색 결과 확인",
    description: "검색 결과를 보고 필요한 항목을 복사하거나 저장합니다.",
    output: "검색 결과 메모",
    href: "/features/search-results-hub",
    cta: "결과 보기",
    featureLabel: "검색 결과 모음",
  },
  {
    title: "지역 업체 조사",
    description: "지역과 업종 기준으로 제안 준비용 결과를 확인합니다.",
    output: "조사 메모",
    href: "/features/local-business-research",
    cta: "업체 보기",
    featureLabel: "지역 업체 조사",
  },
  {
    title: "경쟁 키워드 확인",
    description: "저장한 키워드의 노출 변화를 다시 확인합니다.",
    output: "비교 메모",
    href: "/features/competitor-keyword-monitoring",
    cta: "변화 보기",
    featureLabel: "경쟁 키워드 모니터링",
  },
  {
    title: "리포트 문안 만들기",
    description: "성과 수치로 공유용 리포트 초안을 정리합니다.",
    output: "리포트 초안",
    href: "/features/search-ad-report-assist",
    cta: "보고서 만들기",
    featureLabel: "검색광고 리포트 보조",
  },
  {
    title: "운영 액션 정리",
    description: "운영 이슈를 입력하면 오늘 할 액션을 정리합니다.",
    output: "운영 메모",
    href: "/features/ad-operations-assist",
    cta: "액션 정리",
    featureLabel: "광고 운영 보조",
  },
];

export const featureUsageGuides: Record<string, FeatureGuide> = {
  "search-results-hub": {
    useWhen: "검색 반응, 경쟁 노출, 참고 콘텐츠를 빠르게 확인할 때 사용합니다.",
    output: "검색 결과 목록과 복사 가능한 요약",
    nextAction: "필요한 결과를 복사하거나 저장한 뒤 다른 작업으로 이어갑니다.",
    testPoint: "조회, 저장, 복사, 최근 기록 복원이 자연스럽게 이어지는지 확인합니다.",
  },
  "local-business-research": {
    useWhen: "지역 광고 제안이나 업종 조사를 위해 기본 검색 결과를 볼 때 사용합니다.",
    output: "지역 조사 결과 목록과 제안 준비용 메모",
    nextAction: "필요하면 검색 결과 모음이나 경쟁 키워드 모니터링으로 이어갑니다.",
    testPoint: "지역과 업종을 바꿔도 결과가 단순하고 명확하게 갱신되는지 확인합니다.",
  },
  "competitor-keyword-monitoring": {
    useWhen: "같은 키워드를 반복 확인하고 이전 대비 노출 변화를 볼 때 사용합니다.",
    output: "이전 대비 노출 비교 요약",
    nextAction: "변화가 있는 키워드만 메모하거나 추가 조사를 이어갑니다.",
    testPoint: "등록, 재확인, 복사, 삭제가 최근 5개 기준으로 안정적으로 동작하는지 확인합니다.",
  },
  "search-ad-report-assist": {
    useWhen: "성과 수치를 리포트 문안과 액션 요약으로 정리할 때 사용합니다.",
    output: "한 줄 요약, 잘된 점, 문제점, 다음 액션",
    nextAction: "복사해서 내부 공유나 클라이언트 공유 문안으로 사용합니다.",
    testPoint: "샘플 입력, 템플릿 변경, AI 실패 fallback, 저장 복원이 모두 동작하는지 확인합니다.",
  },
  "ad-operations-assist": {
    useWhen: "운영 이슈를 빠르게 점검하고 오늘 해야 할 액션을 정리할 때 사용합니다.",
    output: "문제 요약, 원인 가설, 오늘 액션, 내일 확인 지표",
    nextAction: "복사해서 내부 메모나 운영 공유 문안으로 바로 사용합니다.",
    testPoint: "이슈 조합에 따라 결과가 바뀌고 저장 복원도 정상 동작하는지 확인합니다.",
  },
};

export const qaChecklist: QaChecklistItem[] = [
  {
    title: "첫 화면 이해",
    description: "짧은 설명과 버튼만 보고도 어떤 작업인지 바로 이해되는지 확인합니다.",
  },
  {
    title: "입력부터 결과까지",
    description: "입력, 실행, 결과 확인, 복사, 저장 흐름이 한 화면에서 이어지는지 봅니다.",
  },
  {
    title: "최근 기록 복원",
    description: "저장한 결과를 최근 작업에서 바로 다시 열 수 있는지 확인합니다.",
  },
  {
    title: "복사 결과 품질",
    description: "복사한 텍스트가 추가 편집 없이 바로 공유 가능한지 확인합니다.",
  },
  {
    title: "다음 행동이 보이는지",
    description: "조회 뒤 복사, 저장, 다시 열기 중 무엇을 하면 되는지 바로 이해되는지 확인합니다.",
  },
];

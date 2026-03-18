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
    title: "신규 고객사 제안 준비",
    description: "업종 반응, 콘텐츠 레퍼런스, 검색 노출 흐름을 빠르게 모아 제안 전 메모를 만들 때 씁니다.",
    output: "제안 전 조사 메모",
    href: "/features/search-results-hub",
    cta: "검색부터 시작",
    featureLabel: "검색 결과 모음",
  },
  {
    title: "지역 업종 조사",
    description: "로컬 클라이언트나 지점형 업종의 검색 패턴과 경쟁 노출 구성을 확인할 때 씁니다.",
    output: "지역 조사 메모",
    href: "/features/local-business-research",
    cta: "지역 조사 열기",
    featureLabel: "지역 업체 조사",
  },
  {
    title: "경쟁사 키워드 추적",
    description: "반복 확인해야 하는 경쟁 키워드를 등록하고 이전 대비 변화 여부를 비교할 때 씁니다.",
    output: "경쟁 추적 결과",
    href: "/features/competitor-keyword-monitoring",
    cta: "모니터링 열기",
    featureLabel: "경쟁 키워드 모니터링",
  },
  {
    title: "주간 보고 초안 작성",
    description: "성과 수치를 넣고 내부 공유용 또는 클라이언트 초안용 문장을 빠르게 정리할 때 씁니다.",
    output: "보고 초안",
    href: "/features/search-ad-report-assist",
    cta: "초안 작성",
    featureLabel: "검색광고 리포트 보조",
  },
  {
    title: "광고 운영 점검",
    description: "오늘 먼저 점검할 위험 구간과 바로 실행할 조치 항목을 정리할 때 씁니다.",
    output: "운영 액션 메모",
    href: "/features/ad-operations-assist",
    cta: "운영 점검",
    featureLabel: "광고 운영 보조",
  },
];

export const featureUsageGuides: Record<string, FeatureGuide> = {
  "search-results-hub": {
    useWhen: "신규 제안 조사, 업종 레퍼런스 확인, 경쟁 콘텐츠 흐름을 빠르게 훑어야 할 때",
    output: "조사 메모, 저장 가능한 검색 결과 묶음, 후속 모니터링용 키워드",
    nextAction: "필요한 결과를 저장하거나 지역 조사와 경쟁 키워드 모니터링으로 이어가세요.",
    testPoint: "조회 후 제목 복사, 저장, 다시 열기, 후속 액션 링크까지 한 번씩 확인하세요.",
  },
  "local-business-research": {
    useWhen: "지역 기반 클라이언트, 지점형 업종, 로컬 경쟁사 노출 구성을 확인해야 할 때",
    output: "지역 조사 메모, 업체명 포함 여부, 업종 일치 가능성 요약",
    nextAction: "조사 결과를 저장하고, 더 넓게 볼 때는 검색 결과 모음으로 확장하세요.",
    testPoint: "지역·업종·업체명 조합으로 조회하고 저장 후 다시 보기 흐름을 확인하세요.",
  },
  "competitor-keyword-monitoring": {
    useWhen: "반복 체크가 필요한 경쟁 키워드나 지역 조합 키워드를 주기적으로 확인할 때",
    output: "경쟁 추적 결과, 이전 대비 변화 요약, 상위 결과 비교 메모",
    nextAction: "변화 있음 항목을 우선 확인하고 제안 메모나 운영 점검 자료로 넘기세요.",
    testPoint: "키워드 등록 후 지금 확인을 두 번 이상 실행해 비교 상태와 변화 요약을 확인하세요.",
  },
  "search-ad-report-assist": {
    useWhen: "주간·월간 보고 전에 성과 수치를 보고용 문장과 액션 포인트로 정리해야 할 때",
    output: "핵심 요약, 좋은 점, 점검 포인트, 권장 액션이 포함된 보고 초안",
    nextAction: "전체 복사나 핵심 요약 복사로 내부 공유 초안을 바로 전달하세요.",
    testPoint: "전기 수치를 함께 넣어 비교 문구와 복사 결과가 바로 보고용으로 쓰이는지 확인하세요.",
  },
  "ad-operations-assist": {
    useWhen: "캠페인 상태를 빠르게 점검하고 지금 해야 할 운영 조치를 정리해야 할 때",
    output: "운영 액션 메모, 문제 가능 구간, 우선 점검 항목",
    nextAction: "운영 요약을 복사해 팀 메모로 공유하고 필요한 항목부터 바로 점검하세요.",
    testPoint: "정상, 점검 필요, 위험에 가까운 수치를 바꿔 넣어 추천 액션이 달라지는지 확인하세요.",
  },
};

export const qaChecklist: QaChecklistItem[] = [
  {
    title: "언제 쓰는지 이해되는가",
    description: "기능에 들어갔을 때 이럴 때 쓰세요 안내만 보고도 용도를 바로 이해할 수 있는지 확인합니다.",
  },
  {
    title: "조회·실행이 정상 동작하는가",
    description: "검색, 조사, 초안 생성, 운영 점검 같은 핵심 실행이 오류 없이 끝나는지 확인합니다.",
  },
  {
    title: "저장·다시 열기가 되는가",
    description: "결과를 저장한 뒤 최근 작업이나 다시 보기에서 같은 내용이 다시 열리는지 확인합니다.",
  },
  {
    title: "결과 문구가 바로 업무에 쓸 만한가",
    description: "조사 메모, 보고 초안, 운영 메모가 별도 수정 없이 팀 공유 초안으로 쓸 수 있는지 확인합니다.",
  },
  {
    title: "다음 행동이 명확한가",
    description: "저장, 복사, 후속 기능 이동 같은 다음 액션이 헷갈리지 않고 바로 이어지는지 확인합니다.",
  },
];

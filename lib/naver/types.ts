export type NaverRuntimeMode = "real" | "demo";
export type ApiErrorCode =
  | "validation_error"
  | "unsupported_type"
  | "config_error"
  | "timeout_error"
  | "payload_error"
  | "upstream_error";

export type ApiResult<T> =
  | {
      ok: true;
      data: T;
      meta?: {
        source: "naver" | "mock";
        mode: NaverRuntimeMode;
      };
    }
  | {
      ok: false;
      error: string;
      code?: ApiErrorCode;
      issues?: string[];
    };

export type TrendPoint = {
  date: string;
  value: number;
};

export type TrendResponse = {
  summary: {
    keyword: string;
    periodLabel: string;
    average: number;
    peak: number;
    changeRate: number;
  };
  points: TrendPoint[];
  rows: Array<{
    date: string;
    value: number;
    change: number;
  }>;
};

export type SearchItem = {
  title: string;
  link: string;
  description: string;
  source?: string;
  type: "blog" | "news" | "shopping";
  publishedAt?: string;
};

export type SearchResponse = {
  keyword: string;
  searchType: "blog" | "news" | "shopping";
  total: number;
  items: SearchItem[];
};

export type ShoppingInsightResponse = {
  summary: {
    keyword: string;
    period: string;
    averageRatio: number;
    peakPeriod: string;
    ratioRange: number;
  };
  points: TrendPoint[];
  rows: Array<{
    period: string;
    ratio: number;
    peakRelativeRatio: number;
  }>;
};

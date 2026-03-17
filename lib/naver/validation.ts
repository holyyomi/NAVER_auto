import { parseDateInput } from "@/lib/naver/utils";
import { NaverPayloadError } from "@/lib/naver/errors";

export type TrendInput = {
  keyword: string;
  startDate: string;
  endDate: string;
};

export type SearchInput = {
  keyword: string;
  searchType: string;
};

export type ShoppingInput = {
  keyword: string;
  period: string;
};

export type NaverTrendPoint = {
  period: string;
  ratio: number;
};

export type NaverTrendResult = {
  title: string;
  keywords: string[];
  data: NaverTrendPoint[];
};

export type NaverTrendResponse = {
  startDate: string;
  endDate: string;
  timeUnit: "date" | "week" | "month";
  results: NaverTrendResult[];
};

export type NaverSearchRawItem = {
  title: string;
  link: string;
  description: string;
  bloggername?: string;
  originallink?: string;
  pubDate?: string;
  mallName?: string;
};

export type NaverSearchRawResponse = {
  items: NaverSearchRawItem[];
  total: number;
};

export type NaverShoppingKeywordPoint = {
  period: string;
  ratio: number;
};

export type NaverShoppingKeywordResult = {
  title: string;
  keyword: string[];
  data: NaverShoppingKeywordPoint[];
};

export type NaverShoppingKeywordResponse = {
  startDate: string;
  endDate: string;
  timeUnit: "date" | "week" | "month";
  results: NaverShoppingKeywordResult[];
};

export function validateTrendInput(input: TrendInput) {
  const issues: string[] = [];
  const keyword = input.keyword.trim();
  const startDate = parseDateInput(input.startDate);
  const endDate = parseDateInput(input.endDate);

  if (!keyword) issues.push("Enter a keyword.");
  if (!startDate) issues.push("Start date must be a valid date.");
  if (!endDate) issues.push("End date must be a valid date.");

  if (startDate && endDate) {
    if (startDate > endDate) {
      issues.push("Start date cannot be later than end date.");
    }

    const diffDays =
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays > 90) {
      issues.push("Trend lookback is limited to 90 days.");
    }
  }

  return {
    issues,
    value:
      issues.length === 0 && startDate && endDate
        ? {
            keyword,
            startDate,
            endDate,
          }
        : null,
  };
}

export function validateSearchInput(input: SearchInput) {
  const issues: string[] = [];
  const keyword = input.keyword.trim();
  const searchType = input.searchType.trim();
  const allowed = ["blog", "news", "shopping"] as const;

  if (!keyword) issues.push("Enter a keyword.");
  if (!allowed.includes(searchType as (typeof allowed)[number])) {
    issues.push("Search type must be one of blog, news, or shopping.");
  }

  return {
    issues,
    value:
      issues.length === 0
        ? {
            keyword,
            searchType: searchType as "blog" | "news" | "shopping",
          }
        : null,
  };
}

export function validateShoppingInput(input: ShoppingInput) {
  const issues: string[] = [];
  const keyword = input.keyword.trim();
  const period = input.period.trim();
  const allowed = ["7d", "30d", "90d"] as const;

  if (!keyword) issues.push("Enter a keyword.");
  if (!allowed.includes(period as (typeof allowed)[number])) {
    issues.push("Period must be one of 7d, 30d, or 90d.");
  }

  return {
    issues,
    value:
      issues.length === 0
        ? {
            keyword,
            period: period as "7d" | "30d" | "90d",
          }
        : null,
  };
}

export function validateTrendPayload(payload: unknown) {
  const issues: string[] = [];
  const root = asRecord(payload);

  if (!root) {
    throw new NaverPayloadError("trend", ["Payload must be an object."]);
  }

  const startDate = asString(root.startDate, "startDate", issues);
  const endDate = asString(root.endDate, "endDate", issues);
  const timeUnit = asTimeUnit(root.timeUnit, "timeUnit", issues);
  const results = asArray(root.results, "results", issues);

  const normalizedResults = (results ?? []).map((result, index) =>
    validateTrendResult(result, `results[${index}]`, issues),
  );

  throwIfIssues("trend", issues);

  return {
    startDate,
    endDate,
    timeUnit,
    results: normalizedResults,
  } satisfies NaverTrendResponse;
}

export function validateSearchPayload(payload: unknown) {
  const issues: string[] = [];
  const root = asRecord(payload);

  if (!root) {
    throw new NaverPayloadError("search", ["Payload must be an object."]);
  }

  const items = asArray(root.items, "items", issues);
  const total = asNumber(root.total, "total", issues);

  const normalizedItems = (items ?? []).map((item, index) =>
    validateSearchItem(item, `items[${index}]`, issues),
  );

  throwIfIssues("search", issues);

  return {
    items: normalizedItems,
    total,
  } satisfies NaverSearchRawResponse;
}

export function validateShoppingPayload(payload: unknown) {
  const issues: string[] = [];
  const root = asRecord(payload);

  if (!root) {
    throw new NaverPayloadError("shopping", ["Payload must be an object."]);
  }

  const startDate = asString(root.startDate, "startDate", issues);
  const endDate = asString(root.endDate, "endDate", issues);
  const timeUnit = asTimeUnit(root.timeUnit, "timeUnit", issues);
  const results = asArray(root.results, "results", issues);

  const normalizedResults = (results ?? []).map((result, index) =>
    validateShoppingResult(result, `results[${index}]`, issues),
  );

  throwIfIssues("shopping", issues);

  return {
    startDate,
    endDate,
    timeUnit,
    results: normalizedResults,
  } satisfies NaverShoppingKeywordResponse;
}

function validateTrendResult(
  value: unknown,
  path: string,
  issues: string[],
): NaverTrendResult {
  const record = asRecord(value);
  if (!record) {
    issues.push(`${path} must be an object.`);
    return { title: "", keywords: [], data: [] };
  }

  const keywords = asStringArray(record.keywords, `${path}.keywords`, issues);
  const data = asArray(record.data, `${path}.data`, issues);

  return {
    title: asString(record.title, `${path}.title`, issues),
    keywords,
    data: (data ?? []).map((item, index) =>
      validateTrendPoint(item, `${path}.data[${index}]`, issues),
    ),
  };
}

function validateTrendPoint(
  value: unknown,
  path: string,
  issues: string[],
): NaverTrendPoint {
  const record = asRecord(value);
  if (!record) {
    issues.push(`${path} must be an object.`);
    return { period: "", ratio: 0 };
  }

  return {
    period: asString(record.period, `${path}.period`, issues),
    ratio: asNumber(record.ratio, `${path}.ratio`, issues),
  };
}

function validateSearchItem(
  value: unknown,
  path: string,
  issues: string[],
): NaverSearchRawItem {
  const record = asRecord(value);
  if (!record) {
    issues.push(`${path} must be an object.`);
    return { title: "", link: "", description: "" };
  }

  return {
    title: asString(record.title, `${path}.title`, issues),
    link: asString(record.link, `${path}.link`, issues),
    description: asString(record.description, `${path}.description`, issues),
    bloggername: asOptionalString(record.bloggername, `${path}.bloggername`, issues),
    originallink: asOptionalString(record.originallink, `${path}.originallink`, issues),
    pubDate: asOptionalString(record.pubDate, `${path}.pubDate`, issues),
    mallName: asOptionalString(record.mallName, `${path}.mallName`, issues),
  };
}

function validateShoppingResult(
  value: unknown,
  path: string,
  issues: string[],
): NaverShoppingKeywordResult {
  const record = asRecord(value);
  if (!record) {
    issues.push(`${path} must be an object.`);
    return { title: "", keyword: [], data: [] };
  }

  const keyword = asStringArray(record.keyword, `${path}.keyword`, issues);
  const data = asArray(record.data, `${path}.data`, issues);

  return {
    title: asString(record.title, `${path}.title`, issues),
    keyword,
    data: (data ?? []).map((item, index) =>
      validateShoppingPoint(item, `${path}.data[${index}]`, issues),
    ),
  };
}

function validateShoppingPoint(
  value: unknown,
  path: string,
  issues: string[],
): NaverShoppingKeywordPoint {
  const record = asRecord(value);
  if (!record) {
    issues.push(`${path} must be an object.`);
    return { period: "", ratio: 0 };
  }

  return {
    period: asString(record.period, `${path}.period`, issues),
    ratio: asNumber(record.ratio, `${path}.ratio`, issues),
  };
}

function asRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function asArray(value: unknown, path: string, issues: string[]) {
  if (!Array.isArray(value)) {
    issues.push(`${path} must be an array.`);
    return null;
  }

  return value;
}

function asString(value: unknown, path: string, issues: string[]) {
  if (typeof value !== "string") {
    issues.push(`${path} must be a string.`);
    return "";
  }

  return value;
}

function asOptionalString(value: unknown, path: string, issues: string[]) {
  if (value === undefined) return undefined;

  if (typeof value !== "string") {
    issues.push(`${path} must be a string when present.`);
    return undefined;
  }

  return value;
}

function asNumber(value: unknown, path: string, issues: string[]) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    issues.push(`${path} must be a finite number.`);
    return 0;
  }

  return value;
}

function asStringArray(value: unknown, path: string, issues: string[]) {
  if (!Array.isArray(value)) {
    issues.push(`${path} must be an array of strings.`);
    return [];
  }

  return value.map((item, index) => asString(item, `${path}[${index}]`, issues));
}

function asTimeUnit(value: unknown, path: string, issues: string[]) {
  if (value === "date" || value === "week" || value === "month") {
    return value;
  }

  issues.push(`${path} must be one of date, week, or month.`);
  return "date";
}

function throwIfIssues(operation: string, issues: string[]) {
  if (issues.length > 0) {
    throw new NaverPayloadError(operation, issues);
  }
}

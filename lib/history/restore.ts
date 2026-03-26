import type { SavedItemRecord } from "@/lib/history/types";
import type { ApiResult, SearchResponse } from "@/lib/naver/types";
import type { AdOperationsOutput } from "@/lib/operations/ad-operations-assist-rules";
import type { SearchAdReportOutput } from "@/lib/reporting/search-ad-report-rules";
import type { SearchType } from "@/lib/search/workbench-store";

type RestoreResult<TInput, TOutput> =
  | { ok: true; input: TInput; output: TOutput }
  | { ok: false; message: string };

function isSearchType(value: unknown): value is SearchType {
  return value === "blog" || value === "news" || value === "shopping";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isSearchResponseValue(value: unknown): value is SearchResponse {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isString(value.keyword) &&
    isSearchType(value.searchType) &&
    typeof value.total === "number" &&
    Array.isArray(value.items)
  );
}

function isApiResultSearchResponse(value: unknown): value is ApiResult<SearchResponse> {
  if (!isRecord(value) || typeof value.ok !== "boolean") {
    return false;
  }

  if (value.ok) {
    return isSearchResponseValue(value.data);
  }

  return isString(value.error);
}

export function restoreSearchResultsRecord<TInput extends { keyword: string; searchType: SearchType }>(
  record: SavedItemRecord,
): RestoreResult<TInput, ApiResult<SearchResponse>> {
  if (!isRecord(record.inputSnapshot)) {
    return { ok: false, message: "저장한 검색 조건을 불러오지 못했습니다." };
  }

  const input = record.inputSnapshot as Record<string, unknown>;
  if (!isString(input.keyword) || !isSearchType(input.searchType)) {
    return { ok: false, message: "저장한 검색 조건 형식이 올바르지 않습니다." };
  }

  if (!isApiResultSearchResponse(record.outputSnapshot)) {
    return { ok: false, message: "저장한 검색 결과를 불러오지 못했습니다." };
  }

  return {
    ok: true,
    input: {
      ...(record.inputSnapshot as TInput),
      keyword: input.keyword,
      searchType: input.searchType,
    },
    output: record.outputSnapshot,
  };
}

export function restoreSearchAdReportRecord<TInput>(
  record: SavedItemRecord,
): RestoreResult<TInput, SearchAdReportOutput> {
  if (!isRecord(record.inputSnapshot)) {
    return { ok: false, message: "저장한 리포트 입력값을 불러오지 못했습니다." };
  }

  if (!isRecord(record.outputSnapshot)) {
    return { ok: false, message: "저장한 리포트 결과를 불러오지 못했습니다." };
  }

  const output = record.outputSnapshot as Record<string, unknown>;
  if (
    !isString(output.oneLineSummary) ||
    !isStringArray(output.strengths) ||
    !isStringArray(output.issues) ||
    !isStringArray(output.nextActions)
  ) {
    return { ok: false, message: "저장한 리포트 결과 형식이 올바르지 않습니다." };
  }

  return {
    ok: true,
    input: record.inputSnapshot as TInput,
    output: record.outputSnapshot as SearchAdReportOutput,
  };
}

export function restoreLocalBusinessRecord<
  TInput extends {
    region: string;
    businessKeyword: string;
    searchType: SearchType;
  },
>(record: SavedItemRecord): RestoreResult<TInput, ApiResult<SearchResponse>> {
  if (!isRecord(record.inputSnapshot)) {
    return { ok: false, message: "저장한 조사 조건을 불러오지 못했습니다." };
  }

  const input = record.inputSnapshot as Record<string, unknown>;
  if (
    !isString(input.region) ||
    !isString(input.businessKeyword) ||
    !isSearchType(input.searchType)
  ) {
    return { ok: false, message: "저장한 조사 조건 형식이 올바르지 않습니다." };
  }

  if (!isApiResultSearchResponse(record.outputSnapshot)) {
    return { ok: false, message: "저장한 조사 결과를 불러오지 못했습니다." };
  }

  return {
    ok: true,
    input: record.inputSnapshot as TInput,
    output: record.outputSnapshot,
  };
}

export function restoreAdOperationsRecord<TInput>(
  record: SavedItemRecord,
): RestoreResult<TInput, AdOperationsOutput> {
  if (!isRecord(record.inputSnapshot)) {
    return { ok: false, message: "저장한 운영 입력값을 불러오지 못했습니다." };
  }

  if (!isRecord(record.outputSnapshot)) {
    return { ok: false, message: "저장한 운영 결과를 불러오지 못했습니다." };
  }

  const output = record.outputSnapshot as Record<string, unknown>;
  if (
    !isString(output.problemSummary) ||
    !isStringArray(output.causeHypotheses) ||
    !isStringArray(output.todayActions) ||
    !isStringArray(output.tomorrowMetrics)
  ) {
    return { ok: false, message: "저장한 운영 결과 형식이 올바르지 않습니다." };
  }

  return {
    ok: true,
    input: record.inputSnapshot as TInput,
    output: record.outputSnapshot as AdOperationsOutput,
  };
}

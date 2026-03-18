import type { ApiErrorCode, ApiResult } from "@/lib/naver/types";

export class ServerConfigError extends Error {
  readonly code = "config_error" as const;

  constructor(message: string, readonly issues: string[] = []) {
    super(message);
    this.name = "ServerConfigError";
  }
}

export class NaverTimeoutError extends Error {
  readonly code = "timeout_error" as const;

  constructor(readonly operation: string, readonly timeoutMs: number) {
    super(`NAVER API timed out after ${timeoutMs}ms during ${operation}.`);
    this.name = "NaverTimeoutError";
  }
}

export class NaverPayloadError extends Error {
  readonly code = "payload_error" as const;

  constructor(readonly operation: string, readonly issues: string[]) {
    super(`NAVER API payload was invalid for ${operation}.`);
    this.name = "NaverPayloadError";
  }
}

export class NaverUpstreamError extends Error {
  readonly code = "upstream_error" as const;

  constructor(
    readonly operation: string,
    readonly status: number,
    readonly responseText?: string,
  ) {
    super(`NAVER API request failed for ${operation} with status ${status}.`);
    this.name = "NaverUpstreamError";
  }
}

export function logServerError(scope: string, error: unknown, context?: Record<string, unknown>) {
  if (error instanceof ServerConfigError) {
    console.error(`[${scope}] config_error`, {
      issues: error.issues,
      ...(context ?? {}),
    });
    return;
  }

  if (error instanceof NaverTimeoutError) {
    console.error(`[${scope}] timeout_error`, {
      operation: error.operation,
      timeoutMs: error.timeoutMs,
      ...(context ?? {}),
    });
    return;
  }

  if (error instanceof NaverPayloadError) {
    console.error(`[${scope}] payload_error`, {
      operation: error.operation,
      issues: error.issues,
      ...(context ?? {}),
    });
    return;
  }

  if (error instanceof NaverUpstreamError) {
    console.error(`[${scope}] upstream_error`, {
      operation: error.operation,
      status: error.status,
      detail: sanitizeDetail(error.responseText),
      ...(context ?? {}),
    });
    return;
  }

  console.error(`[${scope}] unexpected_error`, {
    message: error instanceof Error ? error.message : "Unknown error",
    ...(context ?? {}),
  });
}

function sanitizeDetail(detail?: string) {
  if (!detail) return undefined;
  return detail.replace(/\s+/g, " ").trim().slice(0, 200);
}

function isQuotaExceeded(detail?: string) {
  const normalized = detail?.toLowerCase().replace(/\s+/g, " ").trim();

  if (!normalized) {
    return false;
  }

  return [
    "quota",
    "quota exceeded",
    "daily quota",
    "daily request count exceeded",
    "usage limit exceeded",
    "rate limit exceeded",
    "호출 시도",
    "일일 시도",
    "사용 한도",
  ].some((pattern) => normalized.includes(pattern));
}

export function toApiErrorResult<T>(_featureLabel: string, error: unknown): ApiResult<T> {
  if (error instanceof ServerConfigError) {
    return {
      ok: false,
      code: error.code,
      error: "네이버 API 설정이 완료되지 않았습니다.",
    };
  }

  if (error instanceof NaverTimeoutError) {
    return {
      ok: false,
      code: error.code,
      error: "네이버 검색 응답이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.",
    };
  }

  if (error instanceof NaverPayloadError) {
    return {
      ok: false,
      code: error.code,
      error: "네이버 검색 응답 형식을 확인하지 못했습니다.",
    };
  }

  if (error instanceof NaverUpstreamError) {
    if (error.status === 429 || isQuotaExceeded(error.responseText)) {
      return {
        ok: false,
        code: error.code,
        error: "오늘 사용 가능한 검색 호출 한도를 초과했습니다. 내일 다시 시도해 주세요.",
      };
    }

    if (error.status === 401) {
      return {
        ok: false,
        code: error.code,
        error: "네이버 API 인증 정보를 확인해 주세요.",
      };
    }

    if (error.status === 403) {
      return {
        ok: false,
        code: error.code,
        error: "현재 계정에서 이 검색 기능을 사용할 수 없습니다.",
      };
    }

    if (error.status === 404 && error.operation === "search:shopping") {
      return {
        ok: false,
        code: error.code,
        error: "쇼핑 검색 API 응답을 확인하지 못했습니다. 현재 지원 상태를 점검해 주세요.",
      };
    }

    if (error.status >= 500) {
      return {
        ok: false,
        code: error.code,
        error: "네이버 검색 서버 응답이 불안정합니다. 잠시 후 다시 시도해 주세요.",
      };
    }

    return {
      ok: false,
      code: error.code,
      error: "네이버 검색 요청이 정상적으로 처리되지 않았습니다.",
    };
  }

  return {
    ok: false,
    code: "upstream_error",
    error: "검색 요청 중 예상하지 못한 오류가 발생했습니다.",
  };
}

export function getApiErrorStatus(code?: ApiErrorCode) {
  switch (code) {
    case "validation_error":
    case "unsupported_type":
      return 400;
    case "config_error":
      return 503;
    case "timeout_error":
      return 504;
    case "payload_error":
      return 502;
    case "upstream_error":
      return 502;
    default:
      return 500;
  }
}

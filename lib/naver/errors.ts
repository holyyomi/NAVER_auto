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

export function toApiErrorResult<T>(
  _featureLabel: string,
  error: unknown,
): ApiResult<T> {
  if (error instanceof ServerConfigError) {
    return {
      ok: false,
      code: error.code,
      error: "설정이 아직 완료되지 않았습니다.",
    };
  }

  if (error instanceof NaverTimeoutError) {
    return {
      ok: false,
      code: error.code,
      error: "잠시 후 다시 시도해 주세요.",
    };
  }

  if (error instanceof NaverPayloadError) {
    return {
      ok: false,
      code: error.code,
      error: "응답 형식을 다시 확인해 주세요.",
    };
  }

  if (error instanceof NaverUpstreamError) {
    if (error.status === 401) {
      return {
        ok: false,
        code: error.code,
        error: "인증 정보 또는 권한을 확인해 주세요.",
      };
    }

    if (error.status === 403) {
      return {
        ok: false,
        code: error.code,
        error: "현재 기능 권한이 아직 승인되지 않았습니다.",
      };
    }

    if (error.status === 429) {
      return {
        ok: false,
        code: error.code,
        error: "잠시 후 다시 시도해 주세요.",
      };
    }

    if (error.status >= 500) {
      return {
        ok: false,
        code: error.code,
        error: "현재 데이터를 불러올 수 없습니다. 잠시 후 다시 시도해 주세요.",
      };
    }

    return {
      ok: false,
      code: error.code,
      error: "요청을 다시 확인해 주세요.",
    };
  }

  return {
    ok: false,
    code: "upstream_error",
    error: "잠시 후 다시 시도해 주세요.",
  };
}

export function getApiErrorStatus(code?: ApiErrorCode) {
  switch (code) {
    case "validation_error":
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

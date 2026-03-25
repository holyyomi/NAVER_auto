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
    "?몄텧 ?쒗븳",
    "?쇱씪 ?쒗븳",
    "?ъ슜 ?쒗븳",
  ].some((pattern) => normalized.includes(pattern));
}

export function toApiErrorResult<T>(_featureLabel: string, error: unknown): ApiResult<T> {
  if (error instanceof ServerConfigError) {
    const modeIssue = error.issues.find((issue) => issue.includes("NAVER_API_MODE=real"));

    return {
      ok: false,
      code: error.code,
      error: modeIssue
        ? "Naver API real mode is not enabled on the server. Check NAVER_API_MODE=real."
        : "Naver API is not configured on the server. Check NAVER_CLIENT_ID and NAVER_CLIENT_SECRET.",
      issues: error.issues,
    };
  }

  if (error instanceof NaverTimeoutError) {
    return {
      ok: false,
      code: error.code,
      error: "The Naver API response timed out. Please try again shortly.",
    };
  }

  if (error instanceof NaverPayloadError) {
    return {
      ok: false,
      code: error.code,
      error: "The Naver API returned a payload this app could not parse.",
    };
  }

  if (error instanceof NaverUpstreamError) {
    if (error.status === 429 || isQuotaExceeded(error.responseText)) {
      return {
        ok: false,
        code: error.code,
        error: "The Naver API request limit has been exceeded. Please try again later.",
      };
    }

    if (error.status === 401) {
      return {
        ok: false,
        code: error.code,
        error: "The Naver API credentials were rejected. Verify the server-side credentials.",
      };
    }

    if (error.status === 403) {
      return {
        ok: false,
        code: error.code,
        error: "The current Naver account does not have access to this API feature.",
      };
    }

    if (error.status === 404 && error.operation === "search:shopping") {
      return {
        ok: false,
        code: error.code,
        error: "The Naver Shopping search API endpoint could not be reached. Check API availability.",
      };
    }

    if (error.status >= 500) {
      return {
        ok: false,
        code: error.code,
        error: "The Naver API server returned an unstable response. Please try again shortly.",
      };
    }

    return {
      ok: false,
      code: error.code,
      error: "The Naver API request could not be completed successfully.",
    };
  }

  return {
    ok: false,
    code: "upstream_error",
    error: "An unexpected error occurred while processing the Naver API request.",
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

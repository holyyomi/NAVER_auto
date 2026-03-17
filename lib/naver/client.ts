import { getNaverEnv } from "@/lib/naver/env";
import {
  logServerError,
  NaverPayloadError,
  NaverTimeoutError,
  NaverUpstreamError,
} from "@/lib/naver/errors";

type FetchNaverJsonOptions<T> = RequestInit & {
  operation: string;
  validate: (payload: unknown) => T;
};

const TRANSIENT_STATUSES = new Set([408, 429, 500, 502, 503, 504]);

export async function fetchNaverJson<T>(url: string, options: FetchNaverJsonOptions<T>) {
  const { clientId, clientSecret, timeoutMs, retryCount, mode } = getNaverEnv();
  let lastError: unknown;

  for (let attempt = 0; attempt <= retryCount; attempt += 1) {
    try {
      const response = await fetchWithTimeout(url, {
        ...options,
        headers: {
          "X-Naver-Client-Id": clientId,
          "X-Naver-Client-Secret": clientSecret,
          "Content-Type": "application/json",
          ...(options.headers ?? {}),
        },
        cache: "no-store",
      }, timeoutMs, options.operation);

      if (!response.ok) {
        const responseText = await safeReadText(response);
        const error = new NaverUpstreamError(
          options.operation,
          response.status,
          responseText,
        );

        if (attempt < retryCount && shouldRetryStatus(response.status)) {
          lastError = error;
          await waitBeforeRetry(attempt);
          continue;
        }

        throw error;
      }

      const payload = await safeReadJson(response, options.operation);
      return options.validate(payload);
    } catch (error) {
      lastError = error;

      if (attempt < retryCount && shouldRetryError(error)) {
        await waitBeforeRetry(attempt);
        continue;
      }

      logServerError(`naver:${options.operation}`, error, {
        mode,
        url,
        attempt: attempt + 1,
      });
      throw error;
    }
  }

  logServerError(`naver:${options.operation}`, lastError, {
    mode,
    url,
    attempt: retryCount + 1,
  });
  throw lastError;
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
  operation: string,
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new NaverTimeoutError(operation, timeoutMs);
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function safeReadJson(response: Response, operation: string) {
  try {
    return (await response.json()) as unknown;
  } catch {
    throw new NaverPayloadError(operation, ["Response body was not valid JSON."]);
  }
}

async function safeReadText(response: Response) {
  try {
    return await response.text();
  } catch {
    return "";
  }
}

function shouldRetryStatus(status: number) {
  return TRANSIENT_STATUSES.has(status);
}

function shouldRetryError(error: unknown) {
  if (error instanceof NaverTimeoutError) return true;

  if (error instanceof NaverUpstreamError) {
    return shouldRetryStatus(error.status);
  }

  return error instanceof TypeError;
}

function waitBeforeRetry(attempt: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, 300 * (attempt + 1));
  });
}

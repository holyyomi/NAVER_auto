import "server-only";

import type { NaverRuntimeMode } from "@/lib/naver/types";
import { ServerConfigError } from "@/lib/naver/errors";

export function getNaverEnv() {
  const mode = parseMode(process.env.NAVER_API_MODE);
  const timeoutMs = parseInteger(process.env.NAVER_API_TIMEOUT_MS, 8000, 3000, 20000);
  const retryCount = parseInteger(process.env.NAVER_API_RETRY_COUNT, 1, 0, 2);

  return {
    mode,
    clientId: readEnv("NAVER_CLIENT_ID"),
    clientSecret: readEnv("NAVER_CLIENT_SECRET"),
    appName: process.env.NEXT_PUBLIC_APP_NAME ?? "Marketing Dashboard",
    timeoutMs,
    retryCount,
  };
}

export function hasNaverCredentials() {
  const { clientId, clientSecret } = getNaverEnv();

  return Boolean(clientId && clientSecret);
}

export function isDemoMode() {
  return getNaverEnv().mode === "demo";
}

export function assertRealModeNaverConfig() {
  const { mode, clientId, clientSecret } = getNaverEnv();

  if (mode !== "real") {
    throw new ServerConfigError(
      "Real mode was requested while demo mode is enabled.",
      ["Set NAVER_API_MODE=real to use live NAVER API responses."],
    );
  }

  const issues: string[] = [];

  if (!clientId) issues.push("NAVER_CLIENT_ID is missing.");
  if (!clientSecret) issues.push("NAVER_CLIENT_SECRET is missing.");

  if (issues.length > 0) {
    throw new ServerConfigError("NAVER API server credentials are missing.", issues);
  }
}

export function assertProductionReadyNaverConfig(featureName: string) {
  const { mode } = getNaverEnv();

  if (mode !== "real") {
    throw new ServerConfigError(`${featureName} requires NAVER_API_MODE=real.`, [
      `${featureName} does not support demo responses in the production path.`,
      "Set NAVER_API_MODE=real before enabling this feature.",
    ]);
  }

  assertRealModeNaverConfig();
}

function parseMode(value?: string): NaverRuntimeMode {
  return value?.trim().toLowerCase() === "demo" ? "demo" : "real";
}

function parseInteger(
  value: string | undefined,
  fallback: number,
  min: number,
  max: number,
) {
  const parsed = Number.parseInt(value ?? "", 10);

  if (Number.isNaN(parsed)) return fallback;

  return Math.min(max, Math.max(min, parsed));
}

function readEnv(name: "NAVER_CLIENT_ID" | "NAVER_CLIENT_SECRET") {
  return process.env[name]?.trim() ?? "";
}

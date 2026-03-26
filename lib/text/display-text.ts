const DEFAULT_TEXT_FALLBACK = "데이터를 정리하지 못했습니다. 다시 실행해 주세요.";

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

const mojibakeMarkers = ["寃", "媛", "留", "諛", "蹂", "듭", "꾩", "뺤", "쒖", "곗"];

export function looksCorruptedText(value: string) {
  const text = normalizeWhitespace(value);
  if (!text) return false;
  if (text.includes("\uFFFD")) return true;

  const markerHits = mojibakeMarkers.reduce(
    (count, marker) => count + (text.includes(marker) ? 1 : 0),
    0,
  );

  if (markerHits >= 2) return true;

  const hangulCount = (text.match(/[가-힣]/g) ?? []).length;
  const suspiciousCount = (text.match(/[À-ÿЀ-ӿ㐀-䶿一-鿿豈-﫿]/g) ?? []).length;
  return hangulCount === 0 && suspiciousCount >= 4;
}

export function sanitizeDisplayText(value: unknown, fallback = DEFAULT_TEXT_FALLBACK) {
  if (typeof value !== "string") return fallback;
  const normalized = normalizeWhitespace(value);
  if (!normalized || looksCorruptedText(normalized)) return fallback;
  return normalized;
}

export function sanitizeOptionalDisplayText(value: unknown) {
  if (typeof value !== "string") return undefined;
  const normalized = normalizeWhitespace(value);
  if (!normalized || looksCorruptedText(normalized)) return undefined;
  return normalized;
}

export function sanitizeDisplayList(value: unknown, fallback = DEFAULT_TEXT_FALLBACK) {
  if (!Array.isArray(value)) return [fallback];

  const items = value
    .map((item) => sanitizeOptionalDisplayText(item))
    .filter((item): item is string => Boolean(item));

  return items.length > 0 ? items : [fallback];
}

export function getDisplayTextFallback() {
  return DEFAULT_TEXT_FALLBACK;
}

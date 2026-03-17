export function decodeHtmlEntities(input: string) {
  return input
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

export function sanitizeText(input: string) {
  return decodeHtmlEntities(input)
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function stripHtmlTags(input: string) {
  return sanitizeText(input);
}

export function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function createSeed(input: string) {
  return input.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
}

export function formatDateLabel(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function parseDateInput(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function listDateRange(start: Date, end: Date) {
  const points: string[] = [];
  const cursor = new Date(start);

  while (cursor <= end) {
    points.push(formatDateLabel(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return points;
}

export function percentageChange(first: number, last: number) {
  if (first === 0) {
    return last === 0 ? 0 : 100;
  }

  return Number((((last - first) / first) * 100).toFixed(1));
}

export function normalizePublishedDate(input?: string) {
  if (!input) return "";

  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    return input;
  }

  return date.toISOString().slice(0, 10);
}

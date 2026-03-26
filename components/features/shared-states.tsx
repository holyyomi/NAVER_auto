import { EmptyStateBlock } from "@/components/ui/empty-state-block";
import { sanitizeDisplayText } from "@/lib/text/display-text";

export function ErrorState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const safeTitle = sanitizeDisplayText(title, "오류가 발생했습니다");
  const safeDescription = sanitizeDisplayText(description);

  return (
    <div className="panel panel-state rounded-[20px] border-[var(--warning-text)]/20 px-6 py-8">
      <p className="section-label">오류 안내</p>
      <p className="mt-2 text-base font-semibold text-[var(--text-strong)]">{safeTitle}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--text-body)]">{safeDescription}</p>
    </div>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <EmptyStateBlock
      title={sanitizeDisplayText(title, "데이터를 정리하지 못했습니다. 다시 실행해 주세요.")}
      description={sanitizeDisplayText(description)}
    />
  );
}

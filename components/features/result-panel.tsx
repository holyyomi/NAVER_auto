import { sanitizeDisplayText } from "@/lib/text/display-text";

type ResultPanelProps = {
  title: string;
  description?: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
};

export function ResultPanel({
  title,
  description,
  aside,
  children,
}: ResultPanelProps) {
  const safeTitle = sanitizeDisplayText(title, "결과 요약");
  const safeDescription = description
    ? sanitizeDisplayText(description, "데이터를 정리하지 못했습니다. 다시 실행해 주세요.")
    : null;

  return (
    <div className="panel panel-result rounded-[20px]">
      <div className="flex flex-col gap-4 border-b border-[var(--line)] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-[16px] font-semibold text-[var(--text-strong)]">{safeTitle}</p>
          {safeDescription ? (
            <p className="mt-2 text-sm leading-6 text-[var(--text-body)]">{safeDescription}</p>
          ) : null}
        </div>
        {aside ? <div className="shrink-0">{aside}</div> : null}
      </div>
      <div className="px-5 py-5 sm:px-6 sm:py-6">{children}</div>
    </div>
  );
}

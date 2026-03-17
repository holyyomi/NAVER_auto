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
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)]">
      <div className="flex items-center justify-between gap-4 border-b border-[var(--line)] px-5 py-4">
        <div>
          <p className="text-sm font-medium text-[var(--text-strong)]">{title}</p>
          {description ? (
            <p className="mt-1 text-xs text-[var(--text-dim)]">{description}</p>
          ) : null}
        </div>
        {aside ? <div className="shrink-0">{aside}</div> : null}
      </div>
      <div className="px-5 py-5">{children}</div>
    </div>
  );
}

type ChartPreviewPanelProps = {
  title: string;
  note: string;
};

export function ChartPreviewPanel({ title, note }: ChartPreviewPanelProps) {
  const bars = [48, 68, 52, 84, 62, 72, 58, 76];

  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)]">
      <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
        <div>
          <p className="text-sm font-medium text-[var(--text-strong)]">{title}</p>
          <p className="mt-1 text-xs text-[var(--text-dim)]">{note}</p>
        </div>
        <span className="text-xs text-[var(--text-dim)]">차트 영역</span>
      </div>
      <div className="px-5 py-5">
        <div className="flex h-56 items-end gap-3 rounded-lg border border-[var(--line)] bg-[var(--bg-panel)] px-4 py-4">
          {bars.map((height, index) => (
            <div key={`${height}-${index}`} className="flex flex-1 flex-col justify-end gap-2">
              <div
                className="rounded-sm bg-[var(--accent)]/80"
                style={{ height: `${height}%` }}
              />
              <div className="h-2 rounded-sm bg-white/6" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

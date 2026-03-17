import { StatusBadge } from "@/components/ui/status-badge";

type EmptyPanelProps = {
  title: string;
  description: string;
  status?: string;
};

export function EmptyPanel({
  title,
  description,
  status = "데이터 연결 전",
}: EmptyPanelProps) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--line-strong)] bg-[var(--bg-elevated)] px-6 py-8">
      <StatusBadge tone="pending">{status}</StatusBadge>
      <h3 className="mt-4 text-lg font-semibold tracking-[-0.02em] text-[var(--text-strong)]">
        {title}
      </h3>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-body)]">
        {description}
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="loading-shimmer h-16 rounded-lg border border-[var(--line)] bg-white/[0.02]" />
        <div className="loading-shimmer h-16 rounded-lg border border-[var(--line)] bg-white/[0.02]" />
        <div className="loading-shimmer h-16 rounded-lg border border-[var(--line)] bg-white/[0.02]" />
      </div>
    </div>
  );
}

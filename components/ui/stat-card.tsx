type StatCardProps = {
  label: string;
  value: string;
  note: string;
};

export function StatCard({ label, value, note }: StatCardProps) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-5 py-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--text-dim)]">
        {label}
      </p>
      <p className="metric-value mt-3 text-[28px] font-semibold text-[var(--text-strong)]">
        {value}
      </p>
      <p className="mt-2 text-sm leading-6 text-[var(--text-body)]">{note}</p>
    </div>
  );
}

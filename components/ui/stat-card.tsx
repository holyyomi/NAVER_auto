type StatCardProps = {
  label: string;
  value: string;
  note: string;
};

export function StatCard({ label, value, note }: StatCardProps) {
  return (
    <div className="kpi-card px-5 py-5">
      <p className="section-label">{label}</p>
      <p className="kpi-value mt-4">{value}</p>
      <p className="mt-3 text-sm leading-6 text-[var(--text-body)]">{note}</p>
    </div>
  );
}

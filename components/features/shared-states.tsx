export function ErrorState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-6 py-8">
      <p className="text-base font-semibold text-[var(--text-strong)]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--text-body)]">{description}</p>
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
    <div className="rounded-xl border border-dashed border-[var(--line-strong)] bg-[var(--bg-elevated)] px-6 py-8">
      <p className="text-base font-semibold text-[var(--text-strong)]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--text-body)]">{description}</p>
    </div>
  );
}

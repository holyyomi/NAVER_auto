import { EmptyStateBlock } from "@/components/ui/empty-state-block";

export function ErrorState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="panel panel-state rounded-[20px] border-[var(--warning-text)]/20 px-6 py-8">
      <p className="section-label">Error</p>
      <p className="mt-2 text-base font-semibold text-[var(--text-strong)]">{title}</p>
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
  return <EmptyStateBlock title={title} description={description} />;
}

type EmptyStateBlockProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
};

export function EmptyStateBlock({
  title,
  description,
  action,
}: EmptyStateBlockProps) {
  return (
    <div className="panel panel-state rounded-[20px] border-dashed px-6 py-8">
      <p className="section-label">Empty</p>
      <p className="mt-2 text-base font-semibold text-[var(--text-strong)]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--text-body)]">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

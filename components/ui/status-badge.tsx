type StatusBadgeProps = {
  children: React.ReactNode;
  tone?: "active" | "pending" | "neutral" | "attention";
};

export function StatusBadge({
  children,
  tone = "neutral",
}: StatusBadgeProps) {
  const toneClass = {
    active: "border border-transparent bg-[var(--success-bg)] text-[var(--success-text)]",
    pending: "border border-[var(--line)] bg-[var(--pending-bg)] text-[var(--pending-text)]",
    neutral: "border border-[var(--line)] bg-[var(--pending-bg)] text-[var(--text-body)]",
    attention: "border border-transparent bg-[var(--warning-bg)] text-[var(--warning-text)]",
  }[tone];

  return (
    <span
      className={`inline-flex h-7 items-center rounded-md px-2.5 text-xs font-medium tracking-[0.01em] ${toneClass}`}
    >
      {children}
    </span>
  );
}

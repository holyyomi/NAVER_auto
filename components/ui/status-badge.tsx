type StatusBadgeProps = {
  children: React.ReactNode;
  tone?: "active" | "pending" | "neutral" | "attention";
};

export function StatusBadge({
  children,
  tone = "neutral",
}: StatusBadgeProps) {
  const toneClass = {
    active:
      "border border-[rgba(3,199,90,0.18)] bg-[var(--success-bg)] text-[var(--success-text)]",
    pending: "border border-[var(--line)] bg-[var(--pending-bg)] text-[var(--pending-text)]",
    neutral: "border border-[var(--line)] bg-[var(--pending-bg)] text-[var(--text-body)]",
    attention:
      "border border-[rgba(208,181,139,0.14)] bg-[var(--warning-bg)] text-[var(--warning-text)]",
  }[tone];

  return (
    <span
      className={`inline-flex h-7 items-center rounded-full px-3 text-xs font-semibold tracking-[0.01em] ${toneClass}`}
    >
      {children}
    </span>
  );
}

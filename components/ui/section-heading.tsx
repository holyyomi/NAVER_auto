type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description?: string;
  aside?: React.ReactNode;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  aside,
}: SectionHeadingProps) {
  return (
    <div className="section-heading-block flex flex-col gap-3 border-b border-[var(--line)] pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="section-label">{eyebrow}</p>
        <h2 className="mt-2 text-[21px] font-semibold tracking-[-0.03em] text-[var(--text-strong)]">
          {title}
        </h2>
        {description ? (
          <p className="mt-2.5 max-w-3xl text-sm leading-6 text-[var(--text-body)]">
            {description}
          </p>
        ) : null}
      </div>
      {aside ? <div className="shrink-0">{aside}</div> : null}
    </div>
  );
}

type ResultSummaryGridProps = {
  children: React.ReactNode;
};

export function ResultSummaryGrid({ children }: ResultSummaryGridProps) {
  return <div className="grid gap-3 md:grid-cols-3">{children}</div>;
}

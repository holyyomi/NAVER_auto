type ChartPoint = {
  label: string;
  value: number;
};

type LineChartProps = {
  title: string;
  note: string;
  points: ChartPoint[];
};

export function LineChart({ title, note, points }: LineChartProps) {
  const width = 720;
  const height = 260;
  const padding = 24;
  const maxValue = Math.max(...points.map((point) => point.value), 1);
  const minValue = Math.min(...points.map((point) => point.value), 0);
  const range = Math.max(1, maxValue - minValue);

  const polyline = points
    .map((point, index) => {
      const x =
        padding +
        (index * (width - padding * 2)) / Math.max(1, points.length - 1);
      const y =
        height -
        padding -
        ((point.value - minValue) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)]">
      <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
        <div>
          <p className="text-sm font-medium text-[var(--text-strong)]">{title}</p>
          <p className="mt-1 text-xs text-[var(--text-dim)]">{note}</p>
        </div>
        <span className="text-xs text-[var(--text-dim)]">추이 차트</span>
      </div>
      <div className="px-5 py-5">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-64 w-full rounded-lg border border-[var(--line)] bg-[var(--bg-panel)]"
          role="img"
          aria-label={title}
        >
          {[0, 1, 2, 3].map((line) => {
            const y = padding + ((height - padding * 2) / 3) * line;
            return (
              <line
                key={line}
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="rgba(255,255,255,0.08)"
                strokeDasharray="4 6"
              />
            );
          })}
          <polyline
            fill="none"
            stroke="rgba(142, 167, 196, 0.95)"
            strokeWidth="3"
            points={polyline}
          />
          {points.map((point, index) => {
            const x =
              padding +
              (index * (width - padding * 2)) / Math.max(1, points.length - 1);
            const y =
              height -
              padding -
              ((point.value - minValue) / range) * (height - padding * 2);

            return (
              <g key={`${point.label}-${index}`}>
                <circle cx={x} cy={y} r="4" fill="#d7e3ef" />
              </g>
            );
          })}
        </svg>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[var(--text-dim)] md:grid-cols-4">
          {points.slice(-4).map((point) => (
            <div key={point.label} className="rounded-lg bg-white/[0.02] px-3 py-2">
              <span>{point.label}</span>
              <strong className="ml-2 text-[var(--text-body)]">{point.value}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

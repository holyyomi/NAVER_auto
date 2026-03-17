type ResultTableProps = {
  title: string;
  description: string;
  columns: string[];
  rows: string[][];
};

export function ResultTable({
  title,
  description,
  columns,
  rows,
}: ResultTableProps) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)]">
      <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
        <div>
          <p className="text-sm font-medium text-[var(--text-strong)]">{title}</p>
          <p className="mt-1 text-xs text-[var(--text-dim)]">{description}</p>
        </div>
        <span className="text-xs text-[var(--text-dim)]">결과 표</span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead>
            <tr className="border-b border-[var(--line)]">
              {columns.map((column) => (
                <th
                  key={column}
                  className="px-5 py-3 text-[12px] font-medium tracking-[0.02em] text-[var(--text-dim)]"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={`${row[0]}-${index}`}
                className="border-b border-[var(--line)] last:border-b-0 hover:bg-white/[0.015]"
              >
                {row.map((cell, cellIndex) => (
                  <td
                    key={`${cell}-${cellIndex}`}
                    className="px-5 py-4 text-sm text-[var(--text-body)]"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

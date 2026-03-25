import { StatusBadge } from "@/components/ui/status-badge";

type FeatureUsageGuideProps = {
  useWhen: string;
  output: string;
  nextAction: string;
  testPoint?: string;
};

export function FeatureUsageGuide({
  useWhen,
  output,
  nextAction,
  testPoint,
}: FeatureUsageGuideProps) {
  return (
    <section className="panel panel-guide rounded-3xl px-5 py-5">
      <div className="flex flex-col gap-3 border-b border-[var(--line)] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="section-label">안내</p>
          <p className="mt-2 text-sm font-medium text-[var(--text-strong)]">사용 가이드</p>
          <p className="mt-1 text-xs text-[var(--text-dim)]">
            언제 쓰는지, 무엇이 나오는지, 다음에 무엇을 하면 되는지 짧게 정리했습니다.
          </p>
        </div>
        <StatusBadge tone="neutral">빠른 이해</StatusBadge>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-3">
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-4">
          <p className="section-label">사용 시점</p>
          <p className="mt-2 text-sm leading-6 text-[var(--text-body)]">{useWhen}</p>
        </div>
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-4">
          <p className="section-label">결과물</p>
          <p className="mt-2 text-sm leading-6 text-[var(--text-body)]">{output}</p>
        </div>
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-4">
          <p className="section-label">다음 액션</p>
          <p className="mt-2 text-sm leading-6 text-[var(--text-body)]">{nextAction}</p>
        </div>
      </div>

      {testPoint ? (
        <div className="mt-4 rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-4">
          <p className="section-label">확인 포인트</p>
          <p className="mt-2 text-sm leading-6 text-[var(--text-body)]">{testPoint}</p>
        </div>
      ) : null}
    </section>
  );
}

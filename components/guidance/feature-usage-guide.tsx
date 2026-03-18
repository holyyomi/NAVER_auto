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
    <section className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-5 py-5">
      <div className="flex flex-col gap-3 border-b border-[var(--line)] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[var(--text-strong)]">실무 가이드</p>
          <p className="mt-1 text-xs text-[var(--text-dim)]">
            이 기능을 언제 쓰고, 무엇을 얻고, 다음에 무엇을 하면 되는지 바로 확인합니다.
          </p>
        </div>
        <StatusBadge tone="neutral">빠른 안내</StatusBadge>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-3">
        <div className="rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-4 py-4">
          <p className="text-[11px] tracking-[0.14em] text-[var(--text-dim)]">이럴 때 쓰세요</p>
          <p className="mt-2 text-sm leading-6 text-[var(--text-body)]">{useWhen}</p>
        </div>
        <div className="rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-4 py-4">
          <p className="text-[11px] tracking-[0.14em] text-[var(--text-dim)]">결과물</p>
          <p className="mt-2 text-sm leading-6 text-[var(--text-body)]">{output}</p>
        </div>
        <div className="rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-4 py-4">
          <p className="text-[11px] tracking-[0.14em] text-[var(--text-dim)]">바로 다음 행동</p>
          <p className="mt-2 text-sm leading-6 text-[var(--text-body)]">{nextAction}</p>
        </div>
      </div>

      {testPoint ? (
        <div className="mt-4 rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-4 py-4">
          <p className="text-[11px] tracking-[0.14em] text-[var(--text-dim)]">테스트 포인트</p>
          <p className="mt-2 text-sm leading-6 text-[var(--text-body)]">{testPoint}</p>
        </div>
      ) : null}
    </section>
  );
}

import { sanitizeDisplayText } from "@/lib/text/display-text";

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
      <div className="border-b border-[var(--line)] pb-4">
        <p className="text-sm font-semibold text-[var(--text-strong)]">사용 가이드</p>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-3">
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-4">
          <p className="section-label">언제 쓰나요</p>
          <p className="mt-2 text-sm leading-6 text-[var(--text-body)]">
            {sanitizeDisplayText(useWhen)}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-4">
          <p className="section-label">무엇이 나오나요</p>
          <p className="mt-2 text-sm leading-6 text-[var(--text-body)]">
            {sanitizeDisplayText(output)}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-4">
          <p className="section-label">다음 작업</p>
          <p className="mt-2 text-sm leading-6 text-[var(--text-body)]">
            {sanitizeDisplayText(nextAction)}
          </p>
        </div>
      </div>

      {testPoint ? (
        <div className="mt-4 rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-4">
          <p className="section-label">확인 포인트</p>
          <p className="mt-2 text-sm leading-6 text-[var(--text-body)]">
            {sanitizeDisplayText(testPoint)}
          </p>
        </div>
      ) : null}
    </section>
  );
}

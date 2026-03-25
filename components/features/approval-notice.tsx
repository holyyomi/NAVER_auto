import { StatusBadge } from "@/components/ui/status-badge";

export function isApprovalPendingMessage(message: string) {
  return ["승인", "권한", "approval", "forbidden"].some((pattern) =>
    message.toLowerCase().includes(pattern.toLowerCase()),
  );
}

export function isQuotaExceededMessage(message: string) {
  return ["호출 한도", "quota", "429"].some((pattern) =>
    message.toLowerCase().includes(pattern.toLowerCase()),
  );
}

export function ApprovalNotice() {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[var(--text-strong)]">현재 사용할 수 없는 기능입니다</p>
          <p className="mt-1 text-sm text-[var(--text-body)]">
            운영 범위에 포함되지 않아 화면만 유지하고 있습니다.
          </p>
        </div>
        <StatusBadge tone="attention">숨김 기능</StatusBadge>
      </div>
    </div>
  );
}

export function PendingResultState() {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-6 py-8">
      <div className="flex items-center gap-2">
        <p className="text-base font-semibold text-[var(--text-strong)]">
          현재 MVP 범위에서 제외된 기능입니다.
        </p>
        <StatusBadge tone="attention">비활성</StatusBadge>
      </div>
      <p className="mt-2 text-sm leading-6 text-[var(--text-body)]">
        홈으로 돌아가 사용 가능한 기능을 이용해 주세요.
      </p>
    </div>
  );
}

export function QuotaExceededState() {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-6 py-8">
      <div className="flex items-center gap-2">
        <p className="text-base font-semibold text-[var(--text-strong)]">
          오늘 사용할 수 있는 호출 한도를 초과했습니다.
        </p>
        <StatusBadge tone="attention">한도 초과</StatusBadge>
      </div>
      <p className="mt-2 text-sm leading-6 text-[var(--text-body)]">
        잠시 후 다시 시도해 주세요.
      </p>
    </div>
  );
}

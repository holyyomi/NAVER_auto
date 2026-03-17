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
          <p className="text-sm font-medium text-[var(--text-strong)]">
            현재 네이버 승인 대기 상태입니다.
          </p>
          <p className="mt-1 text-sm text-[var(--text-body)]">
            승인 완료 전까지는 실데이터 조회가 제한될 수 있습니다.
          </p>
          <p className="mt-1 text-xs text-[var(--text-dim)]">
            입력 조건과 화면 흐름은 먼저 검토할 수 있도록 유지합니다.
          </p>
        </div>
        <StatusBadge tone="attention">승인 대기</StatusBadge>
      </div>
    </div>
  );
}

export function PendingResultState() {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-6 py-8">
      <div className="flex items-center gap-2">
        <p className="text-base font-semibold text-[var(--text-strong)]">
          현재 네이버 승인 대기 상태입니다.
        </p>
        <StatusBadge tone="attention">승인 대기</StatusBadge>
      </div>
      <p className="mt-2 text-sm leading-6 text-[var(--text-body)]">
        승인 완료 전까지는 실데이터 조회가 제한될 수 있습니다. 현재는 입력 조건과
        결과 레이아웃을 확인하는 용도로 사용할 수 있습니다.
      </p>
    </div>
  );
}

export function QuotaExceededState() {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-6 py-8">
      <div className="flex items-center gap-2">
        <p className="text-base font-semibold text-[var(--text-strong)]">
          오늘 사용 가능한 호출 한도를 초과했습니다.
        </p>
        <StatusBadge tone="attention">한도 초과</StatusBadge>
      </div>
      <p className="mt-2 text-sm leading-6 text-[var(--text-body)]">
        내일 다시 시도해 주세요.
      </p>
    </div>
  );
}

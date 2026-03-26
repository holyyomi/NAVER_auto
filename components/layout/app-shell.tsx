"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { StatusBadge } from "@/components/ui/status-badge";
import { getFeatureByHref, getFeatureStatusMeta, visibleFeatures } from "@/lib/features";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const appName = process.env.NEXT_PUBLIC_APP_NAME || "Marketing Dashboard";
  const isHome = pathname === "/";
  const currentFeature = getFeatureByHref(pathname);

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="mx-auto flex min-h-screen max-w-[1520px] items-stretch gap-5 px-4 py-4 lg:px-5 lg:py-5">
        <aside className="hidden h-screen w-[260px] shrink-0 self-stretch lg:block">
          <div
            className="sticky top-5 flex h-[calc(100vh-2.5rem)] flex-col overflow-hidden rounded-[24px] px-4 py-5 text-white shadow-[0_18px_40px_rgba(3,199,90,0.22)]"
            style={{ background: "var(--sidebar-bg)" }}
          >
            <div className="border-b border-white/20 px-2 pb-4">
              <p className="text-[24px] font-bold tracking-[-0.03em] text-white">{appName}</p>
              <p className="mt-2 text-sm leading-6 text-white/78">
                검색, 리포트, 운영, 조사 작업을 한 흐름으로 연결해 관리하는 마케팅 워크스페이스입니다.
              </p>
            </div>

            <nav className="space-y-6 overflow-y-auto pt-5">
              <div className="space-y-2">
                <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/65">
                  Overview
                </p>
                <Link href="/" className={navItemClass(pathname === "/")}>
                  대시보드 홈
                </Link>
              </div>

              <div className="space-y-2">
                <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/65">
                  Workflow Library
                </p>
                <div className="space-y-1.5">
                  {visibleFeatures.map((feature) => (
                    <Link
                      key={feature.slug}
                      href={feature.href}
                      className={navItemClass(pathname === feature.href)}
                    >
                      {feature.title}
                    </Link>
                  ))}
                </div>
              </div>
            </nav>

            <div className="mt-auto rounded-2xl border border-white/18 bg-white/10 px-4 py-4 backdrop-blur-sm">
              <p className="text-sm font-semibold text-white">오늘의 포인트</p>
              <p className="mt-2 text-sm leading-6 text-white/78">
                결과를 저장하고 다음 작업으로 이어서 정리하면 반복 업무를 더 빠르게 처리할 수 있습니다.
              </p>
            </div>
          </div>
        </aside>

        <div className="page-surface flex min-h-screen min-w-0 flex-1 flex-col self-stretch rounded-[28px] border px-4 py-4 sm:px-5 sm:py-5">
          {!isHome ? (
            <header className="surface-card app-header overflow-hidden px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[18px] font-bold text-[var(--accent)]">
                      M
                    </div>
                    <div>
                      <h1 className="text-[26px] font-bold tracking-[-0.04em] text-[var(--text-strong)]">
                        {currentFeature?.title ?? "워크스페이스"}
                      </h1>
                    </div>
                    {currentFeature ? (
                      <StatusBadge tone={getFeatureStatusMeta(currentFeature.status).tone}>
                        {getFeatureStatusMeta(currentFeature.status).label}
                      </StatusBadge>
                    ) : null}
                  </div>
                  <p className="mt-4 max-w-3xl text-[15px] leading-7 text-[var(--text-body)]">
                    {currentFeature?.description ?? "선택한 작업을 실행하고 결과를 정리하는 화면입니다."}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex gap-2 overflow-x-auto pb-1 lg:hidden">
                <Link href="/" className={mobileTabClass(pathname === "/")}>
                  대시보드 홈
                </Link>
                {visibleFeatures.map((feature) => (
                  <Link
                    key={feature.slug}
                    href={feature.href}
                    className={mobileTabClass(pathname === feature.href)}
                  >
                    {feature.title}
                  </Link>
                ))}
              </div>
            </header>
          ) : (
            <div className="pb-1 lg:hidden">
              <div className="surface-card px-4 py-4 sm:px-5">
                <div className="flex gap-2 overflow-x-auto pb-1">
                  <Link href="/" className={mobileTabClass(pathname === "/")}>
                    대시보드 홈
                  </Link>
                  {visibleFeatures.map((feature) => (
                    <Link
                      key={feature.slug}
                      href={feature.href}
                      className={mobileTabClass(pathname === feature.href)}
                    >
                      {feature.title}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          <main className={`min-h-0 flex-1 ${isHome ? "pt-5" : "pt-6"}`}>{children}</main>
        </div>
      </div>
    </div>
  );
}

function navItemClass(isActive: boolean) {
  return [
    "flex min-h-12 items-center rounded-2xl px-4 py-3 text-[15px] font-semibold transition-all duration-150",
    isActive
      ? "border-l-4 border-white bg-white/15 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
      : "border-l-4 border-transparent text-white/88 hover:bg-white/10 hover:text-white",
  ].join(" ");
}

function mobileTabClass(isActive: boolean) {
  return [
    "whitespace-nowrap rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
    isActive
      ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
      : "border-[var(--line)] bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:border-[var(--accent)]/30 hover:bg-[var(--bg-soft)]",
  ].join(" ");
}

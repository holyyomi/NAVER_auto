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
  const appName = process.env.NEXT_PUBLIC_APP_NAME || "NAVER Auto";
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
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">
                NAVER
              </p>
              <p className="mt-2 text-[22px] font-bold tracking-[-0.03em] text-white">
                {appName}
              </p>
              <p className="mt-2 text-sm leading-6 text-white/78">
                검색과 마케팅 운영 흐름을 한 화면에서 관리합니다.
              </p>
            </div>

            <nav className="space-y-6 overflow-y-auto pt-5">
              <div className="space-y-2">
                <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/65">
                  Dashboard
                </p>
                <Link href="/" className={navItemClass(pathname === "/")}>
                  홈
                </Link>
              </div>

              <div className="space-y-2">
                <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/65">
                  Workflows
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
              <p className="text-sm font-semibold text-white">오늘 포커스</p>
              <p className="mt-2 text-sm leading-6 text-white/78">
                조회 결과를 저장하고 다음 액션으로 이어지는 흐름을 빠르게 정리하세요.
              </p>
            </div>
          </div>
        </aside>

        <div className="page-surface flex min-h-screen min-w-0 flex-1 flex-col self-stretch rounded-[28px] border px-4 py-4 sm:px-5 sm:py-5">
          {!isHome ? (
            <header className="surface-card overflow-hidden px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[18px] font-bold text-[var(--accent)]">
                      N
                    </div>
                    <div>
                      <p className="section-label">Feature Workspace</p>
                      <h1 className="mt-2 text-[24px] font-bold tracking-[-0.035em] text-[var(--text-strong)]">
                        {currentFeature?.title ?? "작업"}
                      </h1>
                    </div>
                    {currentFeature ? (
                      <StatusBadge tone={getFeatureStatusMeta(currentFeature.status).tone}>
                        {getFeatureStatusMeta(currentFeature.status).label}
                      </StatusBadge>
                    ) : null}
                  </div>
                  <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--text-body)]">
                    {currentFeature?.description ?? "선택한 작업 화면입니다."}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex gap-2 overflow-x-auto pb-1 lg:hidden">
                <Link href="/" className={mobileTabClass(pathname === "/")}>
                  홈
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
                    홈
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

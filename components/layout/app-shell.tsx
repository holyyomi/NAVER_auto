"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { StatusBadge } from "@/components/ui/status-badge";
import { allFeatures, activeFeatures, upcomingFeatures } from "@/lib/features";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const appName = process.env.NEXT_PUBLIC_APP_NAME || "네이버 마케팅 운영 센터";
  const isHome = pathname === "/";
  const currentFeature = allFeatures.find((feature) => feature.href === pathname);

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-[1680px] gap-7 px-4 py-5 lg:px-6">
        <aside className="panel hidden h-[calc(100vh-2rem)] w-[300px] shrink-0 flex-col rounded-2xl lg:flex">
          <div className="border-b border-[var(--line)] px-5 py-5">
            <p className="section-label">도구</p>
            <h1 className="mt-3 text-[22px] font-semibold tracking-[-0.03em] text-[var(--text-strong)]">
              {appName}
            </h1>
            <p className="mt-2 text-sm leading-6 text-[var(--text-body)]">
              필요한 작업을 바로 엽니다.
            </p>
          </div>

          <div className="border-b border-[var(--line)] px-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-3">
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--text-dim)]">
                  활성
                </p>
                <p className="metric-value mt-2 text-xl font-semibold text-[var(--text-strong)]">
                  {activeFeatures.length}
                </p>
              </div>
              <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-3">
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--text-dim)]">
                  예정
                </p>
                <p className="metric-value mt-2 text-xl font-semibold text-[var(--text-strong)]">
                  {upcomingFeatures.length}
                </p>
              </div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <div>
              <p className="section-label px-2">홈</p>
              <Link href="/" className={navItemClass(pathname === "/")}>
                <div>
                  <p className="text-sm font-medium text-[var(--text-strong)]">작업 선택</p>
                  <p className="mt-1 text-xs text-[var(--text-dim)]">바로 시작</p>
                </div>
                <span className="text-xs font-medium text-[var(--text-dim)]">00</span>
              </Link>
            </div>

            <div className="mt-7">
              <p className="section-label px-2">활성</p>
              <div className="mt-2 space-y-1.5">
                {activeFeatures.map((feature) => (
                  <Link
                    key={feature.slug}
                    href={feature.href}
                    className={navItemClass(pathname === feature.href)}
                  >
                    <div>
                      <p className="text-sm font-medium text-[var(--text-strong)]">
                        {feature.title}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-[var(--text-dim)]">
                        {feature.shortDescription}
                      </p>
                    </div>
                    <StatusBadge tone="active">사용</StatusBadge>
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-7">
              <p className="section-label px-2">예정</p>
              <div className="mt-2 space-y-1.5">
                {upcomingFeatures.map((feature) => (
                  <Link
                    key={feature.slug}
                    href={feature.href}
                    className={navItemClass(pathname === feature.href, true)}
                  >
                    <div>
                      <p className="text-sm font-medium text-[var(--text-strong)]">
                        {feature.title}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-[var(--text-dim)]">
                        {feature.shortDescription}
                      </p>
                    </div>
                    <StatusBadge tone="pending">준비 중</StatusBadge>
                  </Link>
                ))}
              </div>
            </div>
          </nav>
        </aside>

        <div className="min-w-0 flex-1">
          {!isHome ? (
            <header className="panel rounded-2xl px-4 py-4 sm:px-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <p className="section-label">기능</p>
                  <p className="mt-2 text-[24px] font-semibold tracking-[-0.035em] text-[var(--text-strong)]">
                    {currentFeature?.title ?? "기능"}
                  </p>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--text-body)]">
                    이 화면에서 바로 작업합니다.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-3.5 py-2.5 text-sm text-[var(--text-body)]">
                    활성 {activeFeatures.length}개
                  </div>
                  <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-3.5 py-2.5 text-sm text-[var(--text-body)]">
                    예정 {upcomingFeatures.length}개
                  </div>
                </div>
              </div>

              <div className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
                <Link href="/" className={mobileTabClass(pathname === "/")}>
                  홈
                </Link>
                {allFeatures.map((feature) => (
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
              <div className="panel rounded-2xl px-4 py-4 sm:px-5">
                <div className="flex gap-2 overflow-x-auto pb-1">
                  <Link href="/" className={mobileTabClass(pathname === "/")}>
                    홈
                  </Link>
                  {allFeatures.map((feature) => (
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

          <main className={isHome ? "pt-4" : "pt-7"}>{children}</main>
        </div>
      </div>
    </div>
  );
}

function navItemClass(isActive: boolean, subdued = false) {
  return [
    "mt-2 flex items-start justify-between gap-4 rounded-xl border px-4 py-3 transition-colors",
    isActive
      ? "border-[var(--line-strong)] bg-[var(--bg-soft)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
      : "border-transparent hover:border-[var(--line)] hover:bg-[var(--bg-elevated)]",
    subdued ? "opacity-95" : "",
  ].join(" ");
}

function mobileTabClass(isActive: boolean) {
  return [
    "whitespace-nowrap rounded-lg border px-3 py-2 text-sm transition-colors",
    isActive
      ? "border-[var(--line-strong)] bg-[var(--bg-soft)] text-[var(--text-strong)]"
      : "border-[var(--line)] bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:bg-[var(--bg-soft)]",
  ].join(" ");
}

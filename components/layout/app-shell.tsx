"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  allFeatures,
  type FeatureDefinition,
  getFeatureByHref,
  getFeatureStatusMeta,
  pendingFeatures,
  plannedFeatures,
  usableFeatures,
} from "@/lib/features";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const appName = process.env.NEXT_PUBLIC_APP_NAME || "네이버 마케팅 운영 센터";
  const isHome = pathname === "/";
  const currentFeature = getFeatureByHref(pathname);

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
              현재 운영 가능한 기능과 승인 대기 기능을 한 화면에서 정리합니다.
            </p>
          </div>

          <div className="border-b border-[var(--line)] px-4 py-4">
            <div className="grid grid-cols-3 gap-3">
              <StatusCountCard label="사용 가능" value={usableFeatures.length} />
              <StatusCountCard label="승인 대기" value={pendingFeatures.length} />
              <StatusCountCard label="준비 중" value={plannedFeatures.length} />
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <div>
              <p className="section-label px-2">홈</p>
              <Link href="/" className={navItemClass(pathname === "/")}>
                <div>
                  <p className="text-sm font-medium text-[var(--text-strong)]">작업 대시보드</p>
                  <p className="mt-1 text-xs text-[var(--text-dim)]">
                    상태별 기능 구성을 바로 확인합니다.
                  </p>
                </div>
                <span className="text-xs font-medium text-[var(--text-dim)]">00</span>
              </Link>
            </div>

            <FeatureNavSection
              title="사용 가능"
              features={usableFeatures}
              currentPath={pathname}
            />
            <FeatureNavSection
              title="승인 대기"
              features={pendingFeatures}
              currentPath={pathname}
              subdued
            />
            <FeatureNavSection
              title="준비 중"
              features={plannedFeatures}
              currentPath={pathname}
              subdued
            />
          </nav>
        </aside>

        <div className="min-w-0 flex-1">
          {!isHome ? (
            <header className="panel rounded-2xl px-4 py-4 sm:px-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <p className="section-label">기능</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <p className="text-[24px] font-semibold tracking-[-0.035em] text-[var(--text-strong)]">
                      {currentFeature?.title ?? "기능"}
                    </p>
                    {currentFeature ? (
                      <StatusBadge tone={getFeatureStatusMeta(currentFeature.status).tone}>
                        {getFeatureStatusMeta(currentFeature.status).label}
                      </StatusBadge>
                    ) : null}
                  </div>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--text-body)]">
                    {currentFeature?.description ?? "현재 선택한 작업 화면입니다."}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-3.5 py-2.5 text-sm text-[var(--text-body)]">
                    사용 가능 {usableFeatures.length}개
                  </div>
                  <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-3.5 py-2.5 text-sm text-[var(--text-body)]">
                    승인 대기 {pendingFeatures.length}개
                  </div>
                  <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-3.5 py-2.5 text-sm text-[var(--text-body)]">
                    준비 중 {plannedFeatures.length}개
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

type StatusCountCardProps = {
  label: string;
  value: number;
};

function StatusCountCard({ label, value }: StatusCountCardProps) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-3 py-3">
      <p className="text-[11px] font-medium tracking-[0.14em] text-[var(--text-dim)]">{label}</p>
      <p className="metric-value mt-2 text-lg font-semibold text-[var(--text-strong)]">{value}</p>
    </div>
  );
}

type FeatureNavSectionProps = {
  title: string;
  features: FeatureDefinition[];
  currentPath: string;
  subdued?: boolean;
};

function FeatureNavSection({
  title,
  features,
  currentPath,
  subdued = false,
}: FeatureNavSectionProps) {
  if (features.length === 0) {
    return null;
  }

  return (
    <div className="mt-7">
      <p className="section-label px-2">{title}</p>
      <div className="mt-2 space-y-1.5">
        {features.map((feature) => (
          <Link
            key={feature.slug}
            href={feature.href}
            className={navItemClass(currentPath === feature.href, subdued)}
          >
            <div>
              <p className="text-sm font-medium text-[var(--text-strong)]">{feature.title}</p>
              <p className="mt-1 text-xs leading-5 text-[var(--text-dim)]">
                {feature.shortDescription}
              </p>
            </div>
            <StatusBadge tone={getFeatureStatusMeta(feature.status).tone}>
              {getFeatureStatusMeta(feature.status).shortLabel}
            </StatusBadge>
          </Link>
        ))}
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

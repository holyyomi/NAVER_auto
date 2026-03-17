"use client";

type ActiveFeatureLayoutProps = {
  controls: React.ReactNode;
  children: React.ReactNode;
};

export function ActiveFeatureLayout({
  controls,
  children,
}: ActiveFeatureLayoutProps) {
  return (
    <section className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
      <div className="panel rounded-2xl px-6 py-6">{controls}</div>
      <div className="space-y-6">{children}</div>
    </section>
  );
}

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
    <section className="grid items-start gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
      <div className="panel panel-input rounded-[20px] px-5 py-5 sm:px-6 sm:py-6">{controls}</div>
      <div className="space-y-6">{children}</div>
    </section>
  );
}

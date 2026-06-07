import type { Metadata } from "next";
import Link from "next/link";
import { additives } from "@/data/additives";
import { getReviewQueue } from "@/lib/risk";
import { StatusBadge } from "@/components/status-badge";
import { sensitivityCopy } from "@/lib/status";

export const metadata: Metadata = {
  title: "Review Queue",
  description: "High-risk and source-dependent additive records that need the most careful halal review.",
  robots: {
    index: false,
    follow: false
  }
};

export default function ReviewQueuePage() {
  const queue = getReviewQueue(additives);
  const highPriority = queue.filter((item) => item.riskScore >= 10).length;

  return (
    <div className="container py-10 sm:py-14">
      <div className="max-w-3xl space-y-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Data quality</p>
        <h1 className="text-4xl font-bold leading-tight">High-risk review queue</h1>
        <p className="text-base leading-7 text-muted-foreground">
          These records are source-dependent, process-dependent, or more likely to need manufacturer or halal
          certifier verification. The score is a prioritization aid, not a halal ruling.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-5">
          <p className="text-3xl font-bold">{queue.length}</p>
          <p className="mt-1 text-sm text-muted-foreground">records in queue</p>
        </div>
        <div className="rounded-lg border bg-card p-5">
          <p className="text-3xl font-bold">{highPriority}</p>
          <p className="mt-1 text-sm text-muted-foreground">high priority</p>
        </div>
        <div className="rounded-lg border bg-card p-5">
          <p className="text-3xl font-bold">{additives.length}</p>
          <p className="mt-1 text-sm text-muted-foreground">total records</p>
        </div>
      </div>

      <div className="mt-8 overflow-hidden rounded-lg border">
        <div className="grid grid-cols-[86px_1fr] gap-3 border-b bg-muted px-4 py-3 text-sm font-semibold sm:grid-cols-[86px_1fr_140px_120px]">
          <span>Score</span>
          <span>Additive</span>
          <span className="hidden sm:block">Sensitivity</span>
          <span className="hidden sm:block">Status</span>
        </div>
        <div className="divide-y bg-card">
          {queue.map(({ additive, riskScore }) => (
            <Link
              key={additive.id}
              href={`/e/${additive.numericCode}`}
              className="grid grid-cols-[86px_1fr] gap-3 px-4 py-4 hover:bg-accent sm:grid-cols-[86px_1fr_140px_120px] sm:items-center"
            >
              <span className="font-semibold">{riskScore}</span>
              <span>
                <span className="block font-semibold">
                  {additive.eNumber} · {additive.name}
                </span>
                <span className="mt-1 block text-sm text-muted-foreground">{additive.category}</span>
              </span>
              <span className="hidden text-sm text-muted-foreground sm:block">{sensitivityCopy[additive.sourceSensitivity]}</span>
              <span className="hidden sm:block">
                <StatusBadge status={additive.status} />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

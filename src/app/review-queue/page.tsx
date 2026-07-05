import type { Metadata } from "next";
import { additives } from "@/data/additives";
import { ReviewQueueBrowser } from "@/components/review-queue-browser";
import { getReviewQueue } from "@/lib/risk";

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
  const manufacturerNeeded = queue.filter((item) => item.reasons.some((reason) => reason.key === "manufacturer-needed")).length;
  const missingSources = queue.filter((item) =>
    item.reasons.some((reason) => reason.key === "missing-external-source" || reason.key === "missing-guidance-source")
  ).length;

  return (
    <div className="container py-10 sm:py-14">
      <div className="max-w-3xl space-y-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Data quality</p>
        <h1 className="text-4xl font-bold leading-tight">High-risk review queue</h1>
        <p className="text-base leading-7 text-muted-foreground">
          These records are source-dependent, process-dependent, weakly sourced, or likely to need manufacturer or halal
          certifier verification. The score is a prioritization aid, not a halal ruling.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-5">
          <p className="text-3xl font-bold">{queue.length}</p>
          <p className="mt-1 text-sm text-muted-foreground">records in queue</p>
        </div>
        <div className="rounded-lg border bg-card p-5">
          <p className="text-3xl font-bold">{highPriority}</p>
          <p className="mt-1 text-sm text-muted-foreground">high priority</p>
        </div>
        <div className="rounded-lg border bg-card p-5">
          <p className="text-3xl font-bold">{manufacturerNeeded}</p>
          <p className="mt-1 text-sm text-muted-foreground">manufacturer needed</p>
        </div>
        <div className="rounded-lg border bg-card p-5">
          <p className="text-3xl font-bold">{missingSources}</p>
          <p className="mt-1 text-sm text-muted-foreground">missing source work</p>
        </div>
      </div>

      <ReviewQueueBrowser queue={queue} />
    </div>
  );
}

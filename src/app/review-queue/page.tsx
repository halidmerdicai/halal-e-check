import type { Metadata } from "next";
import { additives } from "@/data/additives";
import { ReviewQueueBrowser } from "@/components/review-queue-browser";
import { getReviewQueue } from "@/lib/risk";
import { getRiskGuidance } from "@/lib/risk-guidance";

export const metadata: Metadata = {
  title: "Review Queue",
  description: "Editorial QA queue for medium-confidence, source-sensitive, and weakly sourced additive records.",
  robots: {
    index: false,
    follow: false
  }
};

export default function ReviewQueuePage() {
  const queue = getReviewQueue(additives);
  const highPriority = queue.filter((item) => item.riskScore >= 10).length;
  const mediumConfidence = additives.filter((additive) => additive.guidanceConfidence === "medium").length;
  const avoidIfUnclear = additives.filter((additive) => getRiskGuidance(additive) === "avoid-if-unclear").length;
  const manufacturerNeeded = queue.filter((item) => item.reasons.some((reason) => reason.key === "manufacturer-needed")).length;
  const missingSourceWork = queue.filter((item) =>
    item.reasons.some((reason) => reason.key === "missing-external-source" || reason.key === "missing-guidance-source")
  ).length;

  return (
    <div className="container py-10 sm:py-14">
      <div className="max-w-3xl space-y-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Data quality</p>
        <h1 className="text-4xl font-bold leading-tight">Editorial QA queue</h1>
        <p className="text-base leading-7 text-muted-foreground">
          Low-confidence coverage is now complete. Use this queue to improve medium-confidence, source-sensitive, and
          weakly sourced records before treating the dataset as market-ready. The score is a prioritization aid, not a
          halal ruling.
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
          <p className="text-3xl font-bold">{mediumConfidence}</p>
          <p className="mt-1 text-sm text-muted-foreground">medium confidence</p>
        </div>
        <div className="rounded-lg border bg-card p-5">
          <p className="text-3xl font-bold">{avoidIfUnclear}</p>
          <p className="mt-1 text-sm text-muted-foreground">avoid if unclear</p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border bg-card p-5">
          <p className="text-3xl font-bold">{manufacturerNeeded}</p>
          <p className="mt-1 text-sm text-muted-foreground">manufacturer verification needed</p>
        </div>
        <div className="rounded-lg border bg-card p-5">
          <p className="text-3xl font-bold">{missingSourceWork}</p>
          <p className="mt-1 text-sm text-muted-foreground">missing source work</p>
        </div>
      </div>

      <ReviewQueueBrowser queue={queue} />
    </div>
  );
}

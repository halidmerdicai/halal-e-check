import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, Database, ExternalLink, FileCheck2, Tags } from "lucide-react";
import { additives } from "@/data/additives";
import { getDataQuality } from "@/lib/data-quality";
import { getRiskGuidance, riskGuidanceCopy } from "@/lib/risk-guidance";
import { StatusBadge } from "@/components/status-badge";
import { sensitivityCopy } from "@/lib/status";

export const metadata: Metadata = {
  title: "Data Quality",
  description: "Dataset coverage, source quality, confidence, and review readiness for Halal E-Check additive records."
};

const metricCards = [
  {
    key: "total",
    label: "total records",
    icon: Database
  },
  {
    key: "withExternalSources",
    label: "with external source URL",
    icon: ExternalLink
  },
  {
    key: "withTypedSources",
    label: "with typed source category",
    icon: Tags
  },
  {
    key: "highRisk",
    label: "high-risk/source-sensitive",
    icon: AlertTriangle
  },
  {
    key: "manufacturerNeeded",
    label: "need manufacturer verification",
    icon: FileCheck2
  }
] as const;

export default function DataQualityPage() {
  const { issues, priorityRecords, summary } = getDataQuality(additives);
  const launchBlockers = issues.filter((issue) =>
    ["highRiskMissingGuidanceSource", "missingExternalSource", "lowConfidence"].includes(issue.key)
  );

  return (
    <div className="container py-10 sm:py-14">
      <div className="max-w-3xl space-y-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Launch readiness</p>
        <h1 className="text-4xl font-bold leading-tight">Data quality dashboard</h1>
        <p className="text-base leading-7 text-muted-foreground">
          This page shows where the additive dataset still needs stronger citations, source labels, or manual review.
          It is a practical checklist for improving trust before marketing the app as finished.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {metricCards.map(({ key, label, icon: Icon }) => (
          <div key={key} className="rounded-lg border bg-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-3xl font-bold">{summary[key]}</p>
                <p className="mt-1 text-sm text-muted-foreground">{label}</p>
              </div>
              <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
          </div>
        ))}
      </div>

      <section className="mt-8 rounded-lg border bg-card p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Launch blockers</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              These are the highest-value data issues to reduce before a public launch.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm font-semibold">
            <Link href="/methodology" className="text-primary hover:underline">
              Read methodology
            </Link>
            <Link href="/review-queue" className="text-primary hover:underline">
              Open review queue
            </Link>
            <Link href="/corrections" className="text-primary hover:underline">
              Suggest correction
            </Link>
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {launchBlockers.map((issue) => (
            <div key={issue.key} className="rounded-md border bg-background p-4">
              <p className="text-2xl font-bold">{issue.records.length}</p>
              <h3 className="mt-2 font-semibold">{issue.label}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{issue.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-2">
        {issues.map((issue) => (
          <div key={issue.key} className="rounded-lg border bg-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">{issue.label}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{issue.description}</p>
              </div>
              <span className="rounded-full border px-3 py-1 text-sm font-semibold">{issue.records.length}</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {issue.records.slice(0, 12).map((additive) => (
                <Link
                  key={`${issue.key}-${additive.id}`}
                  href={`/e/${additive.numericCode}`}
                  className="rounded-full border px-3 py-1 text-sm font-medium hover:bg-accent"
                >
                  {additive.eNumber}
                </Link>
              ))}
              {issue.records.length > 12 ? (
                <span className="rounded-full border bg-muted px-3 py-1 text-sm text-muted-foreground">
                  +{issue.records.length - 12} more
                </span>
              ) : null}
            </div>
          </div>
        ))}
      </section>

      <section className="mt-8 overflow-hidden rounded-lg border">
        <div className="border-b bg-muted px-4 py-3">
          <h2 className="font-semibold">Top records to improve first</h2>
          <p className="mt-1 text-sm text-muted-foreground">Sorted by issue count, then risk score.</p>
        </div>
        <div className="grid grid-cols-[78px_1fr] gap-3 border-b bg-muted/70 px-4 py-3 text-sm font-semibold sm:grid-cols-[78px_1fr_140px_150px_130px]">
          <span>Issues</span>
          <span>Additive</span>
          <span className="hidden sm:block">Guidance</span>
          <span className="hidden sm:block">Sensitivity</span>
          <span className="hidden sm:block">Status</span>
        </div>
        <div className="divide-y bg-card">
          {priorityRecords.slice(0, 40).map(({ additive, issueCount }) => (
            <Link
              key={additive.id}
              href={`/e/${additive.numericCode}`}
              className="grid grid-cols-[78px_1fr] gap-3 px-4 py-4 hover:bg-accent sm:grid-cols-[78px_1fr_140px_150px_130px] sm:items-center"
            >
              <span className="font-semibold">{issueCount}</span>
              <span>
                <span className="block font-semibold">
                  {additive.eNumber} - {additive.name}
                </span>
                <span className="mt-1 block text-sm text-muted-foreground">{additive.category}</span>
              </span>
              <span className="hidden text-sm text-muted-foreground sm:block">{riskGuidanceCopy[getRiskGuidance(additive)].label}</span>
              <span className="hidden text-sm text-muted-foreground sm:block">{sensitivityCopy[additive.sourceSensitivity]}</span>
              <span className="hidden sm:block">
                <StatusBadge status={additive.status} />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

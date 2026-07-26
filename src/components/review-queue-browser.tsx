"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Filter, Search } from "lucide-react";
import type { Additive } from "@/data/additives";
import type { ReviewQueueReason, ReviewQueueReasonKey } from "@/lib/risk";
import { getRiskGuidance, riskGuidanceCopy } from "@/lib/risk-guidance";
import { sensitivityCopy } from "@/lib/status";
import { StatusBadge } from "@/components/status-badge";
import { RiskGuidanceBadge } from "@/components/risk-guidance-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ReviewQueueItem = {
  additive: Additive;
  riskScore: number;
  reasons: ReviewQueueReason[];
};

type FilterKey =
  | "all"
  | "avoid"
  | "avoid-if-unclear"
  | "mashbooh"
  | "source"
  | "medium-confidence"
  | "manufacturer"
  | "aliases"
  | "sources";

const filters: Array<{ key: FilterKey; label: string; reasonKeys?: ReviewQueueReasonKey[] }> = [
  { key: "all", label: "All" },
  { key: "avoid", label: "Avoid", reasonKeys: ["avoid"] },
  { key: "avoid-if-unclear", label: "Avoid if unclear", reasonKeys: ["avoid-if-unclear"] },
  { key: "mashbooh", label: "Mashbooh", reasonKeys: ["mashbooh"] },
  { key: "source", label: "Source-sensitive", reasonKeys: ["high-sensitivity", "medium-sensitivity", "source-keyword"] },
  { key: "medium-confidence", label: "Medium confidence", reasonKeys: ["medium-confidence"] },
  { key: "manufacturer", label: "Manufacturer needed", reasonKeys: ["manufacturer-needed"] },
  { key: "aliases", label: "Missing aliases", reasonKeys: ["missing-aliases"] },
  { key: "sources", label: "Missing sources", reasonKeys: ["missing-external-source", "missing-guidance-source"] }
];

const reasonStyles: Partial<Record<ReviewQueueReasonKey, string>> = {
  avoid: "border-red-200 bg-red-50 text-red-950 dark:border-red-800 dark:bg-red-950 dark:text-red-100",
  "avoid-if-unclear": "border-red-200 bg-red-50 text-red-950 dark:border-red-800 dark:bg-red-950 dark:text-red-100",
  mashbooh: "border-orange-200 bg-orange-50 text-orange-950 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-100",
  "high-sensitivity": "border-orange-200 bg-orange-50 text-orange-950 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-100",
  "low-confidence": "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100",
  "medium-confidence": "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100",
  "manufacturer-needed": "border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-100"
};

function matchesFilter(item: ReviewQueueItem, filter: (typeof filters)[number]) {
  if (filter.key === "all") return true;
  return item.reasons.some((reason) => filter.reasonKeys?.includes(reason.key));
}

function matchesSearch(item: ReviewQueueItem, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  return [
    item.additive.eNumber,
    item.additive.numericCode,
    item.additive.name,
    item.additive.category,
    item.additive.status,
    item.additive.sourceSensitivity,
    ...item.additive.aliases,
    ...item.additive.usuallyDerivedFrom,
    ...item.reasons.map((reason) => reason.label)
  ]
    .join(" ")
    .toLowerCase()
    .includes(normalized);
}

export function ReviewQueueBrowser({ queue }: { queue: ReviewQueueItem[] }) {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [query, setQuery] = useState("");
  const selectedFilter = filters.find((filter) => filter.key === activeFilter) ?? filters[0];

  const filteredQueue = useMemo(
    () => queue.filter((item) => matchesFilter(item, selectedFilter) && matchesSearch(item, query)),
    [query, queue, selectedFilter]
  );

  const counts = useMemo(
    () =>
      Object.fromEntries(
        filters.map((filter) => [filter.key, queue.filter((item) => matchesFilter(item, filter)).length])
      ) as Record<FilterKey, number>,
    [queue]
  );

  return (
    <section className="mt-8 grid gap-5">
      <div className="rounded-lg border bg-card p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" aria-hidden="true" />
              <h2 className="text-xl font-semibold">Review filters</h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Use this queue to review source-sensitive, medium-confidence, or weakly sourced records first.
            </p>
          </div>
          <label className="relative block lg:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search code, name, source..." className="pl-9" />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {filters.map((filter) => (
            <Button
              key={filter.key}
              type="button"
              variant={activeFilter === filter.key ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter(filter.key)}
              className="gap-2"
            >
              {filter.label}
              <span className="rounded-full bg-background/80 px-2 py-0.5 text-xs text-foreground">{counts[filter.key]}</span>
            </Button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">{filteredQueue.length} records shown</h2>
          <p className="mt-1 text-sm text-muted-foreground">Sorted by risk score, review reason count, then E-number.</p>
        </div>
      </div>

      <div className="grid gap-3">
        {filteredQueue.map(({ additive, reasons, riskScore }) => (
          <article key={additive.id} className="rounded-lg border bg-card p-4 sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border bg-background px-3 py-1 text-sm font-bold">Score {riskScore}</span>
                  <StatusBadge status={additive.status} className="px-2 py-1 text-xs" />
                  <RiskGuidanceBadge additive={additive} className="px-2 py-1 text-xs" />
                  {riskScore >= 10 ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-950 dark:border-red-800 dark:bg-red-950 dark:text-red-100">
                      <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                      High priority
                    </span>
                  ) : null}
                </div>
                <Link href={`/e/${additive.numericCode}`} className="mt-3 block text-lg font-semibold text-primary hover:underline">
                  {additive.eNumber} - {additive.name}
                </Link>
                <p className="mt-1 text-sm text-muted-foreground">{additive.category}</p>
                <p className="mt-3 text-sm leading-6">{additive.summary}</p>
              </div>
              <div className="grid gap-2 text-sm lg:w-64">
                <div className="rounded-md border bg-background p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Guidance</p>
                  <p className="mt-1 font-medium">{riskGuidanceCopy[getRiskGuidance(additive)].label}</p>
                </div>
                <div className="rounded-md border bg-background p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sensitivity</p>
                  <p className="mt-1 font-medium">{sensitivityCopy[additive.sourceSensitivity]}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {reasons.map((reason) => (
                <span
                  key={`${additive.id}-${reason.key}`}
                  className={cn("rounded-full border bg-background px-2 py-1 text-xs font-semibold", reasonStyles[reason.key])}
                >
                  {reason.label}
                </span>
              ))}
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-md border bg-background p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Check</p>
                <p className="mt-2 text-sm leading-6">{additive.whatToCheck[0] ?? "Confirm source, carrier, and certification context."}</p>
              </div>
              <div className="rounded-md border bg-background p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Action</p>
                <p className="mt-2 text-sm leading-6">{additive.saferAction}</p>
              </div>
              <div className="rounded-md border bg-background p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Review note</p>
                <p className="mt-2 text-sm leading-6">{additive.reviewNotes}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2 min-[420px]:flex-row min-[420px]:flex-wrap">
              <Button asChild size="sm" className="gap-2">
                <Link href={`/e/${additive.numericCode}#review-checklist`}>Review page</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="gap-2">
                <Link
                  href={`/corrections?code=${encodeURIComponent(additive.eNumber)}&name=${encodeURIComponent(additive.name)}&context=${encodeURIComponent(
                    [
                      `${additive.eNumber} ${additive.name}`,
                      `Review reasons: ${reasons.map((reason) => reason.label).join(", ")}`,
                      `Current notes: ${additive.reviewNotes}`
                    ].join("\n")
                  )}`}
                >
                  Correction draft
                </Link>
              </Button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

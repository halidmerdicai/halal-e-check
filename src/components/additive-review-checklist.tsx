"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ClipboardCheck, Copy, ExternalLink } from "lucide-react";
import type { Additive } from "@/data/additives";
import { getReviewReasons } from "@/lib/risk";
import { getRiskGuidance, riskGuidanceCopy } from "@/lib/risk-guidance";
import { Button } from "@/components/ui/button";

function hasSourceType(additive: Additive, type: NonNullable<Additive["sources"][number]["type"]>) {
  return additive.sources.some((source) => source.type === type);
}

function hasExternalSource(additive: Additive) {
  return additive.sources.some((source) => Boolean(source.url));
}

function reviewChecklist(additive: Additive) {
  const isSensitive = additive.status !== "halal" || additive.sourceSensitivity !== "low";

  return [
    {
      label: "External source URL",
      done: hasExternalSource(additive),
      detail: "At least one source should link to identity, regulatory, halal-guidance, or manufacturer material."
    },
    {
      label: "Typed source category",
      done: additive.sources.some((source) => Boolean(source.type)),
      detail: "Sources should be categorized so weak editorial notes do not look stronger than they are."
    },
    {
      label: "Guidance or regulatory source",
      done: !isSensitive || hasSourceType(additive, "halal-guidance") || hasSourceType(additive, "regulatory"),
      detail: "High-risk or source-sensitive records should have stronger support than a generic identity source."
    },
    {
      label: "Aliases for search/OCR",
      done: additive.aliases.length >= 2,
      detail: "Add common label names, Balkan spellings, and OCR-friendly variants when useful."
    },
    {
      label: "Manufacturer question",
      done: additive.whatToCheck.length > 0 && additive.saferAction.length > 0,
      detail: "The record should tell users exactly what source, carrier, or certification question to ask."
    },
    {
      label: "Confidence reviewed",
      done: additive.guidanceConfidence !== "low",
      detail: "Low-confidence records should be reviewed before being treated as launch-ready."
    }
  ];
}

function buildReviewTask(additive: Additive) {
  const reasons = getReviewReasons(additive);
  const missing = reviewChecklist(additive).filter((item) => !item.done);

  return [
    "Halal E-Check additive review task",
    "",
    `Additive: ${additive.eNumber} - ${additive.name}`,
    `Category: ${additive.category}`,
    `Status: ${additive.status}`,
    `Guidance: ${riskGuidanceCopy[getRiskGuidance(additive)].label}`,
    `Source sensitivity: ${additive.sourceSensitivity}`,
    `Confidence: ${additive.guidanceConfidence}`,
    "",
    "Review reasons:",
    ...(reasons.length ? reasons.map((reason) => `- ${reason.label}`) : ["- No queue reasons detected"]),
    "",
    "Missing or weak checklist items:",
    ...(missing.length ? missing.map((item) => `- ${item.label}: ${item.detail}`) : ["- No checklist gaps detected"]),
    "",
    "Current safer action:",
    additive.saferAction,
    "",
    "Current review notes:",
    additive.reviewNotes,
    "",
    "Suggested work:",
    "- Confirm identity and source variants.",
    "- Add stronger external sources if missing.",
    "- Improve aliases/search terms if label matching is weak.",
    "- Update guidance confidence and lastReviewed after review."
  ].join("\n");
}

export function AdditiveReviewChecklist({ additive }: { additive: Additive }) {
  const [copyStatus, setCopyStatus] = useState("");
  const checklist = useMemo(() => reviewChecklist(additive), [additive]);
  const reasons = useMemo(() => getReviewReasons(additive), [additive]);
  const reviewTask = useMemo(() => buildReviewTask(additive), [additive]);
  const missingCount = checklist.filter((item) => !item.done).length;
  const context = [
    `${additive.eNumber} ${additive.name}`,
    `Review reasons: ${reasons.map((reason) => reason.label).join(", ") || "None"}`,
    `Current notes: ${additive.reviewNotes}`
  ].join("\n");

  async function copyTask() {
    try {
      await navigator.clipboard.writeText(reviewTask);
      setCopyStatus("Review task copied.");
    } catch {
      setCopyStatus("Copy failed. Select and copy the task manually.");
    }
  }

  return (
    <section className="rounded-lg border bg-card p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="text-lg font-semibold sm:text-xl">Review checklist</h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Internal checklist for improving this additive record before treating it as launch-ready.
          </p>
        </div>
        <span className="w-fit rounded-full border bg-background px-3 py-1 text-sm font-semibold">
          {missingCount} open item{missingCount === 1 ? "" : "s"}
        </span>
      </div>

      {reasons.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {reasons.map((reason) => (
            <span key={reason.key} className="rounded-full border bg-background px-2 py-1 text-xs font-semibold">
              {reason.label}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {checklist.map((item) => (
          <div key={item.label} className="rounded-md border bg-background p-3">
            <div className="flex items-start gap-2">
              <span
                className={`mt-1 h-3 w-3 flex-none rounded-full border ${
                  item.done ? "border-emerald-600 bg-emerald-600" : "border-amber-600 bg-amber-100"
                }`}
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.detail}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-2 min-[420px]:flex-row min-[420px]:flex-wrap">
        <Button type="button" onClick={copyTask} className="gap-2">
          <Copy className="h-4 w-4" aria-hidden="true" />
          Copy review task
        </Button>
        <Button asChild variant="outline" className="gap-2">
          <Link
            href={`/corrections?code=${encodeURIComponent(additive.eNumber)}&name=${encodeURIComponent(additive.name)}&context=${encodeURIComponent(context)}`}
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            Open correction draft
          </Link>
        </Button>
        <Button asChild variant="outline" className="gap-2">
          <Link href={`/request?code=${encodeURIComponent(additive.eNumber)}&context=${encodeURIComponent(context)}`}>
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            Open request draft
          </Link>
        </Button>
      </div>
      {copyStatus ? <p className="mt-3 text-sm font-medium text-primary">{copyStatus}</p> : null}
    </section>
  );
}

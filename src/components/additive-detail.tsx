import type { Additive } from "@/data/additives";
import Link from "next/link";
import { CheckCircle2, HelpCircle, XCircle } from "lucide-react";
import { sensitivityCopy, statusCopy } from "@/lib/status";
import { StatusBadge } from "@/components/status-badge";
import { DisclaimerBox } from "@/components/disclaimer-box";
import { RelatedAdditives } from "@/components/related-additives";
import { VerificationChecklist } from "@/components/verification-checklist";
import { cn } from "@/lib/utils";
import { RiskGuidanceBadge } from "@/components/risk-guidance-badge";
import { getRiskGuidance, riskGuidanceCopy } from "@/lib/risk-guidance";
import { getManufacturerQuestions } from "@/lib/decision-guide";

function ListSection({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="space-y-2 sm:space-y-3">
      <h2 className="text-lg font-semibold sm:text-xl">{title}</h2>
      <ul className="grid gap-2 text-sm leading-6 text-muted-foreground">
        {items.map((item) => (
          <li key={item} className="rounded-md border bg-card p-3 sm:p-3.5">
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

const confidenceStyles = {
  low: "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200",
  medium: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200",
  high: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
};

const decisionIconStyles = {
  use: "text-emerald-700 dark:text-emerald-300",
  avoid: "text-red-700 dark:text-red-300",
  ask: "text-sky-700 dark:text-sky-300"
};

function DecisionColumn({
  title,
  items,
  tone
}: {
  title: string;
  items: string[];
  tone: keyof typeof decisionIconStyles;
}) {
  const Icon = tone === "use" ? CheckCircle2 : tone === "avoid" ? XCircle : HelpCircle;

  return (
    <div className="min-w-0 space-y-3">
      <div className="flex items-center gap-2">
        <Icon className={cn("h-5 w-5 flex-none", decisionIconStyles[tone])} aria-hidden="true" />
        <h3 className="text-base font-semibold">{title}</h3>
      </div>
      <ul className="grid gap-2 text-sm leading-6 text-muted-foreground">
        {items.slice(0, 3).map((item) => (
          <li key={item} className="border-l pl-3">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function DecisionGuide({ additive, riskGuidance }: { additive: Additive; riskGuidance: ReturnType<typeof getRiskGuidance> }) {
  const shouldShow = additive.sourceSensitivity !== "low" || additive.status !== "halal" || riskGuidance !== "permissible";

  if (!shouldShow) return null;

  return (
    <section className="rounded-lg border bg-card p-4 sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold sm:text-xl">Decision guide</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Use this as the practical next step when the label does not give enough source detail.
          </p>
        </div>
        <span className="inline-flex w-fit rounded-full border bg-background px-3 py-1 text-sm font-semibold text-muted-foreground">
          {riskGuidanceCopy[riskGuidance].label}
        </span>
      </div>

      <div className="mt-5 grid gap-5 border-t pt-5 md:grid-cols-3">
        <DecisionColumn title="Use when" items={additive.halalWhen} tone="use" />
        <DecisionColumn title="Avoid when" items={additive.haramWhen} tone="avoid" />
        <DecisionColumn title="Ask manufacturer" items={getManufacturerQuestions(additive)} tone="ask" />
      </div>
    </section>
  );
}

function TrustSection({ additive }: { additive: Additive }) {
  return (
    <section className="rounded-lg border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold sm:text-xl">Data confidence</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{additive.reviewNotes}</p>
        </div>
        <span
          className={cn(
            "inline-flex rounded-full border px-3 py-1 text-sm font-semibold capitalize",
            confidenceStyles[additive.guidanceConfidence]
          )}
        >
          {additive.guidanceConfidence}
        </span>
      </div>

      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2 sm:gap-3">
        <div className="rounded-md border bg-background p-3">
          <dt className="font-semibold">Reviewed by</dt>
          <dd className="mt-1 text-muted-foreground">{additive.reviewedBy}</dd>
        </div>
        <div className="rounded-md border bg-background p-3">
          <dt className="font-semibold">Last reviewed</dt>
          <dd className="mt-1 text-muted-foreground">{additive.lastReviewed}</dd>
        </div>
      </dl>

      <div className="mt-5 space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-base font-semibold">Sources and basis</h3>
          <div className="grid grid-cols-1 gap-2 text-sm font-semibold min-[420px]:grid-cols-2 sm:flex sm:flex-wrap sm:gap-3">
            <Link href="/methodology" className="rounded-md border bg-background px-3 py-2 text-center text-primary hover:bg-accent sm:border-0 sm:bg-transparent sm:p-0">
              How guidance works
            </Link>
            <Link
              href={`/corrections?code=${encodeURIComponent(additive.eNumber)}&name=${encodeURIComponent(additive.name)}`}
              className="rounded-md border bg-background px-3 py-2 text-center text-primary hover:bg-accent sm:border-0 sm:bg-transparent sm:p-0"
            >
              Suggest correction
            </Link>
          </div>
        </div>
        <ul className="grid gap-3">
          {additive.sources.map((source) => (
            <li key={`${additive.id}-${source.label}`} className="min-w-0 rounded-md border bg-background p-3 text-sm leading-6">
              {source.type ? (
                <span className="mb-2 inline-flex rounded-full border bg-card px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {source.type.replace("-", " ")}
                </span>
              ) : null}
              {source.url ? (
                <a className="break-words font-semibold text-primary hover:underline" href={source.url} target="_blank" rel="noreferrer">
                  {source.label}
                </a>
              ) : (
                <p className="break-words font-semibold">{source.label}</p>
              )}
              {source.note ? <p className="mt-1 text-muted-foreground">{source.note}</p> : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function AdditiveDetail({ additive }: { additive: Additive }) {
  const riskGuidance = getRiskGuidance(additive);

  return (
    <article className="container max-w-4xl py-6 sm:py-12">
      <div className="mb-6 space-y-4 sm:mb-8 sm:space-y-5">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <StatusBadge status={additive.status} className="px-2 py-1 text-xs sm:px-3 sm:text-sm" />
          <RiskGuidanceBadge additive={additive} className="px-2 py-1 text-xs sm:px-3 sm:text-sm" />
          <span className="rounded-full border px-2 py-1 text-xs text-muted-foreground sm:px-3 sm:text-sm">{additive.category}</span>
          <span className="rounded-full border px-2 py-1 text-xs text-muted-foreground sm:px-3 sm:text-sm">
            {sensitivityCopy[additive.sourceSensitivity]}
          </span>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">{additive.eNumber}</p>
          <h1 className="mt-2 break-words text-3xl font-bold leading-tight sm:text-5xl">{additive.name}</h1>
        </div>
        <p className="text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">{additive.summary}</p>
        <Link
          href={`/corrections?code=${encodeURIComponent(additive.eNumber)}&name=${encodeURIComponent(additive.name)}`}
          className="inline-flex rounded-md border bg-card px-3 py-2 text-sm font-semibold text-primary hover:bg-accent sm:border-0 sm:bg-transparent sm:p-0 sm:hover:underline"
        >
          Suggest correction for this page
        </Link>
      </div>

      <div className="grid gap-5 sm:gap-6">
        <section className="rounded-lg border bg-card p-4 sm:p-5">
          <h2 className="text-lg font-semibold sm:text-xl">Status meaning</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{statusCopy[additive.status].meaning}</p>
        </section>

        <DecisionGuide additive={additive} riskGuidance={riskGuidance} />

        <ListSection title="Usually derived from" items={additive.usuallyDerivedFrom} />
        <ListSection title="When it is halal" items={additive.halalWhen} />
        <ListSection title="When it is not halal" items={additive.haramWhen} />

        <section className="space-y-2 sm:space-y-3">
          <h2 className="text-lg font-semibold sm:text-xl">What to check on packaging</h2>
          <VerificationChecklist items={additive.whatToCheck} />
        </section>

        <section className="rounded-lg border bg-accent p-4 sm:p-5">
          <h2 className="text-lg font-semibold sm:text-xl">Safer action</h2>
          <p className="mt-2 text-sm leading-6">{additive.saferAction}</p>
          <p className="mt-3 text-sm font-medium">{riskGuidanceCopy[riskGuidance].description}</p>
        </section>

        <ListSection title="Common foods" items={additive.commonFoods} />
        <ListSection title="Notes" items={additive.notes} />

        <TrustSection additive={additive} />
        <RelatedAdditives additive={additive} />
        <DisclaimerBox />
      </div>
    </article>
  );
}

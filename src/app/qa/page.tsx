import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, CircleAlert, ClipboardCheck } from "lucide-react";
import { realUseLabelCases } from "@/data/qa-label-cases";
import { checkIngredients, cleanIngredientCodeText } from "@/lib/ingredient-check";
import { getRiskGuidance, riskGuidanceCopy, type RiskGuidance } from "@/lib/risk-guidance";

export const metadata: Metadata = {
  title: "QA Samples",
  description: "Internal real-use QA samples for additive detection and halal guidance checks.",
  robots: {
    index: false,
    follow: false
  }
};

type QaIssue = {
  label: string;
  detail: string;
};

const guidanceStyles: Record<RiskGuidance, string> = {
  permissible: "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100",
  verify: "border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-100",
  "avoid-if-unclear": "border-orange-200 bg-orange-50 text-orange-950 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-100",
  avoid: "border-red-200 bg-red-50 text-red-950 dark:border-red-800 dark:bg-red-950 dark:text-red-100"
};

function sameCorrection(actual: [string, string], expected: [string, string]) {
  return actual[0] === expected[0] && actual[1] === expected[1];
}

function evaluateCase(labelCase: (typeof realUseLabelCases)[number]) {
  const cleaned = cleanIngredientCodeText(labelCase.text);
  const result = checkIngredients(cleaned.text);
  const detectedCodes = new Set(result.matches.map((match) => match.additive.eNumber));
  const issues: QaIssue[] = [];

  for (const code of labelCase.expectedCodes) {
    if (!detectedCodes.has(code)) {
      issues.push({ label: "Missing code", detail: code });
    }
  }

  for (const code of labelCase.expectedAbsentCodes ?? []) {
    if (detectedCodes.has(code)) {
      issues.push({ label: "False positive", detail: code });
    }
  }

  for (const entry of Object.entries(labelCase.expectedGuidance ?? {})) {
    const [code, expectedGuidance] = entry as [string, RiskGuidance];
    const match = result.matches.find((item) => item.additive.eNumber === code);
    const actualGuidance = match ? getRiskGuidance(match.additive) : null;

    if (!match || actualGuidance !== expectedGuidance) {
      issues.push({
        label: "Guidance mismatch",
        detail: `${code}: expected ${expectedGuidance}, got ${actualGuidance ?? "missing"}`
      });
    }
  }

  if (labelCase.expectedCorrections) {
    const actualCorrections = cleaned.corrections.map((correction): [string, string] => [correction.from, correction.to]);
    for (const expected of labelCase.expectedCorrections) {
      if (!actualCorrections.some((actual) => sameCorrection(actual, expected))) {
        issues.push({ label: "Missing OCR correction", detail: `${expected[0]} -> ${expected[1]}` });
      }
    }
  }

  if (result.unknownCodes.length) {
    issues.push({ label: "Unknown codes", detail: result.unknownCodes.map((item) => item.code).join(", ") });
  }

  return {
    cleaned,
    result,
    issues,
    passed: issues.length === 0
  };
}

export default function QaPage() {
  const evaluatedCases = realUseLabelCases.map((labelCase) => ({
    labelCase,
    evaluation: evaluateCase(labelCase)
  }));
  const passedCount = evaluatedCases.filter((item) => item.evaluation.passed).length;
  const failedCount = evaluatedCases.length - passedCount;

  return (
    <div className="container py-10 sm:py-14">
      <div className="max-w-3xl space-y-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Internal QA</p>
        <h1 className="text-4xl font-bold leading-tight">Real-use sample checks</h1>
        <p className="text-base leading-7 text-muted-foreground">
          Browser view of the same real-label scenarios used by the automated ingredient tests. These samples focus on
          Balkan and English labels, OCR mistakes, source-sensitive additives, and false-positive guards.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-5">
          <p className="text-3xl font-bold">{evaluatedCases.length}</p>
          <p className="mt-1 text-sm text-muted-foreground">sample labels</p>
        </div>
        <div className="rounded-lg border bg-card p-5">
          <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">{passedCount}</p>
          <p className="mt-1 text-sm text-muted-foreground">passing samples</p>
        </div>
        <div className="rounded-lg border bg-card p-5">
          <p className="text-3xl font-bold text-red-700 dark:text-red-300">{failedCount}</p>
          <p className="mt-1 text-sm text-muted-foreground">samples with issues</p>
        </div>
      </div>

      <section className="mt-8 grid gap-4">
        {evaluatedCases.map(({ labelCase, evaluation }, index) => (
          <article key={labelCase.name} className="rounded-lg border bg-card p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border bg-background px-3 py-1 text-sm font-bold">Sample {index + 1}</span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold ${
                      evaluation.passed
                        ? "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100"
                        : "border-red-200 bg-red-50 text-red-950 dark:border-red-800 dark:bg-red-950 dark:text-red-100"
                    }`}
                  >
                    {evaluation.passed ? <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> : <CircleAlert className="h-3 w-3" aria-hidden="true" />}
                    {evaluation.passed ? "Pass" : "Needs review"}
                  </span>
                </div>
                <h2 className="mt-3 text-xl font-semibold">{labelCase.name}</h2>
              </div>
              <Link href="/check" className="text-sm font-semibold text-primary hover:underline">
                Open scanner
              </Link>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-md border bg-background p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sample text</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{labelCase.text}</p>
              </div>
              <div className="rounded-md border bg-background p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Expected codes</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {labelCase.expectedCodes.map((code) => (
                    <span key={code} className="rounded-full border px-2 py-1 text-xs font-semibold">
                      {code}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {evaluation.cleaned.corrections.length ? (
              <div className="mt-3 rounded-md border bg-background p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">OCR corrections</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {evaluation.cleaned.corrections.map((correction) => (
                    <span key={`${correction.from}-${correction.to}`} className="rounded-full border px-2 py-1 text-xs font-semibold">
                      {correction.from} to {correction.to}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {evaluation.issues.length ? (
              <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-red-950 dark:border-red-800 dark:bg-red-950 dark:text-red-100">
                <p className="text-sm font-semibold">Issues</p>
                <ul className="mt-2 grid gap-1 text-sm">
                  {evaluation.issues.map((issue) => (
                    <li key={`${issue.label}-${issue.detail}`}>
                      {issue.label}: {issue.detail}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {evaluation.result.matches.map((match) => {
                const guidance = getRiskGuidance(match.additive);

                return (
                  <Link
                    key={match.additive.id}
                    href={`/e/${match.additive.numericCode}`}
                    className="rounded-md border bg-background p-3 hover:bg-accent"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{match.additive.eNumber}</span>
                      <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${guidanceStyles[guidance]}`}>
                        {riskGuidanceCopy[guidance].label}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-medium">{match.additive.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {match.matchedBy}: {match.matchedText}
                    </p>
                  </Link>
                );
              })}
            </div>
          </article>
        ))}
      </section>

      <section className="mt-8 rounded-lg border bg-card p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-primary" aria-hidden="true" />
          <h2 className="text-xl font-semibold">QA source</h2>
        </div>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          These samples come from <span className="font-mono text-foreground">src/data/qa-label-cases.ts</span> and are
          also asserted by <span className="font-mono text-foreground">tests/ingredient-check.test.ts</span>.
        </p>
      </section>
    </div>
  );
}

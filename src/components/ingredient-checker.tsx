"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  Download,
  HelpCircle,
  History,
  Trash2,
  RotateCcw,
  ShieldAlert
} from "lucide-react";
import { checkIngredients } from "@/lib/ingredient-check";
import { getRiskGuidance, riskGuidanceCopy, type RiskGuidance } from "@/lib/risk-guidance";
import { StatusBadge } from "@/components/status-badge";
import { RiskGuidanceBadge } from "@/components/risk-guidance-badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const groups: RiskGuidance[] = ["avoid", "avoid-if-unclear", "verify", "permissible"];
const historyKey = "halal-e-check:recent-checks";
const maxHistoryItems = 10;

const example =
  "Ingredients: wheat flour, sugar, vegetable oil, emulsifier E471, soy lecithin (E322), color E120, raising agent E500, flavour enhancer E631.";

type GuidanceCounts = Record<RiskGuidance, number>;

type RecentCheck = {
  id: string;
  input: string;
  preview: string;
  checkedAt: string;
  verdict: RiskGuidance;
  counts: GuidanceCounts;
  knownCount: number;
  unknownCount: number;
};

const verdictMeta = {
  avoid: {
    title: "Avoid",
    action: "This label includes an additive that is strongly avoided. Choose a halal-certified alternative unless a trusted halal authority explicitly accepts this product.",
    icon: ShieldAlert,
    className: "border-red-200 bg-red-50 text-red-950 dark:border-red-800 dark:bg-red-950 dark:text-red-100"
  },
  "avoid-if-unclear": {
    title: "Avoid if source is unclear",
    action: "This label includes source-dependent additives. Verify plant, vegan, manufacturer-confirmed, or halal-certified source before relying on it.",
    icon: AlertTriangle,
    className: "border-orange-200 bg-orange-50 text-orange-950 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-100"
  },
  verify: {
    title: "Verify source",
    action: "No strict avoid additive was detected, but some additives still need source, carrier, or certification checks.",
    icon: HelpCircle,
    className: "border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-100"
  },
  permissible: {
    title: "No major additive concerns found",
    action: "The detected additives are generally low concern. Still check the full product, certification, and any ingredients this tool did not detect.",
    icon: CheckCircle2,
    className: "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100"
  }
};

function getVerdict(counts: GuidanceCounts, unknownCount: number): RiskGuidance {
  if (counts.avoid > 0) return "avoid";
  if (counts["avoid-if-unclear"] > 0) return "avoid-if-unclear";
  if (counts.verify > 0 || unknownCount > 0) return "verify";
  return "permissible";
}

function formatReport({
  counts,
  input,
  result,
  detailed
}: {
  counts: GuidanceCounts;
  input: string;
  result: ReturnType<typeof checkIngredients>;
  detailed: boolean;
}) {
  const verdict = getVerdict(counts, result.unknownCodes.length);
  const lines = [
    "Halal E-Check result",
    "",
    `Overall: ${verdictMeta[verdict].title}`,
    `Known additives: ${result.matches.length}`,
    `Avoid: ${counts.avoid}`,
    `Avoid if unclear: ${counts["avoid-if-unclear"]}`,
    `Verify source: ${counts.verify}`,
    `Generally OK: ${counts.permissible}`,
    `Unknown: ${result.unknownCodes.length}`,
    "",
    "Detected:"
  ];

  if (result.matches.length) {
    for (const match of result.matches) {
      const guidance = getRiskGuidance(match.additive);
      lines.push(`- ${match.additive.eNumber} ${match.additive.name}: ${riskGuidanceCopy[guidance].label}`);
      if (detailed) {
        lines.push(`  Matched: ${match.matchedText}`);
        lines.push(`  Status: ${match.additive.status}`);
        lines.push(`  Action: ${match.additive.saferAction}`);
      }
    }
  } else {
    lines.push("- No known additives detected.");
  }

  if (result.unknownCodes.length) {
    lines.push("", "Unknown E-numbers:");
    for (const code of result.unknownCodes) {
      lines.push(`- ${code.code}`);
    }
  }

  if (detailed) {
    lines.push("", "Original label:", input.trim());
  }

  lines.push(
    "",
    "Reminder: This is general halal ingredient guidance. Verify doubtful ingredients with the manufacturer or a trusted halal certifier."
  );

  return lines.join("\n");
}

function ResultActions({
  counts,
  input,
  result
}: {
  counts: GuidanceCounts;
  input: string;
  result: ReturnType<typeof checkIngredients>;
}) {
  const [copyStatus, setCopyStatus] = useState("");

  async function copyReport(detailed: boolean) {
    const report = formatReport({ counts, input, result, detailed });
    try {
      await navigator.clipboard.writeText(report);
      setCopyStatus(detailed ? "Detailed results copied." : "Summary copied.");
    } catch {
      setCopyStatus("Copy failed. Select and copy the report manually.");
    }
  }

  function downloadReport() {
    const report = formatReport({ counts, input, result, detailed: true });
    const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "halal-e-check-result.txt";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setCopyStatus("Text report downloaded.");
  }

  return (
    <section className="rounded-lg border bg-card p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold">Save or share result</h3>
          <p className="mt-1 text-sm text-muted-foreground">Copy a short summary, copy full details, or download a text report.</p>
        </div>
        <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-3 sm:flex sm:flex-wrap sm:justify-end">
          <Button type="button" variant="outline" onClick={() => copyReport(false)} className="gap-2">
            <Copy className="h-4 w-4" aria-hidden="true" />
            Copy summary
          </Button>
          <Button type="button" variant="outline" onClick={() => copyReport(true)} className="gap-2">
            <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
            Copy details
          </Button>
          <Button type="button" onClick={downloadReport} className="gap-2">
            <Download className="h-4 w-4" aria-hidden="true" />
            Download
          </Button>
        </div>
      </div>
      {copyStatus ? <p className="mt-3 text-sm font-medium text-primary">{copyStatus}</p> : null}
    </section>
  );
}

function makePreview(input: string) {
  const compact = input.trim().replace(/\s+/g, " ");
  return compact.length > 110 ? `${compact.slice(0, 110)}...` : compact;
}

function readHistory(): RecentCheck[] {
  try {
    const raw = window.localStorage.getItem(historyKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeHistory(items: RecentCheck[]) {
  window.localStorage.setItem(historyKey, JSON.stringify(items.slice(0, maxHistoryItems)));
}

function RecentChecks({
  items,
  onLoad,
  onDelete,
  onClear
}: {
  items: RecentCheck[];
  onLoad: (input: string) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}) {
  if (!items.length) return null;

  return (
    <section className="rounded-lg border bg-card p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <History className="mt-1 h-5 w-5 flex-none text-primary" aria-hidden="true" />
          <div>
            <h2 className="font-semibold">Recent checks</h2>
            <p className="mt-1 text-sm text-muted-foreground">Stored privately in this browser.</p>
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onClear} className="w-full gap-2 min-[420px]:w-auto">
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          Clear all
        </Button>
      </div>

      <div className="mt-4 grid gap-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-md border bg-background p-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border px-2 py-1 text-xs font-semibold">
                    {riskGuidanceCopy[item.verdict].label}
                  </span>
                  <span className="text-xs text-muted-foreground">{new Date(item.checkedAt).toLocaleString()}</span>
                </div>
                <p className="mt-2 break-words text-sm leading-6">{item.preview}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {item.knownCount} known, {item.unknownCount} unknown · Avoid {item.counts.avoid} · Avoid if unclear{" "}
                  {item.counts["avoid-if-unclear"]} · Verify {item.counts.verify}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                <Button type="button" size="sm" onClick={() => onLoad(item.input)}>
                  Reopen
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => onDelete(item.id)}>
                  Delete
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SummaryPanel({ counts, unknownCount }: { counts: GuidanceCounts; unknownCount: number }) {
  const verdict = getVerdict(counts, unknownCount);
  const meta = verdictMeta[verdict];
  const Icon = meta.icon;

  return (
    <div className={cn("rounded-lg border p-4 sm:p-5", meta.className)}>
      <div className="flex gap-3">
        <Icon className="mt-1 h-5 w-5 flex-none" aria-hidden="true" />
        <div>
          <h3 className="text-lg font-semibold sm:text-xl">{meta.title}</h3>
          <p className="mt-2 text-sm leading-6">{meta.action}</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-5 sm:grid-cols-5">
        {groups.map((group) => (
          <div key={group} className="rounded-md border bg-background/70 p-3">
            <p className="text-xl font-bold sm:text-2xl">{counts[group]}</p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wide">{riskGuidanceCopy[group].label}</p>
          </div>
        ))}
        <div className="rounded-md border bg-background/70 p-3">
          <p className="text-xl font-bold sm:text-2xl">{unknownCount}</p>
          <p className="mt-1 text-xs font-medium uppercase tracking-wide">Unknown</p>
        </div>
      </div>
    </div>
  );
}

const highlightStyles: Record<RiskGuidance | "unknown", string> = {
  avoid: "border-red-200 bg-red-100 text-red-950 dark:border-red-800 dark:bg-red-950 dark:text-red-100",
  "avoid-if-unclear":
    "border-orange-200 bg-orange-100 text-orange-950 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-100",
  verify: "border-sky-200 bg-sky-100 text-sky-950 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-100",
  permissible:
    "border-emerald-200 bg-emerald-100 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100",
  unknown: "border-muted bg-muted text-foreground"
};

function HighlightedLabel({ input, result }: { input: string; result: ReturnType<typeof checkIngredients> }) {
  const ranges = [
    ...result.matches
      .filter((match) => match.start >= 0 && match.end > match.start)
      .map((match) => ({
        start: match.start,
        end: match.end,
        key: match.additive.id,
        label: `${match.additive.eNumber}: ${riskGuidanceCopy[getRiskGuidance(match.additive)].label}`,
        guidance: getRiskGuidance(match.additive) as RiskGuidance | "unknown"
      })),
    ...result.unknownCodes
      .filter((code) => code.start >= 0 && code.end > code.start)
      .map((code) => ({
        start: code.start,
        end: code.end,
        key: code.code,
        label: `${code.code}: Unknown`,
        guidance: "unknown" as const
      }))
  ]
    .sort((a, b) => a.start - b.start || b.end - b.start - (a.end - a.start))
    .reduce<Array<{ start: number; end: number; key: string; label: string; guidance: RiskGuidance | "unknown" }>>((acc, range) => {
      const previous = acc[acc.length - 1];
      if (previous && range.start < previous.end) return acc;
      acc.push(range);
      return acc;
    }, []);

  if (!ranges.length) return null;

  const parts: React.ReactNode[] = [];
  let cursor = 0;

  ranges.forEach((range, index) => {
    if (range.start > cursor) {
      parts.push(<span key={`text-${index}`}>{input.slice(cursor, range.start)}</span>);
    }

    parts.push(
      <mark
        key={`mark-${range.key}-${index}`}
        title={range.label}
        className={cn("rounded border px-1 py-0.5 font-semibold", highlightStyles[range.guidance])}
      >
        {input.slice(range.start, range.end)}
      </mark>
    );
    cursor = range.end;
  });

  if (cursor < input.length) {
    parts.push(<span key="text-end">{input.slice(cursor)}</span>);
  }

  return (
    <section className="rounded-lg border bg-card p-4 sm:p-5">
      <h3 className="font-semibold">Matched label view</h3>
      <p className="mt-1 text-sm text-muted-foreground">Highlighted terms show what triggered each result.</p>
      <div className="mt-4 whitespace-pre-wrap break-words rounded-md border bg-background p-3 text-sm leading-7 sm:p-4">{parts}</div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium">
        {groups.map((group) => (
          <span key={group} className={cn("rounded-full border px-2 py-1", highlightStyles[group])}>
            {riskGuidanceCopy[group].label}
          </span>
        ))}
        <span className={cn("rounded-full border px-2 py-1", highlightStyles.unknown)}>Unknown</span>
      </div>
    </section>
  );
}

export function IngredientChecker() {
  const [input, setInput] = useState("");
  const [recentChecks, setRecentChecks] = useState<RecentCheck[]>([]);
  const result = useMemo(() => checkIngredients(input), [input]);

  const grouped = useMemo(
    () =>
      groups.map((group) => ({
        group,
        matches: result.matches.filter((match) => getRiskGuidance(match.additive) === group)
      })),
    [result.matches]
  );

  const counts = useMemo(
    () =>
      grouped.reduce(
        (acc, item) => {
          acc[item.group] = item.matches.length;
          return acc;
        },
        { avoid: 0, "avoid-if-unclear": 0, verify: 0, permissible: 0 } as GuidanceCounts
      ),
    [grouped]
  );

  const hasInput = input.trim().length > 0;
  const hasResults = result.matches.length > 0 || result.unknownCodes.length > 0;
  const verdict = useMemo(() => getVerdict(counts, result.unknownCodes.length), [counts, result.unknownCodes.length]);

  useEffect(() => {
    setRecentChecks(readHistory());
  }, []);

  useEffect(() => {
    if (!hasInput || !hasResults) return;

    const timeout = window.setTimeout(() => {
      const trimmed = input.trim();
      const item: RecentCheck = {
        id: `${Date.now()}-${trimmed.slice(0, 16)}`,
        input: trimmed,
        preview: makePreview(trimmed),
        checkedAt: new Date().toISOString(),
        verdict,
        counts,
        knownCount: result.matches.length,
        unknownCount: result.unknownCodes.length
      };
      const current = readHistory().filter((historyItem) => historyItem.input !== trimmed);
      const next = [item, ...current].slice(0, maxHistoryItems);
      writeHistory(next);
      setRecentChecks(next);
    }, 900);

    return () => window.clearTimeout(timeout);
  }, [counts, hasInput, hasResults, input, result.matches.length, result.unknownCodes.length, verdict]);

  function deleteRecentCheck(id: string) {
    const next = recentChecks.filter((item) => item.id !== id);
    writeHistory(next);
    setRecentChecks(next);
  }

  function clearRecentChecks() {
    writeHistory([]);
    setRecentChecks([]);
  }

  return (
    <div className="grid gap-5 sm:gap-6">
      <section className="rounded-lg border bg-card p-4 sm:p-5">
        <label htmlFor="ingredients" className="text-sm font-semibold">
          Ingredients label
        </label>
        <textarea
          id="ingredients"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Paste ingredients here..."
          className="mt-3 min-h-40 w-full rounded-md border border-input bg-background p-3 text-base leading-7 shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-44 sm:p-4"
        />
        <div className="mt-4 grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:flex sm:flex-wrap">
          <Button type="button" onClick={() => setInput(example)} className="gap-2">
            <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
            Use example
          </Button>
          <Button type="button" variant="outline" onClick={() => setInput("")} className="gap-2">
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Clear
          </Button>
        </div>
      </section>

      {hasInput ? (
        <section className="grid gap-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-bold sm:text-2xl">Detected additives</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {result.matches.length} known match{result.matches.length === 1 ? "" : "es"}
                {result.unknownCodes.length ? `, ${result.unknownCodes.length} unknown code${result.unknownCodes.length === 1 ? "" : "s"}` : ""}
              </p>
            </div>
          </div>

          {hasResults ? (
            <div className="grid gap-4 sm:gap-5">
              <SummaryPanel counts={counts} unknownCount={result.unknownCodes.length} />
              <ResultActions counts={counts} input={input} result={result} />
              <HighlightedLabel input={input} result={result} />

              {grouped.map(({ group, matches }) =>
                matches.length ? (
                  <div key={group} className="overflow-hidden rounded-lg border bg-card">
                    <div className="border-b px-4 py-3">
                      <h3 className="font-semibold">{riskGuidanceCopy[group].label}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{riskGuidanceCopy[group].description}</p>
                    </div>
                    <div className="divide-y">
                      {matches.map(({ additive, matchedBy, matchedText }) => (
                        <Link key={additive.id} href={`/e/${additive.numericCode}`} className="block p-3 hover:bg-accent sm:p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <p className="font-semibold">
                                {additive.eNumber} · {additive.name}
                              </p>
                              <p className="mt-1 text-sm text-muted-foreground">
                                Matched {matchedBy.replace("-", " ")}: {matchedText}
                              </p>
                              <p className="mt-2 text-sm leading-6 text-muted-foreground">{additive.saferAction}</p>
                            </div>
                            <div className="flex flex-wrap gap-2 sm:max-w-48 sm:justify-end">
                              <StatusBadge status={additive.status} className="px-2 py-1 text-xs sm:px-3 sm:text-sm" />
                              <RiskGuidanceBadge additive={additive} className="px-2 py-1 text-xs sm:px-3 sm:text-sm" />
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : null
              )}

              {result.unknownCodes.length ? (
                <div className="rounded-lg border bg-card p-4 sm:p-5">
                  <h3 className="font-semibold">Unknown E-numbers</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    These codes were found but are not in the current dataset yet.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {result.unknownCodes.map((code) => (
                      <Link
                        key={code.code}
                        href={`/request?code=${encodeURIComponent(code.code)}&context=${encodeURIComponent(input.slice(Math.max(0, code.start - 80), Math.min(input.length, code.end + 80)))}`}
                        className="rounded-full border bg-background px-3 py-1 text-sm font-semibold hover:bg-accent"
                      >
                        Request {code.code}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="rounded-lg border bg-card p-6 text-sm leading-6 text-muted-foreground">
              No E-numbers, names, or aliases were detected. Try including a code like E471 or an ingredient name like lecithin.
            </div>
          )}
        </section>
      ) : null}

      <RecentChecks
        items={recentChecks}
        onLoad={setInput}
        onDelete={deleteRecentCheck}
        onClear={clearRecentChecks}
      />
    </div>
  );
}

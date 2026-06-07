"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SlidersHorizontal, X } from "lucide-react";
import type { Additive, GuidanceConfidence, HalalStatus, SourceSensitivity } from "@/data/additives";
import { StatusBadge } from "@/components/status-badge";
import { RiskGuidanceBadge } from "@/components/risk-guidance-badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getRiskGuidance, riskGuidanceCopy, type RiskGuidance } from "@/lib/risk-guidance";

type FilterState = {
  status: "all" | HalalStatus;
  category: "all" | string;
  sourceSensitivity: "all" | SourceSensitivity;
  guidanceConfidence: "all" | GuidanceConfidence;
  riskGuidance: "all" | RiskGuidance;
};

const initialFilters: FilterState = {
  status: "all",
  category: "all",
  sourceSensitivity: "all",
  guidanceConfidence: "all",
  riskGuidance: "all"
};

const filterButtonBase =
  "min-h-9 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent sm:min-h-10 sm:py-2";

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

function FilterButton({
  active,
  children,
  onClick
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(filterButtonBase, active ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90" : "bg-card")}
    >
      {children}
    </button>
  );
}

function matchesFilters(additive: Additive, filters: FilterState) {
  return (
    (filters.status === "all" || additive.status === filters.status) &&
    (filters.category === "all" || additive.category === filters.category) &&
    (filters.sourceSensitivity === "all" || additive.sourceSensitivity === filters.sourceSensitivity) &&
    (filters.guidanceConfidence === "all" || additive.guidanceConfidence === filters.guidanceConfidence) &&
    (filters.riskGuidance === "all" || getRiskGuidance(additive) === filters.riskGuidance)
  );
}

export function AdditiveBrowser({ additives }: { additives: Additive[] }) {
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const categories = useMemo(() => uniqueSorted(additives.map((additive) => additive.category)), [additives]);

  const filteredAdditives = useMemo(
    () =>
      additives
        .filter((additive) => matchesFilters(additive, filters))
        .sort((a, b) => a.numericCode.localeCompare(b.numericCode, undefined, { numeric: true })),
    [additives, filters]
  );

  const hasActiveFilters = Object.values(filters).some((value) => value !== "all");

  return (
    <section className="container grid gap-5 pb-10 sm:gap-6 sm:pb-14">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold sm:text-2xl">Browse additives</h2>
          <p className="mt-2 text-muted-foreground">
            Filter the dataset by status, category, source sensitivity, confidence, and practical guidance.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          {filteredAdditives.length} of {additives.length}
        </div>
      </div>

      <div className="grid gap-4 rounded-lg border bg-card p-3 sm:p-4">
        <div className="space-y-2">
          <p className="text-sm font-semibold">Status</p>
          <div className="flex flex-wrap gap-2">
            <FilterButton active={filters.status === "all"} onClick={() => setFilters((current) => ({ ...current, status: "all" }))}>
              All
            </FilterButton>
            {(["halal", "haram", "mashbooh"] as const).map((status) => (
              <FilterButton key={status} active={filters.status === status} onClick={() => setFilters((current) => ({ ...current, status }))}>
                {status[0].toUpperCase() + status.slice(1)}
              </FilterButton>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold">Category</p>
          <div className="flex flex-wrap gap-2">
            <FilterButton active={filters.category === "all"} onClick={() => setFilters((current) => ({ ...current, category: "all" }))}>
              All
            </FilterButton>
            {categories.map((category) => (
              <FilterButton
                key={category}
                active={filters.category === category}
                onClick={() => setFilters((current) => ({ ...current, category }))}
              >
                {category}
              </FilterButton>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-semibold">Source sensitivity</p>
            <div className="flex flex-wrap gap-2">
              {(["all", "low", "medium", "high"] as const).map((sourceSensitivity) => (
                <FilterButton
                  key={sourceSensitivity}
                  active={filters.sourceSensitivity === sourceSensitivity}
                  onClick={() => setFilters((current) => ({ ...current, sourceSensitivity }))}
                >
                  {sourceSensitivity[0].toUpperCase() + sourceSensitivity.slice(1)}
                </FilterButton>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold">Confidence</p>
            <div className="flex flex-wrap gap-2">
              {(["all", "low", "medium", "high"] as const).map((guidanceConfidence) => (
                <FilterButton
                  key={guidanceConfidence}
                  active={filters.guidanceConfidence === guidanceConfidence}
                  onClick={() => setFilters((current) => ({ ...current, guidanceConfidence }))}
                >
                  {guidanceConfidence[0].toUpperCase() + guidanceConfidence.slice(1)}
                </FilterButton>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold">Practical guidance</p>
          <div className="flex flex-wrap gap-2">
            <FilterButton
              active={filters.riskGuidance === "all"}
              onClick={() => setFilters((current) => ({ ...current, riskGuidance: "all" }))}
            >
              All
            </FilterButton>
            {(["permissible", "verify", "avoid-if-unclear", "avoid"] as const).map((riskGuidance) => (
              <FilterButton
                key={riskGuidance}
                active={filters.riskGuidance === riskGuidance}
                onClick={() => setFilters((current) => ({ ...current, riskGuidance }))}
              >
                {riskGuidanceCopy[riskGuidance].label}
              </FilterButton>
            ))}
          </div>
        </div>

        {hasActiveFilters ? (
          <div>
            <Button variant="outline" size="sm" onClick={() => setFilters(initialFilters)} className="w-full gap-2 min-[420px]:w-auto">
              <X className="h-4 w-4" aria-hidden="true" />
              Clear filters
            </Button>
          </div>
        ) : null}
      </div>

      {filteredAdditives.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAdditives.map((additive) => (
            <Link key={additive.id} href={`/e/${additive.numericCode}`} className="rounded-lg border bg-card p-3 hover:bg-accent sm:p-4">
              <div className="flex flex-col gap-3 min-[520px]:flex-row min-[520px]:items-start min-[520px]:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold">{additive.eNumber}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{additive.name}</p>
                  <p className="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {additive.category} · {additive.sourceSensitivity} source sensitivity
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 min-[520px]:flex-none min-[520px]:flex-col min-[520px]:items-end">
                  <StatusBadge status={additive.status} className="px-2 py-1 text-xs sm:px-3 sm:text-sm" />
                  <RiskGuidanceBadge additive={additive} className="px-2 py-1 text-xs sm:px-3 sm:text-sm" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border bg-card p-6 text-sm leading-6 text-muted-foreground">
          No additives match these filters. Clear filters or choose a broader category.
        </div>
      )}
    </section>
  );
}

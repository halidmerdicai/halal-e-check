"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/status-badge";
import { RiskGuidanceBadge } from "@/components/risk-guidance-badge";
import { searchAdditives } from "@/lib/search";
import { cn } from "@/lib/utils";

export function SearchBar({ className, autoFocus = false }: { className?: string; autoFocus?: boolean }) {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const results = useMemo(() => searchAdditives(query, 6), [query]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const firstResult = results[0];
    if (firstResult) {
      router.push(`/e/${firstResult.numericCode}`);
      return;
    }

    return;
  }

  return (
    <div className={cn("relative", className)}>
      <form onSubmit={submit} role="search">
        <label className="sr-only" htmlFor="additive-search">
          Search E-numbers
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            id="additive-search"
            autoFocus={autoFocus}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
            }}
            placeholder="Search E471, E120, E322..."
            className="h-[3.25rem] pl-12 pr-4 text-base sm:h-14 sm:text-lg"
            autoComplete="off"
          />
        </div>
      </form>

      {query.trim().length > 0 ? (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-lg border bg-card shadow-soft">
          {results.length > 0 ? (
            <ul className="max-h-[70vh] overflow-auto p-2 sm:max-h-96" role="listbox" aria-label="Search results">
              {results.map((additive) => (
                <li key={additive.id}>
                  <Link
                    href={`/e/${additive.numericCode}`}
                    className="flex min-h-16 flex-col gap-2 rounded-md px-3 py-3 hover:bg-accent min-[520px]:flex-row min-[520px]:items-center min-[520px]:justify-between"
                  >
                    <span className="min-w-0">
                      <span className="block font-semibold">
                        {additive.eNumber} · {additive.name}
                      </span>
                      <span className="block truncate text-sm text-muted-foreground">{additive.category}</span>
                    </span>
                    <span className="flex flex-wrap gap-2 min-[520px]:flex-none min-[520px]:flex-col min-[520px]:items-end">
                      <StatusBadge status={additive.status} className="px-2 py-1 text-xs sm:px-3 sm:text-sm" />
                      <RiskGuidanceBadge additive={additive} className="px-2 py-1 text-xs sm:px-3 sm:text-sm" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-sm text-muted-foreground">
              No matching additive yet. Try a code like E471 or a name like lecithin.
              {query.trim() ? (
                <div className="mt-2 text-foreground">
                  <p>{query.trim().toUpperCase()} is not in the current dataset, so we will not open a detail page for it yet.</p>
                  <Link
                    href={`/request?code=${encodeURIComponent(query.trim().toUpperCase())}`}
                    className="mt-3 inline-flex min-h-10 items-center rounded-md border px-3 py-2 text-sm font-semibold text-primary hover:bg-accent"
                  >
                    Request this additive
                  </Link>
                </div>
              ) : null}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

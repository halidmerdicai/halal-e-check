"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/status-badge";
import { normalizeCode, searchAdditives } from "@/lib/search";
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

    const normalized = normalizeCode(query);
    if (normalized.length > 1) router.push(`/e/${normalized.replace(/^e/, "")}`);
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
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search E471, E120, E322..."
            className="h-14 pl-12 pr-4 text-lg"
            autoComplete="off"
          />
        </div>
      </form>

      {query.trim().length > 0 ? (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-lg border bg-card shadow-soft">
          {results.length > 0 ? (
            <ul className="max-h-96 overflow-auto p-2" role="listbox" aria-label="Search results">
              {results.map((additive) => (
                <li key={additive.id}>
                  <Link
                    href={`/e/${additive.numericCode}`}
                    className="flex min-h-16 items-center justify-between gap-3 rounded-md px-3 py-2 hover:bg-accent"
                  >
                    <span className="min-w-0">
                      <span className="block font-semibold">
                        {additive.eNumber} · {additive.name}
                      </span>
                      <span className="block truncate text-sm text-muted-foreground">{additive.category}</span>
                    </span>
                    <StatusBadge status={additive.status} className="flex-none" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-sm text-muted-foreground">
              No matching additive yet. Try a code like E471 or a name like lecithin.
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

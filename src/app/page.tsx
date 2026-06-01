import Link from "next/link";
import { additives } from "@/data/additives";
import { DisclaimerBox } from "@/components/disclaimer-box";
import { SearchBar } from "@/components/search-bar";
import { StatusBadge } from "@/components/status-badge";
import { statusCopy } from "@/lib/status";

const examples = ["E471", "E433", "E470b", "E491", "E120", "E322"];

export default function HomePage() {
  const emulsifiers = additives
    .filter((additive) => additive.category.toLowerCase().includes("emulsifier"))
    .sort((a, b) => a.numericCode.localeCompare(b.numericCode, undefined, { numeric: true }));

  return (
    <div>
      <section className="border-b bg-secondary/45">
        <div className="container max-w-4xl py-10 sm:py-14">
          <div className="space-y-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Halal E-number search</p>
            <h1 className="text-3xl font-bold leading-tight sm:text-5xl">Search an additive or E-number</h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground">
              Type a code, number, additive name, or alias. Results show general guidance and whether the
              source needs verification.
            </p>
            <SearchBar autoFocus />
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {examples.map((example) => (
              <Link
                key={example}
                href={`/e/${example.replace("E", "")}`}
                className="min-h-11 rounded-full border bg-card px-4 py-2 text-sm font-medium hover:bg-accent"
              >
                {example}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="container grid gap-6 py-8 sm:py-10">
        <div>
          <h2 className="text-2xl font-bold">The three statuses</h2>
          <p className="mt-2 text-muted-foreground">Simple labels for quick guidance, with details on every additive page.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {(["halal", "haram", "mashbooh"] as const).map((status) => (
            <div key={status} className="rounded-lg border bg-card p-5">
              <StatusBadge status={status} />
              <p className="mt-4 text-sm leading-6 text-muted-foreground">{statusCopy[status].meaning}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container grid gap-6 pb-10 sm:pb-14">
        <div>
          <h2 className="text-2xl font-bold">Browse emulsifiers</h2>
          <p className="mt-2 text-muted-foreground">
            These entries are generated from the additive dataset, not hardcoded in the page.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {emulsifiers.map((additive) => (
            <Link key={additive.id} href={`/e/${additive.numericCode}`} className="rounded-lg border bg-card p-4 hover:bg-accent">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">{additive.eNumber}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{additive.name}</p>
                </div>
                <StatusBadge status={additive.status} className="flex-none" />
              </div>
            </Link>
          ))}
        </div>
        <DisclaimerBox />
      </section>
    </div>
  );
}

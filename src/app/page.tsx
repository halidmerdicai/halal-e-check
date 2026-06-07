import Link from "next/link";
import { additives } from "@/data/additives";
import { AdditiveBrowser } from "@/components/additive-browser";
import { DisclaimerBox } from "@/components/disclaimer-box";
import { SearchBar } from "@/components/search-bar";
import { StatusBadge } from "@/components/status-badge";
import { statusCopy } from "@/lib/status";

const examples = ["E471", "E433", "E470b", "E491", "E120", "E322"];

export default function HomePage() {
  return (
    <div>
      <section className="border-b bg-secondary/45">
        <div className="container max-w-4xl py-7 sm:py-14">
          <div className="space-y-4 sm:space-y-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Halal E-number search</p>
            <h1 className="text-3xl font-bold leading-tight sm:text-5xl">Search an additive or E-number</h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground">
              Type a code, number, additive name, or alias. Results show general guidance and whether the
              source needs verification.
            </p>
            <SearchBar autoFocus />
          </div>
          <div className="mt-4 flex flex-wrap gap-2 sm:mt-5">
            {examples.map((example) => (
              <Link
                key={example}
                href={`/e/${example.replace("E", "")}`}
                className="min-h-10 rounded-full border bg-card px-3 py-2 text-sm font-medium hover:bg-accent sm:min-h-11 sm:px-4"
              >
                {example}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="container grid gap-5 py-7 sm:gap-6 sm:py-10">
        <div>
          <h2 className="text-xl font-bold sm:text-2xl">The three statuses</h2>
          <p className="mt-2 text-muted-foreground">Simple labels for quick guidance, with details on every additive page.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {(["halal", "haram", "mashbooh"] as const).map((status) => (
            <div key={status} className="rounded-lg border bg-card p-4 sm:p-5">
              <StatusBadge status={status} className="px-2 py-1 text-xs sm:px-3 sm:text-sm" />
              <p className="mt-3 text-sm leading-6 text-muted-foreground sm:mt-4">{statusCopy[status].meaning}</p>
            </div>
          ))}
        </div>
      </section>

      <AdditiveBrowser additives={additives} />

      <section className="container pb-10 sm:pb-14">
        <DisclaimerBox />
      </section>
    </div>
  );
}

import type { Additive } from "@/data/additives";
import { sensitivityCopy, statusCopy } from "@/lib/status";
import { StatusBadge } from "@/components/status-badge";
import { DisclaimerBox } from "@/components/disclaimer-box";
import { RelatedAdditives } from "@/components/related-additives";
import { VerificationChecklist } from "@/components/verification-checklist";

function ListSection({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">{title}</h2>
      <ul className="grid gap-2 text-sm leading-6 text-muted-foreground">
        {items.map((item) => (
          <li key={item} className="rounded-md border bg-card p-3">
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function AdditiveDetail({ additive }: { additive: Additive }) {
  return (
    <article className="container max-w-4xl py-8 sm:py-12">
      <div className="mb-8 space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={additive.status} />
          <span className="rounded-full border px-3 py-1 text-sm text-muted-foreground">{additive.category}</span>
          <span className="rounded-full border px-3 py-1 text-sm text-muted-foreground">
            {sensitivityCopy[additive.sourceSensitivity]}
          </span>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">{additive.eNumber}</p>
          <h1 className="mt-2 text-4xl font-bold leading-tight sm:text-5xl">{additive.name}</h1>
        </div>
        <p className="text-lg leading-8 text-muted-foreground">{additive.summary}</p>
      </div>

      <div className="grid gap-6">
        <section className="rounded-lg border bg-card p-5">
          <h2 className="text-xl font-semibold">Status meaning</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{statusCopy[additive.status].meaning}</p>
        </section>

        <ListSection title="Usually derived from" items={additive.usuallyDerivedFrom} />
        <ListSection title="When it is halal" items={additive.halalWhen} />
        <ListSection title="When it is not halal" items={additive.haramWhen} />

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">What to check on packaging</h2>
          <VerificationChecklist items={additive.whatToCheck} />
        </section>

        <section className="rounded-lg border bg-accent p-5">
          <h2 className="text-xl font-semibold">Safer action</h2>
          <p className="mt-2 text-sm leading-6">{additive.saferAction}</p>
        </section>

        <ListSection title="Common foods" items={additive.commonFoods} />
        <ListSection title="Notes" items={additive.notes} />

        <p className="text-sm text-muted-foreground">Last reviewed: {additive.lastReviewed}</p>
        <RelatedAdditives additive={additive} />
        <DisclaimerBox />
      </div>
    </article>
  );
}

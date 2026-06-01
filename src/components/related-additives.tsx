import Link from "next/link";
import { additiveById } from "@/data/additives";
import type { Additive } from "@/data/additives";
import { StatusBadge } from "@/components/status-badge";

export function RelatedAdditives({ additive }: { additive: Additive }) {
  const related = additive.related?.map((id) => additiveById.get(id)).filter(Boolean) as Additive[] | undefined;
  if (!related?.length) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">Related additives</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {related.map((item) => (
          <Link key={item.id} href={`/e/${item.numericCode}`} className="rounded-lg border bg-card p-4 hover:bg-accent">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{item.eNumber}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.name}</p>
              </div>
              <StatusBadge status={item.status} />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

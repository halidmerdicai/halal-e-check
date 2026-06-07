import Link from "next/link";
import { additiveById } from "@/data/additives";
import type { Additive } from "@/data/additives";
import { StatusBadge } from "@/components/status-badge";

export function RelatedAdditives({ additive }: { additive: Additive }) {
  const related = additive.related?.map((id) => additiveById.get(id)).filter(Boolean) as Additive[] | undefined;
  if (!related?.length) return null;

  return (
    <section className="space-y-2 sm:space-y-3">
      <h2 className="text-lg font-semibold sm:text-xl">Related additives</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {related.map((item) => (
          <Link key={item.id} href={`/e/${item.numericCode}`} className="rounded-lg border bg-card p-3 hover:bg-accent sm:p-4">
            <div className="flex flex-col gap-3 min-[420px]:flex-row min-[420px]:items-start min-[420px]:justify-between">
              <div className="min-w-0">
                <p className="font-semibold">{item.eNumber}</p>
                <p className="mt-1 break-words text-sm text-muted-foreground">{item.name}</p>
              </div>
              <StatusBadge status={item.status} className="w-fit px-2 py-1 text-xs sm:px-3 sm:text-sm" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

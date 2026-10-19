import type { Additive } from "@/data/additives";
import { getEvidenceNotice } from "@/lib/evidence";

export function EvidenceNotice({ additive }: { additive: Additive }) {
  return <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm leading-6 text-amber-950 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">{getEvidenceNotice(additive)}</p>;
}

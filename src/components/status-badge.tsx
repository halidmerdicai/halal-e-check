import type { Additive, HalalStatus } from "@/data/additives";
import { getEvidenceNotice, hasExpertHalalReview } from "@/lib/evidence";
import { statusCopy } from "@/lib/status";
import { cn } from "@/lib/utils";

const styles: Record<HalalStatus, string> = {
  halal: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  haram: "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200",
  mashbooh: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200"
};

type Props = ({ additive: Additive; status?: never } | { status: HalalStatus; additive?: never }) & { className?: string };

export function StatusBadge({ status, additive, className }: Props) {
  const value = additive?.status ?? status!;
  const provisional = additive && !hasExpertHalalReview(additive);
  return (
    <span title={additive ? getEvidenceNotice(additive) : undefined} className={cn("inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold", provisional ? styles.mashbooh : styles[value], className)}>
      {statusCopy[value].label}{provisional ? " · provisional" : ""}
    </span>
  );
}

import type { HalalStatus } from "@/data/additives";
import { statusCopy } from "@/lib/status";
import { cn } from "@/lib/utils";

const styles: Record<HalalStatus, string> = {
  halal: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  haram: "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200",
  mashbooh: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200"
};

export function StatusBadge({ status, className }: { status: HalalStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold", styles[status], className)}>
      {statusCopy[status].label}
    </span>
  );
}

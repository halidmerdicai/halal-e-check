import type { Additive } from "@/data/additives";
import { getRiskGuidance, riskGuidanceCopy } from "@/lib/risk-guidance";
import { cn } from "@/lib/utils";

const styles = {
  permissible:
    "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  verify: "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-200",
  "avoid-if-unclear": "border-orange-200 bg-orange-50 text-orange-900 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-200",
  avoid: "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
};

export function RiskGuidanceBadge({ additive, className }: { additive: Additive; className?: string }) {
  const guidance = getRiskGuidance(additive);

  return (
    <span className={cn("inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold", styles[guidance], className)}>
      {riskGuidanceCopy[guidance].label}
    </span>
  );
}

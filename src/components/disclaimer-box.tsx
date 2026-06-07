import { AlertTriangle } from "lucide-react";

export function DisclaimerBox() {
  return (
    <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 flex-none" aria-hidden="true" />
        <p>
          This tool provides general halal ingredient guidance, not a product certification or fatwa. A final product
          ruling may depend on source, processing, contamination risk, and certification. Verify doubtful ingredients
          with the manufacturer or a trusted halal certifier.
        </p>
      </div>
    </section>
  );
}

import type { Metadata } from "next";
import { DisclaimerBox } from "@/components/disclaimer-box";
import { VerificationChecklist } from "@/components/verification-checklist";

export const metadata: Metadata = {
  title: "Guide",
  description: "Learn what E-numbers are and how to verify source-dependent additives."
};

export default function GuidePage() {
  return (
    <div className="container max-w-3xl py-10 sm:py-14">
      <div className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Halal ingredient guide</p>
        <h1 className="text-4xl font-bold leading-tight">How to read E-numbers</h1>
        <p className="text-lg leading-8 text-muted-foreground">
          E-numbers are standardized codes for food additives. The code tells you what the additive is,
          but it does not always tell you the source or manufacturing process.
        </p>
      </div>

      <div className="mt-8 grid gap-6">
        <section className="rounded-lg border bg-card p-5">
          <h2 className="text-xl font-semibold">Why some are questionable</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Some additives can be produced from plant oils, microbial fermentation, synthetic inputs, pork,
            insects, or non-halal animal sources. The same E-number can therefore have different halal outcomes.
          </p>
        </section>
        <section className="rounded-lg border bg-card p-5">
          <h2 className="text-xl font-semibold">Why E471 is source-dependent</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            E471 is made from fatty acids. Those fatty acids may come from vegetable oils or animal fats.
            If the label only says E471, the safer step is to verify whether the source is plant-based or halal-certified.
          </p>
        </section>
        <section className="rounded-lg border bg-card p-5">
          <h2 className="text-xl font-semibold">Why certification still matters</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            A vegan label can help identify plant-derived ingredients, but halal certification also considers
            processing aids, cross-contamination, alcohol concerns, and the full finished product.
          </p>
        </section>
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">How to verify ingredients</h2>
          <VerificationChecklist />
        </section>
        <DisclaimerBox />
      </div>
    </div>
  );
}

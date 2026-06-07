import type { Metadata } from "next";
import Link from "next/link";
import { DisclaimerBox } from "@/components/disclaimer-box";
import { VerificationChecklist } from "@/components/verification-checklist";

export const metadata: Metadata = {
  title: "Guide",
  description: "Learn what E-numbers are and how to verify source-dependent additives."
};

export default function GuidePage() {
  return (
    <div className="container max-w-3xl py-7 sm:py-14">
      <div className="space-y-3 sm:space-y-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Halal ingredient guide</p>
        <h1 className="text-3xl font-bold leading-tight sm:text-4xl">How to read E-numbers</h1>
        <p className="text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
          E-numbers are standardized codes for food additives. The code tells you what the additive is, but it does not
          always tell you the source or manufacturing process.
        </p>
      </div>

      <div className="mt-6 grid gap-5 sm:mt-8 sm:gap-6">
        <section className="rounded-lg border bg-card p-4 sm:p-5">
          <h2 className="text-lg font-semibold sm:text-xl">Why some additives are questionable</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Some additives can be produced from plant oils, microbial fermentation, synthetic inputs, pork, insects, or
            non-halal animal sources. The same E-number can therefore have different halal outcomes.
          </p>
        </section>
        <section className="rounded-lg border bg-card p-4 sm:p-5">
          <h2 className="text-lg font-semibold sm:text-xl">Why avoid if unclear is separate</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            The app keeps the core statuses simple: halal, haram, and mashbooh. Some mashbooh additives are high-risk
            because they may be pork, non-halal animal, insect, alcohol-carrier, or source-dependent. For those, the
            practical guidance says to avoid the product if the source is not clear.
          </p>
        </section>
        <section className="rounded-lg border bg-card p-4 sm:p-5">
          <h2 className="text-lg font-semibold sm:text-xl">Why E471 is source-dependent</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            E471 is made from fatty acids. Those fatty acids may come from vegetable oils or animal fats. If the label
            only says E471, the safer step is to verify whether the source is plant-based, halal-certified, or otherwise
            accepted by a trusted halal authority.
          </p>
        </section>
        <section className="rounded-lg border bg-card p-4 sm:p-5">
          <h2 className="text-lg font-semibold sm:text-xl">Why certification still matters</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            A vegan label can help identify plant-derived ingredients, but halal certification also considers processing
            aids, cross-contamination, alcohol concerns, and the full finished product.
          </p>
        </section>
        <section className="rounded-lg border bg-accent p-4 sm:p-5">
          <h2 className="text-lg font-semibold sm:text-xl">How guidance is produced</h2>
          <p className="mt-2 text-sm leading-6">
            The methodology page explains statuses, practical guidance labels, source categories, and the limits of the
            app&apos;s advice.
          </p>
          <Link href="/methodology" className="mt-3 inline-flex text-sm font-semibold text-primary hover:underline">
            Read the methodology
          </Link>
        </section>
        <section className="space-y-2 sm:space-y-3">
          <h2 className="text-lg font-semibold sm:text-xl">How to verify ingredients</h2>
          <VerificationChecklist />
        </section>
        <DisclaimerBox />
      </div>
    </div>
  );
}

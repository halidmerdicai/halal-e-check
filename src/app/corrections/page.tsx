import type { Metadata } from "next";
import { Suspense } from "react";
import { CorrectionForm } from "@/components/correction-form";
import { DisclaimerBox } from "@/components/disclaimer-box";

export const metadata: Metadata = {
  title: "Suggest Correction",
  description: "Suggest a correction, source update, or review note for a Halal E-Check additive record."
};

export default function CorrectionsPage() {
  return (
    <div className="container max-w-3xl py-7 sm:py-14">
      <div className="space-y-3 sm:space-y-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Correction flow</p>
        <h1 className="text-3xl font-bold leading-tight sm:text-4xl">Suggest a correction</h1>
        <p className="text-base leading-7 text-muted-foreground">
          Use this form when an additive page looks incomplete, a source link is weak, or the halal guidance needs
          review. This static version does not send submissions to a server yet, so copy the correction or open it in
          your email app.
        </p>
      </div>
      <div className="mt-6 sm:mt-8">
        <Suspense fallback={<div className="rounded-lg border bg-card p-5 text-sm text-muted-foreground">Loading correction form...</div>}>
          <CorrectionForm />
        </Suspense>
      </div>
      <div className="mt-8">
        <DisclaimerBox />
      </div>
    </div>
  );
}

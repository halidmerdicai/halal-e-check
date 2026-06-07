import type { Metadata } from "next";
import { Suspense } from "react";
import { AdditiveRequestForm } from "@/components/additive-request-form";
import { DisclaimerBox } from "@/components/disclaimer-box";

export const metadata: Metadata = {
  title: "Request Additive",
  description: "Request a missing additive or E-number for Halal E-Check review."
};

export default function RequestPage() {
  return (
    <div className="container max-w-3xl py-7 sm:py-14">
      <div className="space-y-3 sm:space-y-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Missing additive</p>
        <h1 className="text-3xl font-bold leading-tight sm:text-4xl">Request an additive review</h1>
        <p className="text-base leading-7 text-muted-foreground">
          Use this form when a code is missing or an ingredient needs review. You can copy the request or open it in
          your email app addressed to the Halal E-Check contact email.
        </p>
      </div>
      <div className="mt-6 sm:mt-8">
        <Suspense fallback={<div className="rounded-lg border bg-card p-5 text-sm text-muted-foreground">Loading request form...</div>}>
          <AdditiveRequestForm />
        </Suspense>
      </div>
      <div className="mt-8">
        <DisclaimerBox />
      </div>
    </div>
  );
}

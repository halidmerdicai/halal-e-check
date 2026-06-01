import type { Metadata } from "next";
import { DisclaimerBox } from "@/components/disclaimer-box";

export const metadata: Metadata = {
  title: "Disclaimer",
  description: "Important limits of Halal E-Check guidance."
};

export default function DisclaimerPage() {
  return (
    <div className="container max-w-3xl py-10 sm:py-14">
      <h1 className="text-4xl font-bold">Disclaimer</h1>
      <div className="mt-6 space-y-5 text-base leading-8 text-muted-foreground">
        <p>
          Halal E-Check provides general ingredient guidance only. It is not a fatwa and does not replace
          a qualified halal certifier, scholar, manufacturer statement, or product-specific audit.
        </p>
        <p>
          A finished product may be affected by the additive source, manufacturing process, processing aids,
          contamination risk, alcohol carriers, and certification status.
        </p>
      </div>
      <div className="mt-8">
        <DisclaimerBox />
      </div>
    </div>
  );
}

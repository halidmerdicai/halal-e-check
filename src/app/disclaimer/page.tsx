import type { Metadata } from "next";
import { DisclaimerBox } from "@/components/disclaimer-box";

export const metadata: Metadata = {
  title: "Disclaimer",
  description: "Important limits of Halal E-Check guidance."
};

export default function DisclaimerPage() {
  return (
    <div className="container max-w-3xl py-7 sm:py-14">
      <h1 className="text-3xl font-bold leading-tight sm:text-4xl">Disclaimer</h1>
      <div className="mt-5 space-y-4 text-base leading-8 text-muted-foreground sm:mt-6 sm:space-y-5">
        <p>
          Halal E-Check provides general ingredient guidance only. It is not a fatwa and does not replace a qualified
          halal certifier, scholar, manufacturer statement, or product-specific audit.
        </p>
        <p>
          A finished product may be affected by the additive source, manufacturing process, processing aids,
          contamination risk, alcohol carriers, and certification status.
        </p>
        <p>
          When an ingredient is source-dependent or unclear, use the app as a prompt to verify the product, not as a
          final ruling.
        </p>
      </div>
      <div className="mt-8">
        <DisclaimerBox />
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { DisclaimerBox } from "@/components/disclaimer-box";
import { IngredientChecker } from "@/components/ingredient-checker";

export const metadata: Metadata = {
  title: "Ingredient Checker",
  description: "Paste a food ingredients label and detect E-numbers and additives with halal guidance."
};

export default function CheckPage() {
  return (
    <div className="container max-w-4xl py-7 sm:py-14">
      <div className="space-y-3 sm:space-y-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Ingredient list check</p>
        <h1 className="text-3xl font-bold leading-tight sm:text-4xl">Paste a label and check additives</h1>
        <p className="max-w-3xl text-base leading-7 text-muted-foreground">
          Detect known E-numbers, additive names, and aliases in a full ingredient list. Results are grouped by
          practical guidance so source-dependent additives are easier to spot.
        </p>
      </div>
      <div className="mt-6 sm:mt-8">
        <IngredientChecker />
      </div>
      <div className="mt-8">
        <DisclaimerBox />
      </div>
    </div>
  );
}

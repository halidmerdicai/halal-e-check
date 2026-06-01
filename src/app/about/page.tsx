import type { Metadata } from "next";
import { DisclaimerBox } from "@/components/disclaimer-box";

export const metadata: Metadata = {
  title: "About",
  description: "About Halal E-Check and its guidance-first approach."
};

export default function AboutPage() {
  return (
    <div className="container max-w-3xl py-10 sm:py-14">
      <h1 className="text-4xl font-bold">About Halal E-Check</h1>
      <div className="mt-6 space-y-5 text-base leading-8 text-muted-foreground">
        <p>
          Halal E-Check is a simple public utility for checking E-numbers and food additives. It is designed
          to explain common source concerns quickly, especially for additives that can be plant-based,
          animal-derived, insect-derived, or produced through fermentation.
        </p>
        <p>
          The MVP uses a local typed dataset so it stays fast, easy to audit, and ready to move to a database
          such as Supabase or Postgres later.
        </p>
      </div>
      <div className="mt-8">
        <DisclaimerBox />
      </div>
    </div>
  );
}

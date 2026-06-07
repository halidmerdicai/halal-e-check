import type { Metadata } from "next";
import Link from "next/link";
import { DisclaimerBox } from "@/components/disclaimer-box";

export const metadata: Metadata = {
  title: "About",
  description: "About Halal E-Check and its guidance-first approach."
};

export default function AboutPage() {
  return (
    <div className="container max-w-3xl py-7 sm:py-14">
      <h1 className="text-3xl font-bold leading-tight sm:text-4xl">About Halal E-Check</h1>
      <div className="mt-5 space-y-4 text-base leading-8 text-muted-foreground sm:mt-6 sm:space-y-5">
        <p>
          Halal E-Check is a public utility for checking E-numbers and food additives. It explains common source
          concerns quickly, especially when an additive may be plant-based, animal-derived, insect-derived, synthetic,
          or fermentation-derived.
        </p>
        <p>
          The app is guidance-first. It helps users decide what to verify, but it does not certify products or replace
          a qualified halal certifier, scholar, or manufacturer statement.
        </p>
        <p>
          The classification approach is documented on the{" "}
          <Link href="/methodology" className="font-semibold text-primary hover:underline">
            methodology page
          </Link>
          .
        </p>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Link href="/check" className="rounded-lg border bg-card p-4 text-sm font-semibold text-primary hover:bg-accent">
          Check an ingredient label
        </Link>
        <Link href="/corrections" className="rounded-lg border bg-card p-4 text-sm font-semibold text-primary hover:bg-accent">
          Suggest a correction
        </Link>
      </div>
      <div className="mt-8">
        <DisclaimerBox />
      </div>
    </div>
  );
}

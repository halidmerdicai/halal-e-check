import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, FileSearch, HelpCircle, ShieldAlert } from "lucide-react";
import { DisclaimerBox } from "@/components/disclaimer-box";

export const metadata: Metadata = {
  title: "Methodology",
  description: "How Halal E-Check classifies additives, practical guidance, source confidence, and data limitations."
};

const statuses = [
  {
    title: "Halal",
    text: "Generally accepted or usually permissible as an additive when the finished product has no other halal concerns."
  },
  {
    title: "Mashbooh",
    text: "Questionable, source-dependent, process-dependent, or in need of verification."
  },
  {
    title: "Haram",
    text: "Clearly forbidden or strongly avoided by many halal consumers based on the additive source or common use."
  }
];

const guidance = [
  {
    title: "Generally OK",
    icon: CheckCircle2,
    text: "The additive itself is usually low concern, but the full ingredient list and product certification still matter."
  },
  {
    title: "Verify source",
    icon: HelpCircle,
    text: "The additive may be acceptable, but the source, carrier, solvent, processing aid, or certification should be checked."
  },
  {
    title: "Avoid if unclear",
    icon: AlertTriangle,
    text: "Treat the additive as avoid unless the source is plant, vegan, halal-certified, or manufacturer-confirmed."
  },
  {
    title: "Avoid",
    icon: ShieldAlert,
    text: "Strongly avoid unless a trusted halal authority explicitly accepts the specific product and process."
  }
];

const sourceTypes = [
  {
    title: "Identity",
    text: "Used to confirm what an E-number or additive name refers to. Identity sources do not determine halal status by themselves."
  },
  {
    title: "Regulatory",
    text: "Official food authority or labeling references. These are useful for naming, permitted-use, and declaration context."
  },
  {
    title: "Halal guidance",
    text: "Halal-certifier or halal-standards references used to support source-sensitive guidance."
  },
  {
    title: "Manufacturer needed",
    text: "A signal that the additive name alone cannot prove the actual source used in a finished product."
  },
  {
    title: "Editorial",
    text: "Halal E-Check review notes based on source-risk patterns. Editorial notes are useful context, not a final ruling."
  }
];

export default function MethodologyPage() {
  return (
    <div className="container max-w-4xl py-10 sm:py-14">
      <div className="max-w-3xl space-y-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Trust and transparency</p>
        <h1 className="text-4xl font-bold leading-tight">How Halal E-Check produces guidance</h1>
        <p className="text-lg leading-8 text-muted-foreground">
          Halal E-Check separates additive identity, halal status, practical shopping guidance, and data confidence.
          This keeps the app useful without pretending that an E-number alone can certify a finished product.
        </p>
      </div>

      <div className="mt-8 grid gap-6">
        <section className="rounded-lg border bg-card p-5">
          <h2 className="text-xl font-semibold">Core principle</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            The app classifies additives by source risk. Some additives are usually plant, mineral, synthetic, or
            microbial. Others may come from pork, non-halal animal sources, insects, animal bones, glycerol, fatty acids,
            alcohol carriers, or mixed supply chains. When the source can change, the app marks the additive as
            source-dependent instead of giving false certainty.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {statuses.map((status) => (
            <div key={status.title} className="rounded-lg border bg-card p-5">
              <h2 className="text-lg font-semibold">{status.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{status.text}</p>
            </div>
          ))}
        </section>

        <section className="rounded-lg border bg-card p-5">
          <h2 className="text-xl font-semibold">Practical guidance</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            The status field stays simple: halal, mashbooh, or haram. Practical guidance is a second layer that tells a
            shopper what to do with that information.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {guidance.map(({ title, text, icon: Icon }) => (
              <div key={title} className="rounded-md border bg-background p-4">
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  <h3 className="font-semibold">{title}</h3>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border bg-card p-5">
          <h2 className="text-xl font-semibold">Source categories</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Additive pages show source labels so users can distinguish identity references from halal guidance and
            manufacturer-verification warnings.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {sourceTypes.map((sourceType) => (
              <div key={sourceType.title} className="rounded-md border bg-background p-4">
                <h3 className="font-semibold">{sourceType.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{sourceType.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border bg-card p-5">
          <div className="flex gap-3">
            <FileSearch className="mt-1 h-5 w-5 flex-none text-primary" aria-hidden="true" />
            <div>
              <h2 className="text-xl font-semibold">What the app does not do</h2>
              <div className="mt-2 space-y-3 text-sm leading-6 text-muted-foreground">
                <p>
                  Halal E-Check does not certify products, issue fatwas, audit factories, inspect supply chains, or
                  guarantee the halal status of a finished food.
                </p>
                <p>
                  It also does not assume every source-dependent additive is haram. Instead, it tells users when the
                  source must be verified with a manufacturer, vegan/plant claim, halal certificate, or trusted halal
                  authority.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-lg border bg-accent p-5">
          <h2 className="text-xl font-semibold">How this improves over time</h2>
          <p className="mt-2 text-sm leading-6">
            Source-sensitive records can improve as stronger references, manufacturer statements, and halal guidance
            become available. If a page looks incomplete or a source is weak, send a correction suggestion.
          </p>
          <Link href="/corrections" className="mt-3 inline-flex text-sm font-semibold text-primary hover:underline">
            Suggest a correction
          </Link>
        </section>

        <DisclaimerBox />
      </div>
    </div>
  );
}

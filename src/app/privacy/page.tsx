import type { Metadata } from "next";
import Link from "next/link";
import { Mail } from "lucide-react";
import { DisclaimerBox } from "@/components/disclaimer-box";

const contactEmail = "halidmerdicai@gmail.com";

export const metadata: Metadata = {
  title: "Privacy and Contact",
  description: "Privacy notes and contact details for Halal E-Check requests and correction emails."
};

export default function PrivacyPage() {
  return (
    <div className="container max-w-3xl py-7 sm:py-14">
      <div className="space-y-3 sm:space-y-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Privacy and contact</p>
        <h1 className="text-3xl font-bold leading-tight sm:text-4xl">How contact requests work</h1>
        <p className="text-base leading-7 text-muted-foreground">
          Halal E-Check is a static guidance app. Request and correction forms prepare an email from your own email app;
          they do not store submissions in the website.
        </p>
      </div>

      <div className="mt-7 grid gap-4 sm:mt-8">
        <section className="rounded-lg border bg-card p-4 sm:p-5">
          <h2 className="text-lg font-bold">Contact email</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Additive requests, correction suggestions, and general contact can be sent to:
          </p>
          <a
            href={`mailto:${contactEmail}`}
            className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm font-semibold text-primary hover:bg-accent"
          >
            <Mail className="h-4 w-4" aria-hidden="true" />
            {contactEmail}
          </a>
        </section>

        <section className="rounded-lg border bg-card p-4 sm:p-5">
          <h2 className="text-lg font-bold">What may be included in emails</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            If you send a request or correction, your email may include the ingredient text, additive code, product
            context, links, notes, and your email address. Avoid sending personal information that is not needed for the
            review.
          </p>
        </section>

        <section className="rounded-lg border bg-card p-4 sm:p-5">
          <h2 className="text-lg font-bold">No product certification</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            The app provides general additive guidance only. It does not certify products, issue fatwas, or replace a
            qualified halal certifier, scholar, manufacturer statement, or product-specific audit.
          </p>
        </section>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/request" className="rounded-md border bg-card px-4 py-2 text-sm font-semibold hover:bg-accent">
          Request additive review
        </Link>
        <Link href="/corrections" className="rounded-md border bg-card px-4 py-2 text-sm font-semibold hover:bg-accent">
          Suggest correction
        </Link>
      </div>

      <div className="mt-8">
        <DisclaimerBox />
      </div>
    </div>
  );
}

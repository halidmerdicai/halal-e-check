"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Copy, Mail, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const contactEmail = "halidmerdicai@gmail.com";

function cleanParam(value: string | null) {
  return value?.trim() ?? "";
}

function buildCorrectionText({
  code,
  name,
  issue,
  sourceUrl,
  context,
  requestedAt
}: {
  code: string;
  name: string;
  issue: string;
  sourceUrl: string;
  context: string;
  requestedAt: string;
}) {
  return [
    "Halal E-Check correction suggestion",
    "",
    `Additive: ${[code, name].filter(Boolean).join(" - ") || "Not provided"}`,
    "",
    "Issue or suggested correction:",
    issue || "Not provided",
    "",
    "Supporting source URL:",
    sourceUrl || "Not provided",
    "",
    "Additional context:",
    context || "Not provided",
    "",
    `Submitted at: ${requestedAt}`
  ].join("\n");
}

export function CorrectionForm() {
  const searchParams = useSearchParams();
  const initialCode = cleanParam(searchParams.get("code"));
  const initialName = cleanParam(searchParams.get("name"));
  const initialContext = cleanParam(searchParams.get("context"));
  const [code, setCode] = useState(initialCode);
  const [name, setName] = useState(initialName);
  const [issue, setIssue] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [context, setContext] = useState(initialContext);
  const [status, setStatus] = useState("");
  const [requestedAt, setRequestedAt] = useState("Pending");

  useEffect(() => {
    setRequestedAt(new Date().toISOString());
  }, []);

  const correctionText = useMemo(
    () => buildCorrectionText({ code, context, issue, name, requestedAt, sourceUrl }),
    [code, context, issue, name, requestedAt, sourceUrl]
  );

  const mailtoHref = useMemo(() => {
    const subject = encodeURIComponent(`Halal E-Check correction${code ? `: ${code}` : ""}`);
    const body = encodeURIComponent(correctionText);
    return `mailto:${contactEmail}?subject=${subject}&body=${body}`;
  }, [code, correctionText]);

  async function copyCorrection() {
    try {
      await navigator.clipboard.writeText(correctionText);
      setStatus("Correction text copied.");
    } catch {
      setStatus("Copy failed. Select and copy the correction text manually.");
    }
  }

  function resetForm() {
    setCode("");
    setName("");
    setIssue("");
    setSourceUrl("");
    setContext("");
    setStatus("");
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-lg border bg-card p-5">
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="correction-code" className="text-sm font-semibold">
                E-number or additive code
              </label>
              <Input
                id="correction-code"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="E471"
                className="mt-2"
              />
            </div>
            <div>
              <label htmlFor="correction-name" className="text-sm font-semibold">
                Additive name
              </label>
              <Input
                id="correction-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Mono- and diglycerides"
                className="mt-2"
              />
            </div>
          </div>

          <div>
            <label htmlFor="correction-issue" className="text-sm font-semibold">
              Issue or suggested correction
            </label>
            <textarea
              id="correction-issue"
              value={issue}
              onChange={(event) => setIssue(event.target.value)}
              placeholder="Example: the page should mention that this additive can also be fermentation-derived..."
              className="mt-2 min-h-32 w-full rounded-md border border-input bg-background p-3 text-base leading-7 shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div>
            <label htmlFor="correction-source" className="text-sm font-semibold">
              Supporting source URL
            </label>
            <Input
              id="correction-source"
              value={sourceUrl}
              onChange={(event) => setSourceUrl(event.target.value)}
              placeholder="https://..."
              className="mt-2"
            />
          </div>

          <div>
            <label htmlFor="correction-context" className="text-sm font-semibold">
              Additional context
            </label>
            <textarea
              id="correction-context"
              value={context}
              onChange={(event) => setContext(event.target.value)}
              placeholder="Paste page text, label text, or source notes..."
              className="mt-2 min-h-28 w-full rounded-md border border-input bg-background p-3 text-base leading-7 shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button type="button" onClick={copyCorrection} className="gap-2">
            <Copy className="h-4 w-4" aria-hidden="true" />
            Copy correction
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <a href={mailtoHref}>
              <Mail className="h-4 w-4" aria-hidden="true" />
              Open email
            </a>
          </Button>
          <Button type="button" variant="outline" onClick={resetForm} className="gap-2">
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Reset
          </Button>
        </div>
        {status ? <p className="mt-3 text-sm font-medium text-primary">{status}</p> : null}
      </section>

      <section className="rounded-lg border bg-card p-5">
        <h2 className="text-lg font-semibold">Correction preview</h2>
        <pre className="mt-3 whitespace-pre-wrap rounded-md border bg-background p-4 text-sm leading-6 text-muted-foreground">
          {correctionText}
        </pre>
      </section>
    </div>
  );
}

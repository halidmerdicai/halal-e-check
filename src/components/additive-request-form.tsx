"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Copy, Mail, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function cleanParam(value: string | null) {
  return value?.trim() ?? "";
}

function buildRequestText({
  code,
  notes,
  context,
  requestedAt
}: {
  code: string;
  notes: string;
  context: string;
  requestedAt: string;
}) {
  return [
    "Halal E-Check additive request",
    "",
    `Code: ${code || "Not provided"}`,
    "",
    "Name/source notes:",
    notes || "Not provided",
    "",
    "Ingredient context:",
    context || "Not provided",
    "",
    `Requested at: ${requestedAt}`
  ].join("\n");
}

export function AdditiveRequestForm() {
  const searchParams = useSearchParams();
  const initialCode = cleanParam(searchParams.get("code"));
  const initialContext = cleanParam(searchParams.get("context"));
  const [code, setCode] = useState(initialCode);
  const [notes, setNotes] = useState("");
  const [context, setContext] = useState(initialContext);
  const [status, setStatus] = useState("");
  const [requestedAt, setRequestedAt] = useState("Pending");

  useEffect(() => {
    setRequestedAt(new Date().toISOString());
  }, []);

  const requestText = useMemo(() => buildRequestText({ code, notes, context, requestedAt }), [code, context, notes, requestedAt]);
  const mailtoHref = useMemo(() => {
    const subject = encodeURIComponent(`Halal E-Check additive request${code ? `: ${code}` : ""}`);
    const body = encodeURIComponent(requestText);
    return `mailto:?subject=${subject}&body=${body}`;
  }, [code, requestText]);

  async function copyRequest() {
    try {
      await navigator.clipboard.writeText(requestText);
      setStatus("Request text copied.");
    } catch {
      setStatus("Copy failed. Select and copy the request text manually.");
    }
  }

  function resetForm() {
    setCode("");
    setNotes("");
    setContext("");
    setStatus("");
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-lg border bg-card p-5">
        <div className="grid gap-4">
          <div>
            <label htmlFor="request-code" className="text-sm font-semibold">
              E-number or additive code
            </label>
            <Input
              id="request-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="E999"
              className="mt-2"
            />
          </div>
          <div>
            <label htmlFor="request-notes" className="text-sm font-semibold">
              Name or source notes
            </label>
            <textarea
              id="request-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Example: label says glazing agent, source not listed..."
              className="mt-2 min-h-28 w-full rounded-md border border-input bg-background p-3 text-base leading-7 shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div>
            <label htmlFor="request-context" className="text-sm font-semibold">
              Ingredient context
            </label>
            <textarea
              id="request-context"
              value={context}
              onChange={(event) => setContext(event.target.value)}
              placeholder="Paste the ingredient line or surrounding text..."
              className="mt-2 min-h-32 w-full rounded-md border border-input bg-background p-3 text-base leading-7 shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button type="button" onClick={copyRequest} className="gap-2">
            <Copy className="h-4 w-4" aria-hidden="true" />
            Copy request
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
        <h2 className="text-lg font-semibold">Request preview</h2>
        <pre className="mt-3 whitespace-pre-wrap rounded-md border bg-background p-4 text-sm leading-6 text-muted-foreground">
          {requestText}
        </pre>
      </section>
    </div>
  );
}

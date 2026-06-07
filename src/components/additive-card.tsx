import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Additive } from "@/data/additives";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { RiskGuidanceBadge } from "@/components/risk-guidance-badge";

export function AdditiveCard({ additive }: { additive: Additive }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle>
            {additive.eNumber} · {additive.name}
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">{additive.category}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusBadge status={additive.status} />
          <RiskGuidanceBadge additive={additive} />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-muted-foreground">{additive.summary}</p>
        <Link
          href={`/e/${additive.numericCode}`}
          className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          View guidance
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </CardContent>
    </Card>
  );
}

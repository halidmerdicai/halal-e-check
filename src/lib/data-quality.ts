import type { Additive, AdditiveSource } from "@/data/additives";
import { getEditorialRiskGuidance } from "@/lib/risk-guidance";
import { hasExpertHalalReview, hasHalalGuidanceSource } from "@/lib/evidence";
import { getRiskScore } from "@/lib/risk";

export type DataQualityIssueKey =
  | "missingExternalSource"
  | "missingTypedSource"
  | "highRiskMissingGuidanceSource"
  | "lowConfidence"
  | "manufacturerNeeded"
  | "staleReview"
  | "expertReviewPending";

export type DataQualityIssue = {
  key: DataQualityIssueKey;
  label: string;
  description: string;
  records: Additive[];
};

export type DataQualitySummary = {
  total: number;
  withExternalSources: number;
  withTypedSources: number;
  highRisk: number;
  lowConfidence: number;
  manufacturerNeeded: number;
  staleReview: number;
  expertReviewPending: number;
};

const staleReviewDays = 180;

function hasSourceType(additive: Additive, type: NonNullable<AdditiveSource["type"]>) {
  return additive.sources.some((source) => source.type === type);
}

function hasExternalSource(additive: Additive) {
  return additive.sources.some((source) => Boolean(source.url));
}

function hasTypedSource(additive: Additive) {
  return additive.sources.length > 0 && additive.sources.every((source) => Boolean(source.type));
}

function reviewAgeDays(additive: Additive, referenceDate: Date) {
  const reviewedAt = new Date(`${additive.lastReviewed}T00:00:00Z`);
  if (Number.isNaN(reviewedAt.getTime())) return Number.POSITIVE_INFINITY;

  return Math.floor((referenceDate.getTime() - reviewedAt.getTime()) / 86_400_000);
}

export function isHighRiskRecord(additive: Additive) {
  return additive.status !== "halal" || additive.sourceSensitivity === "high" || getEditorialRiskGuidance(additive) !== "permissible";
}

export function getDataQuality(additives: Additive[], referenceDate = new Date()) {
  const highRiskRecords = additives.filter(isHighRiskRecord);
  const missingExternalSource = additives.filter((additive) => !hasExternalSource(additive));
  const missingTypedSource = additives.filter((additive) => !hasTypedSource(additive));
  const highRiskMissingGuidanceSource = highRiskRecords.filter(
    (additive) => !hasHalalGuidanceSource(additive)
  );
  const lowConfidence = additives.filter((additive) => additive.guidanceConfidence === "low");
  const manufacturerNeeded = additives.filter((additive) => hasSourceType(additive, "manufacturer-needed"));
  const staleReview = additives.filter((additive) => reviewAgeDays(additive, referenceDate) > staleReviewDays);
  const expertReviewPending = additives.filter((additive) => !hasExpertHalalReview(additive));

  const issues: DataQualityIssue[] = [
    {
      key: "expertReviewPending",
      label: "Expert halal review pending",
      description: "These records are explicitly provisional. Generally OK is withheld until a named, dated expert review is tied to additive-specific halal evidence. Editorial confidence does not close this task.",
      records: expertReviewPending
    },
    {
      key: "highRiskMissingGuidanceSource",
      label: "High-risk records missing linked halal guidance",
      description: "Identity and regulatory approval do not establish halal status. These records remain provisional until relevant halal evidence and expert review are recorded.",
      records: highRiskMissingGuidanceSource
    },
    {
      key: "missingTypedSource",
      label: "Records missing typed source categories",
      description: "Source labels should be categorized as identity, regulatory, halal guidance, manufacturer needed, or editorial.",
      records: missingTypedSource
    },
    {
      key: "missingExternalSource",
      label: "Records missing external URL source",
      description: "Every record should have at least one external identity, regulatory, or guidance link before launch.",
      records: missingExternalSource
    },
    {
      key: "lowConfidence",
      label: "Low-confidence records",
      description: "These records need manual review before they should be marketed as reliable.",
      records: lowConfidence
    },
    {
      key: "manufacturerNeeded",
      label: "Manufacturer verification needed",
      description: "These records are source-dependent enough that users should verify the actual product source.",
      records: manufacturerNeeded
    },
    {
      key: "staleReview",
      label: "Reviews older than 180 days",
      description: "Older reviews should be revisited before a polished public launch.",
      records: staleReview
    }
  ];

  const summary: DataQualitySummary = {
    total: additives.length,
    withExternalSources: additives.length - missingExternalSource.length,
    withTypedSources: additives.length - missingTypedSource.length,
    highRisk: highRiskRecords.length,
    lowConfidence: lowConfidence.length,
    manufacturerNeeded: manufacturerNeeded.length,
    staleReview: staleReview.length,
    expertReviewPending: expertReviewPending.length
  };

  const priorityRecords = additives
    .map((additive) => ({
      additive,
      riskScore: getRiskScore(additive),
      issueCount: issues.reduce((count, issue) => count + (issue.records.some((record) => record.id === additive.id) ? 1 : 0), 0)
    }))
    .filter((item) => item.issueCount > 0)
    .sort(
      (a, b) =>
        b.issueCount - a.issueCount ||
        b.riskScore - a.riskScore ||
        a.additive.numericCode.localeCompare(b.additive.numericCode, undefined, { numeric: true })
    );

  return {
    issues,
    priorityRecords,
    summary
  };
}

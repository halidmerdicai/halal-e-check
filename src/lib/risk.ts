import type { Additive } from "@/data/additives";
import { getRiskGuidance } from "@/lib/risk-guidance";

export type ReviewQueueReasonKey =
  | "avoid"
  | "avoid-if-unclear"
  | "mashbooh"
  | "high-sensitivity"
  | "medium-sensitivity"
  | "low-confidence"
  | "medium-confidence"
  | "manufacturer-needed"
  | "missing-aliases"
  | "missing-external-source"
  | "missing-guidance-source"
  | "source-keyword";

export type ReviewQueueReason = {
  key: ReviewQueueReasonKey;
  label: string;
};

const statusWeight = {
  haram: 6,
  mashbooh: 4,
  halal: 0
};

const sensitivityWeight = {
  high: 4,
  medium: 2,
  low: 0
};

const confidenceWeight = {
  low: 3,
  medium: 1,
  high: 0
};

const sourceKeywords = [
  "animal",
  "pork",
  "insect",
  "gelatin",
  "glycerol",
  "fatty",
  "stear",
  "bone",
  "shellac",
  "cysteine",
  "inosinate",
  "guanylate",
  "ribonucleotide",
  "alcohol"
];

function hasSourceType(additive: Additive, type: NonNullable<Additive["sources"][number]["type"]>) {
  return additive.sources.some((source) => source.type === type);
}

function hasExternalSource(additive: Additive) {
  return additive.sources.some((source) => Boolean(source.url));
}

export function getReviewReasons(additive: Additive): ReviewQueueReason[] {
  const reasons: ReviewQueueReason[] = [];
  const text = [
    additive.name,
    additive.summary,
    additive.saferAction,
    ...additive.usuallyDerivedFrom,
    ...additive.haramWhen,
    ...additive.notes
  ]
    .join(" ")
    .toLowerCase();

  if (additive.status === "haram") reasons.push({ key: "avoid", label: "Avoid status" });
  if (getRiskGuidance(additive) === "avoid-if-unclear") {
    reasons.push({ key: "avoid-if-unclear", label: "Avoid if unclear" });
  }
  if (additive.status === "mashbooh") reasons.push({ key: "mashbooh", label: "Mashbooh" });
  if (additive.sourceSensitivity === "high") reasons.push({ key: "high-sensitivity", label: "High source sensitivity" });
  if (additive.sourceSensitivity === "medium") reasons.push({ key: "medium-sensitivity", label: "Medium source sensitivity" });
  if (additive.guidanceConfidence === "low") reasons.push({ key: "low-confidence", label: "Low confidence" });
  if (additive.guidanceConfidence === "medium") reasons.push({ key: "medium-confidence", label: "Medium confidence" });
  if (hasSourceType(additive, "manufacturer-needed")) reasons.push({ key: "manufacturer-needed", label: "Manufacturer needed" });
  if (additive.aliases.length < 2) reasons.push({ key: "missing-aliases", label: "Few aliases" });
  if (!hasExternalSource(additive)) reasons.push({ key: "missing-external-source", label: "Missing external source" });
  if (
    (additive.status !== "halal" || additive.sourceSensitivity === "high") &&
    !hasSourceType(additive, "halal-guidance") &&
    !hasSourceType(additive, "regulatory")
  ) {
    reasons.push({ key: "missing-guidance-source", label: "Missing guidance source" });
  }
  if (sourceKeywords.some((keyword) => text.includes(keyword))) {
    reasons.push({ key: "source-keyword", label: "Sensitive source keyword" });
  }

  return reasons;
}

export function getRiskScore(additive: Additive) {
  const text = [
    additive.name,
    additive.summary,
    additive.saferAction,
    ...additive.usuallyDerivedFrom,
    ...additive.haramWhen,
    ...additive.notes
  ]
    .join(" ")
    .toLowerCase();

  const keywordScore = sourceKeywords.reduce((score, keyword) => score + (text.includes(keyword) ? 1 : 0), 0);

  return (
    statusWeight[additive.status] +
    sensitivityWeight[additive.sourceSensitivity] +
    confidenceWeight[additive.guidanceConfidence] +
    keywordScore
  );
}

export function getReviewQueue(additives: Additive[]) {
  return additives
    .map((additive) => ({
      additive,
      riskScore: getRiskScore(additive),
      reasons: getReviewReasons(additive)
    }))
    .filter(({ additive, riskScore, reasons }) => additive.status !== "halal" || additive.sourceSensitivity !== "low" || riskScore >= 4 || reasons.length > 0)
    .sort(
      (a, b) =>
        b.riskScore - a.riskScore ||
        b.reasons.length - a.reasons.length ||
        a.additive.numericCode.localeCompare(b.additive.numericCode, undefined, { numeric: true })
    );
}

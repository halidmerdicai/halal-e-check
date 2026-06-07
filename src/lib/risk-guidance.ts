import type { Additive } from "@/data/additives";

export type RiskGuidance = "permissible" | "verify" | "avoid-if-unclear" | "avoid";

export const riskGuidanceCopy: Record<RiskGuidance, { label: string; description: string }> = {
  permissible: {
    label: "Generally OK",
    description: "Usually acceptable as an additive, while the finished product still matters."
  },
  verify: {
    label: "Verify source",
    description: "Check the source, carrier, or certification before relying on it."
  },
  "avoid-if-unclear": {
    label: "Avoid if unclear",
    description: "Treat as avoid unless plant, vegan, halal-certified, or manufacturer-verified."
  },
  avoid: {
    label: "Avoid",
    description: "Strongly avoid unless a trusted halal authority explicitly accepts the specific product."
  }
};

export function getRiskGuidance(additive: Additive): RiskGuidance {
  if (additive.status === "haram") return "avoid";

  const text = [
    additive.summary,
    additive.saferAction,
    additive.reviewNotes,
    ...additive.usuallyDerivedFrom,
    ...additive.haramWhen,
    ...additive.notes
  ]
    .join(" ")
    .toLowerCase();

  const avoidSignals = [
    "avoid if",
    "pork",
    "non-halal animal",
    "animal source is hidden",
    "source is not disclosed",
    "source is unknown",
    "human hair",
    "insect-derived",
    "bone",
    "gelatin"
  ];

  if (additive.status === "mashbooh" && additive.sourceSensitivity === "high") return "avoid-if-unclear";
  if (additive.status === "mashbooh" && avoidSignals.some((signal) => text.includes(signal))) return "avoid-if-unclear";
  if (additive.status === "mashbooh") return "verify";
  if (additive.sourceSensitivity === "medium") return "verify";

  return "permissible";
}

import type { Additive } from "@/data/additives";

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
    .map((additive) => ({ additive, riskScore: getRiskScore(additive) }))
    .filter(({ additive, riskScore }) => additive.status !== "halal" || additive.sourceSensitivity !== "low" || riskScore >= 4)
    .sort((a, b) => b.riskScore - a.riskScore || a.additive.numericCode.localeCompare(b.additive.numericCode, undefined, { numeric: true }));
}

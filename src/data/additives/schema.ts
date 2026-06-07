export type HalalStatus = "halal" | "haram" | "mashbooh";

export type SourceSensitivity = "low" | "medium" | "high";

export type GuidanceConfidence = "low" | "medium" | "high";

export type AdditiveSource = {
  type?: "identity" | "regulatory" | "halal-guidance" | "manufacturer-needed" | "editorial";
  label: string;
  url?: string;
  note?: string;
};

export type Additive = {
  id: string;
  eNumber: string;
  numericCode: string;
  name: string;
  aliases: string[];
  category: string;
  status: HalalStatus;
  summary: string;
  sourceSensitivity: SourceSensitivity;
  usuallyDerivedFrom: string[];
  halalWhen: string[];
  haramWhen: string[];
  whatToCheck: string[];
  saferAction: string;
  commonFoods: string[];
  notes: string[];
  lastReviewed: string;
  guidanceConfidence: GuidanceConfidence;
  reviewedBy: string;
  reviewNotes: string;
  sources: AdditiveSource[];
  related?: string[];
};

import type { HalalStatus, SourceSensitivity } from "@/data/additives";

export const statusCopy: Record<HalalStatus, { label: string; meaning: string }> = {
  halal: {
    label: "Halal",
    meaning: "Generally accepted or usually permissible when the finished product has no other concerns."
  },
  haram: {
    label: "Haram",
    meaning: "Clearly forbidden or strongly avoided by many halal consumers."
  },
  mashbooh: {
    label: "Mashbooh",
    meaning: "Questionable, source-dependent, or needs verification."
  }
};

export const sensitivityCopy: Record<SourceSensitivity, string> = {
  low: "Low source sensitivity",
  medium: "Medium source sensitivity",
  high: "High source sensitivity"
};

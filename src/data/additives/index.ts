import additivesJson from "@/data/additives/additives.json";
import type { Additive, AdditiveSource, GuidanceConfidence, HalalStatus, SourceSensitivity } from "@/data/additives/schema";

export type { Additive, AdditiveSource, GuidanceConfidence, HalalStatus, SourceSensitivity };

function assertAdditive(value: unknown): asserts value is Additive {
  if (!value || typeof value !== "object") {
    throw new Error("Invalid additive record: expected object");
  }

  const additive = value as Partial<Record<keyof Additive, unknown>>;
  const requiredStrings: Array<keyof Additive> = [
    "id",
    "eNumber",
    "numericCode",
    "name",
    "category",
    "status",
    "summary",
    "sourceSensitivity",
    "saferAction",
    "lastReviewed",
    "guidanceConfidence",
    "reviewedBy",
    "reviewNotes"
  ];
  const requiredArrays: Array<keyof Additive> = [
    "aliases",
    "usuallyDerivedFrom",
    "halalWhen",
    "haramWhen",
    "whatToCheck",
    "commonFoods",
    "notes",
    "sources"
  ];

  for (const key of requiredStrings) {
    if (typeof additive[key] !== "string" || additive[key] === "") {
      throw new Error(`Invalid additive record: ${String(key)} must be a non-empty string`);
    }
  }

  for (const key of requiredArrays) {
    if (!Array.isArray(additive[key])) {
      throw new Error(`Invalid additive record: ${String(key)} must be an array`);
    }
  }

  if (!["halal", "haram", "mashbooh"].includes(additive.status as string)) {
    throw new Error(`Invalid additive record ${additive.id}: unsupported status`);
  }

  if (!["low", "medium", "high"].includes(additive.sourceSensitivity as string)) {
    throw new Error(`Invalid additive record ${additive.id}: unsupported source sensitivity`);
  }

  if (!["low", "medium", "high"].includes(additive.guidanceConfidence as string)) {
    throw new Error(`Invalid additive record ${additive.id}: unsupported guidance confidence`);
  }

  for (const source of additive.sources as AdditiveSource[]) {
    if (!source || !["identity", "regulatory", "halal-guidance", "manufacturer-needed", "editorial"].includes(source.type) || !source.label) {
      throw new Error(`Invalid additive record ${additive.id}: source type and label are required`);
    }
    if (source.url !== undefined && (typeof source.url !== "string" || !/^https?:\/\//.test(source.url))) {
      throw new Error(`Invalid additive record ${additive.id}: invalid source URL`);
    }
  }
  if (additive.halalReview !== undefined) {
    const review = additive.halalReview as Additive["halalReview"];
    if (!review || ![review.reviewer, review.reviewedAt, review.status, review.summary].every((item) => typeof item === "string") ||
      !Array.isArray(review.sourceUrls) || !review.sourceUrls.every((item) => typeof item === "string")) {
      throw new Error(`Invalid additive record ${additive.id}: malformed expert review`);
    }
  }
}

function loadAdditives(records: unknown[]) {
  const seen = new Set<string>();

  return records.map((record) => {
    assertAdditive(record);

    if (seen.has(record.id)) {
      throw new Error(`Duplicate additive id: ${record.id}`);
    }

    seen.add(record.id);
    return record;
  });
}

export const additives = loadAdditives(additivesJson);
export const additiveById = new Map(additives.map((additive) => [additive.id, additive]));

import additivesJson from "@/data/additives/additives.json";
import type { Additive, HalalStatus, SourceSensitivity } from "@/data/additives/schema";

export type { Additive, HalalStatus, SourceSensitivity };

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
    "lastReviewed"
  ];
  const requiredArrays: Array<keyof Additive> = [
    "aliases",
    "usuallyDerivedFrom",
    "halalWhen",
    "haramWhen",
    "whatToCheck",
    "commonFoods",
    "notes"
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

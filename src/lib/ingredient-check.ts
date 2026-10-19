import { additives } from "@/data/additives";
import type { Additive } from "@/data/additives";
import { normalizeCode, normalizeText, normalizeTextWithOffsets } from "@/lib/search";

export type IngredientMatch = {
  additive: Additive;
  matchedBy: "code" | "name" | "alias" | "numeric-context";
  matchedText: string;
  start: number;
  end: number;
};

export type UnknownIngredientCode = {
  code: string;
  matchedText: string;
  start: number;
  end: number;
};

export type IngredientCheckResult = {
  matches: IngredientMatch[];
  unknownCodes: UnknownIngredientCode[];
};

export type IngredientCodeCorrection = {
  from: string;
  to: string;
};

const additiveByCode = new Map(additives.map((additive) => [additive.id, additive]));
const confidenceRank = {
  low: 0,
  medium: 1,
  high: 2
};
const duplicateNamePreferredId = new Map<string, string>();
const additiveContextPattern =
  /\b(e\s*[-]?\s*)?(number|additive|aditiv|emulsifier|emulgator|stabilizer|stabiliser|stabilizator|color|colour|boja|bojilo|preservative|konzervans|raising agent|sredstvo za dizanje|antioxidant|antioksidans|thickener|zgusnjivac|zgušnjivač|zagusnjivac|zgušnjivač|flavour enhancer|flavor enhancer|pojacivac okusa|pojačivač okusa|pojacivac ukusa|pojačivač ukusa|sweetener|zasladivac|zaslađivač)s?\b/i;

const codeCandidatePattern = /\b[eE]\s*-?\s*[0-9oO]{3,}[a-zA-Z]*\b/g;
const numericCandidatePattern = /\b[0-9oO]{3,}[a-zA-Z]*\b/g;
const ocrDigitSuffixCorrections: Record<string, string> = {
  "1": "i",
  "4": "a"
};

for (const additive of additives) {
  const normalizedName = normalizeText(additive.name);
  const preferredId = duplicateNamePreferredId.get(normalizedName);
  const preferred = preferredId ? additiveByCode.get(preferredId) : undefined;

  if (
    !preferred ||
    confidenceRank[additive.guidanceConfidence] > confidenceRank[preferred.guidanceConfidence] ||
    (confidenceRank[additive.guidanceConfidence] === confidenceRank[preferred.guidanceConfidence] &&
      !additive.category.includes("historical coverage") &&
      preferred.category.includes("historical coverage"))
  ) {
    duplicateNamePreferredId.set(normalizedName, additive.id);
  }
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function phrasePattern(phrase: string) {
  const normalized = normalizeText(phrase);
  if (normalized.length < 4) return null;
  const words = normalized.split(" ").filter(Boolean);
  if (words.length === 1 && words[0].length < 5) return null;
  return new RegExp(`(^|\\b)${words.map(escapeRegExp).join("[\\s,-]+")}(\\b|$)`, "i");
}

function isNegated(input: string, start: number, end: number) {
  const before = normalizeText(input.slice(0, start).split(/[;.!?:,\n]/).pop() ?? "");
  const after = input.slice(end);
  if (/\bnot$/.test(before)) return false;
  return /\b(?:no|without|free from|bez)(?: (?:any|added))?$/.test(before) || /^(?:\s*[-–]\s*|\s+)free\b/i.test(after);
}

function addMatch(matches: Map<string, IngredientMatch>, match: IngredientMatch) {
  const existing = matches.get(match.additive.id);
  if (!existing || existing.matchedBy === "alias") {
    matches.set(match.additive.id, match);
  }
}

function shouldSkipDuplicateNameMatch(additive: Additive) {
  const preferredId = duplicateNamePreferredId.get(normalizeText(additive.name));
  return Boolean(preferredId && preferredId !== additive.id);
}

function cleanUnknownCode(rawCode: string) {
  return normalizeCode(rawCode).toUpperCase();
}

function resolveAdditiveCode(rawCode: string) {
  const exactCode = normalizeCode(rawCode);
  return { additive: additiveByCode.get(exactCode), normalizedCode: exactCode };
}

// These are suggestions for the OCR review screen, never input to the checker
// until the user applies a correction and confirms the reviewed text.
function suggestOcrCode(rawCode: string) {
  const exactCode = normalizeCode(rawCode);
  if (additiveByCode.has(exactCode)) return additiveByCode.get(exactCode);
  const digitsCorrected = exactCode.replace(/o/g, "0");
  if (additiveByCode.has(digitsCorrected)) return additiveByCode.get(digitsCorrected);

  const compactCode = exactCode.replace(/^e/, "");
  const fourDigitOcrCode = compactCode.match(/^(\d{3})(\d)([a-z]{0,3})$/);
  if (fourDigitOcrCode) {
    const correctedSuffix = ocrDigitSuffixCorrections[fourDigitOcrCode[2]];
    if (correctedSuffix) {
      const correctedCode = `e${fourDigitOcrCode[1]}${correctedSuffix}${fourDigitOcrCode[3]}`;
      const correctedAdditive = additiveByCode.get(correctedCode);
      if (correctedAdditive) return correctedAdditive;
    }

  }
  // Observed mistakes from the reference labels; do not generalize to dropping
  // arbitrary digits/suffixes (E9999 and E471z must remain unresolved).
  if (exactCode === "e250i" || exactCode === "e2501") return additiveByCode.get("e250");
  return undefined;
}

function resolvedCodeMatch(rawCode: string, start: number, normalizedCode: string) {
  if (normalizeCode(rawCode) === normalizedCode) {
    return { matchedText: rawCode, start, end: start + rawCode.length };
  }

  const numericOnly = normalizedCode.replace(/^e/, "");
  const numericPrefix = numericOnly.match(/^\d{3,4}/)?.[0] ?? numericOnly;
  const prefixPattern = rawCode.trimStart().toLowerCase().startsWith("e")
    ? new RegExp(`^[eE]\\s*[-]?\\s*${numericPrefix}`)
    : new RegExp(`^${numericPrefix}`);
  const leadingWhitespace = rawCode.length - rawCode.trimStart().length;
  const prefixMatch = prefixPattern.exec(rawCode.trimStart());

  if (!prefixMatch) return { matchedText: rawCode, start, end: start + rawCode.length };

  const matchedText = rawCode.slice(leadingWhitespace, leadingWhitespace + prefixMatch[0].length);
  return {
    matchedText,
    start: start + leadingWhitespace,
    end: start + leadingWhitespace + matchedText.length
  };
}

export function cleanIngredientCodeText(input: string): { text: string; corrections: IngredientCodeCorrection[] } {
  const corrections = new Map<string, IngredientCodeCorrection>();
  const text = input.replace(codeCandidatePattern, (rawCode) => {
    const additive = suggestOcrCode(rawCode);
    if (!additive) return rawCode;

    const compactRaw = rawCode.toUpperCase().replace(/[\s-]/g, "");
    if (compactRaw !== additive.eNumber.toUpperCase()) {
      corrections.set(`${rawCode}:${additive.eNumber}`, { from: rawCode, to: additive.eNumber });
    }

    return additive.eNumber;
  });

  return { text, corrections: Array.from(corrections.values()) };
}

export function normalizeIngredientCodeText(input: string) {
  return cleanIngredientCodeText(input).text;
}

export function checkIngredients(input: string): IngredientCheckResult {
  const matches = new Map<string, IngredientMatch>();
  const unknownCodes = new Map<string, UnknownIngredientCode>();
  const normalized = normalizeTextWithOffsets(input);
  const normalizedInput = normalized.text;
  const explicitCodes = Array.from(input.matchAll(codeCandidatePattern));

  for (const match of explicitCodes) {
    const rawCode = match[0];
    const start = match.index ?? 0;
    const end = start + rawCode.length;
    if (isNegated(input, start, end)) continue;
    const { additive, normalizedCode } = resolveAdditiveCode(rawCode);
    if (additive) {
      addMatch(matches, { additive, matchedBy: "code", ...resolvedCodeMatch(rawCode, start, normalizedCode) });
      unknownCodes.delete(normalizedCode.toUpperCase());
    } else {
      const code = cleanUnknownCode(rawCode);
      unknownCodes.set(code, { code, matchedText: rawCode, start, end });
    }
  }

  for (const match of Array.from(input.matchAll(numericCandidatePattern))) {
    const rawNumber = match[0];
    const index = match.index ?? 0;
    const end = index + rawNumber.length;
    // A spaced E-number has already been processed, including its negation.
    if (explicitCodes.some((code) => index >= code.index && end <= code.index + code[0].length)) continue;
    if (isNegated(input, index, end)) continue;
    const context = input.slice(Math.max(0, index - 28), Math.min(input.length, index + rawNumber.length + 28));
    if (!additiveContextPattern.test(context)) continue;

    const { additive, normalizedCode } = resolveAdditiveCode(rawNumber);
    if (additive) {
      addMatch(matches, {
        additive,
        matchedBy: "numeric-context",
        ...resolvedCodeMatch(rawNumber, index, normalizedCode)
      });
      unknownCodes.delete(normalizedCode.toUpperCase());
    } else {
      const code = cleanUnknownCode(rawNumber);
      unknownCodes.set(code, { code, matchedText: rawNumber, start: index, end });
    }
  }

  const candidates: Array<{ start: number; end: number; match: IngredientMatch }> = [];
  for (const additive of additives) {
    const terms: Array<{ text: string; matchedBy: "name" | "alias" }> = [
      ...(!shouldSkipDuplicateNameMatch(additive) ? [{ text: additive.name, matchedBy: "name" as const }] : []),
      ...additive.aliases.map((text) => ({ text, matchedBy: "alias" as const }))
    ];
    for (const term of terms) {
      const pattern = phrasePattern(term.text);
      if (!pattern) continue;
      for (const found of Array.from(normalizedInput.matchAll(new RegExp(pattern.source, "gi")))) {
        const start = normalized.offsets[found.index].start;
        const end = normalized.offsets[found.index + found[0].length - 1].end;
        candidates.push({
          start: found.index,
          end: found.index + found[0].length,
          match: {
            additive,
            matchedBy: term.matchedBy,
            matchedText: input.slice(start, end),
            start,
            end
          }
        });
      }
    }
  }
  const accepted: typeof candidates = [];
  candidates.sort((a, b) =>
    (b.end - b.start) - (a.end - a.start) ||
    Number(b.match.matchedBy === "name") - Number(a.match.matchedBy === "name")
  );
  for (const candidate of candidates) {
    if (accepted.some((other) => candidate.start < other.end && candidate.end > other.start)) continue;
    accepted.push(candidate);
    if (isNegated(input, candidate.match.start, candidate.match.end)) continue;
    addMatch(matches, candidate.match);
  }

  return {
    matches: Array.from(matches.values()).sort((a, b) =>
      a.additive.numericCode.localeCompare(b.additive.numericCode, undefined, { numeric: true })
    ),
    unknownCodes: Array.from(unknownCodes.values()).sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))
  };
}

import { additives } from "@/data/additives";
import type { Additive } from "@/data/additives";
import { normalizeCode, normalizeText } from "@/lib/search";

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

const additiveByCode = new Map(additives.map((additive) => [additive.id, additive]));
const additiveContextPattern =
  /\b(e\s*[-]?\s*)?(number|additive|aditiv|emulsifier|emulgator|stabilizer|stabiliser|stabilizator|color|colour|boja|bojilo|preservative|konzervans|raising agent|sredstvo za dizanje|antioxidant|antioksidans|thickener|zgusnjivac|zgušnjivač|zagusnjivac|zgušnjivač|flavour enhancer|flavor enhancer|pojacivac okusa|pojačivač okusa|pojacivac ukusa|pojačivač ukusa|sweetener|zasladivac|zaslađivač)s?\b/i;

const codeCandidatePattern = /\b[eE]\s*[-]?\s*(\d{3,4}(?:\s*[a-zA-Z]{1,3})?)\b/g;
const numericCandidatePattern = /\b(\d{3,4}(?:\s*[a-zA-Z]{1,3})?)\b/g;

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function phrasePattern(phrase: string) {
  const normalized = normalizeText(phrase);
  if (normalized.length < 4) return null;
  const words = normalized.split(" ").filter(Boolean);
  if (words.length === 1 && words[0].length < 5) return null;
  return new RegExp(`(^|\\b)${words.map(escapeRegExp).join("[\\\\s,-]+")}(\\b|$)`, "i");
}

function rawPhrasePattern(phrase: string) {
  const normalized = normalizeText(phrase);
  if (normalized.length < 4) return null;
  const words = normalized.split(" ").filter(Boolean);
  if (words.length === 1 && words[0].length < 5) return null;
  return new RegExp(`\\b${words.map(escapeRegExp).join("[\\\\s,-]+")}\\b`, "i");
}

function addMatch(matches: Map<string, IngredientMatch>, match: IngredientMatch) {
  const existing = matches.get(match.additive.id);
  if (!existing || existing.matchedBy === "alias") {
    matches.set(match.additive.id, match);
  }
}

function cleanUnknownCode(rawCode: string) {
  return normalizeCode(rawCode).toUpperCase();
}

function resolveAdditiveCode(rawCode: string) {
  const exactCode = normalizeCode(rawCode);
  const exactAdditive = additiveByCode.get(exactCode);
  if (exactAdditive) return { additive: exactAdditive, normalizedCode: exactCode };

  const numericOnly = exactCode.replace(/^e/, "").match(/^\d{3,4}/)?.[0];
  if (!numericOnly) return { additive: undefined, normalizedCode: exactCode };

  const numericCode = `e${numericOnly}`;
  const numericAdditive = additiveByCode.get(numericCode);
  if (numericAdditive) return { additive: numericAdditive, normalizedCode: numericCode };

  return { additive: undefined, normalizedCode: exactCode };
}

function resolvedCodeMatch(rawCode: string, start: number, normalizedCode: string) {
  if (normalizeCode(rawCode) === normalizedCode) {
    return { matchedText: rawCode, start, end: start + rawCode.length };
  }

  const numericOnly = normalizedCode.replace(/^e/, "");
  const prefixPattern = rawCode.trimStart().toLowerCase().startsWith("e")
    ? new RegExp(`^[eE]\\s*[-]?\\s*${numericOnly}`)
    : new RegExp(`^${numericOnly}`);
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

export function checkIngredients(input: string): IngredientCheckResult {
  const matches = new Map<string, IngredientMatch>();
  const unknownCodes = new Map<string, UnknownIngredientCode>();
  const normalizedInput = normalizeText(input);

  for (const match of Array.from(input.matchAll(codeCandidatePattern))) {
    const rawCode = match[0];
    const start = match.index ?? 0;
    const end = start + rawCode.length;
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

  for (const additive of additives) {
    const nameRegex = phrasePattern(additive.name);
    if (nameRegex?.test(normalizedInput)) {
      const rawMatch = rawPhrasePattern(additive.name)?.exec(input);
      addMatch(matches, {
        additive,
        matchedBy: "name",
        matchedText: rawMatch?.[0] ?? additive.name,
        start: rawMatch?.index ?? -1,
        end: rawMatch ? rawMatch.index + rawMatch[0].length : -1
      });
      continue;
    }

    for (const alias of additive.aliases) {
      const aliasRegex = phrasePattern(alias);
      if (aliasRegex?.test(normalizedInput)) {
        const rawMatch = rawPhrasePattern(alias)?.exec(input);
        addMatch(matches, {
          additive,
          matchedBy: "alias",
          matchedText: rawMatch?.[0] ?? alias,
          start: rawMatch?.index ?? -1,
          end: rawMatch ? rawMatch.index + rawMatch[0].length : -1
        });
        break;
      }
    }
  }

  return {
    matches: Array.from(matches.values()).sort((a, b) =>
      a.additive.numericCode.localeCompare(b.additive.numericCode, undefined, { numeric: true })
    ),
    unknownCodes: Array.from(unknownCodes.values()).sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))
  };
}

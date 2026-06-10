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

export function checkIngredients(input: string): IngredientCheckResult {
  const matches = new Map<string, IngredientMatch>();
  const unknownCodes = new Map<string, UnknownIngredientCode>();
  const normalizedInput = normalizeText(input);

  const codePattern = /\b[eE]\s*[-]?\s*(\d{3,4}\s*[a-zA-Z]{0,3})\b/g;
  for (const match of Array.from(input.matchAll(codePattern))) {
    const rawCode = match[0];
    const start = match.index ?? 0;
    const end = start + rawCode.length;
    const normalized = normalizeCode(rawCode);
    const additive = additiveByCode.get(normalized);
    if (additive) {
      addMatch(matches, { additive, matchedBy: "code", matchedText: rawCode, start, end });
    } else {
      const code = rawCode.toUpperCase().replace(/\s+/g, "").replace("E-", "E");
      unknownCodes.set(code, { code, matchedText: rawCode, start, end });
    }
  }

  const numericPattern = /\b(\d{3,4}\s*[a-zA-Z]{0,3})\b/g;
  for (const match of Array.from(input.matchAll(numericPattern))) {
    const rawNumber = match[0];
    const index = match.index ?? 0;
    const end = index + rawNumber.length;
    const context = input.slice(Math.max(0, index - 28), Math.min(input.length, index + rawNumber.length + 28));
    if (!additiveContextPattern.test(context)) continue;

    const additive = additiveByCode.get(normalizeCode(rawNumber));
    if (additive) {
      addMatch(matches, { additive, matchedBy: "numeric-context", matchedText: rawNumber, start: index, end });
    } else {
      const code = `E${rawNumber.toUpperCase().replace(/\s+/g, "")}`;
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

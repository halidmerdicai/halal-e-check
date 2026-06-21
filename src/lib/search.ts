import { additives } from "@/data/additives";
import type { Additive } from "@/data/additives";

export function normalizeCode(input: string) {
  const compact = input.trim().toLowerCase().replace(/[\s-]/g, "");
  if (!compact) return "";
  const withPrefix = compact.startsWith("e") ? compact : `e${compact}`;
  const body = withPrefix.slice(1);
  const numericLike = body.match(/^[0-9o]{3,4}/)?.[0];

  if (!numericLike) return withPrefix;

  return `e${numericLike.replace(/o/g, "0")}${body.slice(numericLike.length)}`;
}

export function normalizeText(input: string) {
  const normalized = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return applyCommonSpellings(normalized);
}

const spellingReplacements: Array<[RegExp, string]> = [
  [/\bemulgators?\b/g, "emulsifier"],
  [/\bemulgatorima\b/g, "emulsifiers"],
  [/\bemulz?gator\b/g, "emulsifier"],
  [/\bemulsifiers?\b/g, "emulsifier"],
  [/\baditivi?\b/g, "additive"],
  [/\bboj(a|e|ilo|ila)\b/g, "color"],
  [/\bkonzervansi?\b/g, "preservative"],
  [/\bstabilizatori?\b/g, "stabilizer"],
  [/\bzgusnjivaci?\b/g, "thickener"],
  [/\bzagusnjivaci?\b/g, "thickener"],
  [/\bsredstva?\s+za\s+dizanje\b/g, "raising agent"],
  [/\bpojaci?vaci?\s+(okusa|ukusa|arome)\b/g, "flavour enhancer"],
  [/\bzasladivaci?\b/g, "sweetener"],
  [/\bzasladjivaci?\b/g, "sweetener"],
  [/\blecitins?\b/g, "lecithin"],
  [/\blecithins?\b/g, "lecithin"],
  [/\bzelatin(a|e)?\b/g, "gelatin"],
  [/\bzelatina\b/g, "gelatin"],
  [/\bglyserol\b/g, "glycerol"],
  [/\bglicerol\b/g, "glycerol"],
  [/\bglyserin\b/g, "glycerin"],
  [/\bglicerin\b/g, "glycerin"],
  [/\bglyserine\b/g, "glycerine"],
  [/\bglicerine\b/g, "glycerine"],
  [/\bglyserides?\b/g, "glycerides"],
  [/\bgliceridi?\b/g, "glycerides"],
  [/\bmonoglyserides?\b/g, "mono glycerides"],
  [/\bmonogliceridi?\b/g, "mono glycerides"],
  [/\bmono\s+i\s+digliceridi?\b/g, "mono and diglycerides"],
  [/\bmono\s+i\s+diglyserides?\b/g, "mono and diglycerides"],
  [/\bdiglyserides?\b/g, "diglycerides"],
  [/\bdigliceridi?\b/g, "diglycerides"],
  [/\bmonoglycerides?\b/g, "mono glycerides"],
  [/\bdiglycerides?\b/g, "diglycerides"],
  [/\bcarmine\b/g, "carmine"],
  [/\bkarmin\b/g, "carmine"],
  [/\bcochenille\b/g, "cochineal"],
  [/\bcochineal\b/g, "cochineal"],
  [/\bselak\b/g, "shellac"],
  [/\bshellack\b/g, "shellac"],
  [/\bshellac\b/g, "shellac"],
  [/\bpcelinji\s+vosak\b/g, "beeswax"],
  [/\bpcelji\s+vosak\b/g, "beeswax"],
  [/\binosinat\b/g, "inosinate"],
  [/\binozinat\b/g, "inosinate"],
  [/\bnatrijev\s+inosinate\b/g, "sodium inosinate"],
  [/\bnatrijum\s+inosinate\b/g, "sodium inosinate"],
  [/\bnatrijev\s+inosinat\b/g, "sodium inosinate"],
  [/\bnatrijum\s+inosinat\b/g, "sodium inosinate"],
  [/\bguanylat\b/g, "guanylate"],
  [/\bguanilat\b/g, "guanylate"],
  [/\bnatrijev\s+guanilat\b/g, "sodium guanylate"],
  [/\bnatrijum\s+guanilat\b/g, "sodium guanylate"]
];

function applyCommonSpellings(input: string) {
  return spellingReplacements.reduce((value, [pattern, replacement]) => value.replace(pattern, replacement), input);
}

function editDistance(a: string, b: string, maxDistance: number) {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > maxDistance) return maxDistance + 1;
  if (a.length < b.length) return editDistance(b, a, maxDistance);

  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);

  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    let rowMin = current[0];

    for (let j = 1; j <= b.length; j += 1) {
      const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1;
      const next = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + substitutionCost
      );
      current[j] = next;
      rowMin = Math.min(rowMin, next);
    }

    if (rowMin > maxDistance) return maxDistance + 1;
    previous = current;
  }

  return previous[b.length];
}

function fuzzyLimit(word: string) {
  if (word.length < 5) return 0;
  if (word.length < 8) return 1;
  return 2;
}

function wordsMatch(queryWord: string, candidateWord: string) {
  if (queryWord === candidateWord) return true;
  if (queryWord.length >= 5 && candidateWord.startsWith(queryWord)) return true;
  const limit = fuzzyLimit(queryWord);
  if (!limit) return false;
  return editDistance(queryWord, candidateWord, limit) <= limit;
}

function fuzzyTextScore(query: string, item: string) {
  if (query.length < 5) return 0;

  const wholeLimit = fuzzyLimit(query);
  if (wholeLimit && editDistance(query, item, wholeLimit) <= wholeLimit) {
    return 58;
  }

  const queryWords = query.split(" ").filter((word) => word.length >= 4);
  const itemWords = item.split(" ").filter(Boolean);
  if (!queryWords.length || !itemWords.length) return 0;

  const matchedWords = queryWords.filter((queryWord) => itemWords.some((itemWord) => wordsMatch(queryWord, itemWord)));
  if (matchedWords.length === queryWords.length) {
    return 42 + Math.min(matchedWords.length * 5, 18);
  }

  if (queryWords.length === 1 && matchedWords.length === 1) {
    return 46;
  }

  return 0;
}

export function findAdditiveByCode(code: string) {
  const normalized = normalizeCode(code);
  return additives.find((additive) => additive.id === normalized);
}

function scoreMatch(additive: Additive, query: string) {
  const code = normalizeCode(query);
  const textQuery = normalizeText(query);
  const haystack = [
    additive.eNumber,
    additive.numericCode,
    additive.name,
    additive.category,
    ...additive.aliases
  ].map(normalizeText);

  if (additive.id === code) return 100;
  if (additive.numericCode.toLowerCase() === query.trim().toLowerCase()) return 95;

  let score = 0;
  for (const item of haystack) {
    if (!textQuery) continue;
    if (item === textQuery) score = Math.max(score, 90);
    if (item.startsWith(textQuery)) score = Math.max(score, 78);
    if (item.includes(textQuery)) score = Math.max(score, 62);

    const words = textQuery.split(" ");
    const allWordsPresent = words.every((word) => item.includes(word));
    if (allWordsPresent) score = Math.max(score, 52 + Math.min(words.length * 4, 20));
    score = Math.max(score, fuzzyTextScore(textQuery, item));
  }

  return score;
}

export function searchAdditives(query: string, limit = 8) {
  const trimmed = query.trim();
  if (!trimmed) return [];

  return additives
    .map((additive) => ({ additive, score: scoreMatch(additive, trimmed) }))
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score || a.additive.eNumber.localeCompare(b.additive.eNumber))
    .slice(0, limit)
    .map((result) => result.additive);
}

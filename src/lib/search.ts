import { additives } from "@/data/additives";
import type { Additive } from "@/data/additives";

export function normalizeCode(input: string) {
  const compact = input.trim().toLowerCase().replace(/[\s-]/g, "");
  if (!compact) return "";
  return compact.startsWith("e") ? compact : `e${compact}`;
}

export function normalizeText(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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

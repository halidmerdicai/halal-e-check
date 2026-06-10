import type { Additive } from "@/data/additives";

export function getManufacturerQuestions(additive: Additive) {
  const questions = [
    `What is the source of ${additive.eNumber} ${additive.name}: plant, synthetic, microbial, fish, insect, pork, or other animal?`,
    "Is the additive and finished product covered by halal certification?",
    "Are any alcohol-based carriers, processing aids, or shared non-halal production lines used?"
  ];

  if (additive.usuallyDerivedFrom.some((source) => /fat|glycer|stear|animal|bone|gelatin/i.test(source))) {
    questions[0] = `Is the ${additive.name} source plant/synthetic, halal-certified animal, or non-halal animal/pork?`;
  }

  if (additive.usuallyDerivedFrom.some((source) => /fermentation|microbial|yeast|fish/i.test(source))) {
    questions[0] = `Is the ${additive.name} source fermentation-derived, fish-derived, plant-derived, or animal-derived?`;
  }

  if (additive.usuallyDerivedFrom.some((source) => /insect|lac|cochineal|bee/i.test(source))) {
    questions[0] = `What exact insect/bee-derived source and processing method is used for ${additive.name}?`;
  }

  return questions;
}

export function getDecisionReason(additive: Additive) {
  const sourceSummary = additive.usuallyDerivedFrom.slice(0, 3).join(", ");
  const firstHaramCondition = additive.haramWhen[0];

  if (additive.status === "haram") {
    return firstHaramCondition ?? additive.summary;
  }

  if (additive.sourceSensitivity === "high") {
    return `Source-sensitive: commonly tied to ${sourceSummary || "supplier-dependent sources"}.`;
  }

  if (additive.status === "mashbooh") {
    return firstHaramCondition ?? "Needs source, carrier, or certification context.";
  }

  return additive.summary;
}

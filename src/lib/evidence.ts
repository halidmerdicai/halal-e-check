import type { Additive } from "@/data/additives";

export function hasHalalGuidanceSource(additive: Additive) {
  return additive.sources.some((source) => source.type === "halal-guidance" && /^https?:\/\//.test(source.url ?? ""));
}

export function hasExpertHalalReview(additive: Additive) {
  const review = additive.halalReview;
  if (!review || !review.reviewer.trim() || review.status !== additive.status || review.summary !== additive.summary) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(review.reviewedAt)) return false;
  const date = new Date(`${review.reviewedAt}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== review.reviewedAt || date > new Date()) return false;
  return review.sourceUrls.length > 0 && review.sourceUrls.every((url) =>
    /^https?:\/\//.test(url) && additive.sources.some((source) => source.url === url && source.type === "halal-guidance" && source.scope === "additive-specific")
  );
}

export function getEvidenceNotice(additive: Additive) {
  if (hasExpertHalalReview(additive)) return "Expert review recorded. Confirm the actual product's source and certification.";
  return hasHalalGuidanceSource(additive)
    ? "Expert review pending. Halal guidance is linked, but this record's conclusion has not been independently verified. Confirm the actual product with its manufacturer or halal certifier."
    : "Expert review pending. Identity and regulatory references do not establish halal status. Treat this assessment as provisional and confirm the actual product with its manufacturer or halal certifier.";
}

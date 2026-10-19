import assert from "node:assert/strict";
import test from "node:test";
import { additives, additiveById } from "../src/data/additives";
import { getDataQuality } from "../src/lib/data-quality";
import { getRiskGuidance } from "../src/lib/risk-guidance";
import { hasExpertHalalReview, getEvidenceNotice } from "../src/lib/evidence";

test("an identity or regulatory source cannot certify a halal conclusion", () => {
  const additive = additiveById.get("e500")!;
  assert.notEqual(getRiskGuidance(additive), "permissible");
  const regulatoryOnly = { ...additiveById.get("e471")!, sources: [{ type: "regulatory" as const, label: "Identity only", url: "https://example.org/identity" }] };
  const issue = getDataQuality([regulatoryOnly]).issues.find((item) => item.key === "highRiskMissingGuidanceSource")!;
  assert.equal(issue.records.length, 1);
});

test("expert approval must identify a reviewer, date, current conclusion and specific halal citation", () => {
  const original = additiveById.get("e500")!;
  const source = { type: "halal-guidance" as const, label: "Test authority", scope: "additive-specific" as const, url: "https://example.org/e500" };
  const reviewed = { ...original, sources: [source], halalReview: { reviewer: "Test reviewer", reviewedAt: "2026-10-01", status: original.status, summary: original.summary, sourceUrls: [source.url] } };
  assert.equal(hasExpertHalalReview(reviewed), true);
  assert.equal(getRiskGuidance(reviewed), "permissible");
  for (const invalid of [
    { ...reviewed, summary: "A changed claim" },
    { ...reviewed, sources: [{ ...source, type: "regulatory" as const }] },
    { ...reviewed, sources: [{ ...source, scope: "general-background" as const }] },
    { ...reviewed, halalReview: { ...reviewed.halalReview, reviewer: " " } },
    { ...reviewed, halalReview: { ...reviewed.halalReview, reviewedAt: "2026-02-31" } },
    { ...reviewed, halalReview: { ...reviewed.halalReview, reviewedAt: "2099-01-01" } },
    { ...reviewed, halalReview: { ...reviewed.halalReview, sourceUrls: [] } }
  ]) {
    assert.equal(hasExpertHalalReview(invalid), false);
    assert.equal(getRiskGuidance(invalid), "verify");
    assert.match(getEvidenceNotice(invalid), /Expert review pending/);
  }
});

test("the dashboard retains the real expert review backlog", () => {
  const pending = additives.filter((item) => !hasExpertHalalReview(item));
  const quality = getDataQuality(additives);
  assert.equal(quality.summary.expertReviewPending, pending.length);
  assert.ok(pending.length > 0);
  assert.deepEqual(quality.issues.find((item) => item.key === "expertReviewPending")!.records, pending);
});

test("every source declares the kind of evidence it provides", () => {
  for (const additive of additives) {
    assert.ok(additive.sources.every((source) => source.type), additive.eNumber);
  }
});

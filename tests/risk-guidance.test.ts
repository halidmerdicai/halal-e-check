import assert from "node:assert/strict";
import test from "node:test";
import { additiveById } from "../src/data/additives";
import { getRiskGuidance } from "../src/lib/risk-guidance";

test("historical regulatory-risk coverage records escalate to avoid-if-unclear", () => {
  for (const id of ["e701", "e924", "e927a", "e940"]) {
    const additive = additiveById.get(id);

    assert.ok(additive, `${id} should exist`);
    assert.equal(getRiskGuidance(additive), "avoid-if-unclear", `${id} should require avoidance unless clarified`);
  }
});

test("reviewed historical regulatory-risk records have medium-confidence conservative guidance", () => {
  for (const id of ["e105", "e128", "e143", "e154", "e160f", "e230", "e231", "e232", "e233", "e344", "e924", "e927a", "e940", "e945", "e946"]) {
    const additive = additiveById.get(id);

    assert.ok(additive, `${id} should exist`);
    assert.equal(additive.guidanceConfidence, "medium", `${id} should be reviewed to medium confidence`);
    assert.equal(getRiskGuidance(additive), "avoid-if-unclear", `${id} should remain conservative`);
  }
});

test("all additive guidance records have completed confidence review", () => {
  const lowConfidenceIds = Array.from(additiveById.values())
    .filter((additive) => additive.guidanceConfidence === "low")
    .map((additive) => additive.id);

  assert.deepEqual(lowConfidenceIds, []);
});

test("reviewed historical mineral coverage records remain verify", () => {
  const additive = additiveById.get("e505");

  assert.ok(additive, "e505 should exist");
  assert.equal(additive.guidanceConfidence, "medium");
  assert.equal(getRiskGuidance(additive), "verify");
});

test("reviewed high source-sensitive historical records avoid if unclear", () => {
  for (const id of ["e428", "e472g", "e701", "e909", "e921", "e1000", "e1100", "e1516"]) {
    const additive = additiveById.get(id);

    assert.ok(additive, `${id} should exist`);
    assert.equal(additive.guidanceConfidence, "medium", `${id} should be reviewed to medium confidence`);
    assert.equal(getRiskGuidance(additive), "avoid-if-unclear", `${id} should remain conservative`);
  }
});

test("reviewed elevated product-use records avoid if unclear", () => {
  for (const id of ["e121", "e125", "e240", "e556", "e918", "e924b", "e925", "e930"]) {
    const additive = additiveById.get(id);

    assert.ok(additive, `${id} should exist`);
    assert.equal(additive.guidanceConfidence, "medium", `${id} should be reviewed to medium confidence`);
    assert.equal(getRiskGuidance(additive), "avoid-if-unclear", `${id} should remain conservative`);
  }
});

test("reviewed official synthetic and mineral coverage records are generally ok", () => {
  for (const id of ["e512", "e1205", "e1206", "e1207", "e1208"]) {
    const additive = additiveById.get(id);

    assert.ok(additive, `${id} should exist`);
    assert.equal(additive.guidanceConfidence, "medium", `${id} should be reviewed to medium confidence`);
    assert.equal(getRiskGuidance(additive), "permissible", `${id} should be generally ok`);
  }
});

test("reviewed official carrier and enzyme entries still require verification", () => {
  for (const id of ["e325", "e326", "e327", "e423", "e905", "e1103", "e1209", "e1521"]) {
    const additive = additiveById.get(id);

    assert.ok(additive, `${id} should exist`);
    assert.equal(additive.guidanceConfidence, "medium", `${id} should be reviewed to medium confidence`);
    assert.notEqual(getRiskGuidance(additive), "permissible", `${id} should still require verification`);
  }
});

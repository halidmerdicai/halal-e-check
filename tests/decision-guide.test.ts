import assert from "node:assert/strict";
import test from "node:test";
import { additives } from "../src/data/additives";
import { getManufacturerQuestions } from "../src/lib/decision-guide";

function question(code: string) {
  const additive = additives.find((item) => item.eNumber === code);
  assert.ok(additive);
  return getManufacturerQuestions(additive)[0];
}

test("beef and lactic acid do not generate questions about insects or bees", () => {
  assert.match(question("E441"), /species|animal/i);
  assert.doesNotMatch(question("E441"), /insect|bee/i);
  for (const code of ["E481", "E482"]) {
    assert.match(question(code), /plant|animal|fatty|stearic/i);
    assert.doesNotMatch(question(code), /insect|bee/i);
  }
  assert.match(question("E901"), /bee/i);
  assert.match(question("E904"), /insect|lac/i);
  assert.match(question("E120"), /insect|cochineal/i);
});

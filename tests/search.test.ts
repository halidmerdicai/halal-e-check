import assert from "node:assert/strict";
import test from "node:test";
import { findAdditiveByCode, searchAdditives } from "../src/lib/search";

test("code searches only return the exact code, never a fuzzy substitute", () => {
  for (const code of ["E9999", "E5009", "E471z", "E4O7", "9999", "E999 9", "E 471 z"]) {
    assert.deepEqual(searchAdditives(code), [], code);
    assert.equal(findAdditiveByCode(code), undefined, code);
  }
  for (const code of ["E470b", "470b", "E 470b", "e-470b"]) {
    assert.deepEqual(searchAdditives(code).map((item) => item.eNumber), ["E470b"]);
  }
  assert.equal(searchAdditives("lecitin")[0]?.eNumber, "E322");
  assert.ok(searchAdditives("oil").length > 0, "ordinary words must retain text search");
});

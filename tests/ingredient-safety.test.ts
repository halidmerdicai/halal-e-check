import assert from "node:assert/strict";
import test from "node:test";
import { checkIngredients, cleanIngredientCodeText } from "../src/lib/ingredient-check";

test("an unknown code is never silently replaced by a known additive", () => {
  for (const code of ["E9999", "E5009", "E471z", "E4074", "E250i", "E2501", "E4O7"]) {
    const result = checkIngredients(code);
    assert.deepEqual(result.matches.map((match) => match.additive.eNumber), [], code);
    assert.deepEqual(result.unknownCodes.map((item) => item.code), [code.toUpperCase()], code);
  }
});

test("negated ingredients are excluded without hiding a separate positive occurrence", () => {
  for (const input of ["gelatin-free candy, E330", "without gelatin, E330", "free from gelatin, E330", "bez želatine, E330", "E120-free candy, E330"]) {
    assert.deepEqual(checkIngredients(input).matches.map((match) => match.additive.eNumber), ["E330"], input);
  }
  const input = "Gelatin-free coating. Ingredients: gelatin, E330.";
  const gelatin = checkIngredients(input).matches.find((match) => match.additive.eNumber === "E441");
  assert.ok(gelatin);
  assert.equal(gelatin.start, input.lastIndexOf("gelatin"));
});

test("OCR suggestions preserve normal words and never guess arbitrary unknown codes", () => {
  const input = "E500 and sugar; E452 i E331; E9999; E471z";
  assert.deepEqual(cleanIngredientCodeText(input), { text: input, corrections: [] });
});

test("the full ingredient name wins over a shorter overlapping alias", () => {
  const result = checkIngredients("Ingredients: calcium stearoyl lactylate");
  assert.deepEqual(result.matches.map((match) => match.additive.eNumber), ["E482"]);
  assert.equal(result.matches[0].matchedText, "calcium stearoyl lactylate");
});

test("negation stays within a clause and cannot be bypassed by spaced numeric codes", () => {
  assert.deepEqual(checkIngredients("without E 120, colour E330").matches.map((item) => item.additive.eNumber), ["E330"]);
  assert.deepEqual(checkIngredients("No. Ingredients: gelatin").matches.map((item) => item.additive.eNumber), ["E441"]);
  assert.deepEqual(checkIngredients("not gelatin-free").matches.map((item) => item.additive.eNumber), ["E441"]);
});

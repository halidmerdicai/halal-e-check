import assert from "node:assert/strict";
import test from "node:test";
import { checkIngredients, cleanIngredientCodeText } from "../src/lib/ingredient-check";

type LabelCase = {
  name: string;
  sourcePhoto: string;
  text: string;
  expectedCodes: string[];
};

const labelCases: LabelCase[] = [
  {
    name: "cooking cream label",
    sourcePhoto: "WhatsApp Image 2026-06-11 at 00.11.37 (1).jpeg",
    text:
      "Sastojci: obrano mlijeko, biljna mast (palma) 20%, modifikovani skrob, zgusnjivac E412, emulgator E472e, regulator kiselosti (E339-E452).",
    expectedCodes: ["E339", "E412", "E452", "E472e"]
  },
  {
    name: "mayonnaise label",
    sourcePhoto: "WhatsApp Image 2026-06-11 at 00.11.37.jpeg",
    text:
      "Sastojci: suncokretovo ulje 75%, voda, zumance (iz jaja) 6%, sirce, secer, senf, so, regulator kiselosti limunska kiselina, antioksidans E385.",
    expectedCodes: ["E330", "E385"]
  },
  {
    name: "ketchup label with Balkan additive names",
    sourcePhoto: "WhatsApp Image 2026-06-11 at 00.10.13.jpeg",
    text:
      "Sastojci: voda, koncentrisani paradajz 23%, secer, sirce, modifikovani skrob, so, regulator kiselosti limunska kiselina, stabilizatori: guar guma i ksantan guma, konzervans kalijum-sorbat, aroma.",
    expectedCodes: ["E202", "E330", "E412", "E415"]
  },
  {
    name: "pizza label with dense E-number list",
    sourcePhoto: "WhatsApp Image 2026-06-10 at 23.21.31.jpeg",
    text:
      "Sastojci: emulgatori E452 i E331, stabilizator E407, konzervans E200, boja E160a, zgusnjivaci E407 i E407a, pojacivac okusa E621, stabilizatori E450 i E 451, antioksidansi E316 i E330, konzervans E250.",
    expectedCodes: ["E160a", "E200", "E250", "E316", "E330", "E331", "E407", "E407a", "E450", "E451", "E452", "E621"]
  }
];

for (const labelCase of labelCases) {
  test(`${labelCase.name} detects expected additives`, () => {
    const result = checkIngredients(labelCase.text);
    const detectedCodes = new Set(result.matches.map((match) => match.additive.eNumber));

    for (const code of labelCase.expectedCodes) {
      assert.ok(detectedCodes.has(code), `${labelCase.sourcePhoto} should detect ${code}`);
    }

    assert.deepEqual(result.unknownCodes, [], `${labelCase.sourcePhoto} should not create unknown E-numbers`);
  });
}

test("OCR cleanup corrects observed E-number mistakes and reports them", () => {
  const input = "stabilizator E4074, konzervans E250i, E2501, emulgator E4O7";
  const cleaned = cleanIngredientCodeText(input);

  assert.equal(cleaned.text, "stabilizator E407a, konzervans E250, E250, emulgator E407");
  assert.deepEqual(
    cleaned.corrections.map((correction) => [correction.from, correction.to]),
    [
      ["E4074", "E407a"],
      ["E250i", "E250"],
      ["E2501", "E250"],
      ["E4O7", "E407"]
    ]
  );
});

test("valid suffixes are preserved", () => {
  const cleaned = cleanIngredientCodeText("E407, E407a, E472e, E160a");

  assert.equal(cleaned.text, "E407, E407a, E472e, E160a");
  assert.deepEqual(cleaned.corrections, []);
});

test("priority review aliases detect common additive label names", () => {
  const result = checkIngredients(
    [
      "boja kosenil",
      "emulgator mono i digliceridi",
      "emulgator datem",
      "mononatrijev glutamat",
      "pojacivac okusa 631",
      "konditorska glazura",
      "sredstvo za tretiranje brasna"
    ].join(", ")
  );
  const detectedCodes = new Set(result.matches.map((match) => match.additive.eNumber));

  for (const code of ["E120", "E471", "E472e", "E621", "E631", "E904", "E920"]) {
    assert.ok(detectedCodes.has(code), `should detect ${code}`);
  }
});

test("second review batch aliases detect common additive label names", () => {
  const result = checkIngredients(
    [
      "konzervans nitrit",
      "kalijum nitrat",
      "emulgator lecitin",
      "humektant glicerol",
      "govedji zelatin",
      "fosfat iz kostiju",
      "stearinska kiselina",
      "pcelinji vosak"
    ].join(", ")
  );
  const detectedCodes = new Set(result.matches.map((match) => match.additive.eNumber));

  for (const code of ["E250", "E252", "E322", "E422", "E441", "E542", "E570", "E901"]) {
    assert.ok(detectedCodes.has(code), `should detect ${code}`);
  }
});

test("new high-value records detect E572 and E913 labels", () => {
  const result = checkIngredients(
    [
      "protiv zgrudnjavanja E572",
      "magnesium stearate",
      "magnezijum stearat",
      "glazing agent E913",
      "lanolin",
      "wool wax"
    ].join(", ")
  );
  const detectedCodes = new Set(result.matches.map((match) => match.additive.eNumber));

  for (const code of ["E572", "E913"]) {
    assert.ok(detectedCodes.has(code), `should detect ${code}`);
  }
});

test("source-sensitive alias batch detects practical label names", () => {
  const result = checkIngredients(
    [
      "antioksidans askorbil palmitat",
      "stabilizator ester guma",
      "emulgator span 60",
      "sorbitanski tristearat",
      "sorbitan ester laurinske kiseline",
      "emulgator span 80",
      "sorbitan ester palmitinske kiseline",
      "enzim lizozim iz jaja",
      "nosac glicerol diacetat",
      "carrier triacetin"
    ].join(", ")
  );
  const detectedCodes = new Set(result.matches.map((match) => match.additive.eNumber));

  for (const code of ["E304", "E445", "E491", "E492", "E493", "E494", "E495", "E1105", "E1517", "E1518"]) {
    assert.ok(detectedCodes.has(code), `should detect ${code}`);
  }
});

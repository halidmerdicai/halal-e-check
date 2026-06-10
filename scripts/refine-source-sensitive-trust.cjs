const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "..", "src", "data", "additives", "additives.json");
const additives = JSON.parse(fs.readFileSync(filePath, "utf8"));

const today = "2026-06-07";

const sources = {
  ahfMatrix: {
    type: "halal-guidance",
    label: "American Halal Foundation ingredient risk matrix",
    url: "https://halalfoundation.org/halal-ingredients-matrix/",
    note:
      "Classifies ingredients such as gelatin, animal fats, L-cysteine, shellac, animal glycerin, and other animal-derived inputs as higher halal risk requiring verification."
  },
  ahfPackaging: {
    type: "halal-guidance",
    label: "American Halal Foundation packaging requirements",
    url: "https://halalfoundation.org/halal-certification-requirements-for-packaging-manufacturers/",
    note:
      "Highlights source concerns for stearates, animal-based glycerins, shellac, coatings, solvents, and residual alcohol in materials that can contact food."
  },
  ahfGeneral: {
    type: "halal-guidance",
    label: "American Halal Foundation halal standards",
    url: "https://halalfoundation.org/ahf-halal-standards/",
    note:
      "General halal standard reference for animal derivatives, haram contamination, processing aids, and certification controls."
  }
};

function getRecord(code) {
  const record = additives.find((additive) => additive.numericCode === code);
  if (!record) throw new Error(`Missing additive ${code}`);
  return record;
}

function addSource(record, source) {
  if (!record.sources.some((existing) => existing.url === source.url && existing.label === source.label)) {
    record.sources.splice(Math.max(record.sources.length - 1, 1), 0, source);
  }
}

function mergeList(record, key, values) {
  for (const value of values) {
    if (!record[key].includes(value)) record[key].push(value);
  }
}

function refineFlavorEnhancer(code) {
  const record = getRecord(code);
  record.status = "mashbooh";
  record.sourceSensitivity = "high";
  record.guidanceConfidence = "medium";
  record.summary =
    `${record.name} is a nucleotide flavor enhancer. It may be fermentation-derived, fish-derived, or animal-derived depending on supplier, so the E-number alone is not enough for halal confidence.`;
  record.usuallyDerivedFrom = ["Microbial fermentation", "Yeast or plant carbohydrate fermentation", "Fish", "Animal extract may be possible"];
  record.halalWhen = [
    "Produced by acceptable microbial fermentation",
    "Produced from fish or halal-certified animal source accepted by the user's certifier",
    "Vegetarian, vegan, or halal-certified source is confirmed"
  ];
  record.haramWhen = [
    "Produced from pork",
    "Produced from non-halal animal extract",
    "Animal source is undisclosed and no halal certification or vegetarian/vegan evidence is present"
  ];
  record.whatToCheck = [
    "Halal certification",
    "Manufacturer source statement for the nucleotide",
    "Vegetarian or vegan suitability",
    "Whether the flavor system also contains E631, E635, meat extract, broth, or alcohol-based carriers"
  ];
  record.saferAction =
    "For savory snacks, instant noodles, soups, sauces, and seasoning blends, verify the source or choose a halal-certified/vegetarian product; avoid if the source is unclear.";
  record.notes = [
    "These flavor enhancers are often used together, so check the whole flavor-enhancer system, not only one E-number.",
    "Vegetarian or vegan labeling is useful source evidence, but halal certification is stronger for the finished product.",
    "Ask the manufacturer whether the nucleotide is fermentation-derived, fish-derived, or made from animal extract."
  ];
  record.lastReviewed = today;
  record.reviewNotes =
    "Reviewed as source-dependent nucleotide flavor enhancer. Conservative guidance kept as mashbooh because supplier source can determine halal status.";
  addSource(record, sources.ahfMatrix);
  addSource(record, sources.ahfGeneral);
}

[
  "626",
  "627",
  "628",
  "629",
  "630",
  "631",
  "632",
  "633",
  "634",
  "635"
].forEach(refineFlavorEnhancer);

{
  const record = getRecord("542");
  record.summary = "Bone phosphate is animal-derived phosphate. Halal status depends on animal species, slaughter status, and certification.";
  record.usuallyDerivedFrom = ["Animal bones", "Bovine bone may be possible", "Pork bone may be possible"];
  record.halalWhen = ["Made from halal-slaughtered animal source", "Made from a source accepted by a trusted halal certifier", "The finished product is halal-certified"];
  record.haramWhen = ["Made from pork bone", "Made from non-halal-slaughtered animal bone", "Animal source is undisclosed"];
  record.whatToCheck = ["Halal certification", "Animal species", "Slaughter status", "Manufacturer source statement"];
  record.saferAction = "Avoid if the animal source and halal certification are not clear.";
  mergeList(record, "notes", ["Treat bone-derived phosphates like other animal-derived additives: the source and certification matter."]);
  record.lastReviewed = today;
  record.reviewNotes = "Reviewed as animal-derived phosphate with explicit species/slaughter verification guidance.";
  addSource(record, sources.ahfMatrix);
  addSource(record, sources.ahfGeneral);
}

{
  const record = getRecord("901");
  record.sourceSensitivity = "medium";
  record.guidanceConfidence = "medium";
  record.summary =
    "Beeswax is bee-derived. It is commonly treated as lower risk than insect colors or shellac, but users may still want certification or certifier preference checking.";
  record.halalWhen = [
    "Accepted by the user's halal authority",
    "The finished product is halal-certified",
    "No haram solvents, carriers, or non-halal coatings are used"
  ];
  record.haramWhen = [
    "A user's certifier or standard avoids bee-derived glazing agents",
    "Used with haram carriers or in a non-halal finished product"
  ];
  record.whatToCheck = ["Halal certification", "Manufacturer statement on glazing/coating system", "Whether vegan status matters to the user"];
  record.saferAction = "Use certified products if avoiding bee-derived ingredients or if the finished product is doubtful.";
  record.notes = [
    "Bee-derived; many halal consumers accept it, but it is not vegan.",
    "Finished-product context still matters because glazing agents can be combined with carriers or solvents."
  ];
  record.lastReviewed = today;
  record.reviewNotes = "Reviewed as preference-sensitive bee-derived glazing agent with lower risk than shellac/carmine but still source/context dependent.";
  addSource(record, sources.ahfMatrix);
}

{
  const record = getRecord("904");
  record.summary =
    "Shellac is a glazing agent from lac insect resin. Acceptance can vary, and coatings may also involve solvents or carrier systems, so certification is safest.";
  record.halalWhen = [
    "A trusted halal certifier accepts the specific source and process",
    "No haram solvents or carriers are used",
    "The finished product is halal-certified"
  ];
  record.haramWhen = [
    "Insect-derived glazing agents are not accepted by the user's halal authority",
    "Source, solvent, or carrier system is unclear",
    "Used in a non-halal finished product"
  ];
  record.whatToCheck = ["Halal certification", "Manufacturer statement on shellac source", "Coating solvent/carrier system", "Vegan label if avoiding insect-derived ingredients"];
  record.saferAction = "Avoid if insect-derived glazing agents are not accepted by your halal authority; choose certified or vegan alternatives.";
  record.notes = [
    "Also appears as confectioner's glaze in some markets.",
    "Product-level halal status can depend on formulation, carriers, processing aids, and certification."
  ];
  record.lastReviewed = today;
  record.reviewNotes = "Reviewed as insect-derived glazing agent with explicit solvent/carrier verification guidance.";
  addSource(record, sources.ahfMatrix);
  addSource(record, sources.ahfPackaging);
}

{
  const record = getRecord("920");
  record.summary =
    "L-Cysteine can be synthetic, fermentation-derived, or animal-derived in some supply chains. It should be verified in bakery and flour-treatment use.";
  record.halalWhen = ["Made synthetically", "Made by acceptable microbial fermentation", "Made from a halal-certified source"];
  record.haramWhen = ["Made from human hair", "Made from pork or non-halal animal material", "Source is undisclosed in bakery products"];
  record.whatToCheck = ["Halal certification", "Manufacturer source statement", "Vegan, microbial, or synthetic source claim", "Whether it is used in bread improvers or flour treatment"];
  record.saferAction = "Verify source or choose halal-certified bakery products.";
  record.notes = [
    "Historically source-sensitive; do not infer halal status from the E-number alone.",
    "Product-level halal status can still depend on formulation, carriers, processing aids, and certification."
  ];
  record.lastReviewed = today;
  record.reviewNotes = "Reviewed as high-risk flour-treatment additive because feather/hair or other animal-derived sources may require verification.";
  addSource(record, sources.ahfMatrix);
  addSource(record, sources.ahfGeneral);
}

{
  const record = getRecord("1105");
  record.summary =
    "Lysozyme is commonly egg-derived. It is not usually a pork concern, but it still needs product-context checking, especially in cheese and fermentation-related foods.";
  record.usuallyDerivedFrom = ["Egg white", "Microbial or other sources may be possible"];
  record.halalWhen = ["Egg-derived source is acceptable and the finished product is halal", "The product is halal-certified", "No haram processing aids or carriers are used"];
  record.haramWhen = ["Used in a non-halal finished product", "Used with haram processing aids", "Source or processing context is doubtful"];
  record.whatToCheck = ["Egg allergen declaration", "Halal certification", "Manufacturer source statement", "Food category and processing context"];
  record.saferAction = "Check source and product certification, especially in cheese and wine-related processing contexts.";
  record.notes = [
    "Egg source can be acceptable for many users, but the finished product and processing context matter.",
    "Also relevant for allergen review."
  ];
  record.lastReviewed = today;
  record.reviewNotes = "Reviewed as enzyme/source-context record: usually egg-derived, but finished-product process determines confidence.";
  addSource(record, sources.ahfGeneral);
}

{
  const record = getRecord("1519");
  record.sourceSensitivity = "medium";
  record.guidanceConfidence = "medium";
  record.summary =
    "Benzyl alcohol is an alcohol-named carrier/solvent. Halal concern depends on how it is used, residual presence, finished-product formulation, and certifier standard.";
  record.usuallyDerivedFrom = ["Synthetic production", "Natural flavor systems", "Carrier or solvent systems"];
  record.halalWhen = ["Used in a manner accepted by the certifier", "No intoxicating alcohol remains in the finished product beyond accepted limits", "The finished product is halal-certified"];
  record.haramWhen = ["Used as part of a haram flavor or solvent system", "Certifier does not accept the residual alcohol context", "Finished product contains impermissible alcohol or haram carriers"];
  record.whatToCheck = ["Halal certification", "Flavor or carrier system", "Residual alcohol policy", "Manufacturer or certifier statement"];
  record.saferAction = "For flavors and extracts, rely on halal certification or manufacturer confirmation; avoid unclear products if following stricter alcohol-carrier standards.";
  record.notes = [
    "The word alcohol in a chemical name does not automatically mean the ingredient is an intoxicating beverage alcohol.",
    "Finished-product use, residual level, and certifier standard are the important checks."
  ];
  record.lastReviewed = today;
  record.reviewNotes = "Reviewed as context-sensitive carrier/solvent record; kept mashbooh because finished-product use and certifier standard matter.";
  addSource(record, sources.ahfPackaging);
  addSource(record, sources.ahfGeneral);
}

fs.writeFileSync(filePath, `${JSON.stringify(additives, null, 2)}\n`);

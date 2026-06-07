const fs = require("fs");

const path = "src/data/additives/additives.json";
const additives = JSON.parse(fs.readFileSync(path, "utf8"));

function update(id, patch) {
  const additive = additives.find((item) => item.id === id);
  if (!additive) throw new Error(`Missing additive ${id}`);
  Object.assign(additive, patch);
}

const verify = [
  "Halal certification",
  "Manufacturer source statement",
  "Vegan or plant-based label where relevant",
  "Whether alcohol-based carriers or processing aids are used"
];

const fattyHalalWhen = [
  "Fatty acids are confirmed plant-derived",
  "Fatty acids are produced synthetically without haram inputs",
  "The finished product is halal-certified"
];

const fattyHaramWhen = [
  "Fatty acids come from pork fat",
  "Fatty acids come from non-halal animal fat",
  "Animal source is undisclosed and no halal certification is present"
];

const fattyNotes = [
  "The E-number alone does not reveal whether the fatty acid source is plant, synthetic, or animal.",
  "A vegan label is useful source evidence, but halal certification is stronger for the full product.",
  "Ask specifically about the fatty acid or glycerol source when contacting a manufacturer."
];

[
  "e304",
  "e432",
  "e433",
  "e434",
  "e435",
  "e436",
  "e442",
  "e445",
  "e470",
  "e470a",
  "e470b",
  "e471",
  "e472a",
  "e472b",
  "e472c",
  "e472d",
  "e472e",
  "e472f",
  "e473",
  "e474",
  "e475",
  "e476",
  "e477",
  "e479b",
  "e481",
  "e482",
  "e483",
  "e491",
  "e492",
  "e493",
  "e494",
  "e495",
  "e570"
].forEach((id) => {
  update(id, {
    status: "mashbooh",
    sourceSensitivity: id === "e476" ? "medium" : "high",
    halalWhen: fattyHalalWhen,
    haramWhen: fattyHaramWhen,
    whatToCheck: verify,
    notes: fattyNotes,
    guidanceConfidence: "medium",
    reviewNotes: "High-priority source-dependent record: halal status depends on the fatty acid, glycerol, or stearate source."
  });
});

update("e120", {
  guidanceConfidence: "high",
  reviewNotes: "High-confidence avoid entry because carmine/cochineal is insect-derived and commonly avoided by halal consumers.",
  notes: [
    "Also appears as cochineal, carminic acid, carmines, natural red 4, or crimson lake.",
    "A vegan label usually excludes carmine because it is insect-derived.",
    "Only rely on it if a trusted halal certifier explicitly accepts the source and process."
  ]
});

update("e422", {
  summary: "Glycerol can be plant-derived, synthetic, or animal-derived, so it needs source verification unless the product is halal-certified or vegan with acceptable processing.",
  usuallyDerivedFrom: ["Vegetable oils", "Animal fats", "Biodiesel or soap by-products", "Synthetic production"],
  halalWhen: ["Made from vegetable glycerol", "Made synthetically without haram inputs", "The finished product is halal-certified"],
  haramWhen: ["Made from pork fat", "Made from non-halal animal fat", "Used with haram alcohol carriers in the finished product"],
  whatToCheck: verify,
  saferAction: "Verify glycerol source or choose halal-certified/vegan products.",
  notes: [
    "Labels may say glycerol, glycerin, or glycerine.",
    "Vegetable glycerin is generally acceptable, but the finished product still matters.",
    "Glycerol can also be used as a carrier or humectant, so check flavor systems and coatings."
  ],
  guidanceConfidence: "medium",
  reviewNotes: "High-priority source-dependent record: glycerol source can be vegetable, synthetic, or animal."
});

update("e441", {
  summary: "Gelatin is animal-derived, so its halal status depends on animal species, slaughter status, and certification.",
  usuallyDerivedFrom: ["Pork skin or bones", "Beef hide or bones", "Fish collagen"],
  halalWhen: ["Made from halal-slaughtered bovine source", "Made from an accepted fish source", "Clearly certified halal"],
  haramWhen: ["Made from pork", "Made from non-halal-slaughtered animals", "Animal source is hidden or unclear"],
  whatToCheck: ["Halal certification", "Animal species", "Slaughter status", "Manufacturer confirmation", "Vegetarian alternatives such as agar or pectin"],
  saferAction: "Avoid if the source is not disclosed; choose halal-certified gelatin or plant-based alternatives.",
  guidanceConfidence: "high",
  reviewNotes: "High-priority animal-derived record: gelatin should never be assumed halal without source evidence."
});

update("e542", {
  summary: "Bone phosphate is animal bone-derived, so halal status depends on species, slaughter status, and certification.",
  usuallyDerivedFrom: ["Animal bones"],
  halalWhen: ["Animal source is halal and accepted by a trusted halal certifier"],
  haramWhen: ["Source is pork", "Animal source or slaughter status is unknown", "Non-halal animal bones are used"],
  whatToCheck: ["Halal certification", "Animal species", "Slaughter status", "Manufacturer confirmation"],
  saferAction: "Avoid unless halal-certified or clearly verified.",
  guidanceConfidence: "high",
  reviewNotes: "High-priority animal-derived record: bone phosphate requires explicit source verification."
});

["e626", "e627", "e628", "e629", "e630", "e631", "e632", "e633", "e634", "e635"].forEach((id) => {
  update(id, {
    status: "mashbooh",
    sourceSensitivity: "high",
    usuallyDerivedFrom: ["Microbial fermentation", "Yeast extract", "Fish", "Meat or animal-derived material may be possible"],
    halalWhen: ["Made by acceptable microbial fermentation", "Made from fish or halal animal source accepted by certifier", "Vegan or halal-certified source is confirmed"],
    haramWhen: ["Made from pork", "Made from non-halal animal source", "Source is unknown and no halal certification is present"],
    whatToCheck: ["Halal certification", "Vegetarian or vegan suitability", "Manufacturer source statement", "Whether E631 or animal-derived IMP/GMP is included"],
    saferAction: "Verify the source for snacks, instant noodles, soups, and seasoning blends; avoid if unclear.",
    notes: [
      "These flavor enhancers are often used together, so check the whole flavor-enhancer system.",
      "Vegetarian or vegan labeling is helpful evidence for source, but halal certification is stronger.",
      "E631 and E635 are especially common in savory snacks and instant noodles."
    ],
    guidanceConfidence: "medium",
    reviewNotes: "High-priority flavor-enhancer record: source can be fermentation, fish, or animal-derived."
  });
});

update("e901", {
  summary: "Beeswax is bee-derived. Many halal consumers accept it, but it is not vegan and may need certifier preference checking.",
  usuallyDerivedFrom: ["Bee-derived wax"],
  halalWhen: ["Accepted by the user's halal authority", "The finished product is halal-certified", "No haram solvents or carriers are used"],
  haramWhen: ["A user's certifier or school avoids insect/bee-derived glazing agents", "Used with haram carriers or in a non-halal finished product"],
  whatToCheck: ["Halal certification", "Whether the product is vegan if that matters", "Manufacturer statement on glazing agents"],
  saferAction: "Use certified products if avoiding bee-derived ingredients or if the finished product is doubtful.",
  guidanceConfidence: "medium",
  reviewNotes: "Preference-sensitive bee-derived record: halal acceptance may vary by certifier or user standard."
});

update("e904", {
  summary: "Shellac is a glazing agent from lac insect resin, so many users treat it as questionable or avoid it unless certified.",
  usuallyDerivedFrom: ["Lac insect resin"],
  halalWhen: ["A trusted halal certifier accepts the specific source and process", "No haram solvents or carriers are used"],
  haramWhen: ["Insect-derived glazing agents are not accepted by the user's halal authority", "Source or processing solvent is unclear"],
  whatToCheck: ["Halal certification", "Vegan label", "Manufacturer statement on shellac source and solvent"],
  saferAction: "Avoid if insect-derived glazing agents are not accepted by your halal authority; choose certified or vegan alternatives.",
  guidanceConfidence: "medium",
  reviewNotes: "High-priority insect-derived glazing record: acceptance varies, so certification or avoidance is safest."
});

update("e920", {
  summary: "L-Cysteine can be synthetic, fermentation-derived, or animal-derived in some supply chains, so source verification is important.",
  usuallyDerivedFrom: ["Synthetic production", "Microbial fermentation", "Poultry feathers", "Hair may be possible in some supply chains"],
  halalWhen: ["Made synthetically", "Made by acceptable microbial fermentation", "Made from a halal-certified source"],
  haramWhen: ["Made from human hair", "Made from pork or non-halal animal material", "Source is undisclosed in bakery products"],
  whatToCheck: ["Halal certification", "Manufacturer source statement", "Vegan or microbial/synthetic source claim"],
  saferAction: "Verify source or choose halal-certified bakery products.",
  guidanceConfidence: "medium",
  reviewNotes: "High-priority flour-treatment record: source has historically varied and should be verified."
});

update("e1105", {
  summary: "Lysozyme is commonly egg-derived, so it is usually not a pork concern but still needs checking for source, allergen, and certification.",
  usuallyDerivedFrom: ["Egg white", "Microbial or other sources may be possible"],
  halalWhen: ["Egg-derived source is acceptable and the finished product is halal", "The product is halal-certified"],
  haramWhen: ["Used in a non-halal finished product", "Source or processing aids are doubtful"],
  whatToCheck: ["Egg allergen declaration", "Halal certification", "Manufacturer source statement"],
  saferAction: "Check source and product certification, especially in cheese and wine-related processing contexts.",
  guidanceConfidence: "medium",
  reviewNotes: "Source/allergen-sensitive enzyme record: usually egg-derived, but product context matters."
});

["e1517", "e1518"].forEach((id) => {
  update(id, {
    status: "mashbooh",
    sourceSensitivity: "high",
    usuallyDerivedFrom: ["Glycerol", "Acetic acid", "Vegetable glycerol", "Animal-derived glycerol may be possible"],
    halalWhen: ["Glycerol is confirmed vegetable or synthetic", "The carrier system is halal-certified", "No haram solvent or processing aid is used"],
    haramWhen: ["Glycerol comes from pork or non-halal animal fat", "Used as part of a haram flavor or solvent system", "Source is not disclosed"],
    whatToCheck: verify,
    saferAction: "Verify the glycerol source and the full carrier system.",
    notes: [
      "This additive is tied to glycerol source concerns.",
      "Carrier solvents can affect the finished-product ruling even when the additive itself is chemically simple."
    ],
    guidanceConfidence: "medium",
    reviewNotes: "High-priority carrier/solvent record: source depends on glycerol origin and use context."
  });
});

update("e1519", {
  summary: "Benzyl alcohol is an alcohol-named carrier or solvent. Product-level ruling depends on use, amount, transformation, and certifier guidance.",
  usuallyDerivedFrom: ["Synthetic production", "Natural aromatic sources"],
  halalWhen: ["A halal certifier accepts its technical use", "It is not used as an intoxicating ingredient", "The finished product is halal-certified"],
  haramWhen: ["Used as part of a haram flavor or solvent system", "Certifier guidance rejects the specific use", "Finished product contains other haram ingredients"],
  whatToCheck: ["Halal certification", "Role as carrier or solvent", "Manufacturer/certifier statement"],
  saferAction: "For strict halal shopping, prefer certified products when benzyl alcohol appears in flavors or extracts.",
  guidanceConfidence: "medium",
  reviewNotes: "Context-sensitive alcohol-named carrier record: needs certifier or manufacturer context."
});

additives.sort((a, b) => a.numericCode.localeCompare(b.numericCode, undefined, { numeric: true }));
fs.writeFileSync(path, `${JSON.stringify(additives, null, 2)}\n`);
console.log("refined high-risk records");

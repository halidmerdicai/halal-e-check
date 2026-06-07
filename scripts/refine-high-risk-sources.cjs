const fs = require("fs");

const path = "src/data/additives/additives.json";
const additives = JSON.parse(fs.readFileSync(path, "utf8"));

function updateSources(id, sources) {
  const additive = additives.find((item) => item.id === id);
  if (!additive) throw new Error(`Missing additive ${id}`);
  additive.sources = sources;
}

const fsaSource = {
  type: "identity",
  label: "UK Food Standards Agency additive list",
  url: "https://www.food.gov.uk/business-guidance/approved-additives-and-e-numbers",
  note: "Used to cross-check additive identity and E-number naming, not halal status."
};

const editorialSource = {
  type: "editorial",
  label: "Halal E-Check source-risk review",
  note: "General halal guidance based on source sensitivity: plant, microbial, insect, pork, non-halal animal, alcohol, and certification concerns."
};

const manufacturerSource = {
  type: "manufacturer-needed",
  label: "Manufacturer or halal certifier verification needed",
  note: "For source-dependent additives, the final ruling depends on the actual source and finished-product certification."
};

const fdaCarmineSource = {
  type: "regulatory",
  label: "FDA color additives in foods",
  url: "https://www.fda.gov/food/color-additives-information-consumers/color-additives-foods",
  note: "FDA identifies cochineal extract and carmine as insect-derived color additives."
};

const fdaCarmineLabelSource = {
  type: "regulatory",
  label: "FDA carmine/cochineal label declaration guide",
  url: "https://www.fda.gov/regulatory-information/search-fda-guidance-documents/small-entity-compliance-guide-declaration-name-label-all-foods-and-cosmetic-products-contain",
  note: "FDA guidance explains that foods containing cochineal extract or carmine must declare those names on the ingredient label in the United States."
};

const ahfGelatinSource = {
  type: "halal-guidance",
  label: "American Halal Foundation gelatin guidance",
  url: "https://halalfoundation.org/is-gelatin-halal/",
  note: "Explains that gelatin requires source, slaughter, processing, and certification verification."
};

const ahfMonoDiglyceridesSource = {
  type: "halal-guidance",
  label: "American Halal Foundation mono/diglycerides guidance",
  url: "https://halalfoundation.org/are-mono-diglycerides-halal/",
  note: "Explains that mono- and diglycerides can be plant, synthetic, pork, or non-halal animal derived, so source confirmation is required."
};

const ahfStandardsSource = {
  type: "halal-guidance",
  label: "American Halal Foundation halal standards",
  url: "https://halalfoundation.org/ahf-halal-standards/",
  note: "General halal standard reference for animal derivatives and source-sensitive ingredients such as glycerol/glycerin."
};

const carmineSources = [fsaSource, fdaCarmineSource, fdaCarmineLabelSource, editorialSource];
const gelatinSources = [fsaSource, ahfGelatinSource, editorialSource, manufacturerSource];
const fattyAcidSources = [fsaSource, ahfMonoDiglyceridesSource, editorialSource, manufacturerSource];
const glycerolSources = [fsaSource, ahfStandardsSource, editorialSource, manufacturerSource];
const sourceDependentSources = [fsaSource, editorialSource, manufacturerSource];

updateSources("e120", carmineSources);
updateSources("e441", gelatinSources);

[
  "e304",
  "e422",
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
].forEach((id) => updateSources(id, fattyAcidSources));

["e422", "e1517", "e1518"].forEach((id) => updateSources(id, glycerolSources));

[
  "e542",
  "e626",
  "e627",
  "e628",
  "e629",
  "e630",
  "e631",
  "e632",
  "e633",
  "e634",
  "e635",
  "e901",
  "e904",
  "e920",
  "e1105",
  "e1519"
].forEach((id) => updateSources(id, sourceDependentSources));

additives.sort((a, b) => a.numericCode.localeCompare(b.numericCode, undefined, { numeric: true }));
fs.writeFileSync(path, `${JSON.stringify(additives, null, 2)}\n`);
console.log("refined high-risk source metadata");

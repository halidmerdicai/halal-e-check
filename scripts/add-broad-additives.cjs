const fs = require("fs");

const path = "src/data/additives/additives.json";
const additives = JSON.parse(fs.readFileSync(path, "utf8"));

const fsaSource = {
  label: "UK Food Standards Agency additive list",
  url: "https://www.food.gov.uk/business-guidance/approved-additives-and-e-numbers",
  note: "Used to cross-check additive identity and E-number naming, not halal status."
};
const guidanceSource = {
  label: "Halal E-Check source-risk review",
  note: "General halal guidance based on source sensitivity: plant, microbial, insect, pork, non-halal animal, alcohol, and certification concerns."
};
const manufacturerSource = {
  label: "Manufacturer or halal certifier verification needed",
  note: "For source-dependent additives, the final ruling depends on the actual source and finished-product certification."
};

function idFromCode(code) {
  return `e${code.toLowerCase().replace(/[^0-9a-z]/g, "")}`;
}

function normalizeCode(code) {
  return code.toLowerCase().replace(/^e/i, "").replace(/\s+/g, "");
}

function confidenceFor(status, sensitivity) {
  if ((status === "halal" && sensitivity === "low") || status === "haram") return "high";
  return "medium";
}

function commonByCategory(category) {
  const lower = category.toLowerCase();
  if (lower.includes("color")) return ["Candy", "Drinks", "Desserts", "Sauces", "Processed foods"];
  if (lower.includes("preservative")) return ["Sauces", "Drinks", "Bakery products", "Cheese products", "Processed foods"];
  if (lower.includes("antioxidant")) return ["Oils", "Snacks", "Cereals", "Processed foods"];
  if (lower.includes("sweetener")) return ["Sugar-free drinks", "Desserts", "Chewing gum", "Tabletop sweeteners"];
  if (lower.includes("flavor")) return ["Seasonings", "Snacks", "Instant noodles", "Soups"];
  if (lower.includes("stabilizer") || lower.includes("thickener") || lower.includes("gelling")) return ["Sauces", "Desserts", "Dairy products", "Bakery products"];
  if (lower.includes("mineral") || lower.includes("anti-caking") || lower.includes("raising")) return ["Dry mixes", "Baked goods", "Supplements", "Powdered foods"];
  return ["Processed foods", "Packaged foods"];
}

function makeRecord(entry) {
  const code = normalizeCode(entry.code);
  const eNumber = `E${entry.code}`;
  const status = entry.status ?? "halal";
  const sourceSensitivity = entry.sourceSensitivity ?? (status === "mashbooh" ? "medium" : "low");
  const category = entry.category;
  const sensitivityText = sourceSensitivity === "high" ? "high source sensitivity" : sourceSensitivity === "medium" ? "some source sensitivity" : "low source sensitivity";
  const summary =
    entry.summary ??
    (status === "mashbooh"
      ? `${entry.name} is source-dependent or process-dependent, so the E-number alone is not enough for halal confidence.`
      : `${entry.name} is generally considered halal as an additive when the finished product has no other halal concerns.`);

  return {
    id: idFromCode(entry.code),
    eNumber,
    numericCode: code,
    name: entry.name,
    aliases: entry.aliases ?? [],
    category,
    status,
    summary,
    sourceSensitivity,
    usuallyDerivedFrom:
      entry.usuallyDerivedFrom ??
      (status === "mashbooh"
        ? ["Plant sources", "Microbial or synthetic production", "Animal-derived inputs may be possible"]
        : ["Mineral, plant, microbial, or synthetic production depending on the additive"]),
    halalWhen:
      entry.halalWhen ??
      (status === "mashbooh"
        ? ["Source is confirmed halal or plant-based", "The product is halal-certified", "No haram carrier, solvent, or processing aid is used"]
        : ["Used in its usual non-haram source form", "No haram carrier, solvent, or other ingredient is present", "The finished product is otherwise halal"]),
    haramWhen:
      entry.haramWhen ??
      (status === "mashbooh"
        ? ["Made from pork or non-halal animal sources", "A haram alcohol carrier or processing aid is used", "Source is unclear in a doubtful product"]
        : ["The finished product contains haram ingredients", "It is part of a flavor, color, or processing system with a doubtful carrier"]),
    whatToCheck:
      entry.whatToCheck ??
      (status === "mashbooh"
        ? ["Halal certification", "Manufacturer source statement", "Vegan or plant-based label where relevant"]
        : ["Full ingredient list", "Halal certification for complex foods", "Other doubtful ingredients in the finished product"]),
    saferAction: entry.saferAction ?? (status === "mashbooh" ? "Verify the source or choose a halal-certified product." : "Usually acceptable as an additive; check the rest of the product ingredients."),
    commonFoods: entry.commonFoods ?? commonByCategory(category),
    notes: entry.notes ?? [`This is a general ${sensitivityText} entry. Product-level halal status can still depend on formulation and certification.`],
    lastReviewed: "2026-06-04",
    guidanceConfidence: entry.guidanceConfidence ?? confidenceFor(status, sourceSensitivity),
    reviewedBy: "Halal E-Check editorial review",
    reviewNotes: entry.reviewNotes ?? (status === "mashbooh" ? "Marked mashbooh because the E-number alone does not prove the source or processing method." : "General guidance still depends on the finished product, processing aids, and certification."),
    sources: status === "mashbooh" ? [fsaSource, guidanceSource, manufacturerSource] : [fsaSource, guidanceSource],
    related: entry.related
  };
}

const newEntries = [
  ["100", "Curcumin", "Color", ["turmeric color", "curcumins"]],
  ["101", "Riboflavins", "Color", ["riboflavin", "vitamin b2"], { sourceSensitivity: "medium", notes: ["Usually produced synthetically or by fermentation; check if a carrier or growth medium concern is disclosed."] }],
  ["102", "Tartrazine", "Color", ["fd&c yellow 5", "yellow 5"]],
  ["104", "Quinoline yellow", "Color", ["quinoline yellow ws"]],
  ["110", "Sunset Yellow FCF", "Color", ["orange yellow s", "fd&c yellow 6"]],
  ["122", "Azorubine", "Color", ["carmoisine"]],
  ["123", "Amaranth", "Color", ["amaranth color"]],
  ["124", "Ponceau 4R", "Color", ["cochineal red a"], { summary: "A synthetic red color. Despite the alias Cochineal Red A, it is not the same as insect-derived E120 carmine." }],
  ["127", "Erythrosine", "Color", ["red 3", "fd&c red 3"]],
  ["129", "Allura Red AC", "Color", ["red 40", "fd&c red 40"]],
  ["131", "Patent Blue V", "Color", ["patent blue"]],
  ["132", "Indigotine", "Color", ["indigo carmine", "fd&c blue 2"]],
  ["133", "Brilliant Blue FCF", "Color", ["fd&c blue 1", "brilliant blue"]],
  ["140", "Chlorophylls and chlorophyllins", "Color", ["chlorophyll"], { usuallyDerivedFrom: ["Green plants", "Algae"] }],
  ["141", "Copper complexes of chlorophylls and chlorophyllins", "Color", ["copper chlorophyllin"]],
  ["142", "Green S", "Color", ["food green s"]],
  ["150a", "Plain caramel", "Color", ["caramel color", "caramel i"]],
  ["150b", "Caustic sulphite caramel", "Color", ["sulfite caramel", "caramel ii"]],
  ["150c", "Ammonia caramel", "Color", ["caramel iii"]],
  ["150d", "Sulphite ammonia caramel", "Color", ["sulfite ammonia caramel", "caramel iv"]],
  ["151", "Brilliant Black BN", "Color", ["black pn"]],
  ["153", "Vegetable carbon", "Color", ["carbon black", "vegetable charcoal"], { usuallyDerivedFrom: ["Vegetable carbonized material"] }],
  ["155", "Brown HT", "Color", ["chocolate brown ht"]],
  ["160a", "Carotenes", "Color", ["beta carotene", "carotene"], { usuallyDerivedFrom: ["Carrots", "Palm oil", "Algae", "Synthetic production"] }],
  ["160bi", "Annatto, bixin", "Color", ["annatto bixin", "bixin"], { usuallyDerivedFrom: ["Annatto seeds"] }],
  ["160bii", "Annatto, norbixin", "Color", ["annatto norbixin", "norbixin"], { usuallyDerivedFrom: ["Annatto seeds"] }],
  ["160c", "Paprika extract", "Color", ["capsanthin", "capsorubin", "paprika oleoresin"], { usuallyDerivedFrom: ["Paprika peppers"] }],
  ["160d", "Lycopene", "Color", ["tomato lycopene"], { usuallyDerivedFrom: ["Tomatoes", "Synthetic or microbial production"] }],
  ["160e", "Beta-apo-8-carotenal", "Color", ["beta apo carotenal"]],
  ["161b", "Lutein", "Color", ["marigold lutein"], { usuallyDerivedFrom: ["Marigold flowers", "Plant sources"] }],
  ["161g", "Canthaxanthin", "Color", ["canthaxanthin"]],
  ["162", "Beetroot Red", "Color", ["betanin", "beet red"], { usuallyDerivedFrom: ["Beetroot"] }],
  ["163", "Anthocyanins", "Color", ["grape skin extract", "anthocyanin"], { usuallyDerivedFrom: ["Fruit skins", "Vegetable sources"] }],
  ["170", "Calcium carbonate", "Color / mineral", ["chalk", "calcium carbonate"], { usuallyDerivedFrom: ["Limestone", "Mineral sources"] }],
  ["171", "Titanium dioxide", "Color", ["tio2"], { notes: ["Regulatory status differs by region; this entry is halal-source guidance, not safety or legality advice."] }],
  ["172", "Iron oxides and hydroxides", "Color / mineral", ["iron oxide", "iron hydroxide"]],
  ["173", "Aluminium", "Color / mineral", ["aluminum powder"]],
  ["174", "Silver", "Color / mineral", ["silver"]],
  ["175", "Gold", "Color / mineral", ["gold"]],
  ["180", "Litholrubine BK", "Color", ["lithol rubine"]],

  ["200", "Sorbic acid", "Preservative", ["sorbic acid"]],
  ["202", "Potassium sorbate", "Preservative", ["potassium sorbate"]],
  ["210", "Benzoic acid", "Preservative", ["benzoic acid"]],
  ["211", "Sodium benzoate", "Preservative", ["sodium benzoate"]],
  ["212", "Potassium benzoate", "Preservative", ["potassium benzoate"]],
  ["213", "Calcium benzoate", "Preservative", ["calcium benzoate"]],
  ["214", "Ethyl p-hydroxybenzoate", "Preservative", ["ethylparaben", "ethyl paraben"]],
  ["215", "Sodium ethyl p-hydroxybenzoate", "Preservative", ["sodium ethylparaben"]],
  ["218", "Methyl p-hydroxybenzoate", "Preservative", ["methylparaben", "methyl paraben"]],
  ["219", "Sodium methyl p-hydroxybenzoate", "Preservative", ["sodium methylparaben"]],
  ["220", "Sulphur dioxide", "Preservative", ["sulfur dioxide", "sulphur dioxide"]],
  ["221", "Sodium sulphite", "Preservative", ["sodium sulfite"]],
  ["222", "Sodium hydrogen sulphite", "Preservative", ["sodium bisulfite", "sodium hydrogen sulfite"]],
  ["223", "Sodium metabisulphite", "Preservative", ["sodium metabisulfite"]],
  ["224", "Potassium metabisulphite", "Preservative", ["potassium metabisulfite"]],
  ["226", "Calcium sulphite", "Preservative", ["calcium sulfite"]],
  ["227", "Calcium hydrogen sulphite", "Preservative", ["calcium bisulfite", "calcium hydrogen sulfite"]],
  ["228", "Potassium hydrogen sulphite", "Preservative", ["potassium bisulfite", "potassium hydrogen sulfite"]],
  ["234", "Nisin", "Preservative", ["nisin"], { sourceSensitivity: "medium", usuallyDerivedFrom: ["Microbial fermentation"], notes: ["Fermentation-derived; halal confidence depends on growth medium and finished-product certification where strict verification is needed."] }],
  ["235", "Natamycin", "Preservative", ["pimaricin"], { sourceSensitivity: "medium", usuallyDerivedFrom: ["Microbial fermentation"] }],
  ["239", "Hexamethylene tetramine", "Preservative", ["hexamine"]],
  ["242", "Dimethyl dicarbonate", "Preservative", ["dmdc"]],
  ["243", "Ethyl lauroyl arginate", "Preservative", ["lauric arginate ethyl ester", "lae"], { sourceSensitivity: "medium" }],
  ["249", "Potassium nitrite", "Preservative", ["potassium nitrite"]],
  ["250", "Sodium nitrite", "Preservative", ["sodium nitrite"]],
  ["251", "Sodium nitrate", "Preservative", ["sodium nitrate"]],
  ["252", "Potassium nitrate", "Preservative", ["potassium nitrate"]],
  ["280", "Propionic acid", "Preservative", ["propionic acid"]],
  ["281", "Sodium propionate", "Preservative", ["sodium propionate"]],
  ["282", "Calcium propionate", "Preservative", ["calcium propionate"]],
  ["283", "Potassium propionate", "Preservative", ["potassium propionate"]],
  ["284", "Boric acid", "Preservative", ["boric acid"]],
  ["285", "Sodium tetraborate", "Preservative", ["borax", "sodium tetraborate"]],

  ["260", "Acetic acid", "Acidity regulator", ["vinegar acid", "glacial acetic acid"]],
  ["261", "Potassium acetates", "Acidity regulator", ["potassium acetate"]],
  ["262", "Sodium acetates", "Acidity regulator", ["sodium acetate", "sodium diacetate"]],
  ["263", "Calcium acetate", "Acidity regulator", ["calcium acetate"]],
  ["270", "Lactic acid", "Acidity regulator", ["lactic acid"], { sourceSensitivity: "medium", usuallyDerivedFrom: ["Microbial fermentation", "Carbohydrate fermentation"], notes: ["Usually produced by fermentation rather than milk, but strict halal verification may check the fermentation medium."] }],
  ["290", "Carbon dioxide", "Packaging gas / acidity regulator", ["carbon dioxide", "co2"]],
  ["296", "Malic acid", "Acidity regulator", ["dl-malic acid", "malic acid"]],
  ["297", "Fumaric acid", "Acidity regulator", ["fumaric acid"]],
  ["300", "Ascorbic acid", "Antioxidant", ["vitamin c", "l-ascorbic acid"]],
  ["301", "Sodium ascorbate", "Antioxidant", ["sodium ascorbate"]],
  ["302", "Calcium ascorbate", "Antioxidant", ["calcium ascorbate"]],
  ["304", "Fatty acid esters of ascorbic acid", "Antioxidant", ["ascorbyl palmitate", "ascorbyl stearate"], { status: "mashbooh", sourceSensitivity: "high", usuallyDerivedFrom: ["Ascorbic acid", "Vegetable fatty acids", "Animal fatty acids"] }],
  ["306", "Tocopherols", "Antioxidant", ["tocopherol-rich extract", "vitamin e"], { sourceSensitivity: "medium", usuallyDerivedFrom: ["Vegetable oils", "Synthetic production"] }],
  ["307", "Alpha-tocopherol", "Antioxidant", ["alpha tocopherol", "vitamin e"], { sourceSensitivity: "medium" }],
  ["308", "Gamma-tocopherol", "Antioxidant", ["gamma tocopherol"], { sourceSensitivity: "medium" }],
  ["309", "Delta-tocopherol", "Antioxidant", ["delta tocopherol"], { sourceSensitivity: "medium" }],
  ["310", "Propyl gallate", "Antioxidant", ["propyl gallate"]],
  ["315", "Erythorbic acid", "Antioxidant", ["isoascorbic acid"]],
  ["316", "Sodium erythorbate", "Antioxidant", ["sodium isoascorbate"]],
  ["319", "Tertiary-butyl hydroquinone", "Antioxidant", ["tbhq"]],
  ["320", "Butylated hydroxyanisole", "Antioxidant", ["bha"]],
  ["321", "Butylated hydroxytoluene", "Antioxidant", ["bht"]],
  ["330", "Citric acid", "Acidity regulator", ["citric acid"], { sourceSensitivity: "medium", usuallyDerivedFrom: ["Microbial fermentation", "Carbohydrate fermentation"] }],
  ["331", "Sodium citrates", "Acidity regulator", ["sodium citrate"]],
  ["332", "Potassium citrates", "Acidity regulator", ["potassium citrate"]],
  ["333", "Calcium citrates", "Acidity regulator", ["calcium citrate"]],
  ["334", "Tartaric acid", "Acidity regulator", ["l-tartaric acid"]],
  ["335", "Sodium tartrates", "Acidity regulator", ["sodium tartrate"]],
  ["336", "Potassium tartrates", "Acidity regulator", ["potassium tartrate", "cream of tartar"]],
  ["337", "Potassium sodium tartrate", "Acidity regulator", ["rochelle salt"]],
  ["338", "Phosphoric acid", "Acidity regulator", ["phosphoric acid"]],
  ["339", "Sodium phosphates", "Acidity regulator / mineral salt", ["sodium phosphate"]],
  ["340", "Potassium phosphates", "Acidity regulator / mineral salt", ["potassium phosphate"]],
  ["341", "Calcium phosphates", "Acidity regulator / mineral salt", ["calcium phosphate"]],
  ["343", "Magnesium phosphates", "Acidity regulator / mineral salt", ["magnesium phosphate"]],
  ["350", "Sodium malates", "Acidity regulator", ["sodium malate"]],
  ["351", "Potassium malates", "Acidity regulator", ["potassium malate"]],
  ["352", "Calcium malates", "Acidity regulator", ["calcium malate"]],
  ["353", "Metatartaric acid", "Acidity regulator", ["metatartaric acid"]],
  ["354", "Calcium tartrate", "Acidity regulator", ["calcium tartrate"]],
  ["355", "Adipic acid", "Acidity regulator", ["adipic acid"]],
  ["356", "Sodium adipates", "Acidity regulator", ["sodium adipate"]],
  ["357", "Potassium adipates", "Acidity regulator", ["potassium adipate"]],
  ["363", "Succinic acid", "Acidity regulator", ["succinic acid"]],
  ["380", "Triammonium citrate", "Acidity regulator", ["ammonium citrate"]],
  ["385", "Calcium disodium EDTA", "Sequestrant", ["calcium disodium ethylenediaminetetraacetate", "edta"]],
  ["392", "Extracts of rosemary", "Antioxidant", ["rosemary extract"], { usuallyDerivedFrom: ["Rosemary leaves"] }]
];

for (const raw of newEntries) {
  const [code, name, category, aliases, options = {}] = raw;
  const id = idFromCode(code);
  if (additives.some((additive) => additive.id === id)) continue;
  additives.push(makeRecord({ code, name, category, aliases, ...options }));
}

additives.sort((a, b) => a.numericCode.localeCompare(b.numericCode, undefined, { numeric: true }));
fs.writeFileSync(path, `${JSON.stringify(additives, null, 2)}\n`);
console.log(`total=${additives.length}`);

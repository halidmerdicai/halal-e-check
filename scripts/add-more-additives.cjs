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

function commonByCategory(category) {
  const lower = category.toLowerCase();
  if (lower.includes("sweetener")) return ["Sugar-free drinks", "Desserts", "Chewing gum", "Tabletop sweeteners"];
  if (lower.includes("flavor")) return ["Seasonings", "Snacks", "Instant noodles", "Soups"];
  if (lower.includes("stabilizer") || lower.includes("thickener") || lower.includes("gelling")) return ["Sauces", "Desserts", "Dairy products", "Bakery products"];
  if (lower.includes("mineral") || lower.includes("anti-caking") || lower.includes("raising")) return ["Dry mixes", "Baked goods", "Supplements", "Powdered foods"];
  if (lower.includes("glazing")) return ["Candy", "Chocolate", "Fruit coatings", "Bakery glazes"];
  return ["Processed foods", "Packaged foods"];
}

function makeRecord(entry) {
  const status = entry.status ?? "halal";
  const sourceSensitivity = entry.sourceSensitivity ?? (status === "mashbooh" ? "medium" : "low");
  const summary =
    entry.summary ??
    (status === "mashbooh"
      ? `${entry.name} is source-dependent or process-dependent, so the E-number alone is not enough for halal confidence.`
      : `${entry.name} is generally considered halal as an additive when the finished product has no other halal concerns.`);

  return {
    id: idFromCode(entry.code),
    eNumber: `E${entry.code}`,
    numericCode: normalizeCode(entry.code),
    name: entry.name,
    aliases: entry.aliases ?? [],
    category: entry.category,
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
    commonFoods: entry.commonFoods ?? commonByCategory(entry.category),
    notes: entry.notes ?? ["Product-level halal status can still depend on formulation, carriers, processing aids, and certification."],
    lastReviewed: "2026-06-04",
    guidanceConfidence: entry.guidanceConfidence ?? ((status === "halal" && sourceSensitivity === "low") || status === "haram" ? "high" : "medium"),
    reviewedBy: "Halal E-Check editorial review",
    reviewNotes: entry.reviewNotes ?? (status === "mashbooh" ? "Marked mashbooh because the E-number alone does not prove the source or processing method." : "General guidance still depends on the finished product, processing aids, and certification."),
    sources: status === "mashbooh" ? [fsaSource, guidanceSource, manufacturerSource] : [fsaSource, guidanceSource],
    related: entry.related
  };
}

const newEntries = [
  ["400", "Alginic acid", "Stabilizer / thickener", ["alginic acid"], { usuallyDerivedFrom: ["Brown seaweed"] }],
  ["401", "Sodium alginate", "Stabilizer / thickener", ["sodium alginate"], { usuallyDerivedFrom: ["Brown seaweed"] }],
  ["402", "Potassium alginate", "Stabilizer / thickener", ["potassium alginate"], { usuallyDerivedFrom: ["Brown seaweed"] }],
  ["403", "Ammonium alginate", "Stabilizer / thickener", ["ammonium alginate"], { usuallyDerivedFrom: ["Brown seaweed"] }],
  ["404", "Calcium alginate", "Stabilizer / thickener", ["calcium alginate"], { usuallyDerivedFrom: ["Brown seaweed"] }],
  ["405", "Propane-1,2-diol alginate", "Stabilizer / thickener", ["propylene glycol alginate"], { sourceSensitivity: "medium" }],
  ["407", "Carrageenan", "Stabilizer / gelling agent", ["carrageenan"], { usuallyDerivedFrom: ["Red seaweed"] }],
  ["407a", "Processed eucheuma seaweed", "Stabilizer / gelling agent", ["pes", "processed eucheuma seaweed"], { usuallyDerivedFrom: ["Red seaweed"] }],
  ["410", "Locust bean gum", "Stabilizer / thickener", ["carob gum", "locust bean gum"], { usuallyDerivedFrom: ["Carob seeds"] }],
  ["413", "Tragacanth", "Stabilizer / thickener", ["tragacanth gum"], { usuallyDerivedFrom: ["Plant gum"] }],
  ["414", "Acacia gum", "Stabilizer / thickener", ["gum arabic", "acacia gum"], { usuallyDerivedFrom: ["Acacia tree gum"] }],
  ["415", "Xanthan gum", "Stabilizer / thickener", ["xanthan gum"], { sourceSensitivity: "medium", usuallyDerivedFrom: ["Microbial fermentation"] }],
  ["416", "Karaya gum", "Stabilizer / thickener", ["karaya gum"], { usuallyDerivedFrom: ["Plant gum"] }],
  ["417", "Tara gum", "Stabilizer / thickener", ["tara gum"], { usuallyDerivedFrom: ["Tara seeds"] }],
  ["418", "Gellan gum", "Stabilizer / gelling agent", ["gellan gum"], { sourceSensitivity: "medium", usuallyDerivedFrom: ["Microbial fermentation"] }],
  ["420", "Sorbitols", "Sweetener / humectant", ["sorbitol", "sorbitol syrup"]],
  ["421", "Mannitol", "Sweetener / humectant", ["mannitol"]],
  ["422", "Glycerol", "Humectant / carrier", ["glycerin", "glycerine"], { status: "mashbooh", sourceSensitivity: "high", usuallyDerivedFrom: ["Vegetable oils", "Animal fats", "Synthetic production"], commonFoods: ["Slush drinks", "Icings", "Confectionery", "Flavor carriers"] }],
  ["425", "Konjac", "Stabilizer / thickener", ["konjac flour", "konjac gum"], { usuallyDerivedFrom: ["Konjac root"] }],
  ["426", "Soybean hemicellulose", "Stabilizer / thickener", ["soybean hemicellulose"], { usuallyDerivedFrom: ["Soybean fiber"] }],
  ["427", "Cassia gum", "Stabilizer / thickener", ["cassia gum"], { usuallyDerivedFrom: ["Cassia seeds"] }],
  ["440", "Pectins", "Stabilizer / gelling agent", ["pectin"], { usuallyDerivedFrom: ["Citrus peel", "Apple pomace"] }],
  ["450", "Diphosphates", "Raising agent / stabilizer", ["diphosphates", "disodium diphosphate"]],
  ["451", "Triphosphates", "Stabilizer / mineral salt", ["triphosphates"]],
  ["452", "Polyphosphates", "Stabilizer / mineral salt", ["polyphosphates"]],
  ["459", "Beta-cyclodextrin", "Stabilizer", ["cyclodextrin", "beta cyclodextrin"]],
  ["460", "Cellulose", "Stabilizer / thickener", ["cellulose", "microcrystalline cellulose"], { usuallyDerivedFrom: ["Plant cellulose"] }],
  ["461", "Methyl cellulose", "Stabilizer / thickener", ["methylcellulose"], { usuallyDerivedFrom: ["Plant cellulose"] }],
  ["462", "Ethyl cellulose", "Stabilizer / thickener", ["ethylcellulose"], { usuallyDerivedFrom: ["Plant cellulose"] }],
  ["463", "Hydroxypropyl cellulose", "Stabilizer / thickener", ["hydroxypropyl cellulose"], { usuallyDerivedFrom: ["Plant cellulose"] }],
  ["464", "Hydroxypropyl methyl cellulose", "Stabilizer / thickener", ["hpmc"], { usuallyDerivedFrom: ["Plant cellulose"] }],
  ["465", "Ethyl methyl cellulose", "Stabilizer / thickener", ["methyl ethyl cellulose"], { usuallyDerivedFrom: ["Plant cellulose"] }],
  ["466", "Carboxy methyl cellulose", "Stabilizer / thickener", ["cellulose gum", "sodium carboxymethyl cellulose"], { usuallyDerivedFrom: ["Plant cellulose"] }],
  ["468", "Crosslinked sodium carboxy methyl cellulose", "Stabilizer / thickener", ["crosslinked cellulose gum"], { usuallyDerivedFrom: ["Plant cellulose"] }],
  ["469", "Enzymatically hydrolysed carboxy methyl cellulose", "Stabilizer / thickener", ["enzymatically hydrolyzed cellulose gum"], { sourceSensitivity: "medium", usuallyDerivedFrom: ["Plant cellulose", "Enzyme processing"] }],
  ["499", "Stigmasterol-rich plant sterols", "Stabilizer", ["plant sterols", "stigmasterol"], { usuallyDerivedFrom: ["Plant sterols"] }],
  ["501", "Potassium carbonates", "Raising agent / acidity regulator", ["potassium carbonate", "potassium bicarbonate"]],
  ["503", "Ammonium carbonates", "Raising agent", ["ammonium carbonate", "ammonium bicarbonate"]],
  ["504", "Magnesium carbonates", "Anti-caking agent / mineral", ["magnesium carbonate"]],
  ["507", "Hydrochloric acid", "Acidity regulator", ["hydrochloric acid"]],
  ["508", "Potassium chloride", "Mineral salt", ["potassium chloride"]],
  ["509", "Calcium chloride", "Mineral salt", ["calcium chloride"]],
  ["511", "Magnesium chloride", "Mineral salt", ["magnesium chloride"]],
  ["513", "Sulfuric acid", "Acidity regulator", ["sulphuric acid", "sulfuric acid"]],
  ["514", "Sodium sulfates", "Mineral salt", ["sodium sulfate", "sodium sulphate"]],
  ["515", "Potassium sulfates", "Mineral salt", ["potassium sulfate", "potassium sulphate"]],
  ["516", "Calcium sulfate", "Mineral salt", ["calcium sulphate", "calcium sulfate"]],
  ["517", "Ammonium sulfate", "Mineral salt", ["ammonium sulphate", "ammonium sulfate"]],
  ["520", "Aluminium sulfate", "Firming agent / mineral salt", ["aluminum sulfate", "aluminium sulphate"]],
  ["521", "Aluminium sodium sulfate", "Raising agent / mineral salt", ["sodium aluminium sulfate"]],
  ["522", "Aluminium potassium sulfate", "Raising agent / mineral salt", ["potassium alum"]],
  ["523", "Aluminium ammonium sulfate", "Raising agent / mineral salt", ["ammonium alum"]],
  ["524", "Sodium hydroxide", "Acidity regulator", ["caustic soda"]],
  ["525", "Potassium hydroxide", "Acidity regulator", ["caustic potash"]],
  ["526", "Calcium hydroxide", "Acidity regulator", ["slaked lime"]],
  ["527", "Ammonium hydroxide", "Acidity regulator", ["ammonia solution"]],
  ["528", "Magnesium hydroxide", "Acidity regulator", ["magnesium hydroxide"]],
  ["529", "Calcium oxide", "Acidity regulator", ["quicklime"]],
  ["530", "Magnesium oxide", "Anti-caking agent / mineral", ["magnesium oxide"]],
  ["535", "Sodium ferrocyanide", "Anti-caking agent", ["sodium ferrocyanide"]],
  ["536", "Potassium ferrocyanide", "Anti-caking agent", ["potassium ferrocyanide"]],
  ["538", "Calcium ferrocyanide", "Anti-caking agent", ["calcium ferrocyanide"]],
  ["541", "Sodium aluminium phosphates", "Raising agent / mineral salt", ["sodium aluminum phosphate"]],
  ["551", "Silicon dioxide", "Anti-caking agent", ["silica", "silicon dioxide"]],
  ["552", "Calcium silicate", "Anti-caking agent", ["calcium silicate"]],
  ["553a", "Magnesium silicates", "Anti-caking agent", ["magnesium silicate"]],
  ["553b", "Talc", "Anti-caking agent", ["talc"]],
  ["554", "Sodium aluminium silicate", "Anti-caking agent", ["sodium aluminum silicate"]],
  ["555", "Potassium aluminium silicate", "Anti-caking agent", ["potassium aluminum silicate"]],
  ["570", "Fatty acids", "Anti-caking agent / glazing agent", ["stearic acid", "palmitic acid", "fatty acids"], { status: "mashbooh", sourceSensitivity: "high", usuallyDerivedFrom: ["Vegetable fatty acids", "Animal fatty acids"] }],
  ["574", "Gluconic acid", "Acidity regulator", ["gluconic acid"], { sourceSensitivity: "medium", usuallyDerivedFrom: ["Microbial fermentation"] }],
  ["575", "Glucono delta-lactone", "Acidity regulator", ["gdl", "gluconolactone"], { sourceSensitivity: "medium", usuallyDerivedFrom: ["Microbial fermentation"] }],
  ["576", "Sodium gluconate", "Acidity regulator", ["sodium gluconate"], { sourceSensitivity: "medium" }],
  ["577", "Potassium gluconate", "Acidity regulator", ["potassium gluconate"], { sourceSensitivity: "medium" }],
  ["578", "Calcium gluconate", "Acidity regulator", ["calcium gluconate"], { sourceSensitivity: "medium" }],
  ["579", "Ferrous gluconate", "Color stabilizer / mineral", ["ferrous gluconate"], { sourceSensitivity: "medium" }],
  ["585", "Ferrous lactate", "Color stabilizer / mineral", ["ferrous lactate"], { sourceSensitivity: "medium" }],
  ["586", "4-Hexylresorcinol", "Antioxidant", ["hexylresorcinol"]],
  ["620", "Glutamic acid", "Flavor enhancer", ["glutamic acid"], { sourceSensitivity: "medium", usuallyDerivedFrom: ["Microbial fermentation", "Plant protein fermentation"] }],
  ["621", "Monosodium glutamate", "Flavor enhancer", ["msg", "monosodium l-glutamate"], { sourceSensitivity: "medium", usuallyDerivedFrom: ["Microbial fermentation"] }],
  ["622", "Monopotassium glutamate", "Flavor enhancer", ["potassium glutamate"], { sourceSensitivity: "medium" }],
  ["623", "Calcium diglutamate", "Flavor enhancer", ["calcium glutamate"], { sourceSensitivity: "medium" }],
  ["624", "Monoammonium glutamate", "Flavor enhancer", ["ammonium glutamate"], { sourceSensitivity: "medium" }],
  ["625", "Magnesium diglutamate", "Flavor enhancer", ["magnesium glutamate"], { sourceSensitivity: "medium" }],
  ["626", "Guanylic acid", "Flavor enhancer", ["guanylic acid", "gmp"], { status: "mashbooh", sourceSensitivity: "high", related: ["e627", "e635"] }],
  ["628", "Dipotassium guanylate", "Flavor enhancer", ["potassium guanylate"], { status: "mashbooh", sourceSensitivity: "high", related: ["e627", "e635"] }],
  ["629", "Calcium guanylate", "Flavor enhancer", ["calcium guanylate"], { status: "mashbooh", sourceSensitivity: "high", related: ["e627", "e635"] }],
  ["630", "Inosinic acid", "Flavor enhancer", ["inosinic acid", "imp"], { status: "mashbooh", sourceSensitivity: "high", related: ["e631", "e635"] }],
  ["632", "Potassium inosinate", "Flavor enhancer", ["dipotassium inosinate"], { status: "mashbooh", sourceSensitivity: "high", related: ["e631", "e635"] }],
  ["633", "Calcium inosinate", "Flavor enhancer", ["calcium inosinate"], { status: "mashbooh", sourceSensitivity: "high", related: ["e631", "e635"] }],
  ["634", "Calcium ribonucleotides", "Flavor enhancer", ["calcium 5-ribonucleotides"], { status: "mashbooh", sourceSensitivity: "high", related: ["e627", "e631", "e635"] }],
  ["640", "Glycine", "Flavor enhancer", ["glycine"], { sourceSensitivity: "medium" }],
  ["641", "L-Leucine", "Flavor enhancer", ["leucine"], { sourceSensitivity: "medium" }],
  ["650", "Zinc acetate", "Flavor enhancer / mineral", ["zinc acetate"]],
  ["900", "Dimethylpolysiloxane", "Anti-foaming agent", ["silicone", "dimethyl polysiloxane"]],
  ["901", "Beeswax", "Glazing agent", ["white beeswax", "yellow beeswax"], { status: "mashbooh", sourceSensitivity: "medium", usuallyDerivedFrom: ["Bee-derived wax"], notes: ["Bee-derived; many halal consumers accept it, but it is not vegan and may require school/certifier preference checking."] }],
  ["902", "Candelilla wax", "Glazing agent", ["candelilla wax"], { usuallyDerivedFrom: ["Candelilla plant wax"] }],
  ["903", "Carnauba wax", "Glazing agent", ["carnauba wax"], { usuallyDerivedFrom: ["Carnauba palm wax"] }],
  ["904", "Shellac", "Glazing agent", ["bleached shellac", "lac resin"], { status: "mashbooh", sourceSensitivity: "high", usuallyDerivedFrom: ["Lac insect resin"], saferAction: "Avoid if insect-derived glazing agents are not accepted by your halal authority; choose certified products." }],
  ["905ci", "Microcrystalline wax", "Glazing agent", ["microcrystalline wax"], { usuallyDerivedFrom: ["Petroleum-derived wax"] }],
  ["907", "Hydrogenated poly-1-decenes", "Glazing agent", ["hydrogenated polydecene"]],
  ["914", "Oxidized polyethylene wax", "Glazing agent", ["oxidised polyethylene wax"]],
  ["920", "L-Cysteine", "Flour treatment agent", ["cysteine", "l-cysteine hydrochloride"], { status: "mashbooh", sourceSensitivity: "high", usuallyDerivedFrom: ["Synthetic production", "Microbial fermentation", "Hair or feathers may be possible in some supply chains"], saferAction: "Verify source or choose halal-certified bakery products." }],
  ["927b", "Carbamide", "Other additive", ["urea", "carbamide"]],
  ["938", "Argon", "Packaging gas", ["argon"]],
  ["939", "Helium", "Packaging gas", ["helium"]],
  ["941", "Nitrogen", "Packaging gas", ["nitrogen"]],
  ["942", "Nitrous oxide", "Propellant / packaging gas", ["nitrous oxide"]],
  ["943a", "Butane", "Propellant", ["butane"]],
  ["943b", "Iso-butane", "Propellant", ["isobutane"]],
  ["944", "Propane", "Propellant", ["propane"]],
  ["948", "Oxygen", "Packaging gas", ["oxygen"]],
  ["949", "Hydrogen", "Packaging gas", ["hydrogen"]],
  ["950", "Acesulfame K", "Sweetener", ["acesulfame potassium", "ace-k"]],
  ["951", "Aspartame", "Sweetener", ["aspartame"]],
  ["952", "Cyclamates", "Sweetener", ["cyclamic acid", "sodium cyclamate", "calcium cyclamate"]],
  ["953", "Isomalt", "Sweetener", ["isomalt"]],
  ["954", "Saccharins", "Sweetener", ["saccharin", "sodium saccharin"]],
  ["955", "Sucralose", "Sweetener", ["sucralose"]],
  ["957", "Thaumatin", "Sweetener", ["thaumatin"], { usuallyDerivedFrom: ["Thaumatococcus daniellii fruit"] }],
  ["959", "Neohesperidine DC", "Sweetener", ["neohesperidine dihydrochalcone"]],
  ["960a", "Steviol glycosides from stevia", "Sweetener", ["stevia", "steviol glycosides"], { usuallyDerivedFrom: ["Stevia leaves"] }],
  ["960b", "Steviol glycosides from fermentation", "Sweetener", ["fermented steviol glycosides"], { sourceSensitivity: "medium", usuallyDerivedFrom: ["Microbial fermentation"] }],
  ["960c", "Enzymatically produced steviol glycosides", "Sweetener", ["enzymatic steviol glycosides"], { sourceSensitivity: "medium" }],
  ["961", "Neotame", "Sweetener", ["neotame"]],
  ["962", "Aspartame-acesulfame salt", "Sweetener", ["aspartame acesulfame salt"]],
  ["964", "Polyglycitol syrup", "Sweetener", ["polyglycitol syrup"]],
  ["965", "Maltitols", "Sweetener", ["maltitol", "maltitol syrup"]],
  ["966", "Lactitol", "Sweetener", ["lactitol"], { sourceSensitivity: "medium", usuallyDerivedFrom: ["Lactose-derived production"] }],
  ["967", "Xylitol", "Sweetener", ["xylitol"]],
  ["968", "Erythritol", "Sweetener", ["erythritol"], { sourceSensitivity: "medium", usuallyDerivedFrom: ["Microbial fermentation"] }],
  ["969", "Advantame", "Sweetener", ["advantame"]],
  ["999", "Quillaia extract", "Foaming agent", ["quillaia extracts", "soapbark extract"], { usuallyDerivedFrom: ["Quillaia tree bark"] }],
  ["1105", "Lysozyme", "Preservative / enzyme", ["lysozyme"], { status: "mashbooh", sourceSensitivity: "medium", usuallyDerivedFrom: ["Egg white", "Microbial or other sources may be possible"], saferAction: "Check source and allergen/certification information." }],
  ["1200", "Polydextrose", "Bulking agent", ["polydextrose"]],
  ["1201", "Polyvinylpyrrolidone", "Stabilizer", ["pvp"]],
  ["1202", "Polyvinylpolypyrrolidone", "Stabilizer", ["pvpp"]],
  ["1203", "Polyvinyl alcohol", "Glazing agent", ["pva"]],
  ["1204", "Pullulan", "Glazing agent", ["pullulan"], { sourceSensitivity: "medium", usuallyDerivedFrom: ["Microbial fermentation"] }],
  ["1404", "Oxidized starch", "Modified starch", ["oxidised starch"]],
  ["1410", "Monostarch phosphate", "Modified starch", ["monostarch phosphate"]],
  ["1412", "Distarch phosphate", "Modified starch", ["distarch phosphate"]],
  ["1413", "Phosphated distarch phosphate", "Modified starch", ["phosphated distarch phosphate"]],
  ["1414", "Acetylated distarch phosphate", "Modified starch", ["acetylated distarch phosphate"]],
  ["1420", "Starch acetate", "Modified starch", ["starch acetate"]],
  ["1422", "Acetylated distarch adipate", "Modified starch", ["acetylated distarch adipate"]],
  ["1440", "Hydroxypropyl starch", "Modified starch", ["hydroxypropyl starch"]],
  ["1442", "Hydroxypropyl distarch phosphate", "Modified starch", ["hydroxypropyl distarch phosphate"]],
  ["1450", "Starch sodium octenyl succinate", "Modified starch", ["sodium starch octenyl succinate"]],
  ["1451", "Acetylated oxidized starch", "Modified starch", ["acetylated oxidised starch"]],
  ["1452", "Starch aluminium octenyl succinate", "Modified starch", ["starch aluminum octenyl succinate"]],
  ["1505", "Triethyl citrate", "Carrier / solvent", ["triethyl citrate"], { sourceSensitivity: "medium" }],
  ["1517", "Glycerol diacetate", "Carrier / solvent", ["diacetin"], { status: "mashbooh", sourceSensitivity: "high", usuallyDerivedFrom: ["Glycerol", "Acetic acid", "Vegetable or animal-derived glycerol"] }],
  ["1518", "Triacetin", "Carrier / solvent", ["glycerol triacetate"], { status: "mashbooh", sourceSensitivity: "high", usuallyDerivedFrom: ["Glycerol", "Acetic acid", "Vegetable or animal-derived glycerol"] }],
  ["1519", "Benzyl alcohol", "Carrier / solvent", ["benzyl alcohol"], { status: "mashbooh", sourceSensitivity: "medium", notes: ["Alcohol named ingredient; product-level ruling depends on use, amount, and certifier guidance."] }],
  ["1520", "Propylene glycol", "Carrier / solvent", ["propane-1,2-diol", "propylene glycol"]]
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

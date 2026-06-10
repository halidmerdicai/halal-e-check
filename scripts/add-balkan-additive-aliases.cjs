const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "..", "src", "data", "additives", "additives.json");
const additives = JSON.parse(fs.readFileSync(filePath, "utf8"));

const aliasesByCode = {
  "120": ["karmin", "karminska kiselina", "kosinela", "crvena boja 4"],
  "322": ["lecitin", "sojin lecitin", "suncokretov lecitin", "jajni lecitin"],
  "422": ["glicerol", "glicerin", "biljni glicerin"],
  "441": ["zelatin", "zelatina", "govedji zelatin", "svinjski zelatin", "ribiji zelatin", "kolagen"],
  "470": ["soli masnih kiselina", "masne kiseline"],
  "470a": ["natrijeve soli masnih kiselina", "kalijeve soli masnih kiselina", "kalcijumove soli masnih kiselina"],
  "470b": ["magnezijumove soli masnih kiselina", "magnezijeve soli masnih kiselina"],
  "471": ["mono i digliceridi", "mono i digliceridi masnih kiselina", "monogliceridi", "digliceridi"],
  "472a": ["esteri mono i diglicerida", "acetatni esteri mono i diglicerida"],
  "472b": ["laktatni esteri mono i diglicerida"],
  "472c": ["citratni esteri mono i diglicerida"],
  "472d": ["tartaratni esteri mono i diglicerida"],
  "472e": ["datem", "mono i diacetil vinska kiselina esteri mono i diglicerida"],
  "473": ["esteri saharoze masnih kiselina", "secerna jedinjenja masnih kiselina"],
  "474": ["saharo gliceridi", "sukrogliceridi"],
  "475": ["poliglicerol esteri masnih kiselina"],
  "476": ["pgpr", "poliglicerol poliricinoleat"],
  "477": ["propilen glikol esteri masnih kiselina"],
  "481": ["natrijev stearoil laktilat", "natrijum stearoil laktilat"],
  "482": ["kalcij stearoil laktilat", "kalcijum stearoil laktilat"],
  "483": ["stearil tartarat"],
  "491": ["sorbitan monostearat"],
  "492": ["sorbitan tristearat"],
  "493": ["sorbitan monolaurat"],
  "494": ["sorbitan monooleat"],
  "495": ["sorbitan monopalmitat"],
  "542": ["kostani fosfat", "kostani pepeo", "fosfat iz kostiju"],
  "570": ["masne kiseline", "stearinska kiselina", "palmitinska kiselina"],
  "626": ["gvanilna kiselina", "guanilna kiselina"],
  "627": ["dinatrijev gvanilat", "dinatrijum guanilat", "natrijev guanilat", "natrijum guanilat"],
  "628": ["dikalijev gvanilat", "dikalijum guanilat"],
  "629": ["kalcijum guanilat", "kalcij guanilat"],
  "630": ["inozinska kiselina", "inosinska kiselina"],
  "631": ["dinatrijev inosinat", "dinatrijum inosinat", "natrijev inosinat", "natrijum inosinat"],
  "632": ["kalijev inosinat", "kalijum inosinat"],
  "633": ["kalcijum inosinat", "kalcij inosinat"],
  "634": ["kalcijum ribonukleotidi", "kalcij ribonukleotidi"],
  "635": ["dinatrijev ribonukleotid", "dinatrijum ribonukleotid", "ribonukleotidi"],
  "901": ["pcelinji vosak", "pcelji vosak", "bijeli pcelinji vosak", "zuti pcelinji vosak"],
  "904": ["selak", "šelak", "lak smola", "konditorska glazura"],
  "920": ["l cistein", "cistein", "l-cistein"],
  "1105": ["lizozim", "lisozim"],
  "1518": ["triacetin", "glicerol triacetat"],
  "1519": ["benzil alkohol"]
};

function addAliases(record, aliases) {
  const normalizedExisting = new Set(record.aliases.map((alias) => alias.toLowerCase()));
  for (const alias of aliases) {
    if (!normalizedExisting.has(alias.toLowerCase())) {
      record.aliases.push(alias);
      normalizedExisting.add(alias.toLowerCase());
    }
  }
}

for (const [code, aliases] of Object.entries(aliasesByCode)) {
  const record = additives.find((additive) => additive.numericCode === code);
  if (!record) throw new Error(`Missing additive ${code}`);
  addAliases(record, aliases);
}

fs.writeFileSync(filePath, `${JSON.stringify(additives, null, 2)}\n`);
console.log(`Added Balkan aliases for ${Object.keys(aliasesByCode).length} additive records.`);

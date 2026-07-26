import type { RiskGuidance } from "@/lib/risk-guidance";

export type RealUseLabelCase = {
  name: string;
  text: string;
  expectedCodes: string[];
  expectedAbsentCodes?: string[];
  expectedGuidance?: Partial<Record<string, RiskGuidance>>;
  expectedCorrections?: Array<[string, string]>;
};

export const realUseLabelCases: RealUseLabelCase[] = [
  {
    name: "Balkan animal-source warning label",
    text: "Sastojci: voda, govedji zelatin, emulgator mono i digliceridi, boja kosenil, aroma.",
    expectedCodes: ["E120", "E441", "E471"],
    expectedAbsentCodes: ["E428"],
    expectedGuidance: {
      E120: "avoid",
      E441: "avoid-if-unclear",
      E471: "avoid-if-unclear"
    }
  },
  {
    name: "English bakery label with role words",
    text: "Ingredients: wheat flour, water, emulsifier E471, raising agents E450 and E500, preservative potassium sorbate, colour annatto.",
    expectedCodes: ["E160b", "E202", "E450", "E471", "E500"],
    expectedAbsentCodes: ["E430", "E926"],
    expectedGuidance: {
      E202: "permissible",
      E471: "avoid-if-unclear",
      E500: "permissible"
    }
  },
  {
    name: "OCR-misread dense additive list",
    text: "Sastojci: stabilizator E4074, konzervans E250i, E2501, emulgator E4O7, pojacivac okusa E621.",
    expectedCodes: ["E250", "E407", "E407a", "E621"],
    expectedCorrections: [
      ["E4074", "E407a"],
      ["E250i", "E250"],
      ["E2501", "E250"],
      ["E4O7", "E407"]
    ],
    expectedGuidance: {
      E250: "permissible",
      E407: "permissible",
      E407a: "permissible",
      E621: "permissible"
    }
  },
  {
    name: "Glazing and carrier label",
    text: "Ingredients: shellac glaze, beeswax, lanolin, magnesium stearate, triacetin carrier.",
    expectedCodes: ["E572", "E901", "E904", "E913", "E1518"],
    expectedAbsentCodes: ["E470b"],
    expectedGuidance: {
      E572: "avoid-if-unclear",
      E901: "verify",
      E904: "avoid-if-unclear",
      E913: "avoid-if-unclear",
      E1518: "avoid-if-unclear"
    }
  },
  {
    name: "Balkan gum and preservative label",
    text: "Sastojci: limunska kiselina, ksantan guma, guar guma, kalijum-sorbat, natrijev benzoat.",
    expectedCodes: ["E202", "E330", "E412", "E415"],
    expectedGuidance: {
      E202: "permissible",
      E330: "verify",
      E412: "permissible",
      E415: "verify"
    }
  },
  {
    name: "Source-sensitive enhancer label",
    text: "Ingredients: ethanol, glycerol, lecithin, monosodium glutamate, disodium inosinate.",
    expectedCodes: ["E322", "E422", "E621", "E631", "E1510"],
    expectedGuidance: {
      E322: "verify",
      E422: "avoid-if-unclear",
      E621: "permissible",
      E631: "avoid-if-unclear",
      E1510: "verify"
    }
  },
  {
    name: "Restricted historical additive label",
    text: "Sastojci: formaldehid E240, kalijum bromat E924, hlor E925, benzoyl peroxide E928.",
    expectedCodes: ["E240", "E924", "E925", "E928"],
    expectedGuidance: {
      E240: "avoid-if-unclear",
      E924: "avoid-if-unclear",
      E925: "avoid-if-unclear",
      E928: "avoid-if-unclear"
    }
  },
  {
    name: "Plant thickener label",
    text: "Ingredients: pectin, agar, carrageenan E407, locust bean gum, cellulose.",
    expectedCodes: ["E407", "E410", "E440", "E460"],
    expectedGuidance: {
      E407: "permissible",
      E410: "permissible",
      E440: "permissible",
      E460: "permissible"
    }
  },
  {
    name: "Fatty-acid emulsifier label",
    text: "Sastojci: askorbil palmitat, stearinska kiselina, sorbitan monostearat, polisorbat 80.",
    expectedCodes: ["E304", "E491", "E570"],
    expectedGuidance: {
      E304: "avoid-if-unclear",
      E491: "avoid-if-unclear",
      E570: "avoid-if-unclear"
    }
  },
  {
    name: "Common color label",
    text: "Ingredients: riboflavin, beta carotene E160a, caramel E150d, titanium dioxide E171.",
    expectedCodes: ["E101", "E150d", "E160a", "E171"],
    expectedGuidance: {
      E101: "verify",
      E150d: "permissible",
      E160a: "permissible",
      E171: "permissible"
    }
  }
];

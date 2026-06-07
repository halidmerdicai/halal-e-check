# Halal E-Check

A production-minded static web app for checking whether food additive E-numbers are generally halal, haram, or mashbooh/source-dependent.

## What is included

- Next.js App Router with TypeScript and Tailwind CSS
- shadcn/ui-style local components
- Local typed seed dataset in `src/data/additives/additives.json`
- Instant search by E-number, numeric code, additive name, and aliases
- SEO-friendly additive pages at canonical routes such as `/e/471`
- Redirect support from routes such as `/e/e471` to `/e/471`
- Guide, methodology, about, disclaimer, and custom 404 pages
- Ingredient-list checker at `/check`
- Private recent checks on `/check` stored in browser `localStorage`
- Missing additive request helper at `/request`
- Correction suggestion helper at `/corrections`
- High-risk review queue at `/review-queue`
- Data quality dashboard at `/data-quality`
- Mobile-first responsive UI with dark mode token support
- Basic localization structure in `src/i18n`

## Getting started

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

For production metadata and sitemap URLs, set:

```bash
NEXT_PUBLIC_SITE_URL=https://your-domain.example
```

## Useful scripts

```bash
npm run dev
npm run build
npm run typecheck
npm run lint
```

## Dataset

The seed data now includes 300+ additive records covering common:

- colors
- preservatives
- antioxidants and acidity regulators
- emulsifiers, stabilizers, thickeners, and gelling agents
- raising agents, anti-caking agents, and mineral salts
- flavor enhancers
- sweeteners
- glazing agents, packaging gases, carriers, solvents, and modified starches

The dataset includes source-sensitive entries such as E120, E304, E422, E441, E470-E477, E481-E483, E570, E626-E635, E901, E904, E920, E1105, E1517-E1519, and related additives.

Each additive follows the typed schema in `src/data/additives/schema.ts`, including source sensitivity, halal and haram conditions, packaging checks, safer action guidance, common foods, notes, review date, confidence level, reviewer label, review notes, and sources.

Search and browse views are data-driven from `src/data/additives/additives.json`; additive-specific behavior is not hardcoded in UI components.

## Data maintenance

Utility scripts used to add and refine records:

```bash
node scripts/add-broad-additives.cjs
node scripts/add-more-additives.cjs
node scripts/refine-high-risk-additives.cjs
node scripts/refine-high-risk-sources.cjs
```

The `/review-queue` page ranks source-sensitive and higher-risk entries so the highest-impact records can be reviewed first.

## Guidance principle

This app gives general halal ingredient guidance, not final fatwa-level certainty. Some additives are source-dependent and require manufacturer confirmation or halal certification. Vegan and plant-based labels can help identify source, but they do not replace halal certification for the finished product.

## Future extension points

The code is structured so these can be added later without changing the public app:

- Database migration to Supabase or Postgres
- Barcode scanning
- OCR ingredient scanning
- Saved history
- Ingredient list comparison
- Scholar or certifier references
- Bosnian and Arabic localization
- Admin updates and correction submissions
- Premium household shopping assistant

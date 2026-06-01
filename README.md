# Halal E-Check

A production-minded MVP for checking whether food additive E-numbers are generally halal, haram, or mashbooh/source-dependent.

## What is included

- Next.js App Router with TypeScript and Tailwind CSS
- shadcn/ui-style local components
- Local typed seed dataset in `src/data/additives/additives.json`
- Instant search by E-number, numeric code, additive name, and aliases
- SEO-friendly additive pages at canonical routes such as `/e/471`
- Redirect support from routes such as `/e/e471` to `/e/471`
- Guide, about, disclaimer, and custom 404 pages
- Mobile-first responsive UI with dark mode token support
- Basic localization structure in `src/i18n`

## Getting started

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Useful scripts

```bash
npm run dev
npm run build
npm run typecheck
npm run lint
```

## Dataset

The MVP seed data includes the original starter set plus a broader emulsifier index:

- E120
- E322
- E406
- E412
- E441
- E432 through E436
- E442
- E444
- E445
- E470, E470a, E470b
- E471
- E472a through E472f
- E473
- E474
- E475
- E476
- E477
- E479b
- E481
- E482
- E483
- E491 through E495
- E542
- E627
- E631
- E635

Each additive follows the typed schema in `src/data/additives/schema.ts`, including source sensitivity, halal and haram conditions, packaging checks, safer action guidance, common foods, notes, and review date.

Search and browse views are data-driven from `src/data/additives/additives.json`; additive-specific behavior is not hardcoded in UI components.

## Guidance principle

This app gives general halal ingredient guidance, not final fatwa-level certainty. Some additives are source-dependent and require manufacturer confirmation or halal certification. Vegan and plant-based labels can help identify source, but they do not replace halal certification for the finished product.

## Future extension points

The code is structured so these can be added later without changing the public MVP:

- Database migration to Supabase or Postgres
- Barcode scanning
- OCR ingredient scanning
- Saved history
- Ingredient list comparison
- Scholar or certifier references
- Bosnian and Arabic localization
- Admin updates and correction submissions
- Premium household shopping assistant

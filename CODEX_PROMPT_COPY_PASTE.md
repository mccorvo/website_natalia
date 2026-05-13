# Prompt da incollare in Codex

Build a new Italian-language interactive page: **Ricette polacche per obiettivi nutrizionali**.

This must be a diet-aware Polish recipe discovery tool, not a static recipe page.

Core journey:

`hero → survey wizard → 9-card ingredient preference deck → personalized ranking → search/filters → recipe detail drawer/page`

## First inspect the repository

- Detect framework and routing.
- Reuse existing design system, Tailwind/CSS setup, UI components, data conventions, tests and linting.
- Do not rewrite unrelated files.
- Implement a static MVP; do not depend on live APIs.

Preferred routes:

- Next.js App Router: `app/polish-recipes/page.tsx`
- Next.js Pages Router: `pages/polish-recipes.tsx`
- Vite/React: `src/pages/PolishRecipesPage.tsx`

Use the provided files as seed data/specification:

- `types.ts`
- `ingredient-catalog.ts`
- `ingredient-preferences.ts`
- `recipes.ts`
- `asset-manifest.json`
- `ranking-cost-nutrition.ts`
- `IngredientPreferenceDeck.example.tsx`

## Product requirements

### Hero

Title:

`Scopri ricette polacche compatibili con i tuoi obiettivi`

Subtitle:

`Uno strumento per esplorare ricette polacche tradizionali e ricette dietetiche ispirate ai gusti polacchi, ordinate per calorie, proteine, fibre, allergeni, costo e reperibilità degli ingredienti.`

CTA:

- `Inizia il survey`
- `Vai alla ricerca ricette`

Visible disclaimers:

```txt
Questo strumento non sostituisce indicazioni mediche o dietetiche personalizzate.
Valori nutrizionali stimati da ingredienti generici/prodotti confezionati. Controllare sempre etichette e porzioni reali.
Prezzi stimati: possono variare per negozio, promozione e disponibilità.
Per allergeni e prodotti confezionati, controllare sempre l’etichetta aggiornata.
```

### Survey wizard

Steps:

1. Obiettivo
2. Numero persone
3. Tempo disponibile
4. Accesso ingredienti
5. Allergeni da escludere
6. Ingredient preference deck
7. Risultati

Goals:

- `Dimagrimento / calorie moderate`
- `Più proteine`
- `Vegetariano`
- `Budget basso`
- `Batch cooking`
- `Comfort food controllato`
- `Voglio sapori polacchi, ma ricette più leggere`

Number of people:

- 1, 2, 3, 4

Time:

- `<30 min`
- `30–60 min`
- `60+ min`
- `meal prep / batch`

Access:

- `Solo supermercato normale`
- `Tesco / sezione Polish groceries`
- `Polonez o negozio Eastern European`

Allergens:

Use the full EU/FSAI list:

- cereals containing gluten, separated as wheat/rye/barley/oats in the internal model
- crustaceans
- eggs
- fish
- peanuts
- soybeans
- milk
- nuts
- celery
- mustard
- sesame
- sulphites
- lupin
- molluscs

### Ingredient preference deck

Show 9 ingredient cards at a time.

Behaviour:

- User clicks an ingredient they like.
- The selected card disappears and a new ingredient appears.
- User can select maximum 10 liked ingredients.
- Show progress: `Ingredienti scelti: N/10`.
- User can mark ingredient as `Non mi piace`.
- User can finish early with `Ho finito`.
- No duplicates in visible cards.
- Keyboard accessible: Enter/Space selects; every button has accessible label.
- Respect reduced motion.
- Selected ingredients become chips below the grid.

Use these selected ingredients in ranking.

### Recommendation engine

Hard filters first:

- Exclude recipes containing selected allergens.
- Exclude non-vegetarian recipes if vegetarian goal is selected.
- Apply hard user filters if they exist.

Then scoring:

- +8 per exact liked ingredient match.
- +3 per flavour-family match.
- +2 per matching liked tag.
- -8 per disliked ingredient match.
- Weight-loss goal: lower kcal, better protein/kcal, more fibre, lower cost.
- High-protein goal: more protein and higher protein-energy percentage.
- Budget goal: lower consumed cost and lower basket cost.
- Batch goal: batchFriendly recipes.
- Comfort-controlled goal: traditionalness + moderate calories + adequate protein.
- Polish-taste goal: sour/fermented/dill/mushroom/cabbage/beetroot/sour-dairy flavour families.
- Ingredient access: penalize unavailable critical ingredients without practical substitution.

Show 2–3 reasons under `Perché consigliata`.

### Search and filters

Search across:

- Polish name
- Italian name
- English name
- ingredients in Italian/Polish/English
- tags
- flavour families

Filters:

- kcal per serving
- protein per serving
- cost per serving
- cooking time
- exclude allergens
- vegetarian
- source of protein / high protein using EU thresholds only
- source/high fibre using EU thresholds only if data is available
- batch friendly
- easy to find in Ireland
- recipe type
- traditional vs Polish-inspired

Sort:

- best match
- calories ascending
- protein descending
- protein per kcal descending
- protein-energy percentage descending
- cost ascending
- cooking time ascending
- fibre descending

### Recipe cards

Each card must show:

- image or safe placeholder
- photo attribution/license
- Polish name + Italian name
- kcal/serving
- protein/serving
- fibre/serving if available
- cost/serving
- allergens chips
- availability chip
- recipe tags
- `Vedi dettagli`

### Detail drawer/page

Show:

- large image with attribution
- original description
- scalable ingredients for 1, 2, 3, 4 people
- nutrition table per serving
- allergen panel: contains + may contain/check label
- cost estimates for 1, 2, 3, 4 people
- where to buy panel for Ireland/abroad
- substitutions

Cost modes:

- `Costo ingredienti consumati`
- `Spesa minima stimata`

Cost formulas:

```ts
consumedCost = sum(requiredQuantity / packageSize * packagePrice)
basketCost = sum(Math.ceil(requiredQuantity / packageSize) * packagePrice)
```

### Nutrition claims

Do not use vague “healthy” labels.

Use:

```ts
proteinEnergyPct = protein_g * 4 / kcal * 100;
sourceOfProtein = proteinEnergyPct >= 12;
highProtein = proteinEnergyPct >= 20;
```

Fibre, if enough data exists:

```ts
sourceOfFibre = fibre_g_per_100g >= 3 || fibre_g_per_100kcal >= 1.5;
highFibre = fibre_g_per_100g >= 6 || fibre_g_per_100kcal >= 3;
```

### Recipes to include

Traditional/rebalanced:

1. `pierogi-ruskie-light`
2. `pierogi-kapusta-grzyby`
3. `bigos-lean`
4. `zurek-light`
5. `barszcz-czerwony`
6. `golabki-lean`
7. `kotlet-schabowy-baked`
8. `mizeria-yogurt`
9. `kasza-gryczana-bowl`
10. `zupa-ogorkowa-light`
11. `placki-ziemniaczane-baked`
12. `krupnik-high-fibre`
13. `rosol-protein`
14. `chlodnik-protein`

Polish-inspired diet recipes:

15. `turkey-bigos-bowl`
16. `kasza-mushroom-turkey-skillet`
17. `dill-pickle-chicken-salad`
18. `twarog-cucumber-protein-bowl`
19. `barszcz-bean-bowl`
20. `sauerkraut-lentil-stew`
21. `deconstructed-pierogi-bowl`
22. `kefir-berry-buckwheat-breakfast`

### Asset rules

Use `asset-manifest.json`.

Do not use Getty, Pinterest, random recipe blogs, or unlicensed images.

Prefer Wikimedia Commons assets with:

- CC0
- Public Domain
- CC BY
- CC BY-SA
- GFDL/CC BY-SA where attribution is rendered

Every image must have:

- sourcePage
- author
- license
- attributionText

Helper:

```ts
export function commonsImageUrl(fileName: string, width = 1200) {
  return `https://commons.wikimedia.org/wiki/Special:Redirect/file/${encodeURIComponent(fileName)}?width=${width}`;
}
```

If using Next.js Image, configure remote domains/patterns for:

- `commons.wikimedia.org`
- `upload.wikimedia.org`

If a license/author/source is missing, render a safe local placeholder instead.

### Tests

Add tests if test framework exists:

- allergen exclusion works
- protein claim thresholds work
- fibre claim thresholds work
- cost calculation works for 1, 2, 3, 4 people
- search finds recipes by Polish and Italian names
- ingredient deck never shows duplicate visible cards
- selecting ingredient replaces the card
- max 10 liked ingredients enforced
- liked ingredient matches improve ranking
- unavailable ingredient penalty affects ranking
- missing image attribution fails validation

### Acceptance criteria

- Page loads without external API dependency.
- Survey completes.
- Ingredient deck shows 9 cards and replaces selected card.
- User can select up to 10 ingredients.
- Recommendations are ranked and explain why.
- Search and filters work.
- Details show nutrition, allergens, costs, availability and substitutions.
- Every image has attribution/license or placeholder.
- UI is responsive and accessible.
- No copied recipe text from external websites.
- No unlicensed images.

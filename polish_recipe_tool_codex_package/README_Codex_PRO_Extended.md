# Codex Brief — Polish Recipe Discovery Tool

## Product direction

Build this as a **diet-aware Polish recipe discovery tool**, not as a static recipe page.

Target journey:

`hero → interactive survey → ingredient preference deck → ranked recommendations → searchable/filterable database → recipe detail with nutrition, allergens, availability, substitutions and cost for 1–4 people`

The page must be in Italian.

Primary page title:

> Ricette polacche per obiettivi nutrizionali

Primary framing:

> Scopri ricette polacche e ricette dietetiche ispirate ai gusti polacchi, confrontate per calorie, proteine, fibre, allergeni, costo e reperibilità degli ingredienti.

Do **not** call recipes generically “healthy”. Use measurable properties only: kcal/serving, protein/serving, protein-energy percentage, fibre/serving, cost/serving, allergens, cooking time, ingredient availability.

---

## Repository instructions

Before implementing:

1. Inspect the repository and detect the framework.
2. Reuse existing routing, styles, components, design system, test setup, linting conventions and data conventions.
3. Do not rewrite unrelated files.
4. Prefer a static MVP with no live API dependency.
5. Add tests only if the repository already has a testing setup. If no tests exist, add a small pure-function validation script or document the expected tests.

Preferred routes:

- Next.js App Router: `app/polish-recipes/page.tsx`
- Next.js Pages Router: `pages/polish-recipes.tsx`
- Vite/React: `src/pages/PolishRecipesPage.tsx`

Suggested structure:

```txt
app/polish-recipes/page.tsx
components/polish-recipes/Hero.tsx
components/polish-recipes/SurveyWizard.tsx
components/polish-recipes/IngredientPreferenceDeck.tsx
components/polish-recipes/RecipeSearchFilters.tsx
components/polish-recipes/RecipeCard.tsx
components/polish-recipes/RecipeDetailDrawer.tsx
components/polish-recipes/CostEstimator.tsx
components/polish-recipes/NutritionBadges.tsx
components/polish-recipes/AllergenChips.tsx
components/polish-recipes/IngredientAvailabilityPanel.tsx
lib/polish-recipes/nutrition.ts
lib/polish-recipes/cost.ts
lib/polish-recipes/ranking.ts
lib/polish-recipes/search.ts
lib/polish-recipes/assets.ts
data/polish-recipes/assets.ts
data/polish-recipes/ingredients.ts
data/polish-recipes/ingredient-preferences.ts
data/polish-recipes/recipes.ts
```

---

## Product scope

### 1. Hero

Content:

- Title: `Scopri ricette polacche compatibili con i tuoi obiettivi`
- Subtitle: `Uno strumento per esplorare ricette polacche tradizionali e ricette dietetiche ispirate ai gusti polacchi, ordinate per calorie, proteine, fibre, allergeni, costo e reperibilità degli ingredienti.`
- Primary CTA: `Inizia il survey`
- Secondary CTA: `Vai alla ricerca ricette`

Disclaimers visible near the hero or in a persistent info box:

```txt
Questo strumento non sostituisce indicazioni mediche o dietetiche personalizzate.
Valori nutrizionali e prezzi sono stime basate su ingredienti generici e prodotti disponibili online.
Controllare sempre etichette, allergeni, porzioni reali e disponibilità del negozio.
```

### 2. Survey wizard

Steps:

1. Goal
2. Number of people
3. Time available
4. Ingredient access
5. Allergens to exclude
6. Ingredient preference deck
7. Results

#### Goal options

- `weight_loss`: Dimagrimento / calorie moderate
- `high_protein`: Più proteine
- `vegetarian`: Vegetariano
- `budget`: Budget basso
- `batch`: Batch cooking
- `comfort_controlled`: Comfort food controllato
- `polish_taste`: Voglio sapori polacchi, ma ricette più leggere

#### Number of people

- 1
- 2
- 3
- 4

#### Time available

- `<30 min`
- `30–60 min`
- `60+ min`
- `meal prep / batch`

#### Ingredient access

- `standard_supermarket`: Solo supermercato normale
- `tesco_polish`: Tesco / sezione Polish groceries
- `polish_shop`: Polonez o negozio Eastern European

#### Allergens

Use the EU/FSAI allergen list. Model gluten subtypes separately but render them grouped when useful:

- Cereals containing gluten: wheat, rye, barley, oats
- Crustaceans
- Eggs
- Fish
- Peanuts
- Soybeans
- Milk
- Nuts
- Celery
- Mustard
- Sesame
- Sulphites
- Lupin
- Molluscs

### 3. Ingredient preference deck

This is a core feature.

Show **9 ingredient cards at a time** in a responsive grid:

- Desktop: 3 × 3
- Tablet: 3 × 3 or 2 × N depending on width
- Mobile: 2 × N or horizontal cards, but still keep the concept of “current visible set”

Behaviour:

1. User selects ingredients they like.
2. When a card is selected, it animates out and is replaced by a new card from the deck.
3. The user can select up to 10 liked ingredients.
4. Progress text: `Ingredienti scelti: N/10`
5. User can also click:
   - `Salta ingrediente`
   - `Non mi piace`
   - `Ho finito`
6. Selection must be keyboard accessible: Enter/Space selects, Escape closes modal/drawer, buttons have labels.
7. Respect `prefers-reduced-motion`.
8. No duplicates in visible cards.
9. Store state client-side. Local state is enough; localStorage optional.

Recommended interaction details:

```txt
- A selected card receives a short scale/opacity animation.
- After selection, remove it from visibleCards and push the next unseen ingredient.
- If deck is exhausted, shrink the grid gracefully.
- Selected ingredients appear as chips below the deck.
- The deck can be biased by previous survey answers.
```

Deck scoring seed:

```txt
basePriority = culturalWeight + dietUsefulness
+2 if goal is high_protein and ingredient tag includes protein
+2 if goal is weight_loss and ingredient tag includes low_calorie or high_satiety
+2 if goal is budget and ingredient tag includes budget
+2 if goal is polish_taste and ingredient tag includes polish_core
-3 if access is standard_supermarket and ingredient requires Polish specialist shop
```

### 4. Recommendation engine

Apply hard filters first:

- Exclude selected allergens.
- Exclude meat/fish if strict vegetarian is selected.
- Exclude dairy/eggs/meat/fish if vegan is selected, if vegan option is added later.
- Exclude recipes above hard calorie limit if user sets one in filters.

Then score.

Recipe scoring suggestion:

```ts
score = 0

// ingredient preferences
score += 8 * exactLikedIngredientMatches
score += 3 * flavourFamilyMatches
score += 2 * likedTagMatches
score -= 8 * dislikedIngredientMatches

// goal scoring
if goal === 'weight_loss':
  score += normalizeInverse(kcalPerServing) * 20
  score += normalize(proteinPerKcal) * 12
  score += normalize(fibrePerServing) * 8
  score += normalizeInverse(costPerServing) * 5

if goal === 'high_protein':
  score += normalize(proteinPerServing) * 18
  score += normalize(proteinEnergyPct) * 18
  score += highProtein ? 8 : sourceOfProtein ? 4 : 0

if goal === 'vegetarian':
  score += vegetarian ? 20 : -100

if goal === 'budget':
  score += normalizeInverse(costPerServing) * 25
  score += normalizeInverse(basketCost) * 5

if goal === 'batch':
  score += batchFriendly ? 20 : 0

if goal === 'comfort_controlled':
  score += traditionalness >= 4 ? 8 : 0
  score += kcalPerServing <= 550 ? 8 : -4
  score += proteinPerServing >= 20 ? 6 : 0

if goal === 'polish_taste':
  score += polishFlavourScore * 15

// access
if access === 'standard_supermarket':
  score -= 10 * unavailableCriticalIngredientsWithoutSubstitution
if access === 'tesco_polish':
  score -= 4 * polishShopOnlyIngredients
if access === 'polish_shop':
  no penalty
```

Each recommended recipe must show `Perché consigliata` with 2–3 reasons, e.g.:

- `Contiene 3 ingredienti che hai selezionato: kefir, cetrioli fermentati, aneto.`
- `Alto contenuto proteico secondo soglia UE: 24% dell’energia da proteine.`
- `Ingredienti principali reperibili in supermercato normale o Tesco Polish aisle.`

### 5. Search and filters

Search across:

- Polish name
- Italian name
- English name
- Ingredient names in Italian, Polish and English
- Tags
- Flavour families

Filters:

- kcal per serving: min/max
- protein per serving: min/max
- cost per serving: min/max
- cooking time
- exclude allergens
- vegetarian
- high protein by EU threshold only
- source of protein by EU threshold only
- source/high fibre by EU threshold if fibre data exists
- batch friendly
- easy to find in Ireland
- recipe type: soup, stew, dumpling, main, side, bowl, breakfast
- traditional / Polish-inspired

Sorting:

- best match
- calories ascending
- protein descending
- protein per kcal descending
- protein-energy percentage descending
- cost ascending
- cooking time ascending
- fibre descending

### 6. Recipe cards

Each card must show:

- Image or safe placeholder
- Visible photo attribution/license on hover or footer
- Polish name + Italian name
- kcal/serving
- protein/serving
- fibre/serving if available
- cost/serving
- allergens chips
- ingredient availability chip
- tags: batch, vegetarian, fermented, source/high protein, source/high fibre if criteria met
- button: `Vedi dettagli`

### 7. Recipe detail drawer/page

Include:

- Large photo with attribution and license
- Short original description, not copied from external recipe websites
- Ingredients scalable for 1, 2, 3, 4 people
- Nutrition table per serving:
  - kcal
  - protein
  - carbs
  - fat
  - fibre
  - sodium/salt where available
- Protein claim calculation:
  - `proteinEnergyPct = protein_g * 4 / kcal * 100`
  - `sourceOfProtein = proteinEnergyPct >= 12`
  - `highProtein = proteinEnergyPct >= 20`
- Fibre claim if fibre is available:
  - `sourceOfFibre = fibre >= 3g / 100g OR fibre >= 1.5g / 100kcal`
  - `highFibre = fibre >= 6g / 100g OR fibre >= 3g / 100kcal`
- Allergens:
  - contains
  - may contain / check label
- Cost section:
  - `Costo ingredienti consumati`
  - `Spesa minima stimata`
- Where to buy:
  - normal supermarket
  - Tesco Polish aisle
  - Polonez/Eastern European shop
- Substitutions:
  - twaróg → cottage cheese / quark / ricotta
  - śmietana → sour cream / Greek yogurt
  - ogórki kiszone → sour cucumbers / dill pickles
  - kiełbasa → smoked Polish sausage / lean ham / turkey sausage
  - rye sour starter → rye flour + water starter / bottled żurek starter
  - kasza gryczana → buckwheat groats

---

## Recipe universe

Include two classes of recipes:

### A. Traditional or traditional-rebalanced Polish recipes

1. `pierogi-ruskie-light` — pierogi ruskie alleggeriti
2. `pierogi-kapusta-grzyby` — pierogi crauti e funghi
3. `bigos-lean` — bigos più magro
4. `zurek-light` — żurek controllato
5. `barszcz-czerwony` — barszcz rosso
6. `golabki-lean` — gołąbki con carne magra
7. `kotlet-schabowy-baked` — schabowy al forno
8. `mizeria-yogurt` — mizeria con yogurt
9. `kasza-gryczana-bowl` — bowl di grano saraceno
10. `zupa-ogorkowa-light` — zuppa di cetrioli fermentati
11. `placki-ziemniaczane-baked` — placki al forno
12. `krupnik-high-fibre` — krupnik con orzo/fibre
13. `rosol-protein` — rosół proteico
14. `chlodnik-protein` — chłodnik con kefir/yogurt

### B. Polish-inspired diet recipes

These are not necessarily traditional. They use flavours and ingredients likely to appeal to Polish tastes: fermented vegetables, dill, sour dairy, buckwheat/groats, cabbage, beetroot, mushroom, cucumber, soups, mild meat, tomato/dill/mushroom sauces.

15. `turkey-bigos-bowl` — bowl bigos con tacchino
16. `kasza-mushroom-turkey-skillet` — padellata kasza, funghi e tacchino
17. `dill-pickle-chicken-salad` — insalata pollo, ogórki e aneto
18. `twarog-cucumber-protein-bowl` — bowl proteica twaróg/cottage cheese
19. `barszcz-bean-bowl` — bowl barbabietola e fagioli
20. `sauerkraut-lentil-stew` — stufato crauti e lenticchie
21. `deconstructed-pierogi-bowl` — bowl “pierogi” destrutturata
22. `kefir-berry-buckwheat-breakfast` — colazione kefir, frutti di bosco e grano saraceno

---

## Availability model for Ireland

Use these buckets:

```txt
standardSupermarket: available in a normal supermarket abroad/Ireland
irishPolishAisle: likely available in Tesco Polish groceries / Polish aisle
polishShop: likely available in Polonez or Eastern European shop
```

Render availability as practical guidance, not guarantee.

Text to show:

```txt
Disponibilità indicativa per Irlanda/estero: controlla stock locale e ingredienti in etichetta.
```

---

## Asset policy

Do not use random blog images, Pinterest, Getty, paid stock libraries or images without license metadata.

Use the asset manifest provided in `asset-manifest.json`.

Rules:

1. Prefer Wikimedia Commons.
2. Accept only CC0, Public Domain, CC BY, CC BY-SA, GFDL/CC BY-SA if attribution is rendered.
3. Store:
   - source page
   - file name
   - author
   - license
   - attribution text
4. Render attribution visibly in recipe detail and at least accessible in card footer.
5. If asset metadata is incomplete, use a local placeholder.
6. Do not copy recipe website images.

Helper:

```ts
export function commonsImageUrl(fileName: string, width = 1200) {
  return `https://commons.wikimedia.org/wiki/Special:Redirect/file/${encodeURIComponent(fileName)}?width=${width}`;
}
```

If using Next.js Image, configure remote patterns for:

```txt
commons.wikimedia.org
upload.wikimedia.org
```

Otherwise use standard `<img>` and keep layout stable with width/height/aspect-ratio.

---

## Scientific and legal wording

Visible disclaimers:

```txt
Questo strumento non sostituisce indicazioni mediche o dietetiche personalizzate.
Valori nutrizionali stimati da ingredienti generici/prodotti confezionati. Controllare sempre etichette e porzioni reali.
Prezzi stimati: possono variare per negozio, promozione e disponibilità.
Per allergeni e prodotti confezionati, controllare sempre l’etichetta aggiornata.
```

Nutrition claim rules:

```ts
proteinEnergyPct = protein_g * 4 / kcal * 100;
sourceOfProtein = proteinEnergyPct >= 12;
highProtein = proteinEnergyPct >= 20;
```

Fibre claim rules if enough data exists:

```ts
sourceOfFibre = fibre_g_per_100g >= 3 || fibre_g_per_100kcal >= 1.5;
highFibre = fibre_g_per_100g >= 6 || fibre_g_per_100kcal >= 3;
```

---

## Acceptance criteria

- Page loads without external API dependency.
- Survey can be completed.
- Ingredient deck shows 9 ingredients at a time.
- Selecting one ingredient removes/replaces it.
- User can select up to 10 liked ingredients.
- Recommendations are ranked using goal, liked ingredients, allergens, nutrition and availability.
- Search works by Polish, Italian and English names.
- Filters work for calories, protein, cost, allergens, vegetarian, batch cooking and ingredient availability.
- Recipe details show nutrition, allergens, cost for 1–4 people, where to buy and substitutions.
- Every image has attribution/license or safe placeholder.
- No copied recipe text from external recipe websites.
- No unlicensed images.
- UI is responsive and keyboard accessible.


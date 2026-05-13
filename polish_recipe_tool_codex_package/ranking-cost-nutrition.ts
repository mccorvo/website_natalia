import type { Allergen, AvailabilityTier, IngredientCatalogItem, Recipe, SurveyState } from './types';

export type Nutrition = {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre?: number;
  sodiumMg?: number;
};

export type CostEstimate = {
  consumedCostEur: number;
  basketCostEur: number;
  missingPriceIngredientIds: string[];
};

const UNIT_WEIGHTS_GRAMS: Record<string, number> = {
  eggs: 50,
  cucumber: 300
};

function round(value: number, digits = 1) {
  const n = Math.pow(10, digits);
  return Math.round(value * n) / n;
}

function normalize(value: number, min: number, max: number) {
  if (max <= min) return 0;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

function normalizeInverse(value: number, min: number, max: number) {
  return 1 - normalize(value, min, max);
}

export function calculateProteinEnergyPct(nutrition: Nutrition) {
  if (!nutrition.kcal || nutrition.kcal <= 0) return 0;
  return (nutrition.protein * 4 / nutrition.kcal) * 100;
}

export function getProteinClaim(nutrition: Nutrition): 'high_protein' | 'source_of_protein' | null {
  const pct = calculateProteinEnergyPct(nutrition);
  if (pct >= 20) return 'high_protein';
  if (pct >= 12) return 'source_of_protein';
  return null;
}

export function getFibreClaim(nutrition: Nutrition, totalRecipeWeightGrams?: number): 'high_fibre' | 'source_of_fibre' | null {
  if (nutrition.fibre == null || nutrition.kcal <= 0) return null;
  const fibrePer100Kcal = nutrition.fibre / nutrition.kcal * 100;
  let fibrePer100g = 0;
  if (totalRecipeWeightGrams && totalRecipeWeightGrams > 0) {
    fibrePer100g = nutrition.fibre / totalRecipeWeightGrams * 100;
  }
  if (fibrePer100g >= 6 || fibrePer100Kcal >= 3) return 'high_fibre';
  if (fibrePer100g >= 3 || fibrePer100Kcal >= 1.5) return 'source_of_fibre';
  return null;
}

export function getIngredientMap(catalog: IngredientCatalogItem[]) {
  return new Map(catalog.map(item => [item.id, item]));
}

function amountToGrams(recipeIngredient: Recipe['ingredients'][number], ingredientId: string) {
  if (recipeIngredient.unit === 'unit') {
    return recipeIngredient.quantityPerServing * (UNIT_WEIGHTS_GRAMS[ingredientId] ?? 1);
  }
  return recipeIngredient.quantityPerServing;
}

export function calculateRecipeNutrition(recipe: Recipe, catalog: IngredientCatalogItem[], servings = 1): Nutrition {
  if (recipe.estimatedNutritionPerServing) {
    return {
      kcal: round(recipe.estimatedNutritionPerServing.kcal * servings, 0),
      protein: round(recipe.estimatedNutritionPerServing.protein * servings),
      carbs: round(recipe.estimatedNutritionPerServing.carbs * servings),
      fat: round(recipe.estimatedNutritionPerServing.fat * servings),
      fibre: recipe.estimatedNutritionPerServing.fibre == null ? undefined : round(recipe.estimatedNutritionPerServing.fibre * servings),
      sodiumMg: recipe.estimatedNutritionPerServing.sodiumMg == null ? undefined : round(recipe.estimatedNutritionPerServing.sodiumMg * servings, 0)
    };
  }

  const map = getIngredientMap(catalog);
  const total: Nutrition = { kcal: 0, protein: 0, carbs: 0, fat: 0, fibre: 0, sodiumMg: 0 };

  for (const item of recipe.ingredients) {
    const ingredient = map.get(item.ingredientId);
    if (!ingredient?.nutritionPer100g) continue;
    const grams = amountToGrams(item, item.ingredientId) * servings;
    const factor = grams / 100;
    total.kcal += ingredient.nutritionPer100g.kcal * factor;
    total.protein += ingredient.nutritionPer100g.protein * factor;
    total.carbs += ingredient.nutritionPer100g.carbs * factor;
    total.fat += ingredient.nutritionPer100g.fat * factor;
    total.fibre = (total.fibre ?? 0) + (ingredient.nutritionPer100g.fibre ?? 0) * factor;
    total.sodiumMg = (total.sodiumMg ?? 0) + (ingredient.nutritionPer100g.sodiumMg ?? 0) * factor;
  }

  return {
    kcal: round(total.kcal, 0),
    protein: round(total.protein),
    carbs: round(total.carbs),
    fat: round(total.fat),
    fibre: round(total.fibre ?? 0),
    sodiumMg: round(total.sodiumMg ?? 0, 0)
  };
}

export function calculateCost(recipe: Recipe, catalog: IngredientCatalogItem[], servings = 1): CostEstimate {
  const map = getIngredientMap(catalog);
  let consumedCostEur = 0;
  let basketCostEur = 0;
  const missingPriceIngredientIds: string[] = [];

  for (const item of recipe.ingredients) {
    const ingredient = map.get(item.ingredientId);
    if (!ingredient?.price) {
      missingPriceIngredientIds.push(item.ingredientId);
      continue;
    }

    const needed = item.quantityPerServing * servings;
    const { packageSize, packagePriceEur } = ingredient.price;
    consumedCostEur += (needed / packageSize) * packagePriceEur;
    basketCostEur += Math.ceil(needed / packageSize) * packagePriceEur;
  }

  return {
    consumedCostEur: round(consumedCostEur, 2),
    basketCostEur: round(basketCostEur, 2),
    missingPriceIngredientIds
  };
}

export function detectAllergens(recipe: Recipe, catalog: IngredientCatalogItem[]): Allergen[] {
  const map = getIngredientMap(catalog);
  const allergens = new Set<Allergen>();

  for (const item of recipe.ingredients) {
    const ingredient = map.get(item.ingredientId);
    ingredient?.allergens.forEach(allergen => allergens.add(allergen));
  }

  return Array.from(allergens);
}

export function recipeContainsExcludedAllergen(recipe: Recipe, catalog: IngredientCatalogItem[], excluded: Allergen[]) {
  const allergens = detectAllergens(recipe, catalog);
  return allergens.some(allergen => excluded.includes(allergen));
}

export function countAvailabilityPenalty(recipe: Recipe, catalog: IngredientCatalogItem[], access: AvailabilityTier) {
  const map = getIngredientMap(catalog);
  let penalty = 0;

  for (const item of recipe.ingredients) {
    if (!item.critical) continue;
    const ingredient = map.get(item.ingredientId);
    if (!ingredient) continue;

    if (access === 'standard_supermarket' && !ingredient.availability.standardSupermarket) {
      const hasSubstitution = (ingredient.substitutions?.length ?? 0) > 0;
      penalty += hasSubstitution ? 0.5 : 1;
    }
    if (access === 'tesco_polish' && !ingredient.availability.tescoPolishGroceries && ingredient.availability.polishShop) {
      penalty += 0.5;
    }
  }

  return penalty;
}

export function rankRecipe(recipe: Recipe, catalog: IngredientCatalogItem[], survey: SurveyState): { score: number; reasons: string[] } {
  if (recipeContainsExcludedAllergen(recipe, catalog, survey.excludedAllergens)) {
    return { score: -Infinity, reasons: ['Esclusa per allergeni selezionati.'] };
  }
  if (survey.goal === 'vegetarian' && !recipe.vegetarian) {
    return { score: -Infinity, reasons: ['Esclusa perché non vegetariana.'] };
  }

  const ingredientIds = recipe.ingredients.map(i => i.ingredientId);
  const nutrition = calculateRecipeNutrition(recipe, catalog, 1);
  const cost = calculateCost(recipe, catalog, survey.people);
  const proteinPct = calculateProteinEnergyPct(nutrition);
  const proteinClaim = getProteinClaim(nutrition);
  const exactLiked = survey.likedIngredientIds.filter(id => ingredientIds.includes(id)).length;
  const disliked = survey.dislikedIngredientIds.filter(id => ingredientIds.includes(id)).length;
  const availabilityPenalty = countAvailabilityPenalty(recipe, catalog, survey.ingredientAccess);

  let score = 50;
  const reasons: string[] = [];

  score += exactLiked * 8;
  score -= disliked * 8;
  score -= availabilityPenalty * 10;

  if (exactLiked > 0) reasons.push(`Contiene ${exactLiked} ingrediente/i che hai selezionato.`);
  if (availabilityPenalty === 0) reasons.push('Ingredienti principali compatibili con il livello di accesso indicato.');

  switch (survey.goal) {
    case 'weight_loss':
      score += normalizeInverse(nutrition.kcal, 150, 650) * 20;
      score += normalize(nutrition.protein / Math.max(nutrition.kcal, 1), 0.02, 0.14) * 12;
      score += normalize(nutrition.fibre ?? 0, 0, 15) * 8;
      reasons.push(`${nutrition.kcal} kcal per porzione e ${nutrition.protein} g proteine.`);
      break;
    case 'high_protein':
      score += normalize(nutrition.protein, 5, 45) * 18;
      score += normalize(proteinPct, 5, 35) * 18;
      if (proteinClaim === 'high_protein') {
        score += 8;
        reasons.push(`Alto contenuto proteico: ${round(proteinPct, 1)}% dell’energia da proteine.`);
      } else if (proteinClaim === 'source_of_protein') {
        score += 4;
        reasons.push(`Fonte di proteine: ${round(proteinPct, 1)}% dell’energia da proteine.`);
      }
      break;
    case 'budget':
      score += normalizeInverse(cost.consumedCostEur / survey.people, 1, 5) * 25;
      reasons.push(`Costo ingredienti consumati stimato: €${round(cost.consumedCostEur / survey.people, 2)} per persona.`);
      break;
    case 'batch':
      if (recipe.batchFriendly) {
        score += 20;
        reasons.push('Adatta a batch cooking o meal prep.');
      }
      break;
    case 'comfort_controlled':
      score += recipe.traditionalness >= 4 ? 8 : 0;
      score += nutrition.kcal <= 550 ? 8 : -4;
      score += nutrition.protein >= 20 ? 6 : 0;
      reasons.push('Mantiene sapori comfort polacchi con porzione e nutrienti più controllabili.');
      break;
    case 'polish_taste':
      score += recipe.flavourFamilies.filter(f => ['sour', 'fermented', 'dill', 'mushroom', 'cabbage', 'sour_dairy', 'beetroot'].includes(f)).length * 5;
      reasons.push('Profilo aromatico vicino ai gusti polacchi: acido/fermentato, aneto, cavolo, funghi o latticini aciduli.');
      break;
  }

  if (recipe.cookingTimeMin <= 30) score += 4;
  if (recipe.tags.includes('fermented')) score += survey.likedIngredientIds.some(id => ['sauerkraut', 'pickled_cucumbers', 'kefir'].includes(id)) ? 5 : 0;

  return { score: round(score, 2), reasons: reasons.slice(0, 3) };
}

export function rankRecipes(recipes: Recipe[], catalog: IngredientCatalogItem[], survey: SurveyState) {
  return recipes
    .map(recipe => ({ recipe, ...rankRecipe(recipe, catalog, survey) }))
    .filter(item => item.score !== -Infinity)
    .sort((a, b) => b.score - a.score);
}

export function searchRecipes(recipes: Recipe[], catalog: IngredientCatalogItem[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return recipes;
  const map = getIngredientMap(catalog);

  return recipes.filter(recipe => {
    const ingredientTerms = recipe.ingredients
      .map(item => map.get(item.ingredientId))
      .filter(Boolean)
      .flatMap(ingredient => [ingredient!.nameIt, ingredient!.namePl, ingredient!.nameEn, ...(ingredient!.aliases ?? [])])
      .join(' ');

    const haystack = [
      recipe.namePl,
      recipe.nameIt,
      recipe.nameEn,
      recipe.description,
      recipe.tags.join(' '),
      recipe.flavourFamilies.join(' '),
      ingredientTerms
    ].join(' ').toLowerCase();

    return haystack.includes(q);
  });
}

export function validateImageAssets(assets: Array<{ id: string; source: string; license: string; sourcePage?: string; attributionText?: string }>) {
  const allowed = new Set(['CC0', 'Public Domain', 'CC BY', 'CC BY-SA', 'GFDL/CC BY-SA', 'Local']);
  return assets.filter(asset => {
    if (!allowed.has(asset.license)) return true;
    if (asset.source !== 'Local Placeholder' && !asset.sourcePage) return true;
    if (asset.source !== 'Local Placeholder' && !asset.attributionText) return true;
    return false;
  });
}

export type Allergen =
  | 'gluten_wheat'
  | 'gluten_rye'
  | 'gluten_barley'
  | 'gluten_oats'
  | 'crustaceans'
  | 'eggs'
  | 'fish'
  | 'peanuts'
  | 'soybeans'
  | 'milk'
  | 'nuts'
  | 'celery'
  | 'mustard'
  | 'sesame'
  | 'sulphites'
  | 'lupin'
  | 'molluscs';

export type AvailabilityTier = 'standard_supermarket' | 'tesco_polish' | 'polish_shop';
export type Unit = 'g' | 'ml' | 'unit';

export type NutritionPer100 = {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre?: number;
  sodiumMg?: number;
};

export type PriceSeed = {
  packageSize: number;
  packageUnit: Unit;
  packagePriceEur: number;
  sourceLabel: string;
  sourceUrl?: string;
  lastChecked: string;
  confidence: 'low' | 'medium' | 'high';
};

export type IngredientCatalogItem = {
  id: string;
  nameIt: string;
  namePl?: string;
  nameEn?: string;
  aliases?: string[];
  allergens: Allergen[];
  nutritionPer100g?: NutritionPer100;
  price?: PriceSeed;
  availability: {
    standardSupermarket: boolean;
    tescoPolishGroceries: boolean;
    polishShop: boolean;
    notes?: string;
  };
  substitutions?: string[];
  tags: string[];
};

export type IngredientAmount = {
  ingredientId: string;
  quantityPerServing: number;
  unit: Unit;
  optional?: boolean;
  critical?: boolean;
};

export type ImageAsset = {
  id: string;
  type: 'recipe' | 'ingredient';
  commonsFileName?: string;
  sourcePage: string;
  source: 'Wikimedia Commons' | 'Local Placeholder';
  author?: string;
  license: 'CC0' | 'Public Domain' | 'CC BY' | 'CC BY-SA' | 'GFDL/CC BY-SA' | 'Local';
  licenseVersion?: string;
  attributionText: string;
  usedFor: string[];
};

export type Recipe = {
  id: string;
  namePl: string;
  nameIt: string;
  nameEn: string;
  description: string;
  imageAssetId?: string;
  baseServings: 1;
  ingredients: IngredientAmount[];
  cookingTimeMin: number;
  difficulty: 'easy' | 'medium' | 'hard';
  mealType: 'soup' | 'stew' | 'dumpling' | 'main' | 'side' | 'bowl' | 'breakfast' | 'salad';
  tags: string[];
  flavourFamilies: string[];
  batchFriendly: boolean;
  vegetarian: boolean;
  vegan: boolean;
  traditionalness: 1 | 2 | 3 | 4 | 5;
  polishInspired: boolean;
  estimatedNutritionPerServing?: {
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
    fibre?: number;
    sodiumMg?: number;
  };
};

export type SurveyGoal =
  | 'weight_loss'
  | 'high_protein'
  | 'vegetarian'
  | 'budget'
  | 'batch'
  | 'comfort_controlled'
  | 'polish_taste';

export type SurveyState = {
  goal: SurveyGoal;
  people: 1 | 2 | 3 | 4;
  timeAvailable: 'under_30' | '30_60' | '60_plus' | 'batch';
  ingredientAccess: AvailabilityTier;
  excludedAllergens: Allergen[];
  likedIngredientIds: string[];
  dislikedIngredientIds: string[];
};

import type { IngredientCatalogItem } from './types';

const CHECKED = '2026-04-25';

export const ingredientCatalog: IngredientCatalogItem[] = [
  {
    id: 'potatoes', nameIt: 'Patate', namePl: 'ziemniaki', nameEn: 'potatoes', allergens: [],
    nutritionPer100g: { kcal: 77, protein: 2, carbs: 17, fat: 0.1, fibre: 2.2 },
    price: { packageSize: 2000, packageUnit: 'g', packagePriceEur: 3.29, sourceLabel: 'Tesco Ireland potatoes 2kg example', sourceUrl: 'https://www.tesco.ie/', lastChecked: CHECKED, confidence: 'medium' },
    availability: { standardSupermarket: true, tescoPolishGroceries: true, polishShop: true },
    substitutions: ['sweet potato if Polish authenticity is less important'], tags: ['polish_core', 'budget', 'satiety']
  },
  {
    id: 'wheat_flour', nameIt: 'Farina di frumento', namePl: 'mąka pszenna', nameEn: 'wheat flour', allergens: ['gluten_wheat'],
    nutritionPer100g: { kcal: 364, protein: 10, carbs: 76, fat: 1, fibre: 2.7 },
    price: { packageSize: 1000, packageUnit: 'g', packagePriceEur: 1.49, sourceLabel: 'Generic supermarket flour seed', lastChecked: CHECKED, confidence: 'low' },
    availability: { standardSupermarket: true, tescoPolishGroceries: true, polishShop: true },
    substitutions: ['gluten-free flour blend, but texture changes'], tags: ['dumpling', 'budget']
  },
  {
    id: 'rye_flour', nameIt: 'Farina di segale', namePl: 'mąka żytnia', nameEn: 'rye flour', allergens: ['gluten_rye'],
    nutritionPer100g: { kcal: 325, protein: 10, carbs: 73, fat: 1.6, fibre: 8 },
    price: { packageSize: 1000, packageUnit: 'g', packagePriceEur: 3.05, sourceLabel: 'Tesco/Doves Farm rye flour example', sourceUrl: 'https://www.tesco.ie/', lastChecked: CHECKED, confidence: 'medium' },
    availability: { standardSupermarket: true, tescoPolishGroceries: true, polishShop: true, notes: 'Bottled żurek starter may require Polish shop.' },
    substitutions: ['bottled żurek starter from Polish shop'], tags: ['fermented', 'polish_core']
  },
  {
    id: 'cabbage', nameIt: 'Cavolo', namePl: 'kapusta', nameEn: 'cabbage', allergens: [],
    nutritionPer100g: { kcal: 25, protein: 1.3, carbs: 6, fat: 0.1, fibre: 2.5 },
    price: { packageSize: 1000, packageUnit: 'g', packagePriceEur: 1.49, sourceLabel: 'Generic supermarket cabbage seed', lastChecked: CHECKED, confidence: 'low' },
    availability: { standardSupermarket: true, tescoPolishGroceries: true, polishShop: true },
    substitutions: ['savoy cabbage'], tags: ['polish_core', 'low_calorie', 'fibre']
  },
  {
    id: 'sauerkraut', nameIt: 'Crauti', namePl: 'kapusta kiszona', nameEn: 'sauerkraut', allergens: [],
    nutritionPer100g: { kcal: 19, protein: 0.9, carbs: 4.3, fat: 0.1, fibre: 2.9, sodiumMg: 661 },
    price: { packageSize: 500, packageUnit: 'g', packagePriceEur: 1.35, sourceLabel: 'Tesco Polish Groceries sauerkraut 500g example', sourceUrl: 'https://www.tesco.ie/shop/en-IE/browse/food-cupboard/cooking-sauces-and-world-foods/polish-groceries', lastChecked: CHECKED, confidence: 'high' },
    availability: { standardSupermarket: false, tescoPolishGroceries: true, polishShop: true, notes: 'Look for kapusta kiszona; verify salt and additives.' },
    substitutions: ['standard sauerkraut', 'fresh cabbage + vinegar for non-fermented fallback'], tags: ['polish_core', 'fermented', 'low_calorie']
  },
  {
    id: 'pickled_cucumbers', nameIt: 'Cetrioli fermentati / dill pickles', namePl: 'ogórki kiszone', nameEn: 'sour cucumbers', allergens: [],
    nutritionPer100g: { kcal: 12, protein: 0.5, carbs: 2.4, fat: 0.2, fibre: 1, sodiumMg: 800 },
    price: { packageSize: 490, packageUnit: 'g', packagePriceEur: 2.40, sourceLabel: 'Tesco Polish Groceries Krakus pickled cucumbers 490g example', sourceUrl: 'https://www.tesco.ie/shop/en-IE/browse/food-cupboard/cooking-sauces-and-world-foods/polish-groceries', lastChecked: CHECKED, confidence: 'high' },
    availability: { standardSupermarket: true, tescoPolishGroceries: true, polishShop: true, notes: 'True ogórki kiszone are fermented; standard dill pickles are acceptable fallback.' },
    substitutions: ['dill pickles', 'gherkins'], tags: ['polish_core', 'fermented', 'low_calorie']
  },
  {
    id: 'beetroot', nameIt: 'Barbabietola', namePl: 'buraki', nameEn: 'beetroot', allergens: [],
    nutritionPer100g: { kcal: 43, protein: 1.6, carbs: 10, fat: 0.2, fibre: 2.8 },
    price: { packageSize: 500, packageUnit: 'g', packagePriceEur: 1.20, sourceLabel: 'Generic supermarket beetroot seed', lastChecked: CHECKED, confidence: 'low' },
    availability: { standardSupermarket: true, tescoPolishGroceries: true, polishShop: true },
    substitutions: ['vacuum-packed cooked beetroot'], tags: ['polish_core', 'fibre']
  },
  {
    id: 'mushrooms', nameIt: 'Funghi', namePl: 'grzyby', nameEn: 'mushrooms', allergens: [],
    nutritionPer100g: { kcal: 22, protein: 3.1, carbs: 3.3, fat: 0.3, fibre: 1 },
    price: { packageSize: 250, packageUnit: 'g', packagePriceEur: 1.19, sourceLabel: 'Tesco Ireland chestnut mushrooms 250g example', sourceUrl: 'https://www.tesco.ie/', lastChecked: CHECKED, confidence: 'medium' },
    availability: { standardSupermarket: true, tescoPolishGroceries: true, polishShop: true },
    substitutions: ['dried porcini for stronger Polish mushroom taste'], tags: ['polish_core', 'umami', 'low_calorie']
  },
  {
    id: 'buckwheat', nameIt: 'Grano saraceno', namePl: 'kasza gryczana', nameEn: 'buckwheat groats', allergens: [],
    nutritionPer100g: { kcal: 343, protein: 13.3, carbs: 71.5, fat: 3.4, fibre: 10 },
    price: { packageSize: 500, packageUnit: 'g', packagePriceEur: 2.20, sourceLabel: 'Generic/Tesco buckwheat seed estimate', sourceUrl: 'https://www.tesco.ie/', lastChecked: CHECKED, confidence: 'low' },
    availability: { standardSupermarket: true, tescoPolishGroceries: true, polishShop: true, notes: 'May be in health-food or world-food section.' },
    substitutions: ['pearl barley', 'brown rice'], tags: ['polish_core', 'fibre', 'satiety']
  },
  {
    id: 'pearl_barley', nameIt: 'Orzo perlato', namePl: 'pęczak / kasza jęczmienna', nameEn: 'pearl barley', allergens: ['gluten_barley'],
    nutritionPer100g: { kcal: 352, protein: 9.9, carbs: 78, fat: 1.2, fibre: 15.6 },
    price: { packageSize: 500, packageUnit: 'g', packagePriceEur: 1.10, sourceLabel: 'Tesco pearl barley 500g example', sourceUrl: 'https://www.tesco.ie/', lastChecked: CHECKED, confidence: 'medium' },
    availability: { standardSupermarket: true, tescoPolishGroceries: true, polishShop: true },
    substitutions: ['buckwheat for gluten-free version'], tags: ['polish_core', 'fibre', 'budget']
  },
  {
    id: 'cottage_cheese', nameIt: 'Cottage cheese / twaróg', namePl: 'twaróg / serek wiejski', nameEn: 'cottage cheese', allergens: ['milk'],
    nutritionPer100g: { kcal: 56, protein: 8.9, carbs: 3.1, fat: 0.9, fibre: 0, sodiumMg: 152 },
    price: { packageSize: 300, packageUnit: 'g', packagePriceEur: 1.19, sourceLabel: 'Tesco Creamfields low fat cottage cheese 300g example', sourceUrl: 'https://www.tesco.ie/', lastChecked: CHECKED, confidence: 'high' },
    availability: { standardSupermarket: true, tescoPolishGroceries: true, polishShop: true },
    substitutions: ['quark', 'ricotta', 'twaróg from Polish shop'], tags: ['protein', 'vegetarian', 'polish_core']
  },
  {
    id: 'kefir', nameIt: 'Kefir', namePl: 'kefir', nameEn: 'kefir', allergens: ['milk'],
    nutritionPer100g: { kcal: 50, protein: 3.4, carbs: 4.8, fat: 1.8 },
    price: { packageSize: 400, packageUnit: 'ml', packagePriceEur: 1.35, sourceLabel: 'Tesco Polish Groceries kefir drink 400g/ml example', sourceUrl: 'https://www.tesco.ie/shop/en-IE/browse/food-cupboard/cooking-sauces-and-world-foods/polish-groceries', lastChecked: CHECKED, confidence: 'high' },
    availability: { standardSupermarket: true, tescoPolishGroceries: true, polishShop: true },
    substitutions: ['natural yogurt', 'buttermilk'], tags: ['fermented', 'protein', 'polish_core']
  },
  {
    id: 'greek_yogurt', nameIt: 'Yogurt greco magro', namePl: 'jogurt grecki', nameEn: 'low fat Greek-style yogurt', allergens: ['milk'],
    nutritionPer100g: { kcal: 73, protein: 6.5, carbs: 5.5, fat: 2.7 },
    price: { packageSize: 500, packageUnit: 'g', packagePriceEur: 1.35, sourceLabel: 'Tesco low-fat Greek style yogurt 500g example', sourceUrl: 'https://www.tesco.ie/', lastChecked: CHECKED, confidence: 'medium' },
    availability: { standardSupermarket: true, tescoPolishGroceries: true, polishShop: true },
    substitutions: ['skyr', 'quark', 'low-fat sour cream'], tags: ['protein', 'vegetarian', 'standard_swap']
  },
  {
    id: 'sour_cream', nameIt: 'Panna acida / śmietana', namePl: 'śmietana', nameEn: 'sour cream', allergens: ['milk'],
    nutritionPer100g: { kcal: 193, protein: 2.8, carbs: 3.5, fat: 19 },
    price: { packageSize: 400, packageUnit: 'g', packagePriceEur: 1.90, sourceLabel: 'Tesco Polish Groceries Mlekovita sour cream 400g example', sourceUrl: 'https://www.tesco.ie/shop/en-IE/browse/food-cupboard/cooking-sauces-and-world-foods/polish-groceries', lastChecked: CHECKED, confidence: 'high' },
    availability: { standardSupermarket: true, tescoPolishGroceries: true, polishShop: true },
    substitutions: ['Greek yogurt for lower calorie version'], tags: ['polish_core', 'comfort']
  },
  {
    id: 'eggs', nameIt: 'Uova', namePl: 'jaja', nameEn: 'eggs', allergens: ['eggs'],
    nutritionPer100g: { kcal: 143, protein: 12.6, carbs: 0.7, fat: 9.5 },
    price: { packageSize: 6, packageUnit: 'unit', packagePriceEur: 2.20, sourceLabel: 'Generic eggs seed', lastChecked: CHECKED, confidence: 'low' },
    availability: { standardSupermarket: true, tescoPolishGroceries: true, polishShop: true }, substitutions: [], tags: ['protein', 'budget']
  },
  {
    id: 'onions', nameIt: 'Cipolle', namePl: 'cebula', nameEn: 'onions', allergens: [],
    nutritionPer100g: { kcal: 40, protein: 1.1, carbs: 9.3, fat: 0.1, fibre: 1.7 },
    price: { packageSize: 1000, packageUnit: 'g', packagePriceEur: 1.29, sourceLabel: 'Tesco onions 1kg example', sourceUrl: 'https://www.tesco.ie/', lastChecked: CHECKED, confidence: 'medium' },
    availability: { standardSupermarket: true, tescoPolishGroceries: true, polishShop: true }, substitutions: [], tags: ['polish_core', 'budget']
  },
  {
    id: 'carrots', nameIt: 'Carote', namePl: 'marchew', nameEn: 'carrots', allergens: [],
    nutritionPer100g: { kcal: 41, protein: 0.9, carbs: 10, fat: 0.2, fibre: 2.8 },
    price: { packageSize: 1000, packageUnit: 'g', packagePriceEur: 1.39, sourceLabel: 'Tesco carrots 1kg example', sourceUrl: 'https://www.tesco.ie/', lastChecked: CHECKED, confidence: 'medium' },
    availability: { standardSupermarket: true, tescoPolishGroceries: true, polishShop: true }, substitutions: [], tags: ['budget', 'soup']
  },
  {
    id: 'leek', nameIt: 'Porro', namePl: 'por', nameEn: 'leek', allergens: [],
    nutritionPer100g: { kcal: 61, protein: 1.5, carbs: 14, fat: 0.3, fibre: 1.8 },
    price: { packageSize: 500, packageUnit: 'g', packagePriceEur: 1.95, sourceLabel: 'Tesco leeks 500g example', sourceUrl: 'https://www.tesco.ie/', lastChecked: CHECKED, confidence: 'medium' },
    availability: { standardSupermarket: true, tescoPolishGroceries: true, polishShop: true }, substitutions: ['onion'], tags: ['soup']
  },
  {
    id: 'celeriac', nameIt: 'Sedano rapa / sedano', namePl: 'seler', nameEn: 'celeriac/celery', allergens: ['celery'],
    nutritionPer100g: { kcal: 42, protein: 1.5, carbs: 9.2, fat: 0.3, fibre: 1.8 },
    price: { packageSize: 500, packageUnit: 'g', packagePriceEur: 1.60, sourceLabel: 'Generic celeriac/celery seed', lastChecked: CHECKED, confidence: 'low' },
    availability: { standardSupermarket: true, tescoPolishGroceries: true, polishShop: true }, substitutions: ['parsley root', 'celery stalks'], tags: ['soup']
  },
  {
    id: 'chicken_breast', nameIt: 'Petto di pollo', namePl: 'pierś z kurczaka', nameEn: 'chicken breast', allergens: [],
    nutritionPer100g: { kcal: 120, protein: 23, carbs: 0, fat: 2.6 },
    price: { packageSize: 284, packageUnit: 'g', packagePriceEur: 3.99, sourceLabel: 'Tesco chicken breast mini fillets example', sourceUrl: 'https://www.tesco.ie/', lastChecked: CHECKED, confidence: 'medium' },
    availability: { standardSupermarket: true, tescoPolishGroceries: true, polishShop: true }, substitutions: ['turkey breast'], tags: ['protein', 'lean']
  },
  {
    id: 'turkey_mince', nameIt: 'Tacchino macinato', namePl: 'mielony indyk', nameEn: 'turkey mince', allergens: [],
    nutritionPer100g: { kcal: 150, protein: 22, carbs: 0, fat: 7 },
    price: { packageSize: 400, packageUnit: 'g', packagePriceEur: 4.99, sourceLabel: 'Tesco turkey mince 400g example', sourceUrl: 'https://www.tesco.ie/', lastChecked: CHECKED, confidence: 'medium' },
    availability: { standardSupermarket: true, tescoPolishGroceries: true, polishShop: true }, substitutions: ['lean beef mince', 'lentils'], tags: ['protein', 'lean']
  },
  {
    id: 'lean_pork', nameIt: 'Maiale magro', namePl: 'chuda wieprzowina', nameEn: 'lean pork', allergens: [],
    nutritionPer100g: { kcal: 170, protein: 21, carbs: 0, fat: 9 },
    price: { packageSize: 500, packageUnit: 'g', packagePriceEur: 5.00, sourceLabel: 'Generic pork seed estimate', lastChecked: CHECKED, confidence: 'low' },
    availability: { standardSupermarket: true, tescoPolishGroceries: true, polishShop: true }, substitutions: ['turkey mince', 'chicken'], tags: ['protein', 'traditional']
  },
  {
    id: 'beef_mince', nameIt: 'Manzo macinato', namePl: 'mielona wołowina', nameEn: 'beef mince', allergens: [],
    nutritionPer100g: { kcal: 190, protein: 20, carbs: 0, fat: 12 },
    price: { packageSize: 500, packageUnit: 'g', packagePriceEur: 5.50, sourceLabel: 'Generic beef mince seed', lastChecked: CHECKED, confidence: 'low' },
    availability: { standardSupermarket: true, tescoPolishGroceries: true, polishShop: true }, substitutions: ['turkey mince', 'lentils'], tags: ['protein']
  },
  {
    id: 'kielbasa', nameIt: 'Kiełbasa / salsiccia polacca', namePl: 'kiełbasa', nameEn: 'Polish sausage', allergens: [],
    nutritionPer100g: { kcal: 300, protein: 14, carbs: 2, fat: 26, sodiumMg: 1100 },
    price: { packageSize: 600, packageUnit: 'g', packagePriceEur: 3.99, sourceLabel: 'Tesco Polish Groceries Sokolow sausage 600g example', sourceUrl: 'https://www.tesco.ie/shop/en-IE/browse/food-cupboard/cooking-sauces-and-world-foods/polish-groceries', lastChecked: CHECKED, confidence: 'high' },
    availability: { standardSupermarket: false, tescoPolishGroceries: true, polishShop: true, notes: 'Check label for gluten, soy, mustard, sulphites.' }, substitutions: ['lean ham', 'turkey sausage', 'smoked tofu if vegetarian'], tags: ['polish_core', 'processed_meat']
  },
  {
    id: 'rice', nameIt: 'Riso', namePl: 'ryż', nameEn: 'rice', allergens: [],
    nutritionPer100g: { kcal: 360, protein: 7, carbs: 79, fat: 0.6, fibre: 1.3 },
    price: { packageSize: 1000, packageUnit: 'g', packagePriceEur: 1.80, sourceLabel: 'Generic rice seed', lastChecked: CHECKED, confidence: 'low' },
    availability: { standardSupermarket: true, tescoPolishGroceries: true, polishShop: true }, substitutions: ['buckwheat', 'barley'], tags: ['budget']
  },
  {
    id: 'beans', nameIt: 'Fagioli', namePl: 'fasola', nameEn: 'beans', allergens: [],
    nutritionPer100g: { kcal: 127, protein: 8.7, carbs: 22.8, fat: 0.5, fibre: 6.4 },
    price: { packageSize: 400, packageUnit: 'g', packagePriceEur: 0.85, sourceLabel: 'Generic canned beans seed', lastChecked: CHECKED, confidence: 'low' },
    availability: { standardSupermarket: true, tescoPolishGroceries: true, polishShop: true }, substitutions: ['lentils'], tags: ['protein', 'fibre', 'budget', 'vegetarian']
  },
  {
    id: 'lentils', nameIt: 'Lenticchie', namePl: 'soczewica', nameEn: 'lentils', allergens: [],
    nutritionPer100g: { kcal: 116, protein: 9, carbs: 20, fat: 0.4, fibre: 7.9 },
    price: { packageSize: 500, packageUnit: 'g', packagePriceEur: 0.99, sourceLabel: 'Tesco red split lentils 500g example', sourceUrl: 'https://www.tesco.ie/', lastChecked: CHECKED, confidence: 'medium' },
    availability: { standardSupermarket: true, tescoPolishGroceries: true, polishShop: true }, substitutions: ['beans'], tags: ['protein', 'fibre', 'budget', 'vegetarian']
  },
  {
    id: 'tomato_passata', nameIt: 'Passata di pomodoro', namePl: 'passata pomidorowa', nameEn: 'tomato passata', allergens: [],
    nutritionPer100g: { kcal: 33, protein: 1.4, carbs: 5.5, fat: 0.2, fibre: 1.5 },
    price: { packageSize: 500, packageUnit: 'g', packagePriceEur: 0.99, sourceLabel: 'Generic passata seed', lastChecked: CHECKED, confidence: 'low' },
    availability: { standardSupermarket: true, tescoPolishGroceries: true, polishShop: true }, substitutions: ['canned tomatoes'], tags: ['soup', 'budget']
  },
  {
    id: 'cucumber', nameIt: 'Cetriolo fresco', namePl: 'ogórek', nameEn: 'cucumber', allergens: [],
    nutritionPer100g: { kcal: 15, protein: 0.7, carbs: 3.6, fat: 0.1, fibre: 0.5 },
    price: { packageSize: 1, packageUnit: 'unit', packagePriceEur: 0.95, sourceLabel: 'Generic cucumber seed', lastChecked: CHECKED, confidence: 'low' },
    availability: { standardSupermarket: true, tescoPolishGroceries: true, polishShop: true }, substitutions: [], tags: ['low_calorie', 'fresh']
  },
  {
    id: 'dill', nameIt: 'Aneto', namePl: 'koperek', nameEn: 'dill', allergens: [],
    nutritionPer100g: { kcal: 43, protein: 3.5, carbs: 7, fat: 1.1, fibre: 2.1 },
    price: { packageSize: 30, packageUnit: 'g', packagePriceEur: 1.50, sourceLabel: 'Generic fresh dill seed', lastChecked: CHECKED, confidence: 'low' },
    availability: { standardSupermarket: true, tescoPolishGroceries: true, polishShop: true }, substitutions: ['dried dill, use less'], tags: ['polish_core', 'herb']
  },
  {
    id: 'berries', nameIt: 'Frutti di bosco', namePl: 'owoce jagodowe', nameEn: 'berries', allergens: [],
    nutritionPer100g: { kcal: 50, protein: 1, carbs: 12, fat: 0.3, fibre: 4 },
    price: { packageSize: 300, packageUnit: 'g', packagePriceEur: 3.00, sourceLabel: 'Generic frozen berries seed', lastChecked: CHECKED, confidence: 'low' },
    availability: { standardSupermarket: true, tescoPolishGroceries: true, polishShop: true }, substitutions: ['apple'], tags: ['breakfast', 'fibre']
  },
  {
    id: 'oats', nameIt: 'Avena', namePl: 'płatki owsiane', nameEn: 'oats', allergens: ['gluten_oats'],
    nutritionPer100g: { kcal: 389, protein: 16.9, carbs: 66, fat: 6.9, fibre: 10.6 },
    price: { packageSize: 1000, packageUnit: 'g', packagePriceEur: 1.49, sourceLabel: 'Generic oats seed', lastChecked: CHECKED, confidence: 'low' },
    availability: { standardSupermarket: true, tescoPolishGroceries: true, polishShop: true }, substitutions: ['buckwheat flakes'], tags: ['breakfast', 'fibre', 'budget']
  },
  {
    id: 'oil', nameIt: 'Olio', namePl: 'olej', nameEn: 'oil', allergens: [],
    nutritionPer100g: { kcal: 884, protein: 0, carbs: 0, fat: 100 },
    price: { packageSize: 1000, packageUnit: 'ml', packagePriceEur: 2.50, sourceLabel: 'Generic oil seed', lastChecked: CHECKED, confidence: 'low' },
    availability: { standardSupermarket: true, tescoPolishGroceries: true, polishShop: true }, substitutions: [], tags: ['cooking']
  },
  {
    id: 'breadcrumbs', nameIt: 'Pangrattato', namePl: 'bułka tarta', nameEn: 'breadcrumbs', allergens: ['gluten_wheat'],
    nutritionPer100g: { kcal: 395, protein: 13, carbs: 72, fat: 5, fibre: 4 },
    price: { packageSize: 400, packageUnit: 'g', packagePriceEur: 1.20, sourceLabel: 'Generic breadcrumbs seed', lastChecked: CHECKED, confidence: 'low' },
    availability: { standardSupermarket: true, tescoPolishGroceries: true, polishShop: true }, substitutions: ['oat crumb', 'gluten-free crumbs'], tags: ['comfort']
  },
  {
    id: 'radish', nameIt: 'Ravanelli', namePl: 'rzodkiewka', nameEn: 'radish', allergens: [],
    nutritionPer100g: { kcal: 16, protein: 0.7, carbs: 3.4, fat: 0.1, fibre: 1.6 },
    price: { packageSize: 200, packageUnit: 'g', packagePriceEur: 1.00, sourceLabel: 'Generic radish seed', lastChecked: CHECKED, confidence: 'low' },
    availability: { standardSupermarket: true, tescoPolishGroceries: true, polishShop: true }, substitutions: ['cucumber'], tags: ['fresh', 'low_calorie']
  },
  {
    id: 'horseradish', nameIt: 'Rafano', namePl: 'chrzan', nameEn: 'horseradish', allergens: [],
    nutritionPer100g: { kcal: 48, protein: 1.2, carbs: 11, fat: 0.7, fibre: 3.3 },
    price: { packageSize: 180, packageUnit: 'g', packagePriceEur: 1.80, sourceLabel: 'Generic/Polish shop horseradish seed', lastChecked: CHECKED, confidence: 'low' },
    availability: { standardSupermarket: false, tescoPolishGroceries: true, polishShop: true }, substitutions: ['mustard, but allergen differs'], tags: ['polish_core', 'condiment']
  }
];

import type { Recipe } from './types';

export const polishRecipeSeeds: Recipe[] = [
  {
    id: 'pierogi-ruskie-light',
    namePl: 'Pierogi ruskie light',
    nameIt: 'Pierogi ruskie alleggeriti',
    nameEn: 'Light potato and cottage cheese pierogi',
    description: 'Versione controllata dei pierogi ruskie: ripieno di patate e cottage cheese/twaróg, porzione misurata e condimento più leggero rispetto alla classica dose abbondante di burro.',
    imageAssetId: 'img_pierogi_ruskie', baseServings: 1,
    ingredients: [
      { ingredientId: 'wheat_flour', quantityPerServing: 65, unit: 'g', critical: true },
      { ingredientId: 'potatoes', quantityPerServing: 120, unit: 'g', critical: true },
      { ingredientId: 'cottage_cheese', quantityPerServing: 90, unit: 'g', critical: true },
      { ingredientId: 'onions', quantityPerServing: 35, unit: 'g' },
      { ingredientId: 'greek_yogurt', quantityPerServing: 35, unit: 'g' }
    ],
    cookingTimeMin: 55, difficulty: 'medium', mealType: 'dumpling',
    tags: ['traditional_rebalanced', 'vegetarian', 'comfort_controlled', 'source_protein_candidate'],
    flavourFamilies: ['dairy', 'starchy', 'onion', 'comfort'], batchFriendly: true, vegetarian: true, vegan: false, traditionalness: 5, polishInspired: false,
    estimatedNutritionPerServing: { kcal: 430, protein: 22, carbs: 72, fat: 6, fibre: 5, sodiumMg: 520 }
  },
  {
    id: 'pierogi-kapusta-grzyby',
    namePl: 'Pierogi z kapustą i grzybami',
    nameIt: 'Pierogi con crauti e funghi',
    nameEn: 'Sauerkraut and mushroom pierogi',
    description: 'Pierogi vegetariani dal profilo acido-umami: crauti, funghi e cipolla. Più leggeri se serviti con yogurt o cipolla appassita invece di molto burro.',
    imageAssetId: 'img_pierogi_ruskie', baseServings: 1,
    ingredients: [
      { ingredientId: 'wheat_flour', quantityPerServing: 65, unit: 'g', critical: true },
      { ingredientId: 'sauerkraut', quantityPerServing: 110, unit: 'g', critical: true },
      { ingredientId: 'mushrooms', quantityPerServing: 80, unit: 'g', critical: true },
      { ingredientId: 'onions', quantityPerServing: 35, unit: 'g' },
      { ingredientId: 'oil', quantityPerServing: 5, unit: 'ml' }
    ],
    cookingTimeMin: 60, difficulty: 'medium', mealType: 'dumpling',
    tags: ['traditional', 'vegetarian', 'fermented', 'budget'], flavourFamilies: ['sour', 'fermented', 'mushroom', 'comfort'], batchFriendly: true, vegetarian: true, vegan: false, traditionalness: 5, polishInspired: false,
    estimatedNutritionPerServing: { kcal: 390, protein: 13, carbs: 70, fat: 7, fibre: 7, sodiumMg: 800 }
  },
  {
    id: 'bigos-lean',
    namePl: 'Bigos lżejszy',
    nameIt: 'Bigos più magro',
    nameEn: 'Lean bigos',
    description: 'Stufato di cavolo e crauti con quota ridotta di kiełbasa e più cavolo fresco. Mantiene il gusto affumicato-acido, ma abbassa densità calorica e grassi.',
    imageAssetId: 'img_bigos', baseServings: 1,
    ingredients: [
      { ingredientId: 'cabbage', quantityPerServing: 180, unit: 'g', critical: true },
      { ingredientId: 'sauerkraut', quantityPerServing: 130, unit: 'g', critical: true },
      { ingredientId: 'lean_pork', quantityPerServing: 70, unit: 'g' },
      { ingredientId: 'kielbasa', quantityPerServing: 25, unit: 'g', optional: true },
      { ingredientId: 'mushrooms', quantityPerServing: 60, unit: 'g' },
      { ingredientId: 'onions', quantityPerServing: 40, unit: 'g' }
    ],
    cookingTimeMin: 90, difficulty: 'medium', mealType: 'stew',
    tags: ['traditional_rebalanced', 'batch', 'fermented', 'comfort_controlled'], flavourFamilies: ['sour', 'fermented', 'smoky', 'cabbage'], batchFriendly: true, vegetarian: false, vegan: false, traditionalness: 5, polishInspired: false,
    estimatedNutritionPerServing: { kcal: 360, protein: 25, carbs: 24, fat: 18, fibre: 9, sodiumMg: 1250 }
  },
  {
    id: 'zurek-light',
    namePl: 'Żurek lżejszy',
    nameIt: 'Żurek controllato',
    nameEn: 'Light żurek soup',
    description: 'Zuppa acida di segale con uovo e piccola quota di salsiccia. La versione controllata usa più brodo/verdure e meno panna o salsiccia.',
    imageAssetId: 'img_zurek', baseServings: 1,
    ingredients: [
      { ingredientId: 'rye_flour', quantityPerServing: 20, unit: 'g', critical: true },
      { ingredientId: 'eggs', quantityPerServing: 1, unit: 'unit', critical: true },
      { ingredientId: 'kielbasa', quantityPerServing: 30, unit: 'g', optional: true },
      { ingredientId: 'potatoes', quantityPerServing: 90, unit: 'g' },
      { ingredientId: 'greek_yogurt', quantityPerServing: 35, unit: 'g' },
      { ingredientId: 'onions', quantityPerServing: 25, unit: 'g' }
    ],
    cookingTimeMin: 35, difficulty: 'medium', mealType: 'soup',
    tags: ['traditional_rebalanced', 'soup', 'fermented', 'source_protein_candidate'], flavourFamilies: ['sour', 'rye', 'smoky', 'egg'], batchFriendly: true, vegetarian: false, vegan: false, traditionalness: 5, polishInspired: false,
    estimatedNutritionPerServing: { kcal: 330, protein: 19, carbs: 34, fat: 13, fibre: 4, sodiumMg: 900 }
  },
  {
    id: 'barszcz-czerwony',
    namePl: 'Barszcz czerwony',
    nameIt: 'Barszcz rosso',
    nameEn: 'Red beetroot borscht',
    description: 'Zuppa di barbabietola dal gusto dolce-acido. Può essere mantenuta molto leggera, oppure resa più saziante con fagioli o uovo a parte.',
    imageAssetId: 'img_barszcz', baseServings: 1,
    ingredients: [
      { ingredientId: 'beetroot', quantityPerServing: 220, unit: 'g', critical: true },
      { ingredientId: 'carrots', quantityPerServing: 60, unit: 'g' },
      { ingredientId: 'onions', quantityPerServing: 30, unit: 'g' },
      { ingredientId: 'celeriac', quantityPerServing: 30, unit: 'g' },
      { ingredientId: 'greek_yogurt', quantityPerServing: 25, unit: 'g', optional: true }
    ],
    cookingTimeMin: 40, difficulty: 'easy', mealType: 'soup',
    tags: ['traditional', 'vegetarian', 'low_calorie', 'soup'], flavourFamilies: ['beetroot', 'sweet_sour', 'root_veg'], batchFriendly: true, vegetarian: true, vegan: false, traditionalness: 5, polishInspired: false,
    estimatedNutritionPerServing: { kcal: 170, protein: 6, carbs: 32, fat: 2, fibre: 8, sodiumMg: 450 }
  },
  {
    id: 'golabki-lean',
    namePl: 'Gołąbki lżejsze',
    nameIt: 'Gołąbki con carne magra',
    nameEn: 'Lean cabbage rolls',
    description: 'Involtini di cavolo con riso e carne magra. La versione più diet-aware aumenta il cavolo, riduce il riso e usa tacchino o manzo magro.',
    imageAssetId: 'img_golabki', baseServings: 1,
    ingredients: [
      { ingredientId: 'cabbage', quantityPerServing: 180, unit: 'g', critical: true },
      { ingredientId: 'turkey_mince', quantityPerServing: 100, unit: 'g', critical: true },
      { ingredientId: 'rice', quantityPerServing: 35, unit: 'g' },
      { ingredientId: 'tomato_passata', quantityPerServing: 120, unit: 'g' },
      { ingredientId: 'onions', quantityPerServing: 40, unit: 'g' }
    ],
    cookingTimeMin: 80, difficulty: 'medium', mealType: 'main',
    tags: ['traditional_rebalanced', 'high_protein_candidate', 'batch'], flavourFamilies: ['cabbage', 'tomato', 'comfort'], batchFriendly: true, vegetarian: false, vegan: false, traditionalness: 5, polishInspired: false,
    estimatedNutritionPerServing: { kcal: 410, protein: 32, carbs: 45, fat: 10, fibre: 7, sodiumMg: 650 }
  },
  {
    id: 'kotlet-schabowy-baked',
    namePl: 'Kotlet schabowy pieczony',
    nameIt: 'Schabowy al forno',
    nameEn: 'Baked Polish pork cutlet',
    description: 'Alternativa al classico schabowy fritto: panatura controllata e cottura al forno. Conserva la forma comfort food, ma riduce olio assorbito.',
    imageAssetId: 'img_kotlet_schabowy', baseServings: 1,
    ingredients: [
      { ingredientId: 'lean_pork', quantityPerServing: 150, unit: 'g', critical: true },
      { ingredientId: 'eggs', quantityPerServing: 0.5, unit: 'unit', critical: true },
      { ingredientId: 'breadcrumbs', quantityPerServing: 25, unit: 'g', critical: true },
      { ingredientId: 'wheat_flour', quantityPerServing: 10, unit: 'g' },
      { ingredientId: 'oil', quantityPerServing: 5, unit: 'ml' }
    ],
    cookingTimeMin: 35, difficulty: 'easy', mealType: 'main',
    tags: ['traditional_rebalanced', 'high_protein_candidate', 'comfort_controlled'], flavourFamilies: ['pork', 'crispy', 'comfort'], batchFriendly: false, vegetarian: false, vegan: false, traditionalness: 5, polishInspired: false,
    estimatedNutritionPerServing: { kcal: 390, protein: 38, carbs: 22, fat: 17, fibre: 2, sodiumMg: 550 }
  },
  {
    id: 'mizeria-yogurt',
    namePl: 'Mizeria z jogurtem',
    nameIt: 'Mizeria con yogurt',
    nameEn: 'Cucumber dill yogurt salad',
    description: 'Insalata fredda di cetriolo, aneto e yogurt. È una delle opzioni più leggere e immediate per aggiungere volume, freschezza e gusto polacco al piatto.',
    imageAssetId: 'img_mizeria', baseServings: 1,
    ingredients: [
      { ingredientId: 'cucumber', quantityPerServing: 180, unit: 'g', critical: true },
      { ingredientId: 'greek_yogurt', quantityPerServing: 80, unit: 'g', critical: true },
      { ingredientId: 'dill', quantityPerServing: 5, unit: 'g' }
    ],
    cookingTimeMin: 10, difficulty: 'easy', mealType: 'salad',
    tags: ['vegetarian', 'low_calorie', 'quick', 'source_protein_candidate'], flavourFamilies: ['fresh', 'dill', 'sour_dairy'], batchFriendly: false, vegetarian: true, vegan: false, traditionalness: 4, polishInspired: false,
    estimatedNutritionPerServing: { kcal: 95, protein: 7, carbs: 10, fat: 3, fibre: 1.5, sodiumMg: 90 }
  },
  {
    id: 'kasza-gryczana-bowl',
    namePl: 'Miska z kaszą gryczaną',
    nameIt: 'Bowl di grano saraceno',
    nameEn: 'Buckwheat groats bowl',
    description: 'Bowl vegetariana con kasza gryczana, cottage cheese/twaróg, cetrioli fermentati, funghi e aneto. Sazia molto e resta vicina ai gusti polacchi.',
    imageAssetId: 'img_kasza_gryczana', baseServings: 1,
    ingredients: [
      { ingredientId: 'buckwheat', quantityPerServing: 70, unit: 'g', critical: true },
      { ingredientId: 'cottage_cheese', quantityPerServing: 120, unit: 'g', critical: true },
      { ingredientId: 'pickled_cucumbers', quantityPerServing: 70, unit: 'g' },
      { ingredientId: 'mushrooms', quantityPerServing: 100, unit: 'g' },
      { ingredientId: 'dill', quantityPerServing: 5, unit: 'g' }
    ],
    cookingTimeMin: 25, difficulty: 'easy', mealType: 'bowl',
    tags: ['vegetarian', 'high_satiety', 'fermented', 'source_protein_candidate'], flavourFamilies: ['nutty', 'sour', 'mushroom', 'dill'], batchFriendly: true, vegetarian: true, vegan: false, traditionalness: 3, polishInspired: true,
    estimatedNutritionPerServing: { kcal: 430, protein: 26, carbs: 67, fat: 7, fibre: 9, sodiumMg: 760 }
  },
  {
    id: 'zupa-ogorkowa-light',
    namePl: 'Zupa ogórkowa lżejsza',
    nameIt: 'Zuppa di cetrioli fermentati',
    nameEn: 'Light sour cucumber soup',
    description: 'Zuppa acida e salata a base di ogórki kiszone, patate e verdure. Versione leggera con yogurt invece di panna pesante.',
    imageAssetId: 'img_zupa_ogorkowa', baseServings: 1,
    ingredients: [
      { ingredientId: 'pickled_cucumbers', quantityPerServing: 110, unit: 'g', critical: true },
      { ingredientId: 'potatoes', quantityPerServing: 120, unit: 'g' },
      { ingredientId: 'carrots', quantityPerServing: 50, unit: 'g' },
      { ingredientId: 'greek_yogurt', quantityPerServing: 40, unit: 'g' },
      { ingredientId: 'dill', quantityPerServing: 5, unit: 'g' }
    ],
    cookingTimeMin: 30, difficulty: 'easy', mealType: 'soup',
    tags: ['soup', 'vegetarian', 'fermented', 'budget'], flavourFamilies: ['sour', 'fermented', 'dill', 'potato'], batchFriendly: true, vegetarian: true, vegan: false, traditionalness: 5, polishInspired: false,
    estimatedNutritionPerServing: { kcal: 210, protein: 7, carbs: 38, fat: 3, fibre: 5, sodiumMg: 950 }
  },
  {
    id: 'placki-ziemniaczane-baked',
    namePl: 'Placki ziemniaczane pieczone',
    nameIt: 'Placki di patate al forno',
    nameEn: 'Baked potato pancakes',
    description: 'Frittelle di patate reinterpretate: meno olio, cottura al forno e accompagnamento con yogurt. Non sono ipocaloriche in assoluto, ma più controllabili della versione fritta.',
    imageAssetId: 'img_placki', baseServings: 1,
    ingredients: [
      { ingredientId: 'potatoes', quantityPerServing: 250, unit: 'g', critical: true },
      { ingredientId: 'eggs', quantityPerServing: 0.5, unit: 'unit', critical: true },
      { ingredientId: 'wheat_flour', quantityPerServing: 20, unit: 'g' },
      { ingredientId: 'onions', quantityPerServing: 40, unit: 'g' },
      { ingredientId: 'greek_yogurt', quantityPerServing: 70, unit: 'g' },
      { ingredientId: 'oil', quantityPerServing: 5, unit: 'ml' }
    ],
    cookingTimeMin: 35, difficulty: 'easy', mealType: 'side',
    tags: ['traditional_rebalanced', 'vegetarian', 'comfort_controlled'], flavourFamilies: ['potato', 'crispy', 'sour_dairy'], batchFriendly: false, vegetarian: true, vegan: false, traditionalness: 5, polishInspired: false,
    estimatedNutritionPerServing: { kcal: 360, protein: 13, carbs: 58, fat: 10, fibre: 6, sodiumMg: 300 }
  },
  {
    id: 'krupnik-high-fibre',
    namePl: 'Krupnik z kaszą',
    nameIt: 'Krupnik ricco di fibre',
    nameEn: 'Pearl barley soup',
    description: 'Zuppa saziante con orzo perlato, verdure e funghi. Buona per batch cooking e per aumentare fibre e volume del pasto.',
    imageAssetId: 'img_krupnik', baseServings: 1,
    ingredients: [
      { ingredientId: 'pearl_barley', quantityPerServing: 55, unit: 'g', critical: true },
      { ingredientId: 'carrots', quantityPerServing: 70, unit: 'g' },
      { ingredientId: 'potatoes', quantityPerServing: 80, unit: 'g' },
      { ingredientId: 'mushrooms', quantityPerServing: 70, unit: 'g' },
      { ingredientId: 'onions', quantityPerServing: 35, unit: 'g' }
    ],
    cookingTimeMin: 45, difficulty: 'easy', mealType: 'soup',
    tags: ['traditional', 'vegetarian', 'high_fibre_candidate', 'budget', 'batch'], flavourFamilies: ['grain', 'mushroom', 'broth'], batchFriendly: true, vegetarian: true, vegan: true, traditionalness: 4, polishInspired: false,
    estimatedNutritionPerServing: { kcal: 300, protein: 10, carbs: 63, fat: 2, fibre: 10, sodiumMg: 420 }
  },
  {
    id: 'rosol-protein',
    namePl: 'Rosół białkowy',
    nameIt: 'Rosół proteico',
    nameEn: 'Protein-focused Polish broth',
    description: 'Brodo stile rosół con più pollo e verdure, meno pasta. Utile quando si vuole un pasto leggero, caldo e proteico.',
    imageAssetId: 'img_rosol', baseServings: 1,
    ingredients: [
      { ingredientId: 'chicken_breast', quantityPerServing: 150, unit: 'g', critical: true },
      { ingredientId: 'carrots', quantityPerServing: 70, unit: 'g' },
      { ingredientId: 'leek', quantityPerServing: 40, unit: 'g' },
      { ingredientId: 'celeriac', quantityPerServing: 40, unit: 'g' },
      { ingredientId: 'dill', quantityPerServing: 5, unit: 'g' }
    ],
    cookingTimeMin: 45, difficulty: 'easy', mealType: 'soup',
    tags: ['polish_inspired', 'high_protein_candidate', 'low_calorie', 'soup'], flavourFamilies: ['broth', 'chicken', 'root_veg'], batchFriendly: true, vegetarian: false, vegan: false, traditionalness: 4, polishInspired: true,
    estimatedNutritionPerServing: { kcal: 260, protein: 38, carbs: 12, fat: 6, fibre: 4, sodiumMg: 500 }
  },
  {
    id: 'chlodnik-protein',
    namePl: 'Chłodnik proteinowy',
    nameIt: 'Chłodnik proteico',
    nameEn: 'Protein cold beet kefir soup',
    description: 'Zuppa fredda rosa con barbabietola, kefir/yogurt, cetriolo e aneto. Fresca, acida e adatta a chi cerca volume con calorie moderate.',
    imageAssetId: 'img_chlodnik', baseServings: 1,
    ingredients: [
      { ingredientId: 'beetroot', quantityPerServing: 120, unit: 'g', critical: true },
      { ingredientId: 'kefir', quantityPerServing: 200, unit: 'ml', critical: true },
      { ingredientId: 'greek_yogurt', quantityPerServing: 100, unit: 'g' },
      { ingredientId: 'cucumber', quantityPerServing: 80, unit: 'g' },
      { ingredientId: 'dill', quantityPerServing: 5, unit: 'g' }
    ],
    cookingTimeMin: 15, difficulty: 'easy', mealType: 'soup',
    tags: ['vegetarian', 'fermented', 'quick', 'source_protein_candidate'], flavourFamilies: ['sour_dairy', 'beetroot', 'fresh', 'dill'], batchFriendly: false, vegetarian: true, vegan: false, traditionalness: 4, polishInspired: false,
    estimatedNutritionPerServing: { kcal: 250, protein: 19, carbs: 30, fat: 6, fibre: 5, sodiumMg: 280 }
  },
  {
    id: 'turkey-bigos-bowl',
    namePl: 'Miska bigos z indykiem',
    nameIt: 'Bowl bigos con tacchino',
    nameEn: 'Turkey bigos bowl',
    description: 'Ricetta ispirata al bigos: crauti, cavolo, funghi e tacchino macinato. Più proteica e più prevedibile della versione tradizionale.',
    imageAssetId: 'img_bigos', baseServings: 1,
    ingredients: [
      { ingredientId: 'turkey_mince', quantityPerServing: 130, unit: 'g', critical: true },
      { ingredientId: 'sauerkraut', quantityPerServing: 130, unit: 'g', critical: true },
      { ingredientId: 'cabbage', quantityPerServing: 160, unit: 'g' },
      { ingredientId: 'mushrooms', quantityPerServing: 80, unit: 'g' },
      { ingredientId: 'onions', quantityPerServing: 40, unit: 'g' }
    ],
    cookingTimeMin: 35, difficulty: 'easy', mealType: 'bowl',
    tags: ['polish_inspired', 'high_protein_candidate', 'fermented', 'batch'], flavourFamilies: ['sour', 'cabbage', 'mushroom', 'lean_meat'], batchFriendly: true, vegetarian: false, vegan: false, traditionalness: 3, polishInspired: true,
    estimatedNutritionPerServing: { kcal: 330, protein: 35, carbs: 24, fat: 11, fibre: 9, sodiumMg: 1050 }
  },
  {
    id: 'kasza-mushroom-turkey-skillet',
    namePl: 'Kasza z grzybami i indykiem',
    nameIt: 'Padellata kasza, funghi e tacchino',
    nameEn: 'Buckwheat mushroom turkey skillet',
    description: 'Piatto unico con grano saraceno, funghi, cipolla e tacchino. Gusto polacco-terroso, alta sazietà e proteine solide.',
    imageAssetId: 'img_kasza_gryczana', baseServings: 1,
    ingredients: [
      { ingredientId: 'buckwheat', quantityPerServing: 65, unit: 'g', critical: true },
      { ingredientId: 'turkey_mince', quantityPerServing: 110, unit: 'g', critical: true },
      { ingredientId: 'mushrooms', quantityPerServing: 130, unit: 'g' },
      { ingredientId: 'onions', quantityPerServing: 40, unit: 'g' },
      { ingredientId: 'pickled_cucumbers', quantityPerServing: 50, unit: 'g', optional: true }
    ],
    cookingTimeMin: 30, difficulty: 'easy', mealType: 'main',
    tags: ['polish_inspired', 'high_protein_candidate', 'high_satiety', 'batch'], flavourFamilies: ['nutty', 'mushroom', 'sour', 'lean_meat'], batchFriendly: true, vegetarian: false, vegan: false, traditionalness: 3, polishInspired: true,
    estimatedNutritionPerServing: { kcal: 500, protein: 39, carbs: 58, fat: 12, fibre: 9, sodiumMg: 630 }
  },
  {
    id: 'dill-pickle-chicken-salad',
    namePl: 'Sałatka z kurczakiem i ogórkami kiszonymi',
    nameIt: 'Insalata pollo, ogórki e aneto',
    nameEn: 'Dill pickle chicken salad',
    description: 'Insalata fredda molto pratica: pollo, cetrioli fermentati, yogurt, aneto e croccantezza di cetriolo o ravanello. Profilo acido-cremoso familiare per gusti polacchi.',
    imageAssetId: 'img_ogorki_kiszone', baseServings: 1,
    ingredients: [
      { ingredientId: 'chicken_breast', quantityPerServing: 150, unit: 'g', critical: true },
      { ingredientId: 'pickled_cucumbers', quantityPerServing: 90, unit: 'g', critical: true },
      { ingredientId: 'greek_yogurt', quantityPerServing: 90, unit: 'g' },
      { ingredientId: 'cucumber', quantityPerServing: 100, unit: 'g' },
      { ingredientId: 'dill', quantityPerServing: 6, unit: 'g' }
    ],
    cookingTimeMin: 20, difficulty: 'easy', mealType: 'salad',
    tags: ['polish_inspired', 'high_protein_candidate', 'quick', 'fermented'], flavourFamilies: ['sour', 'dill', 'chicken', 'fresh'], batchFriendly: true, vegetarian: false, vegan: false, traditionalness: 2, polishInspired: true,
    estimatedNutritionPerServing: { kcal: 290, protein: 43, carbs: 13, fat: 7, fibre: 3, sodiumMg: 860 }
  },
  {
    id: 'twarog-cucumber-protein-bowl',
    namePl: 'Twaróg z ogórkiem i koperkiem',
    nameIt: 'Bowl proteica twaróg e cetriolo',
    nameEn: 'Twarog cucumber protein bowl',
    description: 'Bowl fredda vegetariana con cottage cheese/twaróg, cetriolo, ravanelli e aneto. È vicina a una colazione/cena leggera polacca, ma costruita come bowl proteica.',
    imageAssetId: 'img_twarog', baseServings: 1,
    ingredients: [
      { ingredientId: 'cottage_cheese', quantityPerServing: 220, unit: 'g', critical: true },
      { ingredientId: 'cucumber', quantityPerServing: 140, unit: 'g' },
      { ingredientId: 'radish', quantityPerServing: 80, unit: 'g' },
      { ingredientId: 'dill', quantityPerServing: 6, unit: 'g' },
      { ingredientId: 'pickled_cucumbers', quantityPerServing: 50, unit: 'g', optional: true }
    ],
    cookingTimeMin: 10, difficulty: 'easy', mealType: 'bowl',
    tags: ['polish_inspired', 'vegetarian', 'high_protein_candidate', 'quick', 'low_calorie'], flavourFamilies: ['fresh', 'sour_dairy', 'dill'], batchFriendly: false, vegetarian: true, vegan: false, traditionalness: 3, polishInspired: true,
    estimatedNutritionPerServing: { kcal: 220, protein: 24, carbs: 18, fat: 5, fibre: 3, sodiumMg: 620 }
  },
  {
    id: 'barszcz-bean-bowl',
    namePl: 'Miska buraczana z fasolą',
    nameIt: 'Bowl barbabietola e fagioli',
    nameEn: 'Beetroot bean bowl',
    description: 'Ispirata al barszcz, ma trasformata in piatto unico vegetariano: barbabietola, fagioli, yogurt opzionale e aneto.',
    imageAssetId: 'img_barszcz', baseServings: 1,
    ingredients: [
      { ingredientId: 'beetroot', quantityPerServing: 180, unit: 'g', critical: true },
      { ingredientId: 'beans', quantityPerServing: 150, unit: 'g', critical: true },
      { ingredientId: 'greek_yogurt', quantityPerServing: 80, unit: 'g', optional: true },
      { ingredientId: 'dill', quantityPerServing: 6, unit: 'g' },
      { ingredientId: 'pickled_cucumbers', quantityPerServing: 60, unit: 'g' }
    ],
    cookingTimeMin: 20, difficulty: 'easy', mealType: 'bowl',
    tags: ['polish_inspired', 'vegetarian', 'high_fibre_candidate', 'budget'], flavourFamilies: ['beetroot', 'sour', 'legume', 'dill'], batchFriendly: true, vegetarian: true, vegan: false, traditionalness: 2, polishInspired: true,
    estimatedNutritionPerServing: { kcal: 340, protein: 20, carbs: 56, fat: 5, fibre: 16, sodiumMg: 730 }
  },
  {
    id: 'sauerkraut-lentil-stew',
    namePl: 'Gulasz z kapusty kiszonej i soczewicy',
    nameIt: 'Stufato crauti e lenticchie',
    nameEn: 'Sauerkraut lentil stew',
    description: 'Stufato vegetariano con crauti, cavolo e lenticchie. Usa il gusto acido del bigos, ma sposta proteine e fibre su legumi economici.',
    imageAssetId: 'img_sauerkraut', baseServings: 1,
    ingredients: [
      { ingredientId: 'sauerkraut', quantityPerServing: 150, unit: 'g', critical: true },
      { ingredientId: 'lentils', quantityPerServing: 130, unit: 'g', critical: true },
      { ingredientId: 'cabbage', quantityPerServing: 100, unit: 'g' },
      { ingredientId: 'mushrooms', quantityPerServing: 80, unit: 'g' },
      { ingredientId: 'onions', quantityPerServing: 40, unit: 'g' }
    ],
    cookingTimeMin: 35, difficulty: 'easy', mealType: 'stew',
    tags: ['polish_inspired', 'vegetarian', 'vegan', 'high_fibre_candidate', 'budget', 'fermented'], flavourFamilies: ['sour', 'fermented', 'legume', 'mushroom'], batchFriendly: true, vegetarian: true, vegan: true, traditionalness: 2, polishInspired: true,
    estimatedNutritionPerServing: { kcal: 320, protein: 20, carbs: 54, fat: 3, fibre: 18, sodiumMg: 1000 }
  },
  {
    id: 'deconstructed-pierogi-bowl',
    namePl: 'Miska pierogowa',
    nameIt: 'Bowl “pierogi” destrutturata',
    nameEn: 'Deconstructed pierogi bowl',
    description: 'Stessi segnali gustativi dei pierogi ruskie — patate, twaróg/cottage cheese, cipolla — senza impasto. Riduce tempo e migliora controllo porzioni.',
    imageAssetId: 'img_pierogi_ruskie', baseServings: 1,
    ingredients: [
      { ingredientId: 'potatoes', quantityPerServing: 220, unit: 'g', critical: true },
      { ingredientId: 'cottage_cheese', quantityPerServing: 160, unit: 'g', critical: true },
      { ingredientId: 'onions', quantityPerServing: 50, unit: 'g' },
      { ingredientId: 'greek_yogurt', quantityPerServing: 60, unit: 'g' },
      { ingredientId: 'dill', quantityPerServing: 5, unit: 'g' }
    ],
    cookingTimeMin: 25, difficulty: 'easy', mealType: 'bowl',
    tags: ['polish_inspired', 'vegetarian', 'comfort_controlled', 'source_protein_candidate'], flavourFamilies: ['potato', 'dairy', 'onion', 'comfort'], batchFriendly: true, vegetarian: true, vegan: false, traditionalness: 3, polishInspired: true,
    estimatedNutritionPerServing: { kcal: 360, protein: 25, carbs: 50, fat: 6, fibre: 6, sodiumMg: 470 }
  },
  {
    id: 'kefir-berry-buckwheat-breakfast',
    namePl: 'Kefir z kaszą i owocami',
    nameIt: 'Colazione kefir, frutti di bosco e grano saraceno',
    nameEn: 'Kefir berry buckwheat breakfast',
    description: 'Colazione fredda ispirata a kefir, kasza e frutti di bosco: acida, saziante e ricca di fibre. Non tradizionale in forma bowl, ma coerente con ingredienti familiari.',
    imageAssetId: 'img_kefir', baseServings: 1,
    ingredients: [
      { ingredientId: 'kefir', quantityPerServing: 220, unit: 'ml', critical: true },
      { ingredientId: 'buckwheat', quantityPerServing: 45, unit: 'g', critical: true },
      { ingredientId: 'berries', quantityPerServing: 120, unit: 'g' },
      { ingredientId: 'oats', quantityPerServing: 20, unit: 'g', optional: true }
    ],
    cookingTimeMin: 10, difficulty: 'easy', mealType: 'breakfast',
    tags: ['polish_inspired', 'vegetarian', 'breakfast', 'fermented', 'high_fibre_candidate'], flavourFamilies: ['sour_dairy', 'fruit', 'grain', 'nutty'], batchFriendly: false, vegetarian: true, vegan: false, traditionalness: 2, polishInspired: true,
    estimatedNutritionPerServing: { kcal: 390, protein: 18, carbs: 68, fat: 7, fibre: 10, sodiumMg: 160 }
  }
];

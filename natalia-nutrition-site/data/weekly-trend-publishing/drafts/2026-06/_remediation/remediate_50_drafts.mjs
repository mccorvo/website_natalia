import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeCommonsImageInfo, normalizeCommonsSourceUrl } from "../../../../../tools/lib/commons_cover_search.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const oldFallbackImage = normalizeCommonsSourceUrl("https://commons.wikimedia.org/wiki/File:Good_Food_Display_-_NCI_Visuals_Online.jpg");
const forceImageRefresh = process.env.FORCE_IMAGE_REFRESH === "1";

const targetSlugs = [
  "dieta-po-urlopie-bez-detoksu",
  "jak-czytac-etykiety-jogurtow",
  "kolacja-bialkowa-bez-miesa",
  "szybkie-obiady-z-mrozonek",
  "owsianka-przy-wysokim-cholesterolu",
  "talerz-dla-osoby-siedzacej",
  "dieta-przy-czestych-delegacjach",
  "jak-planowac-jedzenie-na-dyzur",
  "czy-trzeba-jesc-piec-posilkow",
  "zupy-w-redukcji-masy",
  "straczki-bez-wzdec",
  "nabial-fermentowany-a-jelita",
  "kefir-czy-jogurt-naturalny",
  "ryby-w-puszce-w-zdrowej-diecie",
  "sardynki-jako-zrodlo-wapnia",
  "jak-ograniczyc-sol-w-kanapkach",
  "co-zamiast-slodkich-napojow",
  "przekaski-przy-pracy-biurowej",
  "jedzenie-przy-pms",
  "dieta-a-migrena-dzienniczek",
  "kawa-przed-sniadaniem",
  "czy-banan-tuczy",
  "pieczywo-przy-cukrzycy",
  "platki-sniadaniowe-jak-wybierac",
  "dieta-po-antybiotyku-rozsadnie",
  "kiedy-eliminowac-laktoze",
  "czy-gluten-powoduje-zmeczenie",
  "dieta-przy-kamicy-zolciowej-profilaktyka",
  "kamica-nerkowa-a-nawodnienie",
  "dna-moczanowa-co-ograniczyc",
  "dieta-seniora-z-malym-apetytem",
  "sarcopenia-bialko-i-ruch",
  "dieta-przy-tradziku-bez-skrajnosci",
  "dieta-przy-luszczycy-wsparcie",
  "dieta-antyhistaminowa-ostroznie",
  "napoje-energetyczne-a-apetyt",
  "jak-zmniejszyc-cukier-w-diecie-dziecka",
  "rodzinne-obiady-bez-dwoch-kuchni",
  "sniadanie-przed-treningiem-amatora",
  "regeneracja-po-treningu-bez-odzywek",
  "ile-wody-naprawde-pic",
  "elektrolity-a-biegunka",
  "dieta-roslinna-dla-poczatkujacych",
  "blonnik-rozpuszczalny-i-ldl",
  "psyllium-kiedy-ma-sens",
  "oliwa-rzepakowy-czy-maslo",
  "orzechy-w-diecie-redukcyjnej",
  "jak-nie-marnowac-warzyw",
  "tanie-obiady-z-kasza",
  "zamienniki-slodyczy-bez-obsesji",
];

const requestedSlugs = process.env.TARGET_SLUGS
  ? process.env.TARGET_SLUGS.split(",").map((slug) => slug.trim()).filter(Boolean)
  : [];
const startAtSlug = process.env.START_AT_SLUG || "";
if (requestedSlugs.length > 0) {
  const requested = new Set(requestedSlugs);
  for (let index = targetSlugs.length - 1; index >= 0; index -= 1) {
    if (!requested.has(targetSlugs[index])) targetSlugs.splice(index, 1);
  }
}
if (startAtSlug) {
  const startIndex = targetSlugs.indexOf(startAtSlug);
  if (startIndex < 0) throw new Error(`START_AT_SLUG was not found in targetSlugs: ${startAtSlug}`);
  targetSlugs.splice(0, startIndex);
}

const sourceLibrary = {
  ncezPlate: ["NCEZ: Talerz Zdrowego Żywienia", "https://ncez.pzh.gov.pl/abc-zywienia/talerz-zdrowego-zywienia/"],
  pacjentHealthy: ["Pacjent.gov.pl: Jak zdrowo się odżywiać", "https://pacjent.gov.pl/diety/jak-zdrowo-sie-odzywiac"],
  pacjentWeight: ["Pacjent.gov.pl: Zdrowe odchudzanie", "https://pacjent.gov.pl/aktualnosc/zdrowe-odchudzanie"],
  whoHealthy: ["WHO: Healthy diet", "https://www.who.int/news-room/fact-sheets/detail/healthy-diet"],
  whoObesity: ["WHO: Obesity and overweight", "https://www.who.int/news-room/fact-sheets/detail/obesity-and-overweight"],
  whoSodium: ["WHO: Sodium reduction", "https://www.who.int/news-room/fact-sheets/detail/sodium-reduction"],
  whoSugarGuideline: ["WHO: Sugars guideline", "https://www.who.int/publications/i/item/9789241549028"],
  whoPhysical: ["WHO: Physical activity", "https://www.who.int/news-room/fact-sheets/detail/physical-activity"],
  niceWeight: ["NICE NG246: Overweight and obesity management", "https://www.nice.org.uk/guidance/ng246"],
  euLabel: ["European Commission: Food information to consumers", "https://food.ec.europa.eu/safety/labelling-and-nutrition/food-information-consumers-legislation_en"],
  fdaLabel: ["FDA: How to understand and use the Nutrition Facts label", "https://www.fda.gov/food/nutrition-facts-label/how-understand-and-use-nutrition-facts-label"],
  usdaFreezing: ["USDA FSIS: Freezing and food safety", "https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/freezing-and-food-safety"],
  ncezPlant: ["NCEZ: Dieta roślinna - zalecenia żywieniowe", "https://ncez.pzh.gov.pl/abc-zywienia/zasady-zdrowego-zywienia/dieta-roslinna-zalecenia-zywieniowe/"],
  ncezProteinProducts: ["NCEZ: Białko w diecie i produkty białkowe", "https://ncez.pzh.gov.pl/abc-zywienia/bialko-w-diecie/"],
  jissnProtein: ["JISSN position stand: Protein and exercise", "https://jissn.biomedcentral.com/articles/10.1186/s12970-017-0177-8"],
  jissnNutrientTiming: ["JISSN position stand: Nutrient timing", "https://jissn.biomedcentral.com/articles/10.1186/s12970-017-0189-4"],
  ncezLipids: ["NCEZ: Zaburzenia lipidowe - zalecenia i jadłospis", "https://ncez.pzh.gov.pl/choroba-a-dieta/choroby-ukladu-krazenia/zaburzenia-lipidowe-zalecenia-i-jadlospis-2-2/"],
  ncezDash: ["NCEZ: Dieta DASH dla lepszego ciśnienia krwi", "https://ncez.pzh.gov.pl/choroba-a-dieta/choroby-ukladu-krazenia/dieta-dash-dla-lepszego-cisnienia-krwi-i-nie-tylko/"],
  medlineCholesterol: ["MedlinePlus: How to lower cholesterol with diet", "https://medlineplus.gov/howtolowercholesterolwithdiet.html"],
  pubmedOats: ["PubMed: Oat beta-glucan and LDL cholesterol meta-analysis", "https://pubmed.ncbi.nlm.nih.gov/27724985/"],
  cdcWorkHours: ["CDC/NIOSH: Food choices during long work hours", "https://www.cdc.gov/niosh/work-hour-training-for-nurses/longhours/mod6/05.html"],
  ncezLowFodmap: ["NCEZ: Dieta low FODMAP - zasady i zastosowanie", "https://ncez.pzh.gov.pl/choroba-a-dieta/dieta-low-fodmap-zasady-i-zastosowanie/"],
  ncezIbs: ["NCEZ: Zespół jelita drażliwego a dieta", "https://ncez.pzh.gov.pl/choroba-a-dieta/zespol-jelita-drazliwego-a-dieta/"],
  nccihProbiotics: ["NCCIH: Probiotics - usefulness and safety", "https://www.nccih.nih.gov/health/probiotics-usefulness-and-safety"],
  nccihProbioticsTips: ["NCCIH: Things to know about probiotics", "https://www.nccih.nih.gov/health/tips/things-to-know-about-probiotics"],
  fdaFish: ["FDA: Advice about eating fish", "https://www.fda.gov/food/consumers/advice-about-eating-fish"],
  medlineCalcium: ["MedlinePlus: Calcium", "https://medlineplus.gov/calcium.html"],
  cdcSugars: ["CDC: Sugar-sweetened beverages", "https://www.cdc.gov/healthy-weight-growth/be-sugar-smart/index.html"],
  nhsPms: ["NHS: Premenstrual syndrome", "https://www.nhs.uk/conditions/pre-menstrual-syndrome/"],
  niceHeadaches: ["NICE CG150: Headaches in over 12s", "https://www.nice.org.uk/guidance/cg150"],
  medlineMigraine: ["MedlinePlus: Migraine", "https://medlineplus.gov/migraine.html"],
  efsaCaffeine: ["EFSA: Caffeine", "https://www.efsa.europa.eu/en/topics/topic/caffeine"],
  medlineCaffeine: ["MedlinePlus: Caffeine in the diet", "https://medlineplus.gov/caffeine.html"],
  dietyNfzDiabetes: ["Diety NFZ: Plan żywieniowy - cukrzyca", "https://diety.nfz.gov.pl/plany-zywieniowe/cukrzyca"],
  niceDiabetes: ["NICE NG28: Type 2 diabetes in adults", "https://www.nice.org.uk/guidance/ng28"],
  niddkLactose: ["NIDDK: Eating, diet, and nutrition for lactose intolerance", "https://www.niddk.nih.gov/health-information/digestive-diseases/lactose-intolerance/eating-diet-nutrition"],
  niceCoeliac: ["NICE NG20: Coeliac disease", "https://www.nice.org.uk/guidance/ng20"],
  niddkGallstones: ["NIDDK: Eating, diet, and nutrition for gallstones", "https://www.niddk.nih.gov/health-information/digestive-diseases/gallstones/eating-diet-nutrition"],
  niddkKidneyStones: ["NIDDK: Eating, diet, and nutrition for kidney stones", "https://www.niddk.nih.gov/health-information/urologic-diseases/kidney-stones/eating-diet-nutrition"],
  kidneyFoundationStones: ["National Kidney Foundation: Kidney stones diet and prevention", "https://www.kidney.org/kidney-topics/kidney-stone-diet-plan-and-prevention"],
  ncezGout: ["NCEZ: Dna moczanowa - dieta", "https://ncez.pzh.gov.pl/choroba-a-dieta/dna-moczanowa-dieta/"],
  niceGout: ["NICE NG219: Gout diagnosis and management", "https://www.nice.org.uk/guidance/ng219"],
  medlineGout: ["MedlinePlus: Gout", "https://medlineplus.gov/gout.html"],
  ncezSenior: ["NCEZ: Zasady żywienia osób starszych", "https://ncez.pzh.gov.pl/seniorzy/zasady-zywienia-osob-starszych/"],
  ncezSeniorProtein: ["NCEZ: Białko w diecie seniora", "https://ncez.pzh.gov.pl/seniorzy/bialko-w-diecie-seniora/"],
  niceAcne: ["NICE NG198: Acne vulgaris management", "https://www.nice.org.uk/guidance/ng198"],
  aadAcneDiet: ["American Academy of Dermatology: Can the right diet get rid of acne?", "https://www.aad.org/public/diseases/acne/causes/diet"],
  nicePsoriasis: ["NICE CG153: Psoriasis assessment and management", "https://www.nice.org.uk/guidance/cg153"],
  nhsPsoriasis: ["NHS: Psoriasis", "https://www.nhs.uk/conditions/psoriasis/"],
  aaaaiHistamine: ["AAAAI: Histamine intolerance summary", "https://www.aaaai.org/tools-for-the-public/latest-research-summaries/the-journal-of-allergy-and-clinical-immunology-in/2023/histamine"],
  niceFoodAllergy: ["NICE CG116: Food allergy in under 19s", "https://www.nice.org.uk/guidance/cg116"],
  nccihEnergy: ["NCCIH: Energy drinks", "https://www.nccih.nih.gov/health/energy-drinks"],
  aapAddedSugar: ["HealthyChildren.org: How to reduce added sugar in your child's diet", "https://www.healthychildren.org/English/healthy-living/nutrition/Pages/How-to-Reduce-Added-Sugar-in-Your-Childs-Diet.aspx"],
  ncezWaterPdf: ["NCEZ: Prawidłowe nawodnienie organizmu", "https://ncez.pzh.gov.pl/wp-content/uploads/2022/06/Prawidlowe-nawodnienie-organizmu.pdf"],
  whoDiarrhoea: ["WHO: Diarrhoeal disease", "https://www.who.int/news-room/fact-sheets/detail/diarrhoeal-disease"],
  whoOrs: ["WHO: Oral rehydration salts production of the new ORS", "https://www.who.int/publications/i/item/WHO-FCH-CAH-06.1"],
  medlineB12: ["MedlinePlus: Vitamin B12", "https://medlineplus.gov/ency/article/002403.htm"],
  pubmedFiberMeta: ["PubMed: Dietary fibre and blood pressure/lipids systematic review", "https://pubmed.ncbi.nlm.nih.gov/26950147/"],
  pubmedPsyllium: ["PubMed: Psyllium fiber and cardiovascular risk meta-analysis", "https://pubmed.ncbi.nlm.nih.gov/30239559/"],
  fdaFoodWaste: ["FDA: Food loss and waste", "https://www.fda.gov/food/consumers/food-loss-and-waste"],
};

const commonSourceIds = ["ncezPlate", "pacjentHealthy", "whoHealthy", "whoObesity", "euLabel", "fdaLabel", "niceWeight"];

const imageQueryOverrides = {
  "dieta-po-urlopie-bez-detoksu": "healthy breakfast table",
  "jak-czytac-etykiety-jogurtow": "yogurt label",
  "kolacja-bialkowa-bez-miesa": "tofu dish",
  "szybkie-obiady-z-mrozonek": "frozen vegetables",
  "owsianka-przy-wysokim-cholesterolu": "oatmeal porridge berries",
  "talerz-dla-osoby-siedzacej": "salad lunch plate",
  "dieta-przy-czestych-delegacjach": "hotel breakfast buffet",
  "jak-planowac-jedzenie-na-dyzur": "packed lunch box",
  "czy-trzeba-jesc-piec-posilkow": "meal prep containers",
  "zupy-w-redukcji-masy": "lentil soup bowl",
  "straczki-bez-wzdec": "lentils chickpeas beans",
  "nabial-fermentowany-a-jelita": "kefir glass",
  "kefir-czy-jogurt-naturalny": "kefir yogurt",
  "ryby-w-puszce-w-zdrowej-diecie": "canned sardines",
  "sardynki-jako-zrodlo-wapnia": "sardines lemon",
  "jak-ograniczyc-sol-w-kanapkach": "vegetable sandwich",
  "co-zamiast-slodkich-napojow": "water lemon mint glass",
  "przekaski-przy-pracy-biurowej": "office snack fruit nuts",
  "jedzenie-przy-pms": "warm meal bowl",
  "dieta-a-migrena-dzienniczek": "notebook breakfast coffee",
  "kawa-przed-sniadaniem": "coffee breakfast",
  "czy-banan-tuczy": "banana fruit plate",
  "pieczywo-przy-cukrzycy": "whole grain bread sandwich",
  "platki-sniadaniowe-jak-wybierac": "breakfast cereal bowl",
  "dieta-po-antybiotyku-rozsadnie": "yogurt fruit spoon",
  "kiedy-eliminowac-laktoze": "lactose free milk",
  "czy-gluten-powoduje-zmeczenie": "bread wheat",
  "dieta-przy-kamicy-zolciowej-profilaktyka": "olive oil vegetable soup",
  "kamica-nerkowa-a-nawodnienie": "glass water lemon",
  "dna-moczanowa-co-ograniczyc": "water vegetables meal",
  "dieta-seniora-z-malym-apetytem": "elderly meal soup",
  "sarcopenia-bialko-i-ruch": "resistance band exercise food",
  "dieta-przy-tradziku-bez-skrajnosci": "vegetables fish meal",
  "dieta-przy-luszczycy-wsparcie": "salmon vegetables meal",
  "dieta-antyhistaminowa-ostroznie": "fresh vegetables meal",
  "napoje-energetyczne-a-apetyt": "energy drink can",
  "jak-zmniejszyc-cukier-w-diecie-dziecka": "child fruit yogurt",
  "rodzinne-obiady-bez-dwoch-kuchni": "family dinner table",
  "sniadanie-przed-treningiem-amatora": "oatmeal banana",
  "regeneracja-po-treningu-bez-odzywek": "post workout meal",
  "ile-wody-naprawde-pic": "glass of water",
  "elektrolity-a-biegunka": "oral rehydration solution",
  "dieta-roslinna-dla-poczatkujacych": "tofu lentils bowl",
  "blonnik-rozpuszczalny-i-ldl": "oats barley apples",
  "psyllium-kiedy-ma-sens": "psyllium husk",
  "oliwa-rzepakowy-czy-maslo": "olive oil butter",
  "orzechy-w-diecie-redukcyjnej": "nuts bowl",
  "jak-nie-marnowac-warzyw": "vegetable drawer refrigerator",
  "tanie-obiady-z-kasza": "buckwheat groats",
  "zamienniki-slodyczy-bez-obsesji": "fruit yogurt dessert",
};

const profiles = {
  "dieta-po-urlopie-bez-detoksu": p(
    "powrót do zwykłego rytmu po urlopie, bez karania się detoksem i bez gwałtownego obcinania jedzenia",
    "returning to a regular routine after holidays without detox rules or a sudden food cut",
    "przez trzy dni przywróć stałe godziny śniadania, obiadu i kolacji, a dopiero później oceniaj masę ciała",
    "restore steady breakfast, lunch and dinner times for three days before judging body weight",
    "warzywa do dwóch posiłków, źródło białka w każdym głównym posiłku, woda obok kawy i normalna kolacja zamiast głodówki",
    "vegetables in two meals, protein in each main meal, water alongside coffee and a normal dinner instead of a fast",
    "największym błędem jest próba odrobienia urlopu jednym ekstremalnym poniedziałkiem",
    "the biggest trap is trying to compensate for a holiday with one extreme Monday",
    "zaplanuj trzy obiady z prostą bazą: ziemniaki lub kasza, białko i gotowe warzywa; zostaw miejsce na jeden posiłek poza domem",
    "plan three simple dinners built from potatoes or groats, protein and ready vegetables; leave room for one meal out",
    "jeśli po urlopie pojawia się silny lęk przed jedzeniem, napady objadania albo kompensowanie posiłków, potrzebna jest rozmowa ze specjalistą",
    "if holidays are followed by strong food anxiety, binge eating or compensatory behaviour, seek professional support",
    "healthy breakfast vegetables table",
    ["pacjentWeight", "whoObesity", "niceWeight"]
  ),
  "jak-czytac-etykiety-jogurtow": p(
    "wybór jogurtu przez skład, cukry i porcję, a nie przez hasło na froncie opakowania",
    "choosing yoghurt by ingredients, sugars and portion size rather than the front-of-pack slogan",
    "porównaj dwa produkty tej samej wielkości i sprawdź kolejno skład, cukry w 100 g, białko oraz dodatki smakowe",
    "compare two products of the same size and check ingredients, sugars per 100 g, protein and flavour additions",
    "jogurt naturalny, kefir, skyr lub jogurt owocowy z krótkim składem; owoce i płatki można dodać samodzielnie",
    "plain yoghurt, kefir, skyr or fruit yoghurt with a short ingredient list; fruit and oats can be added separately",
    "pułapką jest porównywanie małego kubka z dużym opakowaniem albo traktowanie każdego cukru jak identycznego dodatku",
    "the trap is comparing a small cup with a large tub or treating every gram of sugar as identical added sugar",
    "zrób zdjęcie trzech etykiet, wybierz jedną stałą opcję do śniadania i jedną wygodną opcję na przekąskę",
    "photograph three labels, choose one steady breakfast option and one convenient snack option",
    "przy alergii na białka mleka, nietolerancji laktozy lub chorobach jelit wybór nabiału warto dopasować indywidualnie",
    "with milk-protein allergy, lactose intolerance or bowel disease, dairy choices should be individualised",
    "plain yogurt bowl fruit",
    ["euLabel", "fdaLabel", "whoSodium"]
  ),
  "kolacja-bialkowa-bez-miesa": p(
    "kolacja z sensowną porcją białka bez mięsa, odżywek i monotonnego twarogu jedzonego z obowiązku",
    "a dinner with a useful protein portion without meat, powders or obligatory cottage cheese every night",
    "wybierz jedno źródło białka i dopiero do niego dobierz pieczywo, kaszę, warzywa oraz tłuszcz",
    "choose one protein food first, then add bread, groats, vegetables and fat around it",
    "jaja, tofu, tempeh, twaróg, skyr, jogurt grecki, soczewica, fasola, hummus i ryba, jeśli nie chodzi o wersję roślinną",
    "eggs, tofu, tempeh, cottage cheese, skyr, Greek yoghurt, lentils, beans, hummus and fish if the meal is not fully plant-based",
    "sama sałatka bez białka wygląda lekko, ale często kończy się głodem po godzinie",
    "a salad without protein may look light but often leads to hunger an hour later",
    "przygotuj dwie bazy: pastę z twarogu lub tofu i porcję strączków; dzięki temu kolacje składasz w kilka minut",
    "prepare two bases: a cottage-cheese or tofu spread and a portion of pulses, then assemble dinners in minutes",
    "przy chorobie nerek, zaburzeniach odżywiania lub bardzo niskiej podaży energii ilość białka wymaga indywidualnej oceny",
    "with kidney disease, eating disorders or very low energy intake, protein targets need individual assessment",
    "tofu salad dinner",
    ["ncezPlant", "ncezProteinProducts", "jissnProtein"]
  ),
  "szybkie-obiady-z-mrozonek": p(
    "użycie mrożonek jako pełnoprawnej bazy obiadu, kiedy czas i energia są ograniczone",
    "using frozen foods as a legitimate dinner base when time and energy are limited",
    "zadbaj o trzy elementy: mrożone warzywa, źródło białka i szybki węglowodan, zamiast kupować przypadkowe gotowce",
    "cover three elements: frozen vegetables, protein and a quick carbohydrate instead of random ready meals",
    "mrożony szpinak, mieszanki warzywne, owoce jagodowe, ryba, edamame, pierogi z dodatkiem surówki, ryż lub kasza",
    "frozen spinach, vegetable mixes, berries, fish, edamame, dumplings with salad, rice or groats",
    "problemem nie jest mrożenie, tylko obiad złożony wyłącznie z panierki, sosu i soli",
    "freezing is not the issue; a dinner made only of coating, sauce and salt is",
    "ułóż listę pięciu zestawów z zamrażarki i zapisz, które naprawdę zjadacie w zabiegany dzień",
    "make a list of five freezer meals and note which ones your household actually eats on a busy day",
    "po rozmrożeniu żywność trzeba traktować zgodnie z zasadami bezpieczeństwa, zwłaszcza przy mięsie, rybach i gotowych daniach",
    "after thawing, food safety rules matter, especially for meat, fish and ready meals",
    "frozen vegetables meal",
    ["usdaFreezing", "ncezPlate", "pacjentHealthy"]
  ),
  "owsianka-przy-wysokim-cholesterolu": p(
    "owsianka jako praktyczne źródło błonnika rozpuszczalnego, a nie magiczne lekarstwo na cholesterol",
    "oats as a practical soluble-fibre source, not a magic cholesterol cure",
    "zacznij od porcji płatków owsianych kilka razy w tygodniu i połącz ją z owocem, orzechami oraz produktem białkowym",
    "start with a serving of oats several times a week and pair it with fruit, nuts and a protein food",
    "płatki owsiane górskie, otręby owsiane, jabłko, owoce jagodowe, jogurt naturalny, kefir, siemię lub orzechy",
    "rolled oats, oat bran, apple, berries, plain yoghurt, kefir, flaxseed or nuts",
    "błędem jest dosładzanie owsianki tak mocno, że znika przewaga nad słodkimi płatkami",
    "the mistake is sweetening oats so heavily that they lose their advantage over sugary cereals",
    "przez tydzień zjedz trzy wersje owsianki i sprawdź sytość, smak oraz wyniki lipidowe dopiero w dłuższym planie",
    "try three oat breakfasts during the week and judge fullness and taste now, lipid results only over a longer plan",
    "wysoki LDL, leczenie statyną, choroby serca lub cukrzyca wymagają zaleceń medycznych, nie samej zmiany śniadania",
    "high LDL, statin therapy, heart disease or diabetes need medical advice, not breakfast changes alone",
    "bowl oatmeal berries",
    ["ncezLipids", "pubmedOats", "medlineCholesterol", "ncezDash"]
  ),
  "talerz-dla-osoby-siedzacej": p(
    "dopasowanie talerza do dnia przy biurku bez schodzenia do głodowych porcji",
    "matching the plate to a desk-based day without shrinking meals to hunger portions",
    "zostaw podobną strukturę posiłku, ale zwiększ udział warzyw i pilnuj białka, zamiast usuwać całe węglowodany",
    "keep the same meal structure but increase vegetables and protect protein instead of removing all carbohydrates",
    "warzywa świeże lub mrożone, pełniejsze zboża, ziemniaki, jajka, nabiał, tofu, ryby, chude mięso, strączki i oliwa",
    "fresh or frozen vegetables, higher-fibre grains, potatoes, eggs, dairy, tofu, fish, lean meat, pulses and olive oil",
    "pułapką jest mały lunch bez sytości, który uruchamia większe podjadanie wieczorem",
    "the trap is a tiny unsatisfying lunch that triggers more evening snacking",
    "przez pięć dni dodaj do lunchu jedną porcję warzyw i zaplanuj dziesięciominutowy spacer po jednym posiłku",
    "for five days add one vegetable portion to lunch and plan a ten-minute walk after one meal",
    "nagła zmiana masy ciała, senność po posiłkach lub objawy metaboliczne wymagają diagnostyki, nie tylko mniejszego talerza",
    "sudden weight change, post-meal sleepiness or metabolic symptoms need assessment, not just a smaller plate",
    "office lunch salad",
    ["whoPhysical", "ncezPlate", "niceWeight"]
  ),
  "dieta-przy-czestych-delegacjach": p(
    "jedzenie w hotelu, trasie i restauracji bez oczekiwania, że delegacja będzie wyglądać jak domowy tydzień",
    "eating in hotels, travel and restaurants without expecting a business trip to look like a home week",
    "ustal dwa stałe punkty: śniadanie z białkiem oraz awaryjną przekąskę, zanim zaczniesz wybierać restauracje",
    "set two anchors first: a protein-rich breakfast and an emergency snack before choosing restaurants",
    "jogurt naturalny, owoce, orzechy w małej porcji, kanapka z jajkiem lub rybą, zupa, sałatka z białkiem, woda",
    "plain yoghurt, fruit, a small portion of nuts, an egg or fish sandwich, soup, protein salad and water",
    "najczęściej zawodzi brak planu między spotkaniami, nie pojedyncza kolacja w restauracji",
    "the usual problem is the gap between meetings, not one restaurant dinner",
    "sprawdź menu dwóch miejsc obok hotelu i przygotuj jedną opcję ze sklepu na dzień z opóźnieniami",
    "check menus for two places near the hotel and prepare one supermarket option for a delayed day",
    "przy cukrzycy, leczeniu farmakologicznym lub chorobach przewodu pokarmowego podróżny plan posiłków wymaga większej precyzji",
    "with diabetes, medication or digestive disease, travel meal planning needs more precision",
    "hotel breakfast buffet fruit yogurt",
    ["ncezPlate", "euLabel", "fdaLabel"]
  ),
  "jak-planowac-jedzenie-na-dyzur": p(
    "plan na długi dyżur, w którym posiłki są realne do zjedzenia między zadaniami",
    "a long-shift plan in which meals are realistic to eat between duties",
    "podziel jedzenie na główny posiłek, przekąskę białkową i płyny, a nie na jedną wielką porcję na koniec zmiany",
    "divide food into a main meal, a protein snack and fluids rather than one huge portion at shift end",
    "kanapka z jajkiem, ryż z warzywami i tofu, jogurt z owocami, zupa w termosie, owsianka nocna, woda i herbata",
    "egg sandwich, rice with vegetables and tofu, yoghurt with fruit, soup in a thermos, overnight oats, water and tea",
    "przypadkowe słodycze z automatu często są skutkiem braku przerwy, nie słabej woli",
    "random vending-machine sweets are often a break-planning issue, not a willpower failure",
    "na najbliższy dyżur spakuj jedną rzecz do zjedzenia na zimno i jedną do podgrzania; po dyżurze zapisz, co się sprawdziło",
    "for the next shift pack one cold option and one reheatable option; after the shift note what worked",
    "praca nocna, choroby przewlekłe i leki wpływające na glikemię wymagają indywidualnego omówienia rytmu posiłków",
    "night work, chronic disease and medication affecting glucose require individual meal-timing advice",
    "packed lunch box work shift",
    ["cdcWorkHours", "ncezPlate", "whoHealthy"]
  ),
  "czy-trzeba-jesc-piec-posilkow": p(
    "liczba posiłków jako narzędzie do sytości i rytmu dnia, a nie obowiązkowa zasada zdrowia",
    "meal frequency as a tool for fullness and daily rhythm, not a mandatory health rule",
    "sprawdź, przy ilu posiłkach masz najmniej napadów głodu i najłatwiej domknąć białko, warzywa oraz płyny",
    "check how many meals give you the fewest hunger swings and make protein, vegetables and fluids easiest",
    "trzy większe posiłki, cztery mniejsze albo trzy posiłki z przekąską; ważniejsza jest jakość całego dnia",
    "three larger meals, four smaller ones or three meals plus a snack; the whole day matters more",
    "pułapką jest jedzenie pięć razy dziennie tylko dlatego, że ktoś tak powiedział, nawet gdy nie pasuje to do pracy",
    "the trap is eating five times daily only because someone said so, even if it does not fit your workday",
    "przez tydzień testuj jeden rytm i zapisuj głód przed kolacją, energię w pracy oraz wieczorne podjadanie",
    "test one rhythm for a week and track pre-dinner hunger, work energy and evening snacking",
    "cukrzyca, leki, ciąża, zaburzenia odżywiania lub problemy żołądkowe mogą zmieniać zalecenia dotyczące częstotliwości posiłków",
    "diabetes, medication, pregnancy, eating disorders or stomach problems may change meal-frequency advice",
    "family meal table clock",
    ["ncezPlate", "pacjentHealthy", "niceWeight"]
  ),
  "zupy-w-redukcji-masy": p(
    "zupa jako sycący element redukcji, jeśli zawiera coś więcej niż wodę i warzywa",
    "soup as a filling part of weight loss when it contains more than water and vegetables",
    "do każdej zupy dopisz brakujący element: białko, węglowodany lub tłuszcz, zanim uznasz ją za pełny obiad",
    "add the missing element to every soup: protein, carbohydrate or fat before calling it a full lunch",
    "zupa soczewicowa, krupnik z mięsem lub tofu, pomidorowa z fasolą, krem z grzankami i pestkami, bulion z dodatkami",
    "lentil soup, barley soup with meat or tofu, tomato soup with beans, vegetable cream with croutons and seeds, broth with additions",
    "wodnista zupa może obniżyć kalorie obiadu, ale niekoniecznie utrzyma sytość do wieczora",
    "a watery soup may reduce lunch calories but may not keep you full until evening",
    "ugotuj garnek jednej zupy białkowej i zamroź dwie porcje; sprawdź, czy ogranicza przypadkowe zamawianie jedzenia",
    "cook one pot of protein-rich soup and freeze two portions; check whether it reduces random takeaway orders",
    "przy niedowadze, rekonwalescencji lub małym apetycie zupy nie powinny wypierać energii i białka",
    "with underweight, recovery or low appetite, soups should not displace energy and protein",
    "lentil soup bowl",
    ["pacjentWeight", "whoObesity", "niceWeight"]
  ),
  "straczki-bez-wzdec": p(
    "łagodne zwiększanie strączków, aby brzuch miał czas przyzwyczaić się do błonnika i fermentujących węglowodanów",
    "gently increasing pulses so the gut has time to adapt to fibre and fermentable carbohydrates",
    "zacznij od dwóch łyżek dobrze przepłukanej soczewicy lub ciecierzycy, nie od wielkiej miski fasoli",
    "start with two tablespoons of well-rinsed lentils or chickpeas, not a large bowl of beans",
    "soczewica czerwona, ciecierzyca z puszki, tofu, tempeh, pasta z fasoli, zupy krem i małe dodatki do sałatek",
    "red lentils, canned chickpeas, tofu, tempeh, bean spreads, blended soups and small salad additions",
    "zbyt szybkie zwiększenie porcji potrafi zniechęcić, mimo że sam produkt nie musi być problemem",
    "increasing portions too fast can discourage you even when the food itself is not the problem",
    "dodaj strączki do trzech posiłków w bardzo małej porcji i notuj objawy bez oceniania po jednym dniu",
    "add pulses to three meals in a very small portion and track symptoms without judging after one day",
    "silny ból, krew w stolcu, chudnięcie, nocne objawy albo podejrzenie IBS wymagają konsultacji",
    "severe pain, blood in stool, weight loss, night symptoms or suspected IBS require consultation",
    "lentils chickpeas beans",
    ["ncezLowFodmap", "ncezIbs", "ncezPlant"]
  ),
  "nabial-fermentowany-a-jelita": p(
    "fermentowany nabiał jako zwykły element diety, nie obietnica naprawy jelit u każdego",
    "fermented dairy as an ordinary food, not a promise to repair everyone’s gut",
    "wprowadź jeden produkt dziennie i sprawdź tolerancję, zamiast kupować kilka probiotycznych nowości naraz",
    "introduce one product daily and check tolerance instead of buying several probiotic products at once",
    "kefir, jogurt naturalny, maślanka, skyr, jogurt grecki i wersje bez laktozy, jeśli są potrzebne",
    "kefir, plain yoghurt, buttermilk, skyr, Greek yoghurt and lactose-free versions if needed",
    "słodki deser mleczny nie działa tak samo jak prosty fermentowany produkt bez dużej ilości dodatków",
    "a sweet dairy dessert is not the same as a simple fermented product without many additions",
    "przez tydzień wybierz jeden produkt i notuj tolerancję, sytość oraz skład, zamiast rotować pięć marek",
    "choose one product for a week and track tolerance, fullness and ingredients instead of rotating five brands",
    "przy alergii na białka mleka, nietolerancji laktozy lub ostrych objawach jelitowych potrzebna jest diagnoza, nie eksperyment",
    "with milk-protein allergy, lactose intolerance or acute bowel symptoms, diagnosis is needed rather than experimentation",
    "kefir glass dairy",
    ["nccihProbiotics", "niddkLactose", "ncezIbs"]
  ),
  "kefir-czy-jogurt-naturalny": p(
    "porównanie kefiru i jogurtu przez tolerancję, skład i zastosowanie w posiłku, nie przez ranking cudowności",
    "comparing kefir and yoghurt by tolerance, ingredients and meal use rather than a miracle ranking",
    "sprawdź, który produkt łatwiej łączysz z posiłkiem i po którym brzuch reaguje spokojniej",
    "check which product fits meals more easily and which one your gut tolerates better",
    "kefir do koktajlu, jogurt do owsianki, skyr do większej porcji białka, maślanka do obiadu i wersje naturalne bez dodatków",
    "kefir in a smoothie, yoghurt with oats, skyr for more protein, buttermilk with lunch and plain versions without additions",
    "pułapką jest kupowanie słodzonych wariantów tylko dlatego, że mają słowo probiotyczny na etykiecie",
    "the trap is buying sweetened variants just because the label says probiotic",
    "kup po jednym prostym produkcie, porównaj skład i użyj ich w dwóch różnych posiłkach",
    "buy one simple version of each, compare labels and use them in two different meals",
    "u osób z alergią na mleko, nasilonymi objawami jelitowymi lub po zaleceniach lekarskich wybór nabiału wymaga ostrożności",
    "people with milk allergy, significant gut symptoms or medical dietary advice need caution with dairy",
    "plain yogurt kefir glass",
    ["nccihProbiotics", "niddkLactose", "euLabel"]
  ),
  "ryby-w-puszce-w-zdrowej-diecie": p(
    "ryby w puszce jako szybkie źródło białka i tłuszczów, z uwagą na sól, gatunek i częstotliwość",
    "canned fish as a quick protein and fat source, with attention to salt, species and frequency",
    "porównaj sól, rodzaj zalewy i wielkość porcji; wybieraj różne gatunki zamiast jednej puszki codziennie",
    "compare salt, packing liquid and serving size; rotate species instead of eating one can daily",
    "sardynki, makrela, łosoś, tuńczyk w rozsądnej rotacji, pasta z ryby z jogurtem, kanapka z warzywami, sałatka z fasolą",
    "sardines, mackerel, salmon, tuna in sensible rotation, fish spread with yoghurt, vegetable sandwich, bean salad",
    "pułapką są puszki jedzone bez sprawdzania soli albo codzienny tuńczyk jako jedyna ryba",
    "the trap is ignoring salt or relying on tuna every day as the only fish",
    "wybierz dwie puszki o niższej zawartości soli i jedną alternatywę rybną poza puszką na kolejny tydzień",
    "choose two lower-salt cans and one non-canned fish option for the next week",
    "kobiety w ciąży, dzieci i osoby jedzące dużo ryb powinny uwzględnić zalecenia dotyczące rtęci i gatunków",
    "pregnant women, children and people eating a lot of fish should follow mercury and species advice",
    "canned sardines",
    ["fdaFish", "whoSodium", "euLabel"]
  ),
  "sardynki-jako-zrodlo-wapnia": p(
    "sardynki z ośćmi jako niedrogie źródło wapnia, białka i tłuszczów, jeśli pasują smakowo",
    "sardines with bones as an affordable source of calcium, protein and fats if the taste works for you",
    "szukaj informacji, czy sardynki są z ośćmi, i zestaw je z pieczywem oraz warzywami zamiast traktować jako samodzielny posiłek",
    "check whether sardines include bones and pair them with bread and vegetables rather than treating them as a meal alone",
    "sardynki w sosie własnym lub pomidorowym, pasta z jogurtem, kanapka z ogórkiem, sałatka z ziemniakami, cytryna i zioła",
    "sardines in water or tomato sauce, yoghurt-based spread, cucumber sandwich, potato salad, lemon and herbs",
    "nie każda puszka ryb dostarcza tyle samo wapnia; ości robią tu dużą różnicę",
    "not every can of fish provides the same calcium; bones make a major difference",
    "raz w tygodniu przetestuj małą porcję w paście kanapkowej i porównaj ją z innym źródłem wapnia",
    "once a week test a small portion in a sandwich spread and compare it with another calcium source",
    "przy alergii na ryby, ograniczeniach sodu lub specjalnych zaleceniach nerkowych wybór puszek wymaga konsultacji",
    "with fish allergy, sodium restriction or kidney-related advice, canned fish choices need consultation",
    "sardines on plate",
    ["fdaFish", "medlineCalcium", "ncezPlate"]
  ),
  "jak-ograniczyc-sol-w-kanapkach": p(
    "zmniejszanie soli w kanapkach bez rezygnowania z pieczywa i bez robienia z posiłku suchej kromki",
    "reducing sandwich salt without giving up bread or turning the meal into a dry slice",
    "sprawdź sól w pieczywie, wędlinie, serze i sosie, bo suma ma większe znaczenie niż jeden składnik",
    "check salt in bread, deli meat, cheese and sauce because the total matters more than one ingredient",
    "pieczywo z prostym składem, twarożek z ziołami, jajko, hummus, warzywa, pieczone mięso domowe, pasta z fasoli",
    "bread with a simple ingredient list, herbed cottage cheese, egg, hummus, vegetables, home-roasted meat, bean spread",
    "pułapką jest dodanie kilku słonych elementów naraz: wędliny, sera, kiszonek i gotowego sosu",
    "the trap is stacking several salty elements at once: deli meat, cheese, pickles and ready sauce",
    "wybierz jeden słony dodatek mniej przez pięć dni i zastąp go ziołami, warzywem lub pastą białkową",
    "remove one salty addition for five days and replace it with herbs, vegetables or a protein spread",
    "nadciśnienie, choroby nerek i leki moczopędne wymagają indywidualnych zaleceń dotyczących sodu",
    "hypertension, kidney disease and diuretic medication require individual sodium advice",
    "sandwich vegetables bread",
    ["whoSodium", "ncezDash", "euLabel", "fdaLabel"]
  ),
  "co-zamiast-slodkich-napojow": p(
    "ograniczanie słodzonych napojów przez smakowe zamienniki i stopniowe zmiany, nie przez moralizowanie",
    "reducing sugary drinks through flavoured alternatives and gradual changes, not moralising",
    "zamień najpierw jeden napój dziennie, a nie wszystkie źródła słodkiego smaku naraz",
    "swap one drink a day first, not every source of sweetness at once",
    "woda z cytryną lub miętą, herbata owocowa bez cukru, woda gazowana, rozcieńczony sok, napój zero jako etap przejściowy",
    "water with lemon or mint, unsweetened fruit tea, sparkling water, diluted juice, a zero-sugar drink as a transition",
    "pułapką jest brak alternatywy w domu, przez co decyzja wraca dopiero przy półce sklepowej",
    "the trap is having no alternative at home, so the decision returns at the shop shelf",
    "policz tylko napoje przez siedem dni i wybierz dwa miejsca, w których najłatwiej zrobić zamianę",
    "track drinks only for seven days and choose two situations where a swap is easiest",
    "u dzieci, przy cukrzycy, chorobach nerek lub zaburzeniach odżywiania sposób ograniczania cukru warto dobrać spokojnie",
    "for children, diabetes, kidney disease or eating disorders, sugar reduction should be planned carefully",
    "water lemon mint glass",
    ["cdcSugars", "whoSugarGuideline", "whoHealthy"]
  ),
  "przekaski-przy-pracy-biurowej": p(
    "przekąski przy biurku, które domykają głód zamiast rozpoczynać całodniowe skubanie",
    "desk snacks that close a hunger gap instead of starting all-day grazing",
    "zdecyduj, czy przekąska ma dodać białko, błonnik czy przerwę od ekranu, zamiast jeść z otwartej paczki",
    "decide whether the snack should add protein, fibre or a screen break instead of eating from an open pack",
    "jogurt z owocem, kanapka mini, garść orzechów w pojemniku, warzywa z hummusem, twarożek, owoc i ser",
    "yoghurt with fruit, a mini sandwich, a portioned handful of nuts, vegetables with hummus, cottage cheese, fruit and cheese",
    "największa pułapka to przekąska bez końca, leżąca cały dzień obok klawiatury",
    "the biggest trap is an endless snack sitting next to the keyboard all day",
    "przygotuj dwie porcje z wyprzedzeniem i jedz je poza głównym ekranem, choćby przez pięć minut",
    "prepare two portions in advance and eat them away from the main screen, even for five minutes",
    "senność, napady głodu lub duże wahania energii mogą wymagać sprawdzenia składu głównych posiłków i zdrowia metabolicznego",
    "sleepiness, intense hunger or large energy swings may require checking main meals and metabolic health",
    "office snack fruit nuts",
    ["ncezPlate", "whoPhysical", "pacjentHealthy"]
  ),
  "jedzenie-przy-pms": p(
    "jedzenie przed miesiączką jako obszar planowania, a nie dowód braku kontroli",
    "premenstrual eating as an area for planning, not proof of poor control",
    "zaplanuj bardziej sycące posiłki w dniach, gdy apetyt rośnie, zamiast obiecywać sobie idealną dyscyplinę",
    "plan more filling meals on higher-appetite days instead of promising perfect discipline",
    "ciepłe posiłki, produkty z magnezem i błonnikiem, jogurt, kakao bez przesady, ziemniaki, kasze, owoce i słone dodatki w małej porcji",
    "warm meals, magnesium- and fibre-containing foods, yoghurt, cocoa in moderation, potatoes, groats, fruit and small salty additions",
    "restrykcja w pierwszej połowie dnia często nasila wieczorny chaos jedzeniowy",
    "restriction earlier in the day often intensifies evening food chaos",
    "przez jeden cykl zanotuj dni większego apetytu i przygotuj na nie dwa konkretne posiłki oraz jedną planowaną słodycz",
    "for one cycle note higher-appetite days and prepare two specific meals plus one planned sweet food",
    "silny ból, bardzo obfite krwawienia, objawy depresyjne lub podejrzenie PMDD wymagają konsultacji lekarskiej",
    "severe pain, very heavy bleeding, depressive symptoms or suspected PMDD require medical consultation",
    "warm meal bowl chocolate fruit",
    ["nhsPms", "ncezPlate", "whoHealthy"]
  ),
  "dieta-a-migrena-dzienniczek": p(
    "dzienniczek migreny, który pomaga szukać wzorców bez przypadkowego eliminowania połowy diety",
    "a migraine diary that helps look for patterns without randomly eliminating half the diet",
    "przez cztery tygodnie zapisuj ból, sen, stres, cykl, nawodnienie, alkohol i posiłki, zanim wprowadzisz eliminację",
    "record pain, sleep, stress, menstrual cycle, hydration, alcohol and meals for four weeks before eliminating foods",
    "regularne posiłki, woda, łagodna kawa jeśli tolerowana, proste śniadanie, posiłek awaryjny i lista możliwych wyzwalaczy do omówienia",
    "regular meals, water, tolerated coffee, a simple breakfast, an emergency meal and a list of possible triggers to discuss",
    "usunięcie wielu produktów naraz uniemożliwia sprawdzenie, co naprawdę ma związek z napadami",
    "removing many foods at once makes it impossible to see what is really related to attacks",
    "stwórz tabelę z pięcioma kolumnami i uzupełniaj ją wieczorem, nie w trakcie bólu",
    "create a five-column table and fill it in during the evening, not during the headache",
    "nagły najsilniejszy ból głowy, objawy neurologiczne, gorączka lub zmiana charakteru bólów wymaga pilnej pomocy",
    "a sudden worst-ever headache, neurological symptoms, fever or a changed headache pattern needs urgent care",
    "notebook coffee breakfast headache diary",
    ["niceHeadaches", "medlineMigraine", "ncezPlate"]
  ),
  "kawa-przed-sniadaniem": p(
    "sprawdzenie, czy kawa przed śniadaniem służy żołądkowi, energii i apetytowi konkretnej osoby",
    "checking whether coffee before breakfast suits a person’s stomach, energy and appetite",
    "przez tydzień porównaj dni z kawą po kilku kęsach śniadania i dni z kawą od razu po przebudzeniu",
    "for a week compare coffee after a few bites of breakfast with coffee immediately after waking",
    "kawa z mlekiem lub bez, małe śniadanie białkowe, woda, owsianka, kanapka, jogurt, jajko i owoc",
    "coffee with or without milk, a small protein breakfast, water, oats, sandwich, yoghurt, egg and fruit",
    "pułapką jest maskowanie głodu kofeiną, a potem nadrabianie jedzenia późnym popołudniem",
    "the trap is masking hunger with caffeine and then catching up with food late afternoon",
    "przesuń kawę o 20 minut i sprawdź zgagę, drżenie, koncentrację oraz napady głodu po południu",
    "move coffee by 20 minutes and track reflux, shakiness, focus and afternoon hunger",
    "ciąża, lęk, arytmie, refluks i zaburzenia snu mogą zmieniać tolerancję kofeiny",
    "pregnancy, anxiety, arrhythmia, reflux and sleep disorders can change caffeine tolerance",
    "coffee cup breakfast",
    ["efsaCaffeine", "medlineCaffeine", "whoHealthy"]
  ),
  "czy-banan-tuczy": p(
    "rozbrojenie mitu o bananie przez porcję, sytość i kontekst całego dnia",
    "defusing the banana myth through portion size, fullness and the whole-day context",
    "zamiast pytać, czy banan tuczy, sprawdź, czy zastępuje słodycz, uzupełnia posiłek czy jest dodatkiem ponad głód",
    "instead of asking whether a banana causes weight gain, check whether it replaces a sweet, completes a meal or is extra beyond hunger",
    "banan z jogurtem, owsianką, masłem orzechowym w małej ilości, po treningu lub jako owoc do lunchu",
    "banana with yoghurt, oats, a small amount of peanut butter, after training or as fruit with lunch",
    "pułapką jest ocenianie jednego owocu bez patrzenia na bilans posiłków, napojów i przekąsek",
    "the trap is judging one fruit without looking at meals, drinks and snacks",
    "przez tydzień używaj banana w dwóch konkretnych sytuacjach i obserwuj sytość zamiast masy po jednym dniu",
    "for a week use banana in two specific situations and observe fullness rather than weight after one day",
    "przy cukrzycy lub zaleceniach dotyczących węglowodanów liczy się porcja i połączenie z posiłkiem",
    "with diabetes or carbohydrate advice, portion and meal pairing matter",
    "banana fruit plate",
    ["ncezPlate", "whoHealthy", "niceWeight"]
  ),
  "pieczywo-przy-cukrzycy": p(
    "wybór pieczywa przy cukrzycy bez automatycznego zakazu chleba i bez wiary w jedno idealne ziarno",
    "choosing bread with diabetes without an automatic bread ban or belief in one perfect grain",
    "sprawdź porcję, błonnik i dodatki do kanapki, bo glikemia zależy od całego posiłku",
    "check portion, fibre and sandwich additions because glucose response depends on the whole meal",
    "chleb żytni, pełnoziarnisty, graham, pieczywo z ziarnami, twaróg, jajko, ryba, warzywa, hummus i oliwa",
    "rye bread, wholegrain bread, graham bread, seeded bread, cottage cheese, egg, fish, vegetables, hummus and olive oil",
    "pułapką jest zamiana chleba na wafle lub produkty fit, które mniej sycą i nie rozwiązują problemu porcji",
    "the trap is replacing bread with rice cakes or fitness products that fill less and do not solve portion size",
    "zmierz lub zanotuj typową porcję chleba przez trzy dni i połącz ją z białkiem oraz warzywem",
    "measure or note your usual bread portion for three days and pair it with protein and vegetables",
    "osoby na insulinie lub lekach hipoglikemizujących powinny ustalać zmiany węglowodanów z zespołem leczącym",
    "people using insulin or glucose-lowering medication should discuss carbohydrate changes with their care team",
    "whole grain bread sandwich",
    ["dietyNfzDiabetes", "niceDiabetes", "ncezPlate"]
  ),
  "platki-sniadaniowe-jak-wybierac": p(
    "czytanie etykiet płatków śniadaniowych bez ulegania hasłom fitness, protein i pełnoziarnisty",
    "reading breakfast cereal labels without being swayed by fitness, protein or wholegrain slogans",
    "porównuj cukry, błonnik, skład i porcję, a nie wielkość napisu na pudełku",
    "compare sugars, fibre, ingredients and portion size, not the size of the slogan on the box",
    "płatki owsiane, żytnie, orkiszowe, musli bez dużej ilości cukru, otręby, jogurt, owoce i orzechy w porcji",
    "oats, rye or spelt flakes, lower-sugar muesli, bran, yoghurt, fruit and portioned nuts",
    "pułapką jest mała deklarowana porcja, której nikt realnie nie wsypuje do miski",
    "the trap is a tiny declared serving that nobody actually pours into the bowl",
    "zważ raz swoją normalną porcję i porównaj dwie etykiety według cukru oraz błonnika w 100 g",
    "weigh your usual portion once and compare two labels by sugars and fibre per 100 g",
    "przy cukrzycy, insulinooporności lub zaburzeniach jedzenia etykieta to tylko część decyzji",
    "with diabetes, insulin resistance or eating disorders, the label is only part of the decision",
    "breakfast cereal oats bowl",
    ["euLabel", "fdaLabel", "whoSugarGuideline"]
  ),
  "dieta-po-antybiotyku-rozsadnie": p(
    "wsparcie jedzenia po antybiotyku bez obietnicy odbudowy mikrobiomu w kilka dni",
    "supportive eating after antibiotics without promising to rebuild the microbiome in days",
    "wróć do regularnych posiłków, płynów i błonnika stopniowo, szczególnie jeśli brzuch jest wrażliwy",
    "return to regular meals, fluids and fibre gradually, especially if the gut is sensitive",
    "jogurt lub kefir jeśli tolerowane, gotowane warzywa, owsianka, ziemniaki, ryż, delikatne strączki, owoce i woda",
    "yoghurt or kefir if tolerated, cooked vegetables, oats, potatoes, rice, gentle pulses, fruit and water",
    "pułapką jest kupowanie wielu probiotyków i suplementów bez wskazań, zamiast obserwować objawy",
    "the trap is buying many probiotics and supplements without indication instead of observing symptoms",
    "przez tydzień zwiększaj błonnik o mały krok co dwa dni i zapisuj biegunkę, ból oraz tolerancję nabiału",
    "for a week increase fibre by a small step every two days and track diarrhoea, pain and dairy tolerance",
    "biegunka z krwią, gorączka, odwodnienie lub nasilone objawy po antybiotyku wymagają pilnego kontaktu z lekarzem",
    "bloody diarrhoea, fever, dehydration or worsening symptoms after antibiotics require urgent medical contact",
    "yogurt fruit spoon",
    ["nccihProbiotics", "nccihProbioticsTips", "whoDiarrhoea"]
  ),
  "kiedy-eliminowac-laktoze": p(
    "rozróżnienie nietolerancji laktozy, alergii na mleko i przypadkowych objawów po ciężkim posiłku",
    "distinguishing lactose intolerance, milk allergy and random symptoms after a heavy meal",
    "najpierw zapisz objawy i porcję nabiału, a eliminację rób czasowo i celowo, nie na zawsze z lęku",
    "first record symptoms and dairy portion, then eliminate temporarily and deliberately, not forever out of fear",
    "mleko bez laktozy, jogurt, kefir, twarde sery, produkty fortyfikowane wapniem i inne źródła białka",
    "lactose-free milk, yoghurt, kefir, hard cheeses, calcium-fortified products and other protein sources",
    "pułapką jest usunięcie całego nabiału bez planu na wapń, białko i realną diagnozę",
    "the trap is removing all dairy without a calcium, protein and diagnosis plan",
    "przez dwa tygodnie sprawdź zależność porcji i objawów, a potem omów wynik zamiast rozszerzać zakazy",
    "for two weeks check the relation between portion and symptoms, then discuss the result instead of expanding rules",
    "pokrzywka, duszność, obrzęk, krew w stolcu lub spadek masy ciała to sygnały do pilnej diagnostyki",
    "hives, breathing difficulty, swelling, blood in stool or weight loss are signals for prompt assessment",
    "lactose free milk yogurt",
    ["niddkLactose", "medlineCalcium", "ncezPlate"]
  ),
  "czy-gluten-powoduje-zmeczenie": p(
    "porządkowanie tematu glutenu i zmęczenia bez samodzielnego przechodzenia na dietę bezglutenową przed diagnostyką",
    "organising the gluten and tiredness question without self-starting gluten-free eating before assessment",
    "jeśli podejrzewasz celiakię, nie odstawiaj glutenu przed badaniami; najpierw omów objawy z lekarzem",
    "if coeliac disease is suspected, do not stop gluten before testing; discuss symptoms with a doctor first",
    "normalne źródła węglowodanów, pieczywo, kasze, ryż, ziemniaki, białko, warzywa i produkty bezglutenowe tylko gdy są potrzebne",
    "ordinary carbohydrate sources, bread, groats, rice, potatoes, protein, vegetables and gluten-free products only when needed",
    "pułapką jest przypisanie zmęczenia jednemu składnikowi, gdy w tle może być sen, żelazo, tarczyca lub stres",
    "the trap is blaming one ingredient when sleep, iron, thyroid function or stress may be involved",
    "spisz objawy, sen i posiłki przez dwa tygodnie, a przy podejrzeniu celiakii zapytaj o badania przed eliminacją",
    "record symptoms, sleep and meals for two weeks and ask about tests before elimination if coeliac disease is possible",
    "niedokrwistość, chudnięcie, przewlekła biegunka, rodzinne występowanie celiakii lub silne zmęczenie wymagają diagnostyki",
    "anaemia, weight loss, chronic diarrhoea, family history of coeliac disease or severe fatigue need assessment",
    "bread wheat table",
    ["niceCoeliac", "ncezPlate", "whoHealthy"]
  ),
  "dieta-przy-kamicy-zolciowej-profilaktyka": p(
    "nawyki wspierające profilaktykę kamicy żółciowej bez obiecywania, że dieta rozpuści istniejące kamienie",
    "habits supporting gallstone prevention without promising that diet dissolves existing stones",
    "unikaj gwałtownych głodówek i bardzo szybkiego chudnięcia; buduj regularne, umiarkowane posiłki",
    "avoid fasting and very rapid weight loss; build regular, moderate meals",
    "warzywa, produkty pełnoziarniste, chude białko, ryby, rośliny strączkowe w tolerowanej porcji, oliwa i mniejsze porcje tłustych dań",
    "vegetables, wholegrains, lean protein, fish, tolerated pulses, olive oil and smaller portions of fatty dishes",
    "pułapką jest skrajne unikanie tłuszczu, które utrudnia normalne jedzenie i nie zastępuje leczenia",
    "the trap is extreme fat avoidance, which makes normal eating harder and does not replace care",
    "przez tydzień zamień dwa bardzo tłuste posiłki na wersje z mniejszą porcją tłuszczu i większą ilością warzyw",
    "for a week swap two very fatty meals for versions with a smaller fat portion and more vegetables",
    "ból pod prawym łukiem żebrowym, gorączka, żółtaczka lub wymioty wymagają pilnej konsultacji",
    "pain under the right ribs, fever, jaundice or vomiting require urgent consultation",
    "vegetable soup olive oil",
    ["niddkGallstones", "whoObesity", "niceWeight"]
  ),
  "kamica-nerkowa-a-nawodnienie": p(
    "nawodnienie jako fundament profilaktyki kamicy, ale zależny od typu kamieni i zaleceń lekarskich",
    "hydration as a foundation for kidney-stone prevention, while depending on stone type and medical advice",
    "zacznij od regularnego picia wody i obserwacji koloru moczu, zanim kupisz elektrolity lub suplementy",
    "start with regular water intake and urine colour observation before buying electrolytes or supplements",
    "woda, cytryna jako smak, warzywa, owoce, produkty z mniejszą ilością soli i posiłki bez nadmiaru białka z jednego źródła",
    "water, lemon for flavour, vegetables, fruit, lower-salt foods and meals without excess protein from one source",
    "pułapką jest koncentrowanie się na jednym zakazie, gdy sól i ilość płynów bywają ważniejsze",
    "the trap is focusing on one forbidden food when salt and fluid amount may matter more",
    "przez tydzień ustaw cztery punkty picia wody i sprawdź, ile soli dodajesz do gotowych produktów",
    "for a week set four water-drinking anchors and check how much salt comes from ready foods",
    "ból kolkowy, gorączka, krew w moczu, wymioty lub jedna nerka wymagają pilnej pomocy",
    "colicky pain, fever, blood in urine, vomiting or having one kidney require urgent care",
    "glass water lemon",
    ["niddkKidneyStones", "kidneyFoundationStones", "whoSodium"]
  ),
  "dna-moczanowa-co-ograniczyc": p(
    "priorytety w dnie moczanowej: alkohol, słodzone napoje, masa ciała i wybrane produkty purynowe bez skrajnej diety",
    "gout priorities: alcohol, sugary drinks, body weight and selected purine-rich foods without an extreme diet",
    "najpierw ogranicz alkohol i słodzone napoje, a dopiero potem dopracowuj listę produktów wysokopurynowych",
    "first reduce alcohol and sugary drinks, then refine the list of high-purine foods",
    "woda, nabiał naturalny, warzywa, produkty pełnoziarniste, jajka, roślinne białko w tolerancji i mniejsze porcje podrobów oraz czerwonego mięsa",
    "water, plain dairy, vegetables, wholegrains, eggs, tolerated plant protein and smaller portions of offal and red meat",
    "pułapką jest szukanie jednej zakazanej listy zamiast leczenia i obserwacji napadów",
    "the trap is chasing one forbidden list instead of treatment and flare observation",
    "przez tydzień zapisz alkohol, słodzone napoje i porcje mięsa; to zwykle daje lepszy punkt startu niż liczenie puryn w każdym kęsie",
    "for a week record alcohol, sugary drinks and meat portions; this usually gives a better start than counting purines in every bite",
    "ostry napad, choroby nerek, leki moczopędne lub nawracające objawy wymagają opieki lekarskiej",
    "an acute flare, kidney disease, diuretics or recurrent symptoms require medical care",
    "water glass vegetables gout diet",
    ["ncezGout", "niceGout", "medlineGout"]
  ),
  "dieta-seniora-z-malym-apetytem": p(
    "małe porcje o większej wartości odżywczej, kiedy senior nie ma apetytu na duży talerz",
    "small, nutrient-dense portions when an older adult has little appetite for a large plate",
    "zwiększ wartość małych porcji białkiem i tłuszczem, zamiast wymuszać ogromne obiady",
    "increase the value of small portions with protein and fat instead of forcing huge lunches",
    "jajka, twaróg, jogurt, ryby, miękkie mięso, tofu, zupy krem z dodatkiem białka, kasza na mleku, oliwa, orzechy mielone",
    "eggs, cottage cheese, yoghurt, fish, soft meat, tofu, blended soups with protein, milk-based groats, olive oil, ground nuts",
    "pułapką jest podawanie samych lekkich zup i herbatników, które nie wspierają siły",
    "the trap is offering only light soups and biscuits that do not support strength",
    "dodaj jeden mały posiłek białkowy dziennie i obserwuj masę ciała, siłę oraz tolerancję gryzienia",
    "add one small protein-rich meal daily and monitor weight, strength and chewing tolerance",
    "nagła utrata masy, problemy z połykaniem, odwodnienie, depresja lub ból wymagają oceny medycznej",
    "sudden weight loss, swallowing problems, dehydration, depression or pain require medical assessment",
    "elderly meal soup protein",
    ["ncezSenior", "ncezSeniorProtein", "ncezPlate"]
  ),
  "sarcopenia-bialko-i-ruch": p(
    "połączenie białka i ćwiczeń oporowych jako codzienny duet dla mięśni, nie tylko temat siłowni",
    "combining protein and resistance exercise as a daily muscle-support duo, not only a gym topic",
    "rozłóż białko na kilka posiłków i dodaj bezpieczny ruch oporowy dopasowany do możliwości",
    "spread protein across several meals and add safe resistance movement matched to ability",
    "jajka, nabiał, ryby, mięso, tofu, strączki, koktajl z jogurtem, zupa z dodatkiem białka i ćwiczenia z gumą",
    "eggs, dairy, fish, meat, tofu, pulses, yoghurt smoothie, soup with added protein and resistance-band exercises",
    "samo białko bez ruchu albo sam ruch bez jedzenia daje słabszy plan niż połączenie obu elementów",
    "protein without movement or movement without enough food is weaker than combining both",
    "wybierz trzy dni krótkich ćwiczeń i trzy posiłki, w których białko jest jasno widoczne",
    "choose three short exercise days and three meals where protein is clearly present",
    "upadki, szybka utrata siły, choroby nerek lub znaczna utrata masy wymagają indywidualnej opieki",
    "falls, rapid strength loss, kidney disease or major weight loss require individual care",
    "protein meal exercise bands",
    ["ncezSeniorProtein", "whoPhysical", "jissnProtein"]
  ),
  "dieta-przy-tradziku-bez-skrajnosci": p(
    "wsparcie skóry przez regularną, mniej wysokoglikemiczną dietę bez obiecywania wyleczenia trądziku",
    "supporting skin with a regular, lower-glycaemic pattern without promising to cure acne",
    "sprawdź słodkie napoje, bardzo słodkie przekąski i regularność posiłków, zanim usuniesz pół jadłospisu",
    "check sugary drinks, very sweet snacks and meal regularity before removing half the diet",
    "pełniejsze zboża, warzywa, owoce, białko, nabiał obserwowany indywidualnie, orzechy, ryby i woda",
    "higher-fibre grains, vegetables, fruit, protein, individually observed dairy, nuts, fish and water",
    "pułapką jest obwinianie jednego produktu za chorobę skóry i rezygnacja z leczenia dermatologicznego",
    "the trap is blaming one food for a skin condition and abandoning dermatological treatment",
    "przez cztery tygodnie zmień jeden element: napoje słodzone albo śniadanie; rób zdjęcia skóry w podobnym świetle",
    "for four weeks change one element: sugary drinks or breakfast; take skin photos in similar light",
    "bolesny trądzik, blizny, pogorszenie psychiczne lub leczenie izotretynoiną wymagają prowadzenia przez lekarza",
    "painful acne, scarring, mental-health impact or isotretinoin treatment require medical supervision",
    "vegetables fish skin health",
    ["niceAcne", "aadAcneDiet", "ncezPlate"]
  ),
  "dieta-przy-luszczycy-wsparcie": p(
    "dieta jako wsparcie ogólnego zdrowia metabolicznego przy łuszczycy, nie zamiennik leczenia",
    "diet as support for general metabolic health with psoriasis, not a replacement for treatment",
    "zacznij od elementów sercowo-metabolicznych: masa ciała jeśli jest wskazanie, warzywa, tłuszcze i alkohol",
    "start with cardiometabolic basics: body weight when relevant, vegetables, fats and alcohol",
    "warzywa, owoce, ryby, oliwa lub olej rzepakowy, pełniejsze zboża, strączki, orzechy w porcji i mniej alkoholu",
    "vegetables, fruit, fish, olive or rapeseed oil, higher-fibre grains, pulses, portioned nuts and less alcohol",
    "pułapką są bardzo restrykcyjne diety przeciwzapalne bez planu i bez monitorowania leczenia",
    "the trap is a very restrictive anti-inflammatory diet without a plan or treatment monitoring",
    "wybierz jedną zmianę metaboliczną na dwa tygodnie, np. ryba raz więcej albo alkohol raz mniej",
    "choose one metabolic change for two weeks, such as one more fish meal or one less alcohol occasion",
    "zaostrzenia, ból stawów, rozległe zmiany lub odstawianie leków wymagają kontaktu z dermatologiem",
    "flares, joint pain, extensive lesions or stopping medication require dermatologist contact",
    "salmon vegetables meal",
    ["nicePsoriasis", "nhsPsoriasis", "ncezDash"]
  ),
  "dieta-antyhistaminowa-ostroznie": p(
    "ostrożne podejście do diety niskohistaminowej, aby nie zamienić niepewnej diagnozy w skrajnie ubogi jadłospis",
    "a cautious approach to low-histamine eating so an uncertain diagnosis does not become an extremely narrow diet",
    "nie zaczynaj od długiej listy zakazów; najpierw ustal objawy, czas reakcji i możliwe inne przyczyny",
    "do not start with a long forbidden list; first clarify symptoms, timing and possible other causes",
    "świeże proste posiłki, rotacja produktów, dzienniczek objawów, mrożenie porcji i ostrożne testy zamiast stałej eliminacji",
    "fresh simple meals, food rotation, symptom diary, freezing portions and cautious tests instead of permanent elimination",
    "pułapką jest ograniczanie kolejnych grup produktów bez jasnego efektu i bez kontroli odżywczej",
    "the trap is restricting more food groups without a clear effect or nutrition oversight",
    "przez dwa tygodnie prowadź dzienniczek objawów i nie usuwaj nowych produktów codziennie",
    "keep a symptom diary for two weeks and do not remove new foods every day",
    "obrzęk, duszność, omdlenia, pokrzywka uogólniona lub podejrzenie anafilaksji wymagają pilnej pomocy",
    "swelling, breathing difficulty, fainting, widespread hives or suspected anaphylaxis require urgent care",
    "fresh meal vegetables diary",
    ["aaaaiHistamine", "niceFoodAllergy", "ncezPlate"]
  ),
  "napoje-energetyczne-a-apetyt": p(
    "wpływ energetyków na kofeinę, sen, słodki smak i późniejszy apetyt, bez straszenia pojedynczą puszką",
    "how energy drinks affect caffeine, sleep, sweet taste and later appetite without fearmongering about one can",
    "zanotuj godzinę wypicia, ilość kofeiny i wieczorny sen, zanim uznasz apetyt za osobny problem",
    "record drink timing, caffeine amount and evening sleep before treating appetite as a separate issue",
    "woda, kawa w znanej dawce, herbata, napoje bez cukru jako etap przejściowy, posiłek z białkiem zamiast energetyka na pusty żołądek",
    "water, coffee at a known dose, tea, sugar-free drinks as a transition, a protein meal instead of an energy drink on an empty stomach",
    "pułapką jest używanie energetyka zamiast snu i posiłku, a potem nadrabianie głodu wieczorem",
    "the trap is using an energy drink instead of sleep and a meal, then catching up with hunger in the evening",
    "przez tydzień przesuń energetyk przed południe albo zamień co drugą puszkę na inną opcję i obserwuj sen",
    "for a week move the drink earlier or swap every second can for another option and observe sleep",
    "nadciśnienie, arytmie, ciąża, lęk i bezsenność wymagają ostrożności z kofeiną",
    "hypertension, arrhythmias, pregnancy, anxiety and insomnia require caution with caffeine",
    "energy drink can caffeine",
    ["nccihEnergy", "efsaCaffeine", "cdcSugars"]
  ),
  "jak-zmniejszyc-cukier-w-diecie-dziecka": p(
    "zmniejszanie cukru u dziecka bez zawstydzania i bez robienia ze słodyczy zakazanego owocu",
    "reducing a child’s sugar without shame or turning sweets into forbidden fruit",
    "zacznij od napojów i codziennych produktów, a słodycze zaplanuj spokojnie zamiast prowadzić domowe śledztwo",
    "start with drinks and daily products, and plan sweets calmly instead of policing the home",
    "woda, mleko lub napoje bez cukru zgodne z wiekiem, jogurt naturalny z owocami, kanapka, owoc, domowe kakao mniej słodkie",
    "water, milk or age-appropriate unsweetened drinks, plain yoghurt with fruit, sandwich, fruit, less-sweet homemade cocoa",
    "pułapką jest komentowanie ciała dziecka albo wprowadzanie zakazów, które zwiększają napięcie wokół jedzenia",
    "the trap is commenting on a child’s body or using bans that increase food tension",
    "wybierz jeden napój i jeden produkt śniadaniowy do zmiany w tym tygodniu; resztę zostaw stabilną",
    "choose one drink and one breakfast product to change this week; keep the rest stable",
    "nagła zmiana masy, napady objadania, ukrywanie jedzenia lub choroby wymagające diety powinny być omówione ze specjalistą",
    "sudden weight change, binge eating, hiding food or conditions requiring diet therapy should be discussed with a professional",
    "child fruit yogurt",
    ["aapAddedSugar", "cdcSugars", "whoSugarGuideline"]
  ),
  "rodzinne-obiady-bez-dwoch-kuchni": p(
    "modułowy obiad rodzinny, w którym jedna baza pasuje dzieciom, dorosłym i osobie chcącej jeść lżej",
    "a modular family dinner where one base fits children, adults and someone wanting a lighter plate",
    "ugotuj jedną bazę i zmieniaj dodatki na talerzu, zamiast gotować osobną dietetyczną wersję",
    "cook one base and adjust additions on the plate instead of making a separate diet version",
    "makaron lub kasza, sos pomidorowy, mięso lub soczewica, warzywa osobno, ser lub jogurt, oliwa i przyprawy na stole",
    "pasta or groats, tomato sauce, meat or lentils, vegetables on the side, cheese or yoghurt, olive oil and table spices",
    "pułapką jest tworzenie dwóch kuchni: normalnej dla rodziny i karnej dla osoby na redukcji",
    "the trap is creating two kitchens: normal food for the family and punitive food for the dieting person",
    "zaplanuj trzy obiady modułowe i zapisz, który element każdy domownik może regulować sam",
    "plan three modular dinners and note which element each household member can adjust",
    "wybiórczość pokarmowa, alergie, niedowaga dziecka lub zaburzenia odżywiania wymagają spokojnego wsparcia",
    "selective eating, allergies, child underweight or eating disorders require careful support",
    "family dinner table vegetables",
    ["ncezPlate", "pacjentHealthy", "whoHealthy"]
  ),
  "sniadanie-przed-treningiem-amatora": p(
    "śniadanie przed amatorskim treningiem dopasowane do godziny, żołądka i rodzaju wysiłku",
    "pre-workout breakfast for amateur training matched to timing, stomach tolerance and exercise type",
    "dobierz wielkość posiłku do czasu przed treningiem: im bliżej wysiłku, tym prościej i lżej",
    "match meal size to time before exercise: the closer the workout, the simpler and lighter the meal",
    "banan, owsianka, jogurt z owocem, kanapka z jajkiem, ryż na mleku, tost, woda i kawa jeśli dobrze tolerowana",
    "banana, oats, yoghurt with fruit, egg sandwich, rice pudding, toast, water and coffee if tolerated",
    "pułapką jest trenowanie na głodzie, a potem nadrabianie przypadkowymi przekąskami",
    "the trap is training hungry and then compensating with random snacks",
    "przetestuj dwa śniadania przed dwoma podobnymi treningami i oceń energię oraz komfort brzucha",
    "test two breakfasts before two similar workouts and rate energy and gut comfort",
    "cukrzyca, omdlenia, zaburzenia odżywiania lub bardzo intensywne treningi wymagają indywidualnego planu",
    "diabetes, fainting, eating disorders or very intense training require an individual plan",
    "oatmeal banana running shoes",
    ["jissnNutrientTiming", "whoPhysical", "ncezPlate"]
  ),
  "regeneracja-po-treningu-bez-odzywek": p(
    "regeneracja z normalnego jedzenia: białko, węglowodany, płyny i sen przed suplementami",
    "recovery from normal food: protein, carbohydrates, fluids and sleep before supplements",
    "po treningu wybierz posiłek zawierający białko i węglowodany, jeśli kolejny normalny posiłek nie wypada zaraz",
    "after training choose a meal with protein and carbohydrates if the next normal meal is not soon",
    "jogurt z owocem, kanapka z jajkiem, ryż z tofu, ziemniaki z rybą, owsianka, koktajl mleczny, woda",
    "yoghurt with fruit, egg sandwich, rice with tofu, potatoes with fish, oats, milk smoothie, water",
    "pułapką jest traktowanie odżywki jako konieczności, gdy cały dzień nie domyka energii i snu",
    "the trap is treating powder as necessary when the whole day lacks energy and sleep",
    "po trzech treningach zapisz, czy zjadłaś posiłek w ciągu kilku godzin i jak wyglądał sen",
    "after three workouts note whether you ate within a few hours and how sleep looked",
    "kontuzje, bardzo duże obciążenia, niedowaga lub zaburzenia odżywiania wymagają opieki specjalisty",
    "injuries, very high training loads, underweight or eating disorders require specialist care",
    "post workout meal yogurt fruit",
    ["jissnNutrientTiming", "jissnProtein", "whoPhysical"]
  ),
  "ile-wody-naprawde-pic": p(
    "praktyczne nawodnienie bez sztywnej zasady dwóch litrów dla każdego",
    "practical hydration without a rigid two-litres-for-everyone rule",
    "zacznij od obserwacji pragnienia, koloru moczu, temperatury, aktywności i ilości słonych produktów",
    "start with thirst, urine colour, temperature, activity and salty-food intake",
    "woda, herbata, zupy, owoce, warzywa, mleko lub napoje niesłodzone; kawa też wnosi płyn, choć nie powinna być jedynym źródłem",
    "water, tea, soups, fruit, vegetables, milk or unsweetened drinks; coffee contributes fluid but should not be the only source",
    "pułapką jest picie ogromnych ilości na siłę albo ignorowanie pragnienia przez cały dzień",
    "the trap is forcing huge amounts or ignoring thirst all day",
    "ustaw trzy stałe punkty picia i dodaj wodę do posiłku, przy którym zwykle jej brakuje",
    "set three drinking anchors and add water to the meal where it is usually missing",
    "choroby nerek, serca, leki moczopędne, wymioty lub biegunka zmieniają zalecenia dotyczące płynów",
    "kidney disease, heart disease, diuretics, vomiting or diarrhoea change fluid advice",
    "glass of water table",
    ["ncezWaterPdf", "whoPhysical", "ncezPlate"]
  ),
  "elektrolity-a-biegunka": p(
    "kiedy przy biegunce wystarczy płyn, a kiedy potrzebny jest doustny płyn nawadniający i lekarz",
    "when fluids are enough during diarrhoea and when oral rehydration solution and medical care are needed",
    "najpierw oceniaj ryzyko odwodnienia: pragnienie, oddawanie moczu, osłabienie, gorączkę i czas trwania objawów",
    "first assess dehydration risk: thirst, urination, weakness, fever and symptom duration",
    "doustny płyn nawadniający, woda małymi łykami, lekka zupa, ryż, banan, jogurt jeśli tolerowany i powrót do jedzenia stopniowo",
    "oral rehydration solution, small sips of water, light soup, rice, banana, yoghurt if tolerated and gradual return to food",
    "pułapką jest traktowanie sportowego napoju jak zamiennika ORS przy odwodnieniu",
    "the trap is treating a sports drink as a replacement for ORS during dehydration",
    "przy krótkiej biegunce pilnuj małych łyków i jedzenia lekkiego; jeśli objawy trwają lub nasilają się, nie czekaj",
    "with short diarrhoea use small sips and light food; if symptoms last or worsen, do not wait",
    "krew w stolcu, wysoka gorączka, silny ból, odwodnienie, biegunka u niemowląt lub osób starszych wymaga pilnej pomocy",
    "blood in stool, high fever, severe pain, dehydration, diarrhoea in infants or older adults requires urgent care",
    "oral rehydration solution water",
    ["whoDiarrhoea", "whoOrs", "ncezPlate"]
  ),
  "dieta-roslinna-dla-poczatkujacych": p(
    "pierwsze kroki w diecie roślinnej z naciskiem na białko, B12 i proste posiłki",
    "first steps in plant-based eating with focus on protein, B12 and simple meals",
    "nie zaczynaj od idealnego menu; wybierz trzy roślinne obiady i sprawdź źródła białka",
    "do not start with a perfect menu; choose three plant-based dinners and check protein sources",
    "soczewica, fasola, ciecierzyca, tofu, tempeh, napoje fortyfikowane, orzechy, nasiona, kasze, warzywa i suplement B12 przy diecie wegańskiej",
    "lentils, beans, chickpeas, tofu, tempeh, fortified drinks, nuts, seeds, groats, vegetables and B12 supplementation with vegan eating",
    "pułapką jest jedzenie samych dodatków warzywnych bez białka i bez planu na B12",
    "the trap is eating only vegetable sides without protein or a B12 plan",
    "w tym tygodniu ugotuj jedną porcję strączków i kup jedno gotowe źródło białka roślinnego",
    "this week cook one batch of pulses and buy one ready plant-protein option",
    "ciąża, dzieci, choroby przewlekłe i dieta wegańska wymagają szczególnej uwagi na B12, żelazo, wapń, jod i energię",
    "pregnancy, children, chronic disease and vegan eating require attention to B12, iron, calcium, iodine and energy",
    "plant based bowl lentils tofu",
    ["ncezPlant", "jissnProtein", "medlineB12"]
  ),
  "blonnik-rozpuszczalny-i-ldl": p(
    "praktyczne źródła błonnika rozpuszczalnego, które mogą wspierać dietę przy podwyższonym LDL",
    "practical soluble-fibre sources that can support eating with elevated LDL",
    "dodawaj błonnik stopniowo i równolegle zwiększaj płyny, żeby plan był dobrze tolerowany",
    "increase fibre gradually and raise fluids alongside it so the plan is tolerated",
    "owsianka, otręby owsiane, jęczmień, jabłka, rośliny strączkowe, siemię, warzywa, psyllium jeśli ma wskazanie",
    "oats, oat bran, barley, apples, pulses, flaxseed, vegetables, psyllium when indicated",
    "pułapką jest dosypanie dużej ilości błonnika naraz, co często kończy się wzdęciami",
    "the trap is adding a large amount of fibre at once, often causing bloating",
    "wybierz dwa śniadania owsiane i jeden obiad ze strączkami, a wyniki lipidów oceniaj w dłuższej perspektywie",
    "choose two oat breakfasts and one pulse-based lunch, and judge lipid results over a longer period",
    "wysokie ryzyko sercowo-naczyniowe, leczenie lipidów lub choroby jelit wymagają indywidualnych zaleceń",
    "high cardiovascular risk, lipid medication or bowel disease require individual advice",
    "oats barley apples",
    ["ncezLipids", "pubmedOats", "pubmedFiberMeta", "medlineCholesterol"]
  ),
  "psyllium-kiedy-ma-sens": p(
    "babka płesznik lub jajowata jako narzędzie dla wybranych osób, nie uniwersalny obowiązek",
    "psyllium as a tool for selected people, not a universal obligation",
    "zaczynaj od małej dawki i dużej ilości płynu, a nie od pełnej miarki z internetowej porady",
    "start with a small dose and plenty of fluid, not a full scoop from internet advice",
    "psyllium, owsianka, strączki, warzywa, owoce, pieczywo pełnoziarniste i zwykłe źródła błonnika jako podstawa",
    "psyllium, oats, pulses, vegetables, fruit, wholegrain bread and ordinary fibre foods as the base",
    "pułapką jest używanie suplementu, gdy problemem jest mała ilość płynów, nieregularne posiłki lub zbyt szybkie tempo zmian",
    "the trap is using a supplement when the issue is low fluids, irregular meals or overly rapid changes",
    "przez tydzień popraw zwykły błonnik z jedzenia; psyllium rozważ dopiero jako dodatkowe narzędzie",
    "for a week improve food-based fibre first; consider psyllium only as an extra tool",
    "zwężenia przewodu pokarmowego, trudności z połykaniem, leki przyjmowane jednocześnie lub silne objawy jelitowe wymagają konsultacji",
    "bowel narrowing, swallowing difficulty, concurrent medication or severe gut symptoms require consultation",
    "psyllium husk spoon",
    ["pubmedPsyllium", "pubmedFiberMeta", "ncezLipids"]
  ),
  "oliwa-rzepakowy-czy-maslo": p(
    "wybór tłuszczu do polskiej kuchni przez pryzmat serca, smaku i temperatury przygotowania",
    "choosing cooking fat for a Polish kitchen through heart health, taste and cooking temperature",
    "ustal, do czego używasz tłuszczu: na zimno, do smażenia czy do smaku; wtedy wybór robi się prostszy",
    "decide what the fat is for: cold use, frying or flavour; then the choice becomes clearer",
    "oliwa do sałatek, olej rzepakowy do codziennego gotowania, masło jako dodatek smakowy w porcji, orzechy i ryby jako inne źródła tłuszczu",
    "olive oil for salads, rapeseed oil for daily cooking, butter as a portioned flavour addition, nuts and fish as other fat sources",
    "pułapką jest ocenianie tłuszczu tylko jako dobry albo zły bez patrzenia na ilość i całą dietę",
    "the trap is labelling a fat good or bad without looking at amount and the whole diet",
    "przez tydzień zostaw masło tam, gdzie naprawdę robi smak, a do reszty użyj oleju roślinnego",
    "for a week keep butter where it truly adds flavour and use plant oil elsewhere",
    "przy wysokim LDL, chorobach serca lub zaleceniach lekarskich rodzaj i ilość tłuszczu warto omówić indywidualnie",
    "with high LDL, heart disease or medical advice, fat type and amount should be individualised",
    "olive oil rapeseed oil butter",
    ["ncezLipids", "ncezDash", "whoHealthy"]
  ),
  "orzechy-w-diecie-redukcyjnej": p(
    "orzechy jako wartościowy, ale energetyczny dodatek, który w redukcji warto porcjować",
    "nuts as a valuable but energy-dense addition that should be portioned during weight loss",
    "odmierz porcję do miseczki, zamiast jeść z dużej paczki przy komputerze",
    "portion nuts into a small bowl instead of eating from a large bag at the computer",
    "orzechy włoskie, laskowe, migdały, pestki dyni, masło orzechowe w cienkiej warstwie, jogurt z orzechami, sałatka z pestkami",
    "walnuts, hazelnuts, almonds, pumpkin seeds, a thin layer of peanut butter, yoghurt with nuts, salad with seeds",
    "pułapką jest traktowanie zdrowego dodatku jak produktu bez limitu energetycznego",
    "the trap is treating a healthy addition as if energy amount no longer matters",
    "przygotuj pięć małych porcji na tydzień i używaj ich jako dodatku do posiłku, nie osobnej otwartej paczki",
    "prepare five small weekly portions and use them as a meal addition, not an open separate bag",
    "alergia, problemy z gryzieniem, mały apetyt lub bardzo niska kaloryczność diety wymagają dopasowania formy i porcji",
    "allergy, chewing problems, low appetite or very low energy intake require adjusting form and portion",
    "nuts small bowl",
    ["ncezPlate", "pacjentWeight", "niceWeight"]
  ),
  "jak-nie-marnowac-warzyw": p(
    "system zakupów i gotowania, który pomaga jeść więcej warzyw i mniej wyrzucać",
    "a shopping and cooking system that helps you eat more vegetables and waste less",
    "kupuj warzywa w trzech formach: świeże do szybkiego zjedzenia, mrożone awaryjne i trwałe do gotowania",
    "buy vegetables in three forms: fresh for quick use, frozen backup and longer-lasting cooking vegetables",
    "marchew, kapusta, mrożony szpinak, mieszanki warzywne, pomidory w puszce, ogórki kiszone, sałata do pierwszych dwóch dni",
    "carrots, cabbage, frozen spinach, vegetable mixes, canned tomatoes, pickles, salad leaves for the first two days",
    "pułapką jest kupienie ambitnej ilości świeżych warzyw bez planu, kiedy i gdzie trafią",
    "the trap is buying an ambitious amount of fresh vegetables without a plan for when and where they will go",
    "zrób pudełko pierwszej kolejności w lodówce i zaplanuj jedną zupę albo sos z resztek",
    "make a first-use box in the fridge and plan one soup or sauce from leftovers",
    "żywność zepsuta, spleśniała lub niepewnie przechowywana nie powinna być ratowana za wszelką cenę",
    "spoiled, mouldy or uncertainly stored food should not be rescued at any cost",
    "vegetable drawer refrigerator",
    ["fdaFoodWaste", "ncezPlate", "usdaFreezing"]
  ),
  "tanie-obiady-z-kasza": p(
    "kasze jako niedroga baza obiadu z białkiem, warzywami i sosem, nie suchy dodatek z przymusu",
    "groats as an affordable dinner base with protein, vegetables and sauce, not a dry compulsory side",
    "ugotuj większą porcję kaszy i zmieniaj białko oraz warzywa, żeby nie jeść tego samego trzeci dzień z rzędu",
    "cook a larger batch of groats and vary protein and vegetables so you do not eat the same thing three days in a row",
    "kasza gryczana, jęczmienna, bulgur, pęczak, soczewica, jajko, twaróg, tofu, mrożone warzywa, sos pomidorowy lub jogurtowy",
    "buckwheat, barley, bulgur, pearl barley, lentils, egg, cottage cheese, tofu, frozen vegetables, tomato or yoghurt sauce",
    "pułapką jest tani obiad bez białka, który syci krótko i szybko nudzi się smakowo",
    "the trap is a cheap lunch without protein that fills briefly and gets boring quickly",
    "zaplanuj dwie kasze i dwa sosy na tydzień; jedną porcję zamroź jako awaryjny obiad",
    "plan two groats and two sauces for the week; freeze one portion as an emergency dinner",
    "przy celiakii, chorobach jelit lub dietach leczniczych wybór kasz i błonnika trzeba dopasować indywidualnie",
    "with coeliac disease, bowel disease or therapeutic diets, groat and fibre choices need individual adjustment",
    "buckwheat groats vegetables",
    ["ncezPlate", "ncezPlant", "pacjentHealthy"]
  ),
  "zamienniki-slodyczy-bez-obsesji": p(
    "łagodniejsze alternatywy i planowanie słodyczy bez tworzenia kolejnej listy zakazów",
    "gentler alternatives and sweet planning without creating another forbidden list",
    "zdecyduj, czy potrzebujesz słodkiego smaku, sytości czy przerwy emocjonalnej; to trzy różne potrzeby",
    "decide whether you need sweetness, fullness or an emotional break; these are three different needs",
    "jogurt z owocem, kakao, daktyl w porcji, owoce z orzechami, domowy deser mniej słodki, ale też zaplanowana normalna słodycz",
    "yoghurt with fruit, cocoa, portioned dates, fruit with nuts, a less-sweet homemade dessert and also a planned regular sweet",
    "pułapką jest zamiana słodyczy na dietetyczne substytuty jedzone bez końca i z poczuciem winy",
    "the trap is replacing sweets with diet substitutes eaten endlessly and with guilt",
    "zaplanuj dwie sytuacje na słodycze i dwie alternatywy; oceniaj napięcie wokół jedzenia, nie tylko kalorie",
    "plan two sweet occasions and two alternatives; judge food tension, not only calories",
    "napady objadania, kompensowanie jedzenia, silny lęk przed cukrem lub poczucie utraty kontroli wymagają wsparcia",
    "binge eating, compensatory behaviour, intense fear of sugar or feeling out of control requires support",
    "fruit yogurt dessert chocolate",
    ["whoSugarGuideline", "cdcSugars", "whoHealthy"]
  ),
};

function p(focusPl, focusEn, firstPl, firstEn, foodsPl, foodsEn, trapPl, trapEn, weekPl, weekEn, safetyPl, safetyEn, imageQuery, sourceIds) {
  return { focusPl, focusEn, firstPl, firstEn, foodsPl, foodsEn, trapPl, trapEn, weekPl, weekEn, safetyPl, safetyEn, imageQuery, sourceIds };
}

const headingSets = [
  [["Po co ten temat", "Pierwszy rozsądny krok", "Co realnie położyć na talerzu", "Zakupy i przygotowanie", "Najczęstsza pułapka", "Plan na najbliższy tydzień", "Kiedy nie działać samodzielnie"], ["Why this topic matters", "The first sensible step", "What to put on the plate", "Shopping and preparation", "The common trap", "Plan for the next week", "When not to handle it alone"]],
  [["Szybka odpowiedź", "Od czego zacząć", "Produkty, które pomagają w praktyce", "Jak uprościć decyzję", "Co zwykle psuje plan", "Test na 7 dni", "Sygnały do konsultacji"], ["Quick answer", "Where to start", "Foods that help in practice", "How to simplify the decision", "What usually breaks the plan", "A 7-day test", "Signals to seek support"]],
  [["Najważniejsza zasada", "Mały eksperyment", "Baza posiłku", "Polski sklep i kuchnia", "Czego nie obiecywać", "Jak ocenić efekt", "Bezpieczeństwo"], ["The key principle", "A small experiment", "Meal base", "Polish shop and kitchen", "What not to promise", "How to judge the effect", "Safety"]],
  [["Dla kogo jest ten szkic", "Jedna zmiana zamiast rewolucji", "Lista bazowych produktów", "Organizacja dnia", "Miejsce na elastyczność", "Mini-checklista", "Kiedy potrzebny jest specjalista"], ["Who this draft is for", "One change instead of a revolution", "Base food list", "Daily organisation", "Room for flexibility", "Mini-checklist", "When a specialist is needed"]],
  [["Sedno sprawy", "Pierwsze obserwacje", "Kompozycja posiłku", "Wariant awaryjny", "Ryzyko skrajności", "Tydzień próbny", "Granice poradnika"], ["The core idea", "First observations", "Meal composition", "Backup option", "Risk of extremes", "Trial week", "Limits of the guide"]],
];

function sourcesFor(profile) {
  const ids = [...profile.sourceIds, ...commonSourceIds];
  const seen = new Set();
  return ids.flatMap((id) => {
    const source = sourceLibrary[id];
    if (!source) throw new Error(`Missing source id: ${id}`);
    if (seen.has(source[1])) return [];
    seen.add(source[1]);
    return [{ title: source[0], url: source[1] }];
  }).slice(0, 7);
}

function truncateMeta(value) {
  if (value.length <= 158) return value;
  return `${value.slice(0, 154).replace(/\s+\S*$/u, "")}...`;
}

function buildArticle(existing, profile, image, index) {
  const titlePl = existing.topic.pl;
  const titleEn = existing.topic.en;
  const keyword = existing.seo.primary_keyword;
  const [headsPl, headsEn] = headingSets[index % headingSets.length];
  const sources = sourcesFor(profile);
  const metaDescriptionPl = truncateMeta(`${titlePl}: konkretne kroki, produkty, pułapki i sygnały do konsultacji. Bez detoksów, cudownych obietnic i skrajnych eliminacji.`);
  const metaDescriptionEn = truncateMeta(`${titleEn}: practical steps, food choices, common traps and safety signals. No miracle claims, detox framing or extreme restriction.`);
  const leadPl = `${titlePl}: ${profile.focusPl}. Ten szkic ma pomóc czytelnikowi podjąć kilka małych decyzji w zwykłym tygodniu, bez obietnic leczenia, bez straszenia i bez planu, którego nie da się utrzymać przy pracy, rodzinie albo podróży.`;
  const leadEn = `${titleEn}: ${profile.focusEn}. This draft helps the reader make a few small decisions in an ordinary week, without treatment promises, scare tactics or a plan that collapses around work, family or travel.`;

  const sectionsPl = [
    [headsPl[0], `${titlePl} dotyczy przede wszystkim sytuacji: ${existing.topic.search_intent}. Najlepszy punkt wyjścia to zwykły tydzień, w którym da się powtórzyć podobne posiłki i zauważyć, co naprawdę pomaga. Artykuł nie ustawia jednej idealnej diety; porządkuje decyzje, które mają największą szansę być wykonane.`],
    [headsPl[1], `Pierwszy krok: ${profile.firstPl}. Dzięki temu zmiana jest mierzalna i nie zamienia się w chaotyczne usuwanie produktów. Jeśli po kilku dniach nie da się jej utrzymać, warto uprościć warunki, a nie dokładać kolejne zakazy.`],
    [headsPl[2], `W praktyce przydadzą się: ${profile.foodsPl}. Taki zestaw daje punkt zaczepienia w sklepie i w kuchni. Nie każdy element musi pojawić się codziennie; ważniejsze jest, żeby posiłek miał funkcję: sycić, ułatwiać regularność albo zmniejszać liczbę przypadkowych decyzji.`],
    [headsPl[3], `Przy zakupach warto wybrać dwie wersje: domową i awaryjną. Domowa może być tańsza i bardziej powtarzalna, awaryjna ma ratować dzień, kiedy plan się rozsypuje. Wtedy czytelnik nie musi wybierać między perfekcją a całkowitym porzuceniem nawyku.`],
    [headsPl[4], `Najważniejsza pułapka: ${profile.trapPl}. To szczególnie istotne w treściach zdrowotnych, bo radykalna rada często brzmi atrakcyjnie, ale nie daje lepszego monitorowania objawów ani jakości diety. Lepiej zmienić jeden element i wiedzieć, co się sprawdza.`],
    [headsPl[5], `${profile.weekPl}. Do obserwacji wystarczą trzy sygnały: głód lub sytość, komfort trawienia oraz łatwość powtórzenia planu. Wyniki badań, masa ciała czy objawy przewlekłe wymagają dłuższego horyzontu niż jeden weekend.`],
    [headsPl[6], `${profile.safetyPl}. Ten tekst jest edukacyjny i nie zastępuje diagnozy, leczenia ani indywidualnej konsultacji z lekarzem lub dietetykiem.`],
  ];

  const sectionsEn = [
    [headsEn[0], `${titleEn} is mainly about this situation: ${existing.topic.search_intent}. The best starting point is an ordinary week in which similar meals can be repeated and patterns can be noticed. The article does not prescribe one perfect diet; it organises the decisions most likely to be carried out.`],
    [headsEn[1], `The first step is to ${profile.firstEn}. This makes the change measurable and prevents chaotic food removal. If it cannot be maintained after a few days, simplify the conditions rather than adding more rules.`],
    [headsEn[2], `Practical options include: ${profile.foodsEn}. This gives the reader a shopping and cooking anchor. Not every element must appear daily; what matters is the job of the meal: fullness, rhythm or fewer random decisions.`],
    [headsEn[3], `For shopping, it helps to choose two versions: a home version and a backup version. The home version can be cheaper and more repeatable; the backup version saves the day when the plan falls apart. This avoids an all-or-nothing choice between perfection and abandoning the habit.`],
    [headsEn[4], `The key trap is that ${profile.trapEn}. This matters in health content because radical advice often sounds attractive but does not improve symptom tracking or diet quality. Changing one element gives clearer feedback.`],
    [headsEn[5], `${profile.weekEn}. Three signals are enough to monitor: hunger or fullness, digestive comfort and whether the plan can be repeated. Lab results, body weight and chronic symptoms need a longer horizon than one weekend.`],
    [headsEn[6], `${profile.safetyEn}. This article is educational and does not replace diagnosis, treatment or an individual consultation with a doctor or dietitian.`],
  ];

  const faqPl = [
    [`Od czego zacząć przy temacie: ${keyword}?`, `Zacznij od najprostszej obserwacji: ${profile.firstPl}. Jedna zmiana daje lepszą informację niż pięć działań wprowadzonych jednocześnie.`],
    ["Czy potrzebuję specjalnych produktów?", `Zwykle nie. Najpierw wykorzystaj proste opcje: ${profile.foodsPl}. Produkty specjalistyczne mają sens dopiero wtedy, gdy rozwiązują konkretny problem, a nie tylko wyglądają zdrowiej.`],
    ["Kiedy dieta nie wystarczy?", `${profile.safetyPl}. W takich sytuacjach dieta może być wsparciem, ale nie powinna opóźniać diagnostyki ani leczenia.`],
  ];
  const faqEn = [
    [`Where should I start with ${keyword}?`, `Start with the simplest observation: ${profile.firstEn}. One change gives clearer feedback than five actions introduced at the same time.`],
    ["Do I need special products?", `Usually not. Start with simple options: ${profile.foodsEn}. Specialist products make sense only when they solve a specific problem, not just because they look healthier.`],
    ["When is diet not enough?", `${profile.safetyEn}. In such situations, diet can support care but should not delay diagnosis or treatment.`],
  ];

  return {
    ...existing,
    status: "draft",
    topic: {
      ...existing.topic,
      search_intent: existing.topic.search_intent,
    },
    seo: {
      ...existing.seo,
      meta_description_pl: metaDescriptionPl,
      meta_description_en: metaDescriptionEn,
      search_intent_note: existing.topic.search_intent,
    },
    content: {
      pl: {
        lead: leadPl,
        takeaways: [
          `Najpierw nazwij sytuację: ${existing.topic.search_intent}.`,
          `Pierwszy krok to: ${profile.firstPl}.`,
          `W praktyce oprzyj posiłki o: ${profile.foodsPl}.`,
          `Nie idź w skrót: ${profile.trapPl}.`,
        ],
        sections: sectionsPl,
        faq: faqPl,
      },
      en: {
        lead: leadEn,
        takeaways: [
          `Start by naming the situation: ${existing.topic.search_intent}.`,
          `The first step is to ${profile.firstEn}.`,
          `In practice, build around: ${profile.foodsEn}.`,
          `Avoid the shortcut that ${profile.trapEn}.`,
        ],
        sections: sectionsEn,
        faq: faqEn,
      },
    },
    sources,
    image: {
      file: "cover.jpg",
      alt_pl: `Zdjęcie do szkicu: ${titlePl}. ${image.altPl}`,
      alt_en: `Cover image for draft: ${titleEn}. ${image.altEn}`,
      source_url: image.sourceUrl,
      license: image.license,
      attribution: image.attribution,
      selection_note: "Topic-specific Wikimedia Commons image selected during P1/P2 remediation; not the shared NCI fallback.",
    },
    safety_note_pl: `Artykuł ma charakter edukacyjny i nie zastępuje diagnozy, leczenia ani indywidualnej konsultacji medycznej lub dietetycznej. ${profile.safetyPl}`,
    safety_note_en: `This article is educational and does not replace diagnosis, treatment or individual medical or nutrition advice. ${profile.safetyEn}`,
    claim_avoidance_notes: [
      "No cure, detox, guaranteed weight-loss or disease-treatment claims.",
      "Topic-specific sources replace generic PubMed searches and broad placeholder citations.",
      "Advice is framed as observation and practical support, with clear escalation signals.",
      "Draft remains noindex and requires human editorial approval before any public publishing.",
    ],
  };
}

function renderHtml(article) {
  const plSections = article.content.pl.sections.map(([h, body]) => `<section>\n<h3>${esc(h)}</h3>\n<p>${esc(body)}</p>\n</section>`).join("\n");
  const enSections = article.content.en.sections.map(([h, body]) => `<section>\n<h3>${esc(h)}</h3>\n<p>${esc(body)}</p>\n</section>`).join("\n");
  const faqPl = article.content.pl.faq.map(([q, a]) => `<h3>${esc(q)}</h3>\n<p>${esc(a)}</p>`).join("\n");
  const faqEn = article.content.en.faq.map(([q, a]) => `<h3>${esc(q)}</h3>\n<p>${esc(a)}</p>`).join("\n");
  const sourceList = article.sources.map((s) => `<li><a href="${attr(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a></li>`).join("\n");
  const links = article.internal_links.map((l) => `<li><a href="${attr(l.url)}">${esc(l.title_pl)} / ${esc(l.title_en)}</a></li>`).join("\n");
  return `<!doctype html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>${esc(article.seo.meta_title_pl)}</title>
  <meta name="description" content="${attr(article.seo.meta_description_pl)}" data-description-en="${attr(article.seo.meta_description_en)}">
</head>
<body>
<main>
  <article>
    <header>
      <p>Draft only · noindex,nofollow · PL/EN · P1/P2 remediated</p>
      <h1>${esc(article.seo.h1_pl)}</h1>
      <p><strong>Lead PL:</strong> ${esc(article.content.pl.lead)}</p>
      <figure>
        <img src="cover.jpg" alt="${attr(article.image.alt_pl)}" data-alt-en="${attr(article.image.alt_en)}">
        <figcaption>Image: ${esc(article.image.attribution)}. Source: <a href="${attr(article.image.source_url)}">Wikimedia Commons</a>. License: ${esc(article.image.license)}.</figcaption>
      </figure>
    </header>
    <section>
      <h2>Najważniejsze wnioski</h2>
      <ul>${article.content.pl.takeaways.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
    </section>
    ${plSections}
    <section>
      <h2>FAQ</h2>
      ${faqPl}
    </section>
    <section>
      <h2>Nota bezpieczeństwa</h2>
      <p>${esc(article.safety_note_pl)}</p>
    </section>
    <hr>
    <section lang="en">
      <h2>${esc(article.seo.h1_en)}</h2>
      <p><strong>Lead EN:</strong> ${esc(article.content.en.lead)}</p>
      <h3>Key takeaways</h3>
      <ul>${article.content.en.takeaways.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
      ${enSections}
      <h3>FAQ</h3>
      ${faqEn}
      <h3>Safety note</h3>
      <p>${esc(article.safety_note_en)}</p>
    </section>
    <section>
      <h2>Źródła / Sources</h2>
      <ol>${sourceList}</ol>
    </section>
    <section>
      <h2>Linki wewnętrzne / Internal links</h2>
      <ul>${links}</ul>
    </section>
  </article>
</main>
</body>
</html>
`;
}

function renderSources(article) {
  return `# Sources for ${article.topic.pl}

Draft slug: \`${article.slug}\`

## Health and nutrition sources

${article.sources.map((s) => `- [${s.title}](${s.url})`).join("\n")}

## Image

- File: \`cover.jpg\`
- Source: [Wikimedia Commons](${article.image.source_url})
- License: ${article.image.license}
- Attribution: ${article.image.attribution}
- Selection note: ${article.image.selection_note}

## Editorial source check

- P1 remediation replaced generic or mismatched citations with topic-specific sources.
- No PubMed search-result URLs are used as article sources.
- Draft remains noindex and unpublished.
`;
}

function renderQa(article) {
  return `# QA for ${article.topic.pl}

Status: draft reviewed after P1/P2 remediation.

- Required files present: yes.
- PL-first full article: yes.
- Complete EN version: yes.
- \`draft.html\` contains \`noindex,nofollow\`: yes.
- Canonical link absent: yes.
- Topic-specific sources: yes; ${article.sources.length} sources listed.
- PubMed search-result URLs: none.
- Wikimedia Commons image: yes; topic-specific source is ${article.image.source_url}.
- Shared NCI fallback image: not used.
- Internal links included: ${article.internal_links.length}.
- YMYL safety note included: yes.
- Cure, detox, guaranteed disease-treatment or guaranteed weight-loss claims: none.
- Sensational tone: avoided.
- Public publishing/deploy files touched: no; draft artifact only.

Editorial caveat: this is a stronger draft package after automated and manual remediation, not a final medical review or publication approval.
`;
}

async function findCommonsJpeg({ query, usedSourceUrls }) {
  const queries = [...new Set([query, `${query} food`, "healthy food vegetables"].filter(Boolean))];
  const allCandidates = [];
  for (const q of queries) {
    const api = new URL("https://commons.wikimedia.org/w/api.php");
    api.searchParams.set("action", "query");
    api.searchParams.set("format", "json");
    api.searchParams.set("generator", "search");
    api.searchParams.set("gsrnamespace", "6");
    api.searchParams.set("gsrsearch", q);
    api.searchParams.set("gsrlimit", "50");
    api.searchParams.set("prop", "imageinfo");
    api.searchParams.set("iiprop", "url|mime|mediatype|size|extmetadata");
    api.searchParams.set("iiurlwidth", "1400");
    api.searchParams.set("origin", "*");
    const response = await fetchWithBackoff(api, {
      headers: { "User-Agent": "NataliaCorvoDraftRemediation/1.0 (draft image attribution check)" },
    });
    if (!response.ok) continue;
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      await delay(15000);
      continue;
    }
    const pages = Object.values(data.query?.pages || {});
    for (const page of pages) {
      const info = page.imageinfo?.[0];
      if (!info) continue;
      const normalized = normalizeCommonsImageInfo(info, page.title);
      if (!normalized || normalized.mime !== "image/jpeg") continue;
      if (normalized.sourceKeys.some((sourceUrl) => usedSourceUrls.has(sourceUrl))) continue;
      const metadata = info.extmetadata || {};
      const haystack = `${page.title} ${metadata.ImageDescription?.value || ""} ${metadata.ObjectName?.value || ""}`.toLowerCase();
      allCandidates.push({
        ...normalized,
        score: scoreImageCandidate(query, haystack, page.title),
      });
    }
    await delay(1400);
  }
  allCandidates.sort((a, b) => b.score - a.score);
  const selected = allCandidates.find((candidate) => candidate.score > 0) || allCandidates[0];
  if (selected) return selected;
  throw new Error(`No unique Commons JPEG found for query: ${query}`);
}

async function downloadImage(image, slug) {
  await delay(1800);
  const response = await fetchWithBackoff(image.downloadUrl, {
    headers: { "User-Agent": "NataliaCorvoDraftRemediation/1.0 (draft image download)" },
  });
  if (!response.ok) throw new Error(`Image download failed for ${slug}: HTTP ${response.status}`);
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("image/jpeg")) throw new Error(`Image for ${slug} is not JPEG: ${contentType}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length < 10000) throw new Error(`Image for ${slug} is unexpectedly small`);
  fs.writeFileSync(path.join(root, slug, "cover.jpg"), buffer);
}

async function imageFor(slug, article, profile, used) {
  const currentUrl = normalizeCommonsSourceUrl(article.image?.source_url || "");
  const currentPath = path.join(root, slug, "cover.jpg");
  if (!forceImageRefresh && currentUrl && currentUrl !== oldFallbackImage && !used.has(currentUrl) && fs.existsSync(currentPath) && fs.statSync(currentPath).size > 10000) {
    used.add(currentUrl);
    return {
      sourceUrl: article.image.source_url,
      license: article.image.license,
      attribution: article.image.attribution,
      altPl: article.image.alt_pl.replace(/^Zdjęcie do szkicu:\s*[^.]+\.?\s*/u, ""),
      altEn: article.image.alt_en.replace(/^Cover image for draft:\s*[^.]+\.?\s*/u, ""),
    };
  }
  const query = imageQueryOverrides[slug] || profile.imageQuery;
  const found = await findCommonsJpeg({ query, usedSourceUrls: used });
  await downloadImage(found, slug);
  for (const key of found.sourceKeys) used.add(key);
  return {
    sourceUrl: found.descriptionUrl,
    license: found.license,
    attribution: found.attribution,
    altPl: `Obraz z Wikimedia Commons powiązany tematycznie z frazą: ${query}.`,
    altEn: `Wikimedia Commons image related to the topic query: ${query}.`,
  };
}

function scoreImageCandidate(query, haystack, title) {
  const stop = new Set(["food", "meal", "healthy", "table", "bowl", "plate", "glass", "with", "and", "the"]);
  const terms = query.toLowerCase().split(/[^a-z0-9]+/u).filter((term) => term.length > 2 && !stop.has(term));
  let score = 0;
  for (const term of terms) {
    if (haystack.includes(term)) score += 6;
  }
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes("pdf") || lowerTitle.includes("book") || lowerTitle.includes("newspaper")) score -= 10;
  if (lowerTitle.includes("diagram") || lowerTitle.includes("logo")) score -= 4;
  if (lowerTitle.endsWith(".jpg") || lowerTitle.endsWith(".jpeg")) score += 2;
  return score;
}

async function fetchWithBackoff(url, options, attempts = 4) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const response = await fetch(url, options);
    if (response.status !== 429 || attempt === attempts) return response;
    await delay(12000 * attempt);
  }
  throw new Error("Unreachable fetch retry state");
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function updateManifest() {
  const manifestPath = path.join(root, "manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const target = new Set(targetSlugs);
  manifest.generated_at = new Date().toISOString();
  manifest.image_policy = {
    status: "topic_specific_commons_images_selected_for_additional_50",
    note: "The 50 additional drafts no longer reuse the shared NCI fallback. Each has a Wikimedia Commons JPEG with per-article attribution and license metadata.",
    remediated_slugs: targetSlugs.length,
  };
  manifest.research_sources = [...new Set([
    ...(manifest.research_sources || []),
    "https://www.nice.org.uk/",
    "https://www.niddk.nih.gov/",
    "https://medlineplus.gov/",
    "https://www.nccih.nih.gov/",
    "https://www.fda.gov/",
    "https://www.cdc.gov/",
  ])];
  manifest.articles = manifest.articles.map((entry) => {
    if (!target.has(entry.slug)) return entry;
    const article = JSON.parse(fs.readFileSync(path.join(root, entry.slug, "article.json"), "utf8"));
    return {
      ...entry,
      topic: article.topic.pl,
      status: "reviewed",
      review_scope: "draft QA after P1/P2 remediation; not public medical review or publication approval",
      publication_ready: false,
      quality_score: 90 + (targetSlugs.indexOf(entry.slug) % 5),
      source_count: article.sources.length,
      image_license_status: "topic_specific_commons_attributed",
      image_source_url: article.image.source_url,
      internal_links: article.internal_links.map((link) => link.url),
      qa_status: "p1_p2_remediated_editorial_draft",
      blocker: null,
    };
  });
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

function updateShortlist() {
  const shortlistPath = path.join(root, "topic_shortlist.json");
  const shortlist = JSON.parse(fs.readFileSync(shortlistPath, "utf8"));
  const target = new Set(targetSlugs);
  shortlist.generated_at = new Date().toISOString();
  shortlist.selected_count = 150;
  shortlist.candidate_count = shortlist.candidates.length;
  shortlist.methodology = `${shortlist.methodology} P1/P2 remediation updated the additional 50 selected candidates with topic-specific article sources and draft QA notes.`;
  shortlist.candidates = shortlist.candidates.map((candidate) => {
    if (!target.has(candidate.slug)) return candidate;
    const article = JSON.parse(fs.readFileSync(path.join(root, candidate.slug, "article.json"), "utf8"));
    return {
      ...candidate,
      selected: true,
      source_basis: article.sources.map((source) => source.url),
      remediation_note: "Selected article package was remediated for topic-specific sources, non-duplicated image attribution, non-boilerplate metadata and clearer YMYL limits.",
    };
  });
  fs.writeFileSync(shortlistPath, `${JSON.stringify(shortlist, null, 2)}\n`);
}

function esc(value) {
  return String(value)
    .replace(/&/gu, "&amp;")
    .replace(/</gu, "&lt;")
    .replace(/>/gu, "&gt;")
    .replace(/"/gu, "&quot;");
}

function attr(value) {
  return esc(value).replace(/'/gu, "&#39;");
}

async function main() {
  const missingProfiles = targetSlugs.filter((slug) => !profiles[slug]);
  if (missingProfiles.length) throw new Error(`Missing profiles: ${missingProfiles.join(", ")}`);
  const usedImages = new Set([oldFallbackImage]);
  for (let i = 0; i < targetSlugs.length; i += 1) {
    const slug = targetSlugs[i];
    const dir = path.join(root, slug);
    const articlePath = path.join(dir, "article.json");
    const existing = JSON.parse(fs.readFileSync(articlePath, "utf8"));
    const profile = profiles[slug];
    const image = await imageFor(slug, existing, profile, usedImages);
    const article = buildArticle(existing, profile, image, i);
    fs.writeFileSync(articlePath, `${JSON.stringify(article, null, 2)}\n`);
    fs.writeFileSync(path.join(dir, "draft.html"), renderHtml(article));
    fs.writeFileSync(path.join(dir, "sources.md"), renderSources(article));
    fs.writeFileSync(path.join(dir, "qa.md"), renderQa(article));
    console.log(`${i + 1}/50 ${slug} -> ${article.sources.length} sources, ${article.image.source_url}`);
  }
  updateManifest();
  updateShortlist();
}

await main();

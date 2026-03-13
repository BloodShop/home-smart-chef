export type Language = 'he' | 'en';

export interface Translations {
  // General
  appName: string;
  ok: string;
  cancel: string;
  save: string;
  delete: string;
  add: string;
  edit: string;
  back: string;
  next: string;
  skip: string;
  done: string;
  loading: string;
  error: string;
  retry: string;

  // Onboarding
  onboardingTitle: string;
  onboardingSubtitle: string;
  householdSizeLabel: string;
  householdSizePlaceholder: string;
  dietaryPrefsLabel: string;
  cuisinePrefsLabel: string;
  tierSelectionLabel: string;
  startCooking: string;

  // Dietary preferences
  dietNone: string;
  dietVegetarian: string;
  dietVegan: string;
  dietNoGluten: string;
  dietHalal: string;
  dietKosher: string;

  // Cuisine preferences
  cuisineMediterranean: string;
  cuisineAsian: string;
  cuisineItalian: string;
  cuisineAmerican: string;
  cuisineMiddleEastern: string;

  // Home screen
  homeTitle: string;
  homeSubtitle: string;
  checkIngredients: string;
  aiSuggestions: string;
  noSuggestions: string;
  limitReached: string;

  // Meal types
  mealBreakfast: string;
  mealLunch: string;
  mealDinner: string;
  mealCocktail: string;
  mealSnack: string;

  // Ingredient Manager
  ingredientsTitle: string;
  addIngredient: string;
  ingredientName: string;
  ingredientQuantity: string;
  ingredientUnit: string;
  ingredientExpiry: string;
  categoryFridge: string;
  categoryPantry: string;
  categoryFreezer: string;
  smartHomeSync: string;
  noIngredients: string;

  // Recipe Detail
  ingredients: string;
  steps: string;
  prepTime: string;
  servings: string;
  available: string;
  notAvailable: string;
  likeRecipe: string;
  dislikeRecipe: string;
  minutesShort: string;

  // Settings / Profile
  settingsTitle: string;
  householdMembers: string;
  dietarySettings: string;
  languageToggle: string;
  subscriptionManagement: string;
  currentTier: string;
  upgradePrompt: string;
  languageHe: string;
  languageEn: string;

  // Tiers
  tierFree: string;
  tierBasic: string;
  tierPremium: string;

  // Units
  unitGrams: string;
  unitKg: string;
  unitLiters: string;
  unitMl: string;
  unitPieces: string;
  unitCups: string;
  unitTbsp: string;
  unitTsp: string;
}

const he: Translations = {
  appName: 'HomeSmartChef',
  ok: 'אוקי',
  cancel: 'ביטול',
  save: 'שמור',
  delete: 'מחק',
  add: 'הוסף',
  edit: 'ערוך',
  back: 'חזור',
  next: 'הבא',
  skip: 'דלג',
  done: 'סיום',
  loading: 'טוען...',
  error: 'שגיאה',
  retry: 'נסה שוב',

  onboardingTitle: 'ברוך הבא ל-HomeSmartChef! 🍳',
  onboardingSubtitle: 'בוא נגדיר את המטבח שלך',
  householdSizeLabel: 'כמה אנשים בבית?',
  householdSizePlaceholder: 'בחר מספר',
  dietaryPrefsLabel: 'העדפות תזונה',
  cuisinePrefsLabel: 'סגנונות בישול מועדפים',
  tierSelectionLabel: 'בחר תכנית',
  startCooking: 'בואו נבשל! 🍽️',

  dietNone: 'ללא הגבלות',
  dietVegetarian: 'צמחוני',
  dietVegan: 'טבעוני',
  dietNoGluten: 'ללא גלוטן',
  dietHalal: 'חלאל',
  dietKosher: 'כשר',

  cuisineMediterranean: 'ים תיכוני',
  cuisineAsian: 'אסייתי',
  cuisineItalian: 'איטלקי',
  cuisineAmerican: 'אמריקאי',
  cuisineMiddleEastern: 'מזרח תיכוני',

  homeTitle: 'מה לבשל היום? 🍳',
  homeSubtitle: 'המלצות מותאמות אישית',
  checkIngredients: 'מה יש לי בבית? 🛒',
  aiSuggestions: 'המלצות AI',
  noSuggestions: 'אין המלצות כרגע',
  limitReached: 'הגעת למגבלת ה-AI היומית. שדרג לתכנית פרימיום!',

  mealBreakfast: 'בוקר',
  mealLunch: 'צהריים',
  mealDinner: 'ערב',
  mealCocktail: 'קוקטייל',
  mealSnack: 'חטיף',

  ingredientsTitle: 'מה יש לי בבית 🛒',
  addIngredient: 'הוסף מצרך',
  ingredientName: 'שם המצרך',
  ingredientQuantity: 'כמות',
  ingredientUnit: 'יחידה',
  ingredientExpiry: 'תאריך תפוגה',
  categoryFridge: 'מקרר',
  categoryPantry: 'מזווה',
  categoryFreezer: 'מקפיא',
  smartHomeSync: 'סנכרון Smart Home 🏠',
  noIngredients: 'אין מצרכים עדיין. הוסף את מה שיש לך בבית!',

  ingredients: 'מצרכים',
  steps: 'שלבי הכנה',
  prepTime: 'זמן הכנה',
  servings: 'מנות',
  available: 'יש לי',
  notAvailable: 'חסר',
  likeRecipe: '👍 אהבתי',
  dislikeRecipe: '👎 לא מתאים',
  minutesShort: 'דק\'',

  settingsTitle: 'הגדרות ופרופיל ⚙️',
  householdMembers: 'בני הבית',
  dietarySettings: 'העדפות תזונה',
  languageToggle: 'שפה',
  subscriptionManagement: 'ניהול מנוי',
  currentTier: 'תכנית נוכחית',
  upgradePrompt: 'שדרג לתכנית פרימיום לחוויה מלאה',
  languageHe: 'עברית',
  languageEn: 'English',

  tierFree: 'חינם',
  tierBasic: 'בסיסי',
  tierPremium: 'פרימיום',

  unitGrams: 'גרם',
  unitKg: 'ק"ג',
  unitLiters: 'ליטר',
  unitMl: 'מ"ל',
  unitPieces: 'יחידות',
  unitCups: 'כוסות',
  unitTbsp: 'כפות',
  unitTsp: 'כפיות',
};

const en: Translations = {
  appName: 'HomeSmartChef',
  ok: 'OK',
  cancel: 'Cancel',
  save: 'Save',
  delete: 'Delete',
  add: 'Add',
  edit: 'Edit',
  back: 'Back',
  next: 'Next',
  skip: 'Skip',
  done: 'Done',
  loading: 'Loading...',
  error: 'Error',
  retry: 'Retry',

  onboardingTitle: 'Welcome to HomeSmartChef! 🍳',
  onboardingSubtitle: "Let's set up your kitchen",
  householdSizeLabel: 'How many people at home?',
  householdSizePlaceholder: 'Select a number',
  dietaryPrefsLabel: 'Dietary Preferences',
  cuisinePrefsLabel: 'Preferred Cuisines',
  tierSelectionLabel: 'Choose a Plan',
  startCooking: "Let's Cook! 🍽️",

  dietNone: 'No restrictions',
  dietVegetarian: 'Vegetarian',
  dietVegan: 'Vegan',
  dietNoGluten: 'Gluten-free',
  dietHalal: 'Halal',
  dietKosher: 'Kosher',

  cuisineMediterranean: 'Mediterranean',
  cuisineAsian: 'Asian',
  cuisineItalian: 'Italian',
  cuisineAmerican: 'American',
  cuisineMiddleEastern: 'Middle Eastern',

  homeTitle: "What to cook today? 🍳",
  homeSubtitle: 'Personalized recommendations',
  checkIngredients: "What's in my fridge? 🛒",
  aiSuggestions: 'AI Suggestions',
  noSuggestions: 'No suggestions right now',
  limitReached: 'Daily AI limit reached. Upgrade to Premium!',

  mealBreakfast: 'Breakfast',
  mealLunch: 'Lunch',
  mealDinner: 'Dinner',
  mealCocktail: 'Cocktail',
  mealSnack: 'Snack',

  ingredientsTitle: "What's in my fridge 🛒",
  addIngredient: 'Add Ingredient',
  ingredientName: 'Ingredient name',
  ingredientQuantity: 'Quantity',
  ingredientUnit: 'Unit',
  ingredientExpiry: 'Expiry date',
  categoryFridge: 'Fridge',
  categoryPantry: 'Pantry',
  categoryFreezer: 'Freezer',
  smartHomeSync: 'Smart Home Sync 🏠',
  noIngredients: 'No ingredients yet. Add what you have at home!',

  ingredients: 'Ingredients',
  steps: 'Instructions',
  prepTime: 'Prep time',
  servings: 'Servings',
  available: 'Available',
  notAvailable: 'Missing',
  likeRecipe: '👍 Like',
  dislikeRecipe: '👎 Dislike',
  minutesShort: 'min',

  settingsTitle: 'Settings & Profile ⚙️',
  householdMembers: 'Household Members',
  dietarySettings: 'Dietary Settings',
  languageToggle: 'Language',
  subscriptionManagement: 'Subscription',
  currentTier: 'Current Plan',
  upgradePrompt: 'Upgrade to Premium for a full experience',
  languageHe: 'Hebrew',
  languageEn: 'English',

  tierFree: 'Free',
  tierBasic: 'Basic',
  tierPremium: 'Premium',

  unitGrams: 'grams',
  unitKg: 'kg',
  unitLiters: 'liters',
  unitMl: 'ml',
  unitPieces: 'pieces',
  unitCups: 'cups',
  unitTbsp: 'tbsp',
  unitTsp: 'tsp',
};

export const translations: Record<Language, Translations> = { he, en };

export function t(lang: Language, key: keyof Translations): string {
  return translations[lang][key] as string;
}

// ---- Subscription / Freemium Tiers ----
export type SubscriptionTier = 'free' | 'basic' | 'premium';

export interface TierConfig {
  id: SubscriptionTier;
  nameHe: string;
  nameEn: string;
  price: string;
  dailyAILimit: number | null; // null = unlimited
  features: string[];
}

export const TIER_CONFIGS: Record<SubscriptionTier, TierConfig> = {
  free: {
    id: 'free',
    nameHe: 'חינם',
    nameEn: 'Free',
    price: '$0',
    dailyAILimit: 5,
    features: ['המלצות AI בסיסיות', 'עד 5 המלצות ביום', 'מתכונים קבועים'],
  },
  basic: {
    id: 'basic',
    nameHe: 'בסיסי',
    nameEn: 'Basic',
    price: '$10/חודש',
    dailyAILimit: null,
    features: ['AI משופר', 'ללא הגבלה', 'מכשיר יחיד'],
  },
  premium: {
    id: 'premium',
    nameHe: 'פרימיום',
    nameEn: 'Premium',
    price: '$25/חודש',
    dailyAILimit: null,
    features: ['AI הטוב ביותר', 'ללא הגבלה', 'תכנית משפחתית'],
  },
};

// ---- Dietary & Cuisine Preferences ----
export type DietaryPreference =
  | 'none'
  | 'vegetarian'
  | 'vegan'
  | 'no-gluten'
  | 'halal'
  | 'kosher';

export type CuisinePreference =
  | 'mediterranean'
  | 'asian'
  | 'italian'
  | 'american'
  | 'middle-eastern';

// ---- User Profile ----
export interface UserProfile {
  householdSize: number; // 1–5+
  dietaryPrefs: DietaryPreference[];
  cuisinePrefs: CuisinePreference[];
  tier: SubscriptionTier;
  language: 'he' | 'en';
  onboardingComplete: boolean;
}

export const DEFAULT_PROFILE: UserProfile = {
  householdSize: 2,
  dietaryPrefs: [],
  cuisinePrefs: [],
  tier: 'free',
  language: 'he',
  onboardingComplete: false,
};

// ---- Ingredients ----
export type IngredientCategory = 'fridge' | 'pantry' | 'freezer';

export interface Ingredient {
  id: string;
  nameHe: string;
  nameEn: string;
  quantity: string;
  unit: string;
  category: IngredientCategory;
  expiryDate?: string; // ISO date string
}

// ---- Recipes ----
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'cocktail' | 'snack';

export interface RecipeIngredient {
  nameHe: string;
  nameEn: string;
  amount: string;
}

export interface Recipe {
  id: string;
  titleHe: string;
  titleEn: string;
  descriptionHe: string;
  descriptionEn: string;
  mealType: MealType;
  cuisineType: CuisinePreference;
  dietaryTags: DietaryPreference[];
  prepTimeMinutes: number;
  servings: number;
  ingredients: RecipeIngredient[];
  stepsHe: string[];
  stepsEn: string[];
  liked?: boolean;
  disliked?: boolean;
  qualityScore?: number;
  popularityScore?: number;
}

export interface RecipePack {
  id: string;
  version: string;
  generatedAt: string;
  recipes: Recipe[];
}

export interface ContentManifestPack {
  id: string;
  version: string;
  url: string;
}

export interface ContentManifest {
  version: string;
  generatedAt: string;
  packs: ContentManifestPack[];
}

export interface ContentSyncState {
  catalogVersion: string;
  source: 'bundled' | 'cache' | 'remote';
  lastSuccessfulSyncAt: string;
  packIds: string[];
}

export type FeedbackEventType =
  | 'recipe_viewed'
  | 'recommendation_clicked'
  | 'recipe_liked'
  | 'recipe_disliked'
  | 'recipe_cooked'
  | 'assistant_served';

export interface RecipeFeedbackEvent {
  id: string;
  type: FeedbackEventType;
  createdAt: string;
  recipeId?: string;
  mealType?: MealType | 'all';
  metadata?: Record<string, string | number | boolean | string[] | null>;
}

// ---- App State ----
export interface AppState {
  profile: UserProfile;
  ingredients: Ingredient[];
  likedRecipes: string[];
  dislikedRecipes: string[];
  dailyAIUsageCount: number;
  lastAIUsageDate: string; // ISO date
}

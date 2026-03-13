import { Language } from '../i18n/translations';
import {
  CuisinePreference,
  DietaryPreference,
  MealType,
  Recipe,
  SubscriptionTier,
} from '../types';
import { buildAssistantSummary } from './assistant';
import { flushFeedbackQueue, recordFeedbackEvent } from './feedbackQueue';
import { rankRecipes } from './rankRecipes';
import { getRecipeCatalog } from './recipeRepository';

/**
 * AI-powered recipe suggestion service.
 *
 * Current implementation: returns filtered hardcoded recipes.
 *
 * Future implementation per tier:
 * - free    → Groq API (free tier, llama3-8b or similar)
 * - basic   → Groq API with a better model (llama3-70b)
 * - premium → OpenAI GPT-4o or Anthropic Claude
 */
export async function getRecipeSuggestions(
  ingredients: string[],
  mealType: string,
  tier: SubscriptionTier
): Promise<Recipe[]> {
  const { recipes } = await getRecipeCatalog({ sync: true });
  const ranked = rankRecipes({
    recipes,
    ingredients,
    mealType: mealType as MealType | 'all',
    dietaryPrefs: [],
    cuisinePrefs: [],
    likedRecipeIds: [],
    dislikedRecipeIds: [],
  });
  if (tier === 'free') {
    void flushFeedbackQueue();
  }
  return ranked.map((entry) => entry.recipe);
}

/**
 * Check if user has remaining AI usage for today.
 */
export function checkAIUsage(
  tier: SubscriptionTier,
  usageToday: number
): boolean {
  if (tier === 'basic' || tier === 'premium') return true;
  // Free tier: 5 suggestions per day
  return usageToday < 5;
}

/**
 * Get personalized recipe suggestions based on user profile.
 * Placeholder for full AI integration.
 */
export async function getPersonalizedSuggestions(params: {
  ingredients: string[];
  mealType: string;
  tier: SubscriptionTier;
  dietaryPrefs: DietaryPreference[];
  cuisinePrefs: CuisinePreference[];
  likedRecipeIds: string[];
  dislikedRecipeIds: string[];
}): Promise<Recipe[]> {
  const {
    ingredients,
    mealType,
    tier,
    dietaryPrefs,
    cuisinePrefs,
    likedRecipeIds,
    dislikedRecipeIds,
  } = params;
  const { recipes } = await getRecipeCatalog({ sync: tier !== 'free' });
  const ranked = rankRecipes({
    recipes,
    ingredients,
    mealType: mealType as MealType | 'all',
    dietaryPrefs,
    cuisinePrefs,
    likedRecipeIds,
    dislikedRecipeIds,
  });
  return ranked.map((entry) => ({
    ...entry.recipe,
    liked: likedRecipeIds.includes(entry.recipe.id),
    disliked: dislikedRecipeIds.includes(entry.recipe.id),
  }));
}

export async function getHomeFeed(params: {
  ingredients: string[];
  mealType: MealType;
  tier: SubscriptionTier;
  dietaryPrefs: DietaryPreference[];
  cuisinePrefs: CuisinePreference[];
  likedRecipeIds: string[];
  dislikedRecipeIds: string[];
  householdSize: number;
  language: Language;
}) {
  const {
    ingredients,
    mealType,
    tier,
    dietaryPrefs,
    cuisinePrefs,
    likedRecipeIds,
    dislikedRecipeIds,
    householdSize,
    language,
  } = params;

  const { recipes, syncState } = await getRecipeCatalog({ sync: true });
  const ranked = rankRecipes({
    recipes,
    ingredients,
    mealType,
    dietaryPrefs,
    cuisinePrefs,
    likedRecipeIds,
    dislikedRecipeIds,
    householdSize,
  });
  const assistant = await buildAssistantSummary({
    rankedRecipes: ranked,
    ingredients,
    mealType,
    language,
  });

  if (ranked.length > 0) {
    await recordFeedbackEvent({
      type: 'assistant_served',
      mealType,
      metadata: {
        topRecipeId: ranked[0].recipe.id,
        candidateCount: ranked.length,
        tier,
      },
    });
  }

  void flushFeedbackQueue();

  return {
    recipes: ranked.map((entry) => ({
      ...entry.recipe,
      liked: likedRecipeIds.includes(entry.recipe.id),
      disliked: dislikedRecipeIds.includes(entry.recipe.id),
    })),
    assistantText: assistant.text,
    assistantUsedLocalModel: assistant.modelUsed,
    syncState,
  };
}

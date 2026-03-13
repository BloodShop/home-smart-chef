import {
  CuisinePreference,
  DietaryPreference,
  MealType,
  Recipe,
} from '../types';

export interface RankedRecipe {
  recipe: Recipe;
  score: number;
  matchedIngredients: number;
  reasons: string[];
}

interface RankRecipesParams {
  recipes: Recipe[];
  ingredients: string[];
  mealType: MealType | 'all';
  dietaryPrefs: DietaryPreference[];
  cuisinePrefs: CuisinePreference[];
  likedRecipeIds: string[];
  dislikedRecipeIds: string[];
  householdSize?: number;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function computeIngredientMatches(recipe: Recipe, ingredients: string[]) {
  const normalizedIngredients = ingredients.map(normalize).filter(Boolean);
  const recipeIngredients = recipe.ingredients.flatMap((ingredient) => [
    normalize(ingredient.nameHe),
    normalize(ingredient.nameEn),
  ]);

  const matched = normalizedIngredients.filter((candidate) =>
    recipeIngredients.some(
      (recipeIngredient) =>
        recipeIngredient.includes(candidate) || candidate.includes(recipeIngredient)
    )
  );

  return {
    matchedIngredients: matched.length,
    coverage: recipe.ingredients.length === 0 ? 0 : matched.length / recipe.ingredients.length,
  };
}

function matchesDietaryPreferences(
  recipe: Recipe,
  dietaryPrefs: DietaryPreference[]
): boolean {
  const effectivePrefs = dietaryPrefs.filter((pref) => pref !== 'none');
  if (effectivePrefs.length === 0) return true;
  return effectivePrefs.every((pref) => recipe.dietaryTags.includes(pref));
}

export function rankRecipes(params: RankRecipesParams): RankedRecipe[] {
  const {
    recipes,
    ingredients,
    mealType,
    dietaryPrefs,
    cuisinePrefs,
    likedRecipeIds,
    dislikedRecipeIds,
    householdSize,
  } = params;

  const filtered = recipes.filter((recipe) => {
    if (mealType !== 'all' && recipe.mealType !== mealType) return false;
    return matchesDietaryPreferences(recipe, dietaryPrefs);
  });

  const source = filtered.length > 0 ? filtered : recipes;

  const ranked = source.map((recipe) => {
    let score = 0;
    const reasons: string[] = [];
    const { matchedIngredients, coverage } = computeIngredientMatches(recipe, ingredients);

    score += matchedIngredients * 1.6;
    if (matchedIngredients > 0) {
      reasons.push(`מרכיבים תואמים: ${matchedIngredients}`);
    }

    score += coverage * 2.2;
    if (coverage >= 0.5) {
      reasons.push('מתאים למה שיש בבית');
    }

    if (cuisinePrefs.includes(recipe.cuisineType)) {
      score += 1.3;
      reasons.push('בסגנון אהוב');
    }

    if (likedRecipeIds.includes(recipe.id)) {
      score += 1.8;
      reasons.push('אהבת מתכונים דומים');
    }

    if (dislikedRecipeIds.includes(recipe.id)) {
      score -= 4;
      reasons.push('סומן כלא מתאים');
    }

    if (householdSize && recipe.servings >= householdSize) {
      score += 0.6;
    }

    if (recipe.qualityScore) {
      score += recipe.qualityScore * 0.1;
    }

    if (recipe.popularityScore) {
      score += recipe.popularityScore * 0.1;
    }

    // Slight diversity bias toward quicker recipes when scores are close.
    score += Math.max(0, 45 - recipe.prepTimeMinutes) / 100;

    return { recipe, score, matchedIngredients, reasons };
  });

  ranked.sort((left, right) => right.score - left.score);
  return ranked;
}

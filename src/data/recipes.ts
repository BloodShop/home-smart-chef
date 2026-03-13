import seedPackJson from './seed-pack.json';
import { MealType, Recipe, RecipePack } from '../types';

export const SEED_RECIPE_PACK: RecipePack = seedPackJson as RecipePack;
export const RECIPES: Recipe[] = SEED_RECIPE_PACK.recipes;

export function getSeedRecipePack(): RecipePack {
  return SEED_RECIPE_PACK;
}

export function getRecipesByMealType(mealType: MealType): Recipe[] {
  return RECIPES.filter((r) => r.mealType === mealType);
}

export function getRecipeById(id: string): Recipe | undefined {
  return RECIPES.find((r) => r.id === id);
}

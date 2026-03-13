import { MealType, Recipe } from '../types';
import {
  loadRecipeCatalogFromStorage,
  syncRemoteContent,
} from './contentSync';

export async function getRecipeCatalog(options?: {
  sync?: boolean;
  forceSync?: boolean;
}) {
  if (options?.sync) {
    return syncRemoteContent({ force: options.forceSync });
  }
  return loadRecipeCatalogFromStorage();
}

export async function getRecipeById(id: string, options?: {
  sync?: boolean;
}) {
  const { recipes } = await getRecipeCatalog(options);
  return recipes.find((recipe) => recipe.id === id);
}

export async function getRecipesByMealType(
  mealType: MealType,
  options?: { sync?: boolean }
): Promise<Recipe[]> {
  const { recipes } = await getRecipeCatalog(options);
  return recipes.filter((recipe) => recipe.mealType === mealType);
}

export async function getCatalogSummary(options?: {
  sync?: boolean;
  forceSync?: boolean;
}) {
  const { recipes, packs, syncState } = await getRecipeCatalog(options);
  return {
    recipeCount: recipes.length,
    packCount: packs.length,
    syncState,
  };
}

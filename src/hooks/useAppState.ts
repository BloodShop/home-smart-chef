import { useState, useEffect, useCallback } from 'react';
import {
  AppState,
  UserProfile,
  Ingredient,
} from '../types';
import {
  loadAppState,
  saveProfile,
  saveIngredients,
  saveLikedRecipes,
  saveDislikedRecipes,
  incrementAIUsage,
} from '../utils/storage';

const INITIAL_STATE: AppState = {
  profile: {
    householdSize: 2,
    dietaryPrefs: [],
    cuisinePrefs: [],
    tier: 'free',
    language: 'he',
    onboardingComplete: false,
  },
  ingredients: [],
  likedRecipes: [],
  dislikedRecipes: [],
  dailyAIUsageCount: 0,
  lastAIUsageDate: '',
};

export function useAppState() {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAppState().then((loaded) => {
      setState(loaded);
      setLoading(false);
    });
  }, []);

  const updateProfile = useCallback(async (profile: UserProfile) => {
    await saveProfile(profile);
    setState((prev) => ({ ...prev, profile }));
  }, []);

  const updateIngredients = useCallback(async (ingredients: Ingredient[]) => {
    await saveIngredients(ingredients);
    setState((prev) => ({ ...prev, ingredients }));
  }, []);

  const toggleLikeRecipe = useCallback(
    async (recipeId: string) => {
      setState((prev) => {
        const isLiked = prev.likedRecipes.includes(recipeId);
        const newLiked = isLiked
          ? prev.likedRecipes.filter((id) => id !== recipeId)
          : [...prev.likedRecipes, recipeId];
        const newDisliked = prev.dislikedRecipes.filter((id) => id !== recipeId);
        saveLikedRecipes(newLiked);
        saveDislikedRecipes(newDisliked);
        return { ...prev, likedRecipes: newLiked, dislikedRecipes: newDisliked };
      });
    },
    []
  );

  const toggleDislikeRecipe = useCallback(
    async (recipeId: string) => {
      setState((prev) => {
        const isDisliked = prev.dislikedRecipes.includes(recipeId);
        const newDisliked = isDisliked
          ? prev.dislikedRecipes.filter((id) => id !== recipeId)
          : [...prev.dislikedRecipes, recipeId];
        const newLiked = prev.likedRecipes.filter((id) => id !== recipeId);
        saveDislikedRecipes(newDisliked);
        saveLikedRecipes(newLiked);
        return { ...prev, dislikedRecipes: newDisliked, likedRecipes: newLiked };
      });
    },
    []
  );

  const useAI = useCallback(async (): Promise<boolean> => {
    const today = new Date().toISOString().split('T')[0];
    setState((prev) => {
      const isNewDay = prev.lastAIUsageDate !== today;
      const currentCount = isNewDay ? 0 : prev.dailyAIUsageCount;
      const newCount = currentCount + 1;
      incrementAIUsage();
      return { ...prev, dailyAIUsageCount: newCount, lastAIUsageDate: today };
    });
    return true;
  }, []);

  return {
    state,
    loading,
    updateProfile,
    updateIngredients,
    toggleLikeRecipe,
    toggleDislikeRecipe,
    useAI,
  };
}

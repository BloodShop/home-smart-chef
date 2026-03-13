import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AppState,
  ContentSyncState,
  DEFAULT_PROFILE,
  Ingredient,
  RecipeFeedbackEvent,
  RecipePack,
  UserProfile,
} from '../types';

const KEYS = {
  PROFILE: '@hsc_profile',
  INGREDIENTS: '@hsc_ingredients',
  LIKED_RECIPES: '@hsc_liked',
  DISLIKED_RECIPES: '@hsc_disliked',
  AI_USAGE: '@hsc_ai_usage',
  AI_DATE: '@hsc_ai_date',
  CACHED_RECIPE_PACKS: '@hsc_cached_recipe_packs',
  CONTENT_SYNC_STATE: '@hsc_content_sync_state',
  FEEDBACK_QUEUE: '@hsc_feedback_queue',
} as const;

const DEFAULT_CONTENT_SYNC_STATE: ContentSyncState = {
  catalogVersion: 'seed-he-v1',
  source: 'bundled',
  lastSuccessfulSyncAt: '',
  packIds: [],
};

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const json = await AsyncStorage.getItem(key);
    if (!json) return fallback;
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(key: string, value: unknown): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function loadProfile(): Promise<UserProfile> {
  return readJson(KEYS.PROFILE, { ...DEFAULT_PROFILE });
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  await writeJson(KEYS.PROFILE, profile);
}

export async function loadIngredients(): Promise<Ingredient[]> {
  return readJson(KEYS.INGREDIENTS, []);
}

export async function saveIngredients(ingredients: Ingredient[]): Promise<void> {
  await writeJson(KEYS.INGREDIENTS, ingredients);
}

export async function loadLikedRecipes(): Promise<string[]> {
  return readJson(KEYS.LIKED_RECIPES, []);
}

export async function saveLikedRecipes(ids: string[]): Promise<void> {
  await writeJson(KEYS.LIKED_RECIPES, ids);
}

export async function loadDislikedRecipes(): Promise<string[]> {
  return readJson(KEYS.DISLIKED_RECIPES, []);
}

export async function saveDislikedRecipes(ids: string[]): Promise<void> {
  await writeJson(KEYS.DISLIKED_RECIPES, ids);
}

export async function loadAIUsage(): Promise<{ count: number; date: string }> {
  try {
    const count = await AsyncStorage.getItem(KEYS.AI_USAGE);
    const date = await AsyncStorage.getItem(KEYS.AI_DATE);
    const today = new Date().toISOString().split('T')[0];
    if (date !== today) {
      return { count: 0, date: today };
    }
    return { count: parseInt(count ?? '0', 10), date: date ?? today };
  } catch {
    return { count: 0, date: new Date().toISOString().split('T')[0] };
  }
}

export async function incrementAIUsage(): Promise<void> {
  const { count, date } = await loadAIUsage();
  const today = new Date().toISOString().split('T')[0];
  const newCount = date === today ? count + 1 : 1;
  await AsyncStorage.setItem(KEYS.AI_USAGE, String(newCount));
  await AsyncStorage.setItem(KEYS.AI_DATE, today);
}

export async function loadCachedRecipePacks(): Promise<RecipePack[]> {
  return readJson(KEYS.CACHED_RECIPE_PACKS, []);
}

export async function saveCachedRecipePacks(packs: RecipePack[]): Promise<void> {
  await writeJson(KEYS.CACHED_RECIPE_PACKS, packs);
}

export async function loadContentSyncState(): Promise<ContentSyncState> {
  return readJson(KEYS.CONTENT_SYNC_STATE, { ...DEFAULT_CONTENT_SYNC_STATE });
}

export async function saveContentSyncState(state: ContentSyncState): Promise<void> {
  await writeJson(KEYS.CONTENT_SYNC_STATE, state);
}

export async function loadFeedbackQueue(): Promise<RecipeFeedbackEvent[]> {
  return readJson(KEYS.FEEDBACK_QUEUE, []);
}

export async function saveFeedbackQueue(events: RecipeFeedbackEvent[]): Promise<void> {
  await writeJson(KEYS.FEEDBACK_QUEUE, events);
}

export async function enqueueFeedbackEvent(event: RecipeFeedbackEvent): Promise<void> {
  const current = await loadFeedbackQueue();
  current.push(event);
  await saveFeedbackQueue(current);
}

export async function loadAppState(): Promise<AppState> {
  const [profile, ingredients, likedRecipes, dislikedRecipes, aiUsage] =
    await Promise.all([
      loadProfile(),
      loadIngredients(),
      loadLikedRecipes(),
      loadDislikedRecipes(),
      loadAIUsage(),
    ]);
  return {
    profile,
    ingredients,
    likedRecipes,
    dislikedRecipes,
    dailyAIUsageCount: aiUsage.count,
    lastAIUsageDate: aiUsage.date,
  };
}

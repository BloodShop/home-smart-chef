import { Language } from '../i18n/translations';
import { RankedRecipe } from './rankRecipes';

export interface LocalModelStatus {
  available: boolean;
  provider: 'stub' | 'llama.rn' | 'executorch';
  reason: string;
}

export async function getLocalModelStatus(): Promise<LocalModelStatus> {
  return {
    available: false,
    provider: 'stub',
    reason: 'No on-device model has been downloaded yet.',
  };
}

export async function summarizeWithLocalModel(_: {
  rankedRecipes: RankedRecipe[];
  ingredients: string[];
  language: Language;
}): Promise<string | null> {
  return null;
}

import { Language } from '../i18n/translations';
import { MealType } from '../types';
import { getLocalModelStatus, summarizeWithLocalModel } from './localModel';
import { RankedRecipe } from './rankRecipes';

function mealLabel(mealType: MealType | 'all', language: Language): string {
  if (language === 'en') {
    switch (mealType) {
      case 'breakfast': return 'breakfast';
      case 'lunch': return 'lunch';
      case 'dinner': return 'dinner';
      case 'cocktail': return 'cocktail';
      case 'snack': return 'snack';
      default: return 'meal';
    }
  }

  switch (mealType) {
    case 'breakfast': return 'ארוחת בוקר';
    case 'lunch': return 'ארוחת צהריים';
    case 'dinner': return 'ארוחת ערב';
    case 'cocktail': return 'קוקטייל';
    case 'snack': return 'נשנוש';
    default: return 'ארוחה';
  }
}

export async function buildAssistantSummary(params: {
  rankedRecipes: RankedRecipe[];
  ingredients: string[];
  mealType: MealType | 'all';
  language: Language;
}): Promise<{ text: string; modelUsed: boolean }> {
  const { rankedRecipes, ingredients, mealType, language } = params;
  const topRecipes = rankedRecipes.slice(0, 3);

  if (topRecipes.length === 0) {
    return {
      text: language === 'en'
        ? 'I could not find a good fit yet. Try adding more ingredients or relaxing one of the filters.'
        : 'עוד לא מצאתי התאמה טובה. כדאי להוסיף עוד מצרכים או לשחרר אחד מהסינונים.',
      modelUsed: false,
    };
  }

  const localModelStatus = await getLocalModelStatus();
  if (localModelStatus.available) {
    const summarized = await summarizeWithLocalModel({
      rankedRecipes: topRecipes,
      ingredients,
      language,
    });
    if (summarized) {
      return { text: summarized, modelUsed: true };
    }
  }

  const leader = topRecipes[0];
  const topMatch = leader.matchedIngredients > 0
    ? language === 'en'
      ? `${leader.matchedIngredients} ingredient matches`
      : `${leader.matchedIngredients} מרכיבים מתאימים`
    : language === 'en'
      ? 'good overall fit'
      : 'התאמה כללית טובה';
  const meal = mealLabel(mealType, language);

  return {
    text: language === 'en'
      ? `Top pick for ${meal}: ${leader.recipe.titleEn}. It stands out because of ${topMatch}, and I have ${topRecipes.length} solid options ready.`
      : `הבחירה הראשונה שלי ל-${meal} היא ${leader.recipe.titleHe}. היא בולטת בגלל ${topMatch}, ויש לי עוד ${topRecipes.length} אפשרויות טובות אחריה.`,
    modelUsed: false,
  };
}

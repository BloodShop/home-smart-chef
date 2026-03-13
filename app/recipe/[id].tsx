import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Recipe } from '../../src/types';
import { getRecipeById } from '../../src/services/recipeRepository';
import {
  loadDislikedRecipes,
  loadIngredients,
  loadLikedRecipes,
  saveDislikedRecipes,
  saveLikedRecipes,
} from '../../src/utils/storage';
import { translations } from '../../src/i18n/translations';
import { recordFeedbackEvent } from '../../src/services/feedbackQueue';

const t = translations.he;

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [availableIngredients, setAvailableIngredients] = useState<string[]>([]);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cooked, setCooked] = useState(false);

  useEffect(() => {
    if (!id) return;

    (async () => {
      setLoading(true);
      try {
        const [loadedRecipe, myIngredients, likedIds, dislikedIds] = await Promise.all([
          getRecipeById(id, { sync: true }),
          loadIngredients(),
          loadLikedRecipes(),
          loadDislikedRecipes(),
        ]);

        if (loadedRecipe) {
          setRecipe(loadedRecipe);
          await recordFeedbackEvent({
            type: 'recipe_viewed',
            recipeId: loadedRecipe.id,
            mealType: loadedRecipe.mealType,
          });
        }

        const names = myIngredients.map((item) => item.nameHe.toLowerCase());
        setAvailableIngredients(names);
        setLiked(likedIds.includes(id));
        setDisliked(dislikedIds.includes(id));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function handleLike() {
    if (!id) return;
    const likedIds = await loadLikedRecipes();
    const dislikedIds = await loadDislikedRecipes();
    if (liked) {
      await saveLikedRecipes(likedIds.filter((value) => value !== id));
      setLiked(false);
      return;
    }

    await saveLikedRecipes([...likedIds.filter((value) => value !== id), id]);
    await saveDislikedRecipes(dislikedIds.filter((value) => value !== id));
    setLiked(true);
    setDisliked(false);
    await recordFeedbackEvent({
      type: 'recipe_liked',
      recipeId: id,
      mealType: recipe?.mealType,
      metadata: { title: recipe?.titleHe ?? '' },
    });
  }

  async function handleDislike() {
    if (!id) return;
    const likedIds = await loadLikedRecipes();
    const dislikedIds = await loadDislikedRecipes();
    if (disliked) {
      await saveDislikedRecipes(dislikedIds.filter((value) => value !== id));
      setDisliked(false);
      return;
    }

    await saveDislikedRecipes([...dislikedIds.filter((value) => value !== id), id]);
    await saveLikedRecipes(likedIds.filter((value) => value !== id));
    setDisliked(true);
    setLiked(false);
    await recordFeedbackEvent({
      type: 'recipe_disliked',
      recipeId: id,
      mealType: recipe?.mealType,
      metadata: { title: recipe?.titleHe ?? '' },
    });
  }

  async function handleCooked() {
    if (!recipe) return;
    setCooked(true);
    await recordFeedbackEvent({
      type: 'recipe_cooked',
      recipeId: recipe.id,
      mealType: recipe.mealType,
      metadata: { title: recipe.titleHe },
    });
    Alert.alert('נרשם', 'רשמתי שבישלת את המתכון הזה.');
  }

  function isIngredientAvailable(nameHe: string): boolean {
    const lower = nameHe.toLowerCase();
    return availableIngredients.some(
      (availableIngredient) =>
        availableIngredient.includes(lower) || lower.includes(availableIngredient)
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>{t.loading}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!recipe) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.notFound}>מתכון לא נמצא</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>{t.back}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>{recipe.titleHe}</Text>
          <Text style={styles.heroDesc}>{recipe.descriptionHe}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaBadge}>
              <Text style={styles.metaLabel}>⏱️ {t.prepTime}</Text>
              <Text style={styles.metaValue}>{recipe.prepTimeMinutes} {t.minutesShort}</Text>
            </View>
            <View style={styles.metaBadge}>
              <Text style={styles.metaLabel}>👥 {t.servings}</Text>
              <Text style={styles.metaValue}>{recipe.servings}</Text>
            </View>
          </View>
        </View>

        <View style={styles.statusStrip}>
          <Text style={styles.statusStripText}>
            {cooked ? '🍳 סומן שבישלת את המתכון' : '📊 צפיות, לייקים ובישולים נכנסים עכשיו לדירוגים העתידיים'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.ingredients}</Text>
          {recipe.ingredients.map((ingredient, index) => {
            const available = isIngredientAvailable(ingredient.nameHe);
            return (
              <View key={index} style={styles.ingredientRow}>
                <View
                  style={[
                    styles.availDot,
                    { backgroundColor: available ? '#4CAF50' : '#FF5252' },
                  ]}
                />
                <Text style={styles.ingredientText}>
                  <Text style={styles.ingredientName}>{ingredient.nameHe}</Text>
                  {'  '}{ingredient.amount}
                </Text>
                <Text style={[
                  styles.availLabel,
                  { color: available ? '#4CAF50' : '#FF5252' },
                ]}>
                  {available ? t.available : t.notAvailable}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.steps}</Text>
          {recipe.stepsHe.map((step, index) => (
            <View key={index} style={styles.stepRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>

        <View style={styles.feedbackColumn}>
          <TouchableOpacity
            style={[styles.primaryAction, cooked && styles.primaryActionDone]}
            onPress={handleCooked}
          >
            <Text style={styles.primaryActionText}>
              {cooked ? '✓ בישלתי את זה' : '🍳 בישלתי את זה'}
            </Text>
          </TouchableOpacity>

          <View style={styles.feedbackRow}>
            <TouchableOpacity
              style={[styles.feedbackBtn, liked && styles.feedbackBtnLiked]}
              onPress={handleLike}
            >
              <Text style={styles.feedbackBtnText}>{t.likeRecipe}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.feedbackBtn, disliked && styles.feedbackBtnDisliked]}
              onPress={handleDislike}
            >
              <Text style={styles.feedbackBtnText}>{t.dislikeRecipe}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const ORANGE = '#FF6B35';
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF8F3' },
  scroll: { paddingBottom: 40 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, color: '#666' },
  notFound: { textAlign: 'center', fontSize: 18, color: '#666', marginTop: 100 },
  backLink: { textAlign: 'center', fontSize: 16, color: ORANGE, marginTop: 16 },
  hero: {
    backgroundColor: ORANGE,
    padding: 24,
    paddingTop: 32,
    paddingBottom: 28,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'right',
    marginBottom: 8,
  },
  heroDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'right',
    marginBottom: 16,
  },
  metaRow: { flexDirection: 'row', gap: 12, justifyContent: 'flex-end' },
  metaBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    minWidth: 80,
  },
  metaLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginBottom: 2 },
  metaValue: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  statusStrip: {
    backgroundColor: '#FFF3EE',
    borderBottomWidth: 1,
    borderBottomColor: '#F0D4C8',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  statusStripText: { color: '#8A4A2C', textAlign: 'right', fontSize: 13 },
  section: { padding: 20 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    textAlign: 'right',
    marginBottom: 14,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  availDot: { width: 8, height: 8, borderRadius: 4, marginLeft: 8 },
  ingredientText: { flex: 1, fontSize: 15, color: '#333', textAlign: 'right' },
  ingredientName: { fontWeight: '600' },
  availLabel: { fontSize: 12, fontWeight: '600' },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
    gap: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: ORANGE,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  stepNumberText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
    textAlign: 'right',
  },
  feedbackColumn: {
    paddingHorizontal: 20,
    gap: 12,
    paddingBottom: 20,
  },
  primaryAction: {
    backgroundColor: '#222',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryActionDone: { backgroundColor: '#2E7D32' },
  primaryActionText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  feedbackRow: { flexDirection: 'row', gap: 12 },
  feedbackBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  feedbackBtnLiked: { backgroundColor: '#E8F5E9', borderColor: '#4CAF50' },
  feedbackBtnDisliked: { backgroundColor: '#FFEBEE', borderColor: '#FF5252' },
  feedbackBtnText: { fontSize: 15, fontWeight: '600', color: '#333' },
});

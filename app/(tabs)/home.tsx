import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MealType, Recipe, ContentSyncState } from '../../src/types';
import { translations } from '../../src/i18n/translations';
import {
  loadDislikedRecipes,
  loadIngredients,
  loadLikedRecipes,
  loadProfile,
  loadAIUsage,
} from '../../src/utils/storage';
import { checkAIUsage, getHomeFeed } from '../../src/services/ai';
import { recordFeedbackEvent } from '../../src/services/feedbackQueue';

const t = translations.he;

const MEAL_TABS: { key: MealType; label: string }[] = [
  { key: 'breakfast', label: t.mealBreakfast },
  { key: 'lunch', label: t.mealLunch },
  { key: 'dinner', label: t.mealDinner },
  { key: 'cocktail', label: t.mealCocktail },
  { key: 'snack', label: t.mealSnack },
];

function RecipeCard({ recipe, onPress }: { recipe: Recipe; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.recipeCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.recipeCardInner}>
        <View style={styles.recipeHeaderRow}>
          {recipe.liked && <Text style={styles.feedbackBadge}>👍</Text>}
          {recipe.disliked && <Text style={styles.feedbackBadge}>👎</Text>}
          <Text style={styles.recipeTitle}>{recipe.titleHe}</Text>
        </View>
        <Text style={styles.recipeDesc} numberOfLines={2}>{recipe.descriptionHe}</Text>
        <View style={styles.recipeMeta}>
          <Text style={styles.metaText}>⏱️ {recipe.prepTimeMinutes} {t.minutesShort}</Text>
          <Text style={styles.metaText}>👥 {recipe.servings} מנות</Text>
        </View>
        {recipe.dietaryTags.length > 0 && recipe.dietaryTags[0] !== 'none' && (
          <View style={styles.tagRow}>
            {recipe.dietaryTags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
      <Text style={styles.arrow}>‹</Text>
    </TouchableOpacity>
  );
}

function formatSyncText(syncState: ContentSyncState | null): string {
  if (!syncState) return 'משתמשים בתוכן מובנה באפליקציה';
  if (!syncState.lastSuccessfulSyncAt) {
    return syncState.source === 'bundled'
      ? 'תוכן seed מקומי'
      : 'אין זמן סנכרון שמור';
  }
  const date = new Date(syncState.lastSuccessfulSyncAt);
  return `עודכן לאחרונה: ${date.toLocaleString('he-IL')}`;
}

export default function HomeScreen() {
  const router = useRouter();
  const [activeMeal, setActiveMeal] = useState<MealType>('breakfast');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [assistantText, setAssistantText] = useState('');
  const [syncState, setSyncState] = useState<ContentSyncState | null>(null);
  const [loading, setLoading] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRecipes = useCallback(async (mealType: MealType, forceSync = false) => {
    setLoading(true);
    try {
      const [profile, ingredients, likedRecipeIds, dislikedRecipeIds, aiUsage] = await Promise.all([
        loadProfile(),
        loadIngredients(),
        loadLikedRecipes(),
        loadDislikedRecipes(),
        loadAIUsage(),
      ]);
      const today = new Date().toISOString().split('T')[0];
      const todayCount = aiUsage.date === today ? aiUsage.count : 0;
      const canUseAI = checkAIUsage(profile.tier, todayCount);
      setLimitReached(!canUseAI);

      const ingredientNames = ingredients.map((item) => item.nameHe);
      const feed = await getHomeFeed({
        ingredients: ingredientNames,
        mealType,
        tier: profile.tier,
        dietaryPrefs: profile.dietaryPrefs,
        cuisinePrefs: profile.cuisinePrefs,
        likedRecipeIds,
        dislikedRecipeIds,
        householdSize: profile.householdSize,
        language: profile.language,
      });
      setRecipes(feed.recipes);
      setAssistantText(feed.assistantText);
      setSyncState(feed.syncState);

      if (forceSync) {
        setRefreshing(false);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecipes(activeMeal);
  }, [activeMeal, fetchRecipes]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRecipes(activeMeal, true);
    setRefreshing(false);
  }, [activeMeal, fetchRecipes]);

  const handleOpenRecipe = useCallback(async (recipe: Recipe) => {
    await recordFeedbackEvent({
      type: 'recommendation_clicked',
      recipeId: recipe.id,
      mealType: activeMeal,
      metadata: {
        title: recipe.titleHe,
      },
    });
    router.push(`/recipe/${recipe.id}`);
  }, [activeMeal, router]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t.homeTitle}</Text>
        <TouchableOpacity
          style={styles.ingredientsBtn}
          onPress={() => router.push('/(tabs)/ingredients')}
        >
          <Text style={styles.ingredientsBtnText}>{t.checkIngredients}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>מנוע ההמלצות החדש פעיל</Text>
        <Text style={styles.statusText}>{formatSyncText(syncState)}</Text>
      </View>

      <View style={styles.assistantCard}>
        <Text style={styles.assistantLabel}>Chef Assistant</Text>
        <Text style={styles.assistantText}>{assistantText || 'טוען המלצה אישית...'}</Text>
      </View>

      <View style={styles.tabWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabScroll}
          contentContainerStyle={styles.tabContainer}
        >
          {MEAL_TABS.map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              style={[styles.tab, activeMeal === key && styles.tabActive]}
              onPress={() => setActiveMeal(key)}
            >
              <Text style={[styles.tabText, activeMeal === key && styles.tabTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {limitReached && (
        <View style={styles.limitBanner}>
          <Text style={styles.limitText}>{t.limitReached}</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>{t.loading}</Text>
        </View>
      ) : recipes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t.noSuggestions}</Text>
        </View>
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <RecipeCard
              recipe={item}
              onPress={() => handleOpenRecipe(item)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={(
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#FF6B35"
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const ORANGE = '#FF6B35';
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF8F3' },
  header: { padding: 16, paddingBottom: 8 },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: ORANGE,
    textAlign: 'right',
    marginBottom: 12,
  },
  ingredientsBtn: {
    backgroundColor: '#FFF3EE',
    borderWidth: 1.5,
    borderColor: ORANGE,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  ingredientsBtnText: { color: ORANGE, fontWeight: '600', fontSize: 15 },
  statusCard: {
    backgroundColor: '#FFF0E8',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FFD6C5',
  },
  statusTitle: {
    color: '#8A3415',
    fontWeight: '700',
    fontSize: 14,
    textAlign: 'right',
    marginBottom: 4,
  },
  statusText: { color: '#A64B23', textAlign: 'right', fontSize: 12 },
  assistantCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#F3D2C6',
  },
  assistantLabel: {
    color: ORANGE,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 8,
    textAlign: 'right',
  },
  assistantText: {
    color: '#3A2A21',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'right',
  },
  tabWrapper: {
    backgroundColor: '#FFF8F3',
    zIndex: 3,
    elevation: 3,
  },
  tabScroll: {
    maxHeight: 56,
    backgroundColor: '#FFF8F3',
  },
  tabContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    flexDirection: 'row',
  },
  tab: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#ddd',
  },
  tabActive: { backgroundColor: ORANGE, borderColor: ORANGE },
  tabText: { fontSize: 14, fontWeight: '600', color: '#666' },
  tabTextActive: { color: '#fff' },
  limitBanner: {
    backgroundColor: '#FFF3CD',
    marginHorizontal: 16,
    marginTop: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  limitText: { color: '#856404', fontSize: 13, textAlign: 'center' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#666', fontSize: 14 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#999', fontSize: 16 },
  listContent: { padding: 16, gap: 12, paddingBottom: 48 },
  recipeCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  recipeCardInner: { flex: 1 },
  recipeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  feedbackBadge: { fontSize: 15 },
  recipeTitle: { fontSize: 17, fontWeight: '700', color: '#222', textAlign: 'right' },
  recipeDesc: { fontSize: 13, color: '#777', marginBottom: 8, textAlign: 'right' },
  recipeMeta: { flexDirection: 'row', gap: 12, justifyContent: 'flex-end' },
  metaText: { fontSize: 12, color: '#888' },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 6,
    justifyContent: 'flex-end',
  },
  tag: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tagText: { fontSize: 11, color: '#388E3C' },
  arrow: { fontSize: 22, color: '#ccc', marginLeft: 8 },
});

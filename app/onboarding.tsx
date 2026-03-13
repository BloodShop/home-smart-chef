import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { UserProfile, DietaryPreference, CuisinePreference, SubscriptionTier } from '../src/types';
import { saveProfile } from '../src/utils/storage';
import { translations } from '../src/i18n/translations';

const t = translations.he;

const HOUSEHOLD_SIZES = [1, 2, 3, 4, 5];
const DIETARY_OPTIONS: { key: DietaryPreference; label: string }[] = [
  { key: 'none', label: t.dietNone },
  { key: 'vegetarian', label: t.dietVegetarian },
  { key: 'vegan', label: t.dietVegan },
  { key: 'no-gluten', label: t.dietNoGluten },
  { key: 'halal', label: t.dietHalal },
  { key: 'kosher', label: t.dietKosher },
];
const CUISINE_OPTIONS: { key: CuisinePreference; label: string }[] = [
  { key: 'mediterranean', label: t.cuisineMediterranean },
  { key: 'asian', label: t.cuisineAsian },
  { key: 'italian', label: t.cuisineItalian },
  { key: 'american', label: t.cuisineAmerican },
  { key: 'middle-eastern', label: t.cuisineMiddleEastern },
];
const TIER_OPTIONS: { key: SubscriptionTier; label: string; price: string }[] = [
  { key: 'free', label: t.tierFree, price: '$0' },
  { key: 'basic', label: t.tierBasic, price: '$10/חודש' },
  { key: 'premium', label: t.tierPremium, price: '$25/חודש' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [householdSize, setHouseholdSize] = useState(2);
  const [dietaryPrefs, setDietaryPrefs] = useState<DietaryPreference[]>([]);
  const [cuisinePrefs, setCuisinePrefs] = useState<CuisinePreference[]>([]);
  const [tier, setTier] = useState<SubscriptionTier>('free');

  function toggleDietary(key: DietaryPreference) {
    if (key === 'none') {
      setDietaryPrefs(['none']);
      return;
    }
    setDietaryPrefs((prev) => {
      const filtered = prev.filter((p) => p !== 'none');
      return filtered.includes(key)
        ? filtered.filter((p) => p !== key)
        : [...filtered, key];
    });
  }

  function toggleCuisine(key: CuisinePreference) {
    setCuisinePrefs((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  }

  async function handleFinish() {
    const profile: UserProfile = {
      householdSize,
      dietaryPrefs,
      cuisinePrefs,
      tier,
      language: 'he',
      onboardingComplete: true,
    };
    await saveProfile(profile);
    router.replace('/(tabs)/home');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{t.onboardingTitle}</Text>
        <Text style={styles.subtitle}>{t.onboardingSubtitle}</Text>

        {/* Household size */}
        <Text style={styles.sectionLabel}>{t.householdSizeLabel}</Text>
        <View style={styles.chipRow}>
          {HOUSEHOLD_SIZES.map((n) => (
            <TouchableOpacity
              key={n}
              style={[styles.chip, householdSize === n && styles.chipSelected]}
              onPress={() => setHouseholdSize(n)}
            >
              <Text style={[styles.chipText, householdSize === n && styles.chipTextSelected]}>
                {n === 5 ? '5+' : String(n)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Dietary */}
        <Text style={styles.sectionLabel}>{t.dietaryPrefsLabel}</Text>
        <View style={styles.chipRow}>
          {DIETARY_OPTIONS.map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              style={[styles.chip, dietaryPrefs.includes(key) && styles.chipSelected]}
              onPress={() => toggleDietary(key)}
            >
              <Text
                style={[
                  styles.chipText,
                  dietaryPrefs.includes(key) && styles.chipTextSelected,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Cuisine */}
        <Text style={styles.sectionLabel}>{t.cuisinePrefsLabel}</Text>
        <View style={styles.chipRow}>
          {CUISINE_OPTIONS.map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              style={[styles.chip, cuisinePrefs.includes(key) && styles.chipSelected]}
              onPress={() => toggleCuisine(key)}
            >
              <Text
                style={[
                  styles.chipText,
                  cuisinePrefs.includes(key) && styles.chipTextSelected,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tier */}
        <Text style={styles.sectionLabel}>{t.tierSelectionLabel}</Text>
        {TIER_OPTIONS.map(({ key, label, price }) => (
          <TouchableOpacity
            key={key}
            style={[styles.tierCard, tier === key && styles.tierCardSelected]}
            onPress={() => setTier(key)}
          >
            <Text style={[styles.tierLabel, tier === key && styles.tierLabelSelected]}>
              {label}
            </Text>
            <Text style={styles.tierPrice}>{price}</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.finishBtn} onPress={handleFinish}>
          <Text style={styles.finishBtnText}>{t.startCooking}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const ORANGE = '#FF6B35';
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF8F3' },
  scroll: { padding: 24, paddingBottom: 48 },
  title: { fontSize: 26, fontWeight: 'bold', color: ORANGE, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 32 },
  sectionLabel: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 12, marginTop: 20 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#ddd',
  },
  chipSelected: { backgroundColor: ORANGE, borderColor: ORANGE },
  chipText: { fontSize: 14, color: '#555' },
  chipTextSelected: { color: '#fff', fontWeight: '600' },
  tierCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1.5,
    borderColor: '#ddd', marginBottom: 10,
  },
  tierCardSelected: { borderColor: ORANGE, backgroundColor: '#FFF3EE' },
  tierLabel: { fontSize: 16, color: '#333', fontWeight: '600' },
  tierLabelSelected: { color: ORANGE },
  tierPrice: { fontSize: 14, color: '#888' },
  finishBtn: {
    backgroundColor: ORANGE, borderRadius: 14, padding: 18,
    alignItems: 'center', marginTop: 32,
  },
  finishBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

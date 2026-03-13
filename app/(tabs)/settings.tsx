import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import {
  UserProfile,
  DietaryPreference,
  CuisinePreference,
  SubscriptionTier,
  TIER_CONFIGS,
} from '../../src/types';
import { loadProfile, saveProfile } from '../../src/utils/storage';
import { translations, Language } from '../../src/i18n/translations';
import { getCatalogSummary } from '../../src/services/recipeRepository';
import { getContentBaseUrl } from '../../src/services/contentSync';
import { flushFeedbackQueue } from '../../src/services/feedbackQueue';

const HOUSEHOLD_SIZES = [1, 2, 3, 4, 5];
const DIETARY_OPTIONS: { key: DietaryPreference; he: string; en: string }[] = [
  { key: 'none', he: 'ללא הגבלות', en: 'No restrictions' },
  { key: 'vegetarian', he: 'צמחוני', en: 'Vegetarian' },
  { key: 'vegan', he: 'טבעוני', en: 'Vegan' },
  { key: 'no-gluten', he: 'ללא גלוטן', en: 'Gluten-free' },
  { key: 'halal', he: 'חלאל', en: 'Halal' },
  { key: 'kosher', he: 'כשר', en: 'Kosher' },
];
const CUISINE_OPTIONS: { key: CuisinePreference; he: string; en: string }[] = [
  { key: 'mediterranean', he: 'ים תיכוני', en: 'Mediterranean' },
  { key: 'asian', he: 'אסייתי', en: 'Asian' },
  { key: 'italian', he: 'איטלקי', en: 'Italian' },
  { key: 'american', he: 'אמריקאי', en: 'American' },
  { key: 'middle-eastern', he: 'מזרח תיכוני', en: 'Middle Eastern' },
];

export default function SettingsScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [lang, setLang] = useState<Language>('he');
  const [contentStatus, setContentStatus] = useState({
    recipeCount: 0,
    packCount: 0,
    syncText: 'טוען סטטוס תוכן...',
  });

  const refreshContentStatus = useCallback(async (forceSync = false) => {
    const [summary, feedback] = await Promise.all([
      getCatalogSummary({ sync: forceSync, forceSync }),
      flushFeedbackQueue(),
    ]);
    const syncText = summary.syncState.lastSuccessfulSyncAt
      ? `גרסה ${summary.syncState.catalogVersion} · ${new Date(summary.syncState.lastSuccessfulSyncAt).toLocaleString('he-IL')}`
      : 'אין סנכרון מרוחק עדיין. משתמשים ב-seed pack המקומי.';

    setContentStatus({
      recipeCount: summary.recipeCount,
      packCount: summary.packCount,
      syncText: feedback.configured
        ? `${syncText} · תור פידבק ממתין: ${feedback.remaining}`
        : `${syncText} · אין endpoint לפידבק עדיין`,
    });
  }, []);

  useEffect(() => {
    loadProfile().then((loadedProfile) => {
      setProfile(loadedProfile);
      setLang(loadedProfile.language);
    });
    refreshContentStatus();
  }, [refreshContentStatus]);

  const t = translations[lang];

  const update = useCallback(async (patch: Partial<UserProfile>) => {
    if (!profile) return;
    const updated = { ...profile, ...patch };
    setProfile(updated);
    await saveProfile(updated);
  }, [profile]);

  function toggleDietary(key: DietaryPreference) {
    if (!profile) return;
    let next: DietaryPreference[];
    if (key === 'none') {
      next = ['none'];
    } else {
      const filtered = profile.dietaryPrefs.filter((pref) => pref !== 'none');
      next = filtered.includes(key)
        ? filtered.filter((pref) => pref !== key)
        : [...filtered, key];
    }
    update({ dietaryPrefs: next });
  }

  function toggleCuisine(key: CuisinePreference) {
    if (!profile) return;
    const next = profile.cuisinePrefs.includes(key)
      ? profile.cuisinePrefs.filter((pref) => pref !== key)
      : [...profile.cuisinePrefs, key];
    update({ cuisinePrefs: next });
  }

  function handleTierPress(tier: SubscriptionTier) {
    if (!profile) return;
    if (tier === 'free') {
      update({ tier });
      return;
    }

    Alert.alert(
      'שדרוג מנוי',
      `תכנית ${TIER_CONFIGS[tier].nameHe} עולה ${TIER_CONFIGS[tier].price}.\nחיוב יתווסף בקרוב (פיצ'ר בפיתוח)`,
      [
        { text: 'ביטול', style: 'cancel' },
        { text: 'הפעל', onPress: () => update({ tier }) },
      ]
    );
  }

  function handleResetOnboarding() {
    Alert.alert('איפוס', 'האם אתה בטוח שברצונך לאפס את ההגדרות?', [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'איפוס',
        style: 'destructive',
        onPress: () => {
          if (!profile) return;
          update({ onboardingComplete: false });
          Alert.alert('✅', 'ההגדרות אופסו. הפעל מחדש את האפליקציה.');
        },
      },
    ]);
  }

  if (!profile) return null;

  const dietLabel = (option: { he: string; en: string }) => lang === 'he' ? option.he : option.en;
  const cuisLabel = (option: { he: string; en: string }) => lang === 'he' ? option.he : option.en;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.languageToggle}</Text>
          <View style={styles.langRow}>
            <TouchableOpacity
              style={[styles.langBtn, lang === 'he' && styles.langBtnActive]}
              onPress={() => { setLang('he'); update({ language: 'he' }); }}
            >
              <Text style={[styles.langBtnText, lang === 'he' && styles.langBtnTextActive]}>
                🇮🇱 {t.languageHe}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.langBtn, lang === 'en' && styles.langBtnActive]}
              onPress={() => { setLang('en'); update({ language: 'en' }); }}
            >
              <Text style={[styles.langBtnText, lang === 'en' && styles.langBtnTextActive]}>
                🇺🇸 {t.languageEn}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.householdMembers}</Text>
          <View style={styles.chipRow}>
            {HOUSEHOLD_SIZES.map((size) => (
              <TouchableOpacity
                key={size}
                style={[styles.chip, profile.householdSize === size && styles.chipSelected]}
                onPress={() => update({ householdSize: size })}
              >
                <Text style={[styles.chipText, profile.householdSize === size && styles.chipTextSelected]}>
                  {size === 5 ? '5+' : String(size)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.dietarySettings}</Text>
          <View style={styles.chipRow}>
            {DIETARY_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[styles.chip, profile.dietaryPrefs.includes(option.key) && styles.chipSelected]}
                onPress={() => toggleDietary(option.key)}
              >
                <Text style={[styles.chipText, profile.dietaryPrefs.includes(option.key) && styles.chipTextSelected]}>
                  {dietLabel(option)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{lang === 'he' ? 'סגנונות בישול' : 'Cuisine Preferences'}</Text>
          <View style={styles.chipRow}>
            {CUISINE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[styles.chip, profile.cuisinePrefs.includes(option.key) && styles.chipSelected]}
                onPress={() => toggleCuisine(option.key)}
              >
                <Text style={[styles.chipText, profile.cuisinePrefs.includes(option.key) && styles.chipTextSelected]}>
                  {cuisLabel(option)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.subscriptionManagement}</Text>
          <Text style={styles.currentTierLabel}>
            {t.currentTier}: <Text style={styles.currentTierValue}>{TIER_CONFIGS[profile.tier].nameHe}</Text>
          </Text>
          {(['free', 'basic', 'premium'] as SubscriptionTier[]).map((tier) => {
            const config = TIER_CONFIGS[tier];
            return (
              <TouchableOpacity
                key={tier}
                style={[styles.tierCard, profile.tier === tier && styles.tierCardActive]}
                onPress={() => handleTierPress(tier)}
              >
                <View>
                  <Text style={[styles.tierName, profile.tier === tier && styles.tierNameActive]}>
                    {config.nameHe} — {config.price}
                  </Text>
                  {config.features.map((feature, index) => (
                    <Text key={index} style={styles.tierFeature}>• {feature}</Text>
                  ))}
                </View>
                {profile.tier === tier && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>תוכן וסנכרון</Text>
          <Text style={styles.syncSummary}>מתכונים זמינים: {contentStatus.recipeCount}</Text>
          <Text style={styles.syncSummary}>חבילות פעילות: {contentStatus.packCount}</Text>
          <Text style={styles.syncDetails}>{contentStatus.syncText}</Text>
          <Text style={styles.syncDetails}>
            מקור מרוחק: {getContentBaseUrl() ?? 'לא הוגדר EXPO_PUBLIC_CONTENT_BASE_URL'}
          </Text>
          <TouchableOpacity
            style={styles.syncAction}
            onPress={() => refreshContentStatus(true)}
          >
            <Text style={styles.syncActionText}>סנכרן תוכן עכשיו</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.resetBtn} onPress={handleResetOnboarding}>
          <Text style={styles.resetBtnText}>🔄 איפוס הגדרות ראשוניות</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const ORANGE = '#FF6B35';
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF8F3' },
  scroll: { padding: 16, paddingBottom: 40 },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
    textAlign: 'right',
    marginBottom: 12,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
  },
  chipSelected: { backgroundColor: ORANGE, borderColor: ORANGE },
  chipText: { fontSize: 14, color: '#555' },
  chipTextSelected: { color: '#fff', fontWeight: '600' },
  langRow: { flexDirection: 'row', gap: 12 },
  langBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  langBtnActive: { backgroundColor: ORANGE, borderColor: ORANGE },
  langBtnText: { fontSize: 15, color: '#555', fontWeight: '600' },
  langBtnTextActive: { color: '#fff' },
  currentTierLabel: { fontSize: 14, color: '#666', textAlign: 'right', marginBottom: 12 },
  currentTierValue: { color: ORANGE, fontWeight: '700' },
  tierCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F9F9F9',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    marginBottom: 8,
  },
  tierCardActive: { borderColor: ORANGE, backgroundColor: '#FFF3EE' },
  tierName: { fontSize: 15, fontWeight: '700', color: '#333', textAlign: 'right' },
  tierNameActive: { color: ORANGE },
  tierFeature: { fontSize: 12, color: '#888', textAlign: 'right', marginTop: 2 },
  checkmark: { fontSize: 20, color: ORANGE, fontWeight: 'bold' },
  syncSummary: {
    color: '#333',
    textAlign: 'right',
    fontSize: 14,
    marginBottom: 4,
  },
  syncDetails: {
    color: '#666',
    textAlign: 'right',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 6,
  },
  syncAction: {
    marginTop: 8,
    backgroundColor: '#222',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  syncActionText: { color: '#fff', fontWeight: '700' },
  resetBtn: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#FF5252',
    alignItems: 'center',
    marginTop: 8,
  },
  resetBtnText: { color: '#FF5252', fontWeight: '600', fontSize: 14 },
});

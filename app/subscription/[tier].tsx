import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Constants from 'expo-constants';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SubscriptionTier, TIER_CONFIGS, UserProfile } from '../../src/types';
import { loadProfile, saveProfile } from '../../src/utils/storage';

const ORANGE = '#FF6B35';

type PlanCopy = {
  title: string;
  subtitle: string;
  paypalLabel: string;
  activateLabel: string;
  configuredHint: string;
  missingHint: string;
};

function getCopy(language: UserProfile['language']): PlanCopy {
  if (language === 'en') {
    return {
      title: 'Choose how to upgrade',
      subtitle: 'Open PayPal in the browser, complete payment, then activate the tier on this device.',
      paypalLabel: 'Open PayPal checkout',
      activateLabel: 'I paid, activate on this device',
      configuredHint: 'PayPal link is configured for this plan.',
      missingHint: 'No PayPal payment link is configured for this tier yet.',
    };
  }

  return {
    title: 'בחירת מסלול תשלום',
    subtitle: 'פותחים את פייפאל בדפדפן, משלימים תשלום, ואז מפעילים את המסלול במכשיר הזה.',
    paypalLabel: 'פתח תשלום בפייפאל',
    activateLabel: 'שילמתי, הפעל במכשיר הזה',
    configuredHint: 'לינק פייפאל מוגדר למסלול הזה.',
    missingHint: 'עדיין לא הוגדר לינק תשלום בפייפאל למסלול הזה.',
  };
}

function getPaypalLink(tier: SubscriptionTier): string {
  const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;
  const links = (extra.paypalLinks ?? {}) as Record<string, unknown>;
  const configuredLink = links[tier];
  return configuredLink ? String(configuredLink).trim() : '';
}

export default function SubscriptionTierScreen() {
  const router = useRouter();
  const { tier } = useLocalSearchParams<{ tier: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [openedPaypal, setOpenedPaypal] = useState(false);

  const normalizedTier = useMemo<SubscriptionTier>(() => {
    if (tier === 'basic' || tier === 'premium') return tier;
    return 'basic';
  }, [tier]);

  useEffect(() => {
    loadProfile().then(setProfile);
  }, []);

  if (!profile) return null;

  const currentProfile = profile;
  const copy = getCopy(profile.language);
  const config = TIER_CONFIGS[normalizedTier];
  const paypalLink = getPaypalLink(normalizedTier);
  const hasPaypalLink = Boolean(paypalLink);

  async function openPaypal() {
    if (!hasPaypalLink) {
      Alert.alert('PayPal', copy.missingHint);
      return;
    }

    const supported = await Linking.canOpenURL(paypalLink);
    if (!supported) {
      Alert.alert('PayPal', 'לא ניתן לפתוח את קישור התשלום במכשיר הזה.');
      return;
    }

    setOpenedPaypal(true);
    await Linking.openURL(paypalLink);
  }

  async function activateTierLocally() {
    const updated: UserProfile = { ...currentProfile, tier: normalizedTier };
    setProfile(updated);
    await saveProfile(updated);
    Alert.alert(
      currentProfile.language === 'en' ? 'Tier updated' : 'המסלול עודכן',
      currentProfile.language === 'en'
        ? 'The selected tier is now active on this device.'
        : 'המסלול שנבחר פעיל עכשיו על המכשיר הזה.',
      [
        {
          text: currentProfile.language === 'en' ? 'Back to settings' : 'חזרה להגדרות',
          onPress: () => router.back(),
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>HomeSmartChef Membership</Text>
          <Text style={styles.title}>{config.nameHe}</Text>
          <Text style={styles.price}>{config.price}</Text>
          <Text style={styles.subtitle}>{copy.subtitle}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{copy.title}</Text>
          {config.features.map((feature) => (
            <View key={feature} style={styles.featureRow}>
              <Text style={styles.featureBullet}>•</Text>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>PayPal</Text>
          <Text style={styles.hintText}>
            {hasPaypalLink ? copy.configuredHint : copy.missingHint}
          </Text>
          {hasPaypalLink && (
            <Text style={styles.linkPreview} numberOfLines={2}>
              {paypalLink}
            </Text>
          )}
          <TouchableOpacity style={styles.primaryButton} onPress={openPaypal}>
            <Text style={styles.primaryButtonText}>{copy.paypalLabel}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Activation</Text>
          <Text style={styles.hintText}>
            {openedPaypal
              ? 'אחרי שסיימת לשלם, אפשר להפעיל את המסלול במכשיר הזה.'
              : 'כרגע ההפעלה היא מקומית בלבד. בייצור אמיתי צריך חיבור ל-webhook או backend לאימות תשלום.'}
          </Text>
          <TouchableOpacity
            style={[
              styles.secondaryButton,
              !hasPaypalLink && styles.secondaryButtonDisabled,
            ]}
            onPress={activateTierLocally}
          >
            <Text style={styles.secondaryButtonText}>{copy.activateLabel}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF8F3' },
  scroll: { padding: 16, paddingBottom: 48, gap: 16 },
  hero: {
    backgroundColor: '#1E140F',
    borderRadius: 24,
    padding: 22,
  },
  eyebrow: {
    color: '#F3C8B2',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    textAlign: 'right',
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'right',
    marginBottom: 6,
  },
  price: {
    color: '#FFC6A6',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: 10,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'right',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0DED5',
  },
  sectionTitle: {
    color: '#2D1C16',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: 12,
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginBottom: 8,
  },
  featureBullet: {
    color: ORANGE,
    fontSize: 16,
    lineHeight: 20,
  },
  featureText: {
    color: '#4C3A32',
    flex: 1,
    textAlign: 'right',
    lineHeight: 20,
  },
  hintText: {
    color: '#6C5A53',
    textAlign: 'right',
    lineHeight: 20,
    marginBottom: 10,
  },
  linkPreview: {
    color: ORANGE,
    textAlign: 'right',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: ORANGE,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
  secondaryButton: {
    marginTop: 8,
    backgroundColor: '#1E140F',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonDisabled: {
    opacity: 0.6,
  },
  secondaryButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
});

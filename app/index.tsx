import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { loadProfile } from '../src/utils/storage';

export default function EntryScreen() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const profile = await loadProfile();
      if (profile.onboardingComplete) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/onboarding');
      }
    })();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#FF6B35" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8F3',
  },
});

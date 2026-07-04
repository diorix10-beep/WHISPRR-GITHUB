import { useEffect, useState } from 'react';
import { useColorScheme, ActivityIndicator, View, StyleSheet } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { Colors } from '../constants/theme';

// Keep the splash screen visible until we load fonts
SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { user, profile, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  // Hide splash screen when loaded
  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync();
    }
  }, [loading]);

  // Handle routing redirects based on auth and onboarding status
  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inAppGroup = segments[0] === '(app)';
    const inOnboarding = segments[0] === 'onboarding';

    if (!user) {
      // Redirect to login if not in auth group
      if (!inAuthGroup) {
        router.replace('/login');
      }
    } else if (profile && profile.onboarding_complete === false) {
      // Redirect to onboarding if not done
      if (!inOnboarding) {
        router.replace('/onboarding');
      }
    } else {
      // Redirect to app if in auth or onboarding
      if (!inAppGroup) {
        router.replace('/(app)');
      }
    }
  }, [user, profile, loading, segments]);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

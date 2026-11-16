import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import * as SplashScreen from 'expo-splash-screen';
import { Suspense } from 'react';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { DATABASE_NAME, migrateDbIfNeeded } from '@/storage';
import { ThemeProvider as AppThemeProvider } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AppThemeProvider>
        <AnimatedSplashOverlay />
        <Suspense fallback={null}>
          <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrateDbIfNeeded} useSuspense>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="import" />
              <Stack.Screen name="grocery" />
              <Stack.Screen name="recipe/[id]" />
            </Stack>
          </SQLiteProvider>
        </Suspense>
      </AppThemeProvider>
    </ThemeProvider>
  );
}

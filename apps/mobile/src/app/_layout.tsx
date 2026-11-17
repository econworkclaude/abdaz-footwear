import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ToastHost } from '@/components/Toast';
import { queryClient } from '@/hooks/queries';
import { useSession } from '@/stores/session';
import { colors } from '@/theme';

export default function RootLayout() {
  useEffect(() => {
    void useSession.getState().init();
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg }, animation: 'slide_from_right' }}>
            <Stack.Screen name="index" options={{ animation: 'fade' }} />
            <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
            <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
            <Stack.Screen name="admin" options={{ animation: 'fade' }} />
            <Stack.Screen name="order-success/[id]" options={{ animation: 'fade', gestureEnabled: false }} />
          </Stack>
          <ToastHost />
        </View>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

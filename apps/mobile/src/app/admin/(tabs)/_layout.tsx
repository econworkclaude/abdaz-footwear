import { Ionicons } from '@expo/vector-icons';
import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IS_LIVE } from '@/config';
import { invalidateOrders } from '@/hooks/queries';
import { live } from '@/services/live';
import { useSession } from '@/stores/session';
import { colors } from '@/theme';

const icon =
  (name: keyof typeof Ionicons.glyphMap) =>
  ({ color, focused }: { color: import('react-native').ColorValue; focused: boolean }) => <Ionicons name={(focused ? name : `${name}-outline`) as keyof typeof Ionicons.glyphMap} size={22} color={color as string} />;

export default function AdminTabs() {
  const insets = useSafeAreaInsets();
  const role = useSession((s) => s.session?.role);
  useEffect(() => {
    if (!IS_LIVE || role !== 'admin') return;
    return live.subscribeOrders(() => void invalidateOrders());
  }, [role]);
  if (role !== 'admin') return <Redirect href="/admin/login" />;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.textDim,
        tabBarStyle: { backgroundColor: colors.bg2, borderTopColor: colors.border, height: 62 + insets.bottom, paddingTop: 6, paddingBottom: insets.bottom + 6 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Dashboard', tabBarIcon: icon('speedometer') }} />
      <Tabs.Screen name="orders" options={{ title: 'Orders', tabBarIcon: icon('receipt') }} />
      <Tabs.Screen name="products" options={{ title: 'Products', tabBarIcon: icon('pricetags') }} />
      <Tabs.Screen name="settings" options={{ title: 'Store', tabBarIcon: icon('storefront') }} />
    </Tabs>
  );
}

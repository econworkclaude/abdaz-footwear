import { Redirect, Stack } from 'expo-router';
import { IS_ADMIN_APP } from '@/config';
import { colors } from '@/theme';

export default function AdminLayout() {
  // Admin screens exist only in the ABDAZ Admin build.
  if (!IS_ADMIN_APP) return <Redirect href="/" />;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg }, animation: 'slide_from_right' }} />;
}

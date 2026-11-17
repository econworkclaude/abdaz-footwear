// One codebase, two Android apps:
//   APP_VARIANT=customer (default) -> "ABDAZ"        com.abdaz.footwear
//   APP_VARIANT=admin              -> "ABDAZ Admin"  com.abdaz.footwear.admin
// Supabase keys come from EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY.
// Without them both apps run in clearly labelled DEMO mode.
const variant = process.env.APP_VARIANT === 'admin' ? 'admin' : 'customer';
const isAdmin = variant === 'admin';
// Make the variant visible to the JS bundle (EXPO_PUBLIC_* values are inlined at build time).
process.env.EXPO_PUBLIC_APP_VARIANT = variant;

module.exports = {
  expo: {
    name: isAdmin ? 'ABDAZ Admin' : 'ABDAZ',
    slug: 'abdaz-footwear',
    scheme: isAdmin ? 'abdazadmin' : 'abdaz',
    version: '0.2.0',
    orientation: 'portrait',
    icon: isAdmin ? './assets/icon-admin.png' : './assets/icon.png',
    userInterfaceStyle: 'dark',
    backgroundColor: '#080B12',
    splash: { image: './assets/splash-icon.png', resizeMode: 'contain', backgroundColor: '#080B12' },
    android: {
      package: isAdmin ? 'com.abdaz.footwear.admin' : 'com.abdaz.footwear',
      versionCode: 2,
      adaptiveIcon: { backgroundColor: '#080B12', foregroundImage: isAdmin ? './assets/adaptive-admin.png' : './assets/adaptive-icon.png' },
      predictiveBackGestureEnabled: false,
    },
    ios: { supportsTablet: false, bundleIdentifier: isAdmin ? 'com.abdaz.footwear.admin' : 'com.abdaz.footwear' },
    web: { favicon: './assets/favicon.png', output: 'single', bundler: 'metro' },
    plugins: [['expo-router', { asyncRoutes: false }], 'expo-font'],
    extra: {
      appVariant: variant,
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
    },
  },
};

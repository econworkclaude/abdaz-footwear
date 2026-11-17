import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra ?? {}) as { appVariant?: string; supabaseUrl?: string; supabaseAnonKey?: string };

export const APP_VARIANT: 'customer' | 'admin' = (process.env.EXPO_PUBLIC_APP_VARIANT ?? extra.appVariant) === 'admin' ? 'admin' : 'customer';
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || extra.supabaseUrl || '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || extra.supabaseAnonKey || '';
/** Live mode = real Supabase backend. Otherwise everything runs on-device in clearly labelled DEMO mode. */
export const IS_LIVE = !!(SUPABASE_URL && SUPABASE_ANON_KEY);
export const IS_ADMIN_APP = APP_VARIANT === 'admin';

import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { LogoMark } from '@/components/Art';
import { toast } from '@/components/Toast';
import { Field, GoldButton, Notice } from '@/components/ui';
import { IS_LIVE } from '@/config';
import { queryClient } from '@/hooks/queries';
import { live } from '@/services/live';
import { DEMO_ADMIN_PIN, useSession } from '@/stores/session';
import { colors, space } from '@/theme';

/** Staff sign in. Live: Supabase email + password, and the account must have role = admin in the database. */
export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setErr('');
    if (!IS_LIVE) {
      if (password !== DEMO_ADMIN_PIN) return setErr(`In demo mode the PIN is ${DEMO_ADMIN_PIN}.`);
      useSession.getState().demoSignIn({ userId: 'demo-admin', phone: null, email: 'demo-admin', name: 'Store Admin', role: 'admin' });
      router.replace('/admin');
      return;
    }
    setBusy(true);
    try {
      await live.passwordSignIn(email.trim(), password);
      await useSession.getState().refresh();
      const s = useSession.getState().session;
      if (s?.role !== 'admin') {
        await useSession.getState().signOut();
        throw new Error('This account is not an admin. Ask the owner to set role = admin for it.');
      }
      void queryClient.invalidateQueries();
      toast('Welcome back');
      router.replace('/admin');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Sign in failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: space.xl, paddingTop: 80, gap: space.lg }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <LogoMark size={72} />
          <Text style={{ color: colors.text, fontSize: 26, fontWeight: '800' }}>ABDAZ Admin</Text>
          <Text style={{ color: colors.textDim }}>Orders, stock and delivery for your store</Text>
        </View>
        {IS_LIVE ? (
          <>
            <Field label="Email" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
            <Field label="Password" secureTextEntry value={password} onChangeText={setPassword} error={err} onSubmitEditing={submit} />
          </>
        ) : (
          <>
            <Notice tone="info" title="Demo mode" text={`Not connected to the store database yet. Enter PIN ${DEMO_ADMIN_PIN} to explore with sample orders.`} />
            <Field label="Demo PIN" keyboardType="number-pad" secureTextEntry maxLength={4} value={password} onChangeText={setPassword} error={err} onSubmitEditing={submit} />
          </>
        )}
        <GoldButton title="Sign In" icon="lock-open" loading={busy} onPress={submit} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

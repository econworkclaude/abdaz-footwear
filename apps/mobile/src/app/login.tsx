import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { LogoMark } from '@/components/Art';
import { toast } from '@/components/Toast';
import { Field, GoldButton, Notice, OutlineButton, TopBar } from '@/components/ui';
import { IS_LIVE } from '@/config';
import { queryClient } from '@/hooks/queries';
import { live } from '@/services/live';
import { PHONE_RE } from '@/services/rules';
import { DEMO_OTP, useSession } from '@/stores/session';
import { colors, space } from '@/theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Mobile number + OTP sign in. Live mode uses Supabase Auth; demo mode never sends an SMS and says so. */
export default function Login() {
  const [method, setMethod] = useState<'phone' | 'email'>('phone');
  const [value, setValue] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'enter' | 'otp'>('enter');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const target = method === 'phone' ? { phone: '+91' + value } : { email: value.trim() };

  const done = () => {
    void queryClient.invalidateQueries();
    toast('Signed in');
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  };

  const request = async () => {
    if (method === 'phone' && !PHONE_RE.test(value)) return setErr('Enter a valid 10-digit Indian mobile number');
    if (method === 'email' && !EMAIL_RE.test(value.trim())) return setErr('Enter a valid email address');
    setErr('');
    if (IS_LIVE) {
      setBusy(true);
      try {
        await live.requestOtp(target);
        toast(method === 'phone' ? 'Code sent by SMS' : 'Code sent to your email', 'info');
      } catch (e) {
        setBusy(false);
        return setErr(e instanceof Error ? e.message : 'Could not send the code. Try again.');
      }
      setBusy(false);
    }
    setStep('otp');
  };

  const verify = async () => {
    if (!/^\d{6}$/.test(otp)) return setErr('Enter the 6-digit code');
    if (!IS_LIVE) {
      if (otp !== DEMO_OTP) return setErr(`Incorrect code. In demo mode the code is ${DEMO_OTP}.`);
      useSession.getState().demoSignIn({ userId: 'demo-customer', phone: method === 'phone' ? '+91' + value : null, email: method === 'email' ? value : null, name: '', role: 'customer' });
      return done();
    }
    setBusy(true);
    try {
      await live.verifyOtp(target, otp);
      await useSession.getState().refresh();
      done();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'That code did not work.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TopBar title="Sign In" />
      <ScrollView contentContainerStyle={{ padding: space.xl, gap: space.lg }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <LogoMark size={64} />
          <Text style={{ color: colors.text, fontSize: 24, fontWeight: '800' }}>Welcome to ABDAZ</Text>
          <Text style={{ color: colors.textDim }}>Sign in to place orders and track deliveries</Text>
        </View>
        {!IS_LIVE && <Notice tone="info" title="Development mode: SMS is not set up yet" text={`No SMS will be sent. Use the code ${DEMO_OTP} to continue.`} />}
        {step === 'enter' ? (
          <>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {(['phone', 'email'] as const).map((m) => (
                <Pressable key={m} onPress={() => { setMethod(m); setValue(''); setErr(''); }} style={{ flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: method === m ? colors.gold : colors.border, alignItems: 'center' }}>
                  <Text style={{ color: method === m ? colors.gold : colors.textDim, fontWeight: '700' }}>{m === 'phone' ? 'Mobile number' : 'Email'}</Text>
                </Pressable>
              ))}
            </View>
            {method === 'phone' ? (
              <Field label="Mobile number (+91)" keyboardType="number-pad" maxLength={10} value={value} onChangeText={(t) => setValue(t.replace(/\D/g, ''))} placeholder="98765 43210" error={err} />
            ) : (
              <Field label="Email" keyboardType="email-address" autoCapitalize="none" value={value} onChangeText={setValue} placeholder="you@example.com" error={err} />
            )}
            <GoldButton title="Get OTP" loading={busy} onPress={request} />
          </>
        ) : (
          <>
            <Text style={{ color: colors.textDim }}>Enter the 6-digit code {IS_LIVE ? 'we sent to' : 'for'} {method === 'phone' ? '+91 ' + value : value}</Text>
            <Field label="OTP" keyboardType="number-pad" maxLength={6} value={otp} onChangeText={(t) => setOtp(t.replace(/\D/g, ''))} placeholder="6-digit code" error={err} />
            <GoldButton title="Verify & Continue" loading={busy} onPress={verify} />
            <OutlineButton title="Change" onPress={() => { setStep('enter'); setOtp(''); setErr(''); }} />
          </>
        )}
        <OutlineButton title="Continue browsing as guest" onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

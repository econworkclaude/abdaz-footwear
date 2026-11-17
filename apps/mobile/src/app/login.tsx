import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { LogoMark } from '@/components/Art';
import { Field, GoldButton, Notice, OutlineButton, TopBar } from '@/components/ui';
import { PHONE_RE } from '@/services/rules';
import { useShop } from '@/stores/shop';
import { colors, space } from '@/theme';

const DEMO_OTP = '123456';

/** Phone + OTP login. SMS provider is not configured yet, so this runs in DEMO mode and says so. */
export default function Login() {
  const { next } = useLocalSearchParams<{ next?: string }>();
  const signIn = useShop((s) => s.signIn);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [err, setErr] = useState('');

  const request = () => {
    if (!PHONE_RE.test(phone)) return setErr('Enter a valid 10-digit Indian mobile number');
    setErr('');
    setStep('otp');
  };
  const verify = () => {
    if (otp !== DEMO_OTP) return setErr('Incorrect code. In demo mode the code is 123456.');
    signIn('+91' + phone);
    // Return to where the customer came from (e.g. checkout) instead of stacking a duplicate screen.
    if (router.canGoBack()) router.back();
    else router.replace((next as never) ?? '/(tabs)');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TopBar title="Sign In" />
      <ScrollView contentContainerStyle={{ padding: space.xl, gap: space.lg }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <LogoMark size={64} />
          <Text style={{ color: colors.text, fontSize: 24, fontWeight: '800' }}>Welcome to ABDAZ</Text>
          <Text style={{ color: colors.textDim }}>Sign in with your mobile number to order</Text>
        </View>
        <Notice tone="info" title="Development mode: SMS is not set up yet" text={`No SMS will be sent. Use the code ${DEMO_OTP} to continue.`} />
        {step === 'phone' ? (
          <>
            <Field label="Mobile number (+91)" keyboardType="number-pad" maxLength={10} value={phone} onChangeText={(t) => setPhone(t.replace(/\D/g, ''))} placeholder="98765 43210" error={err} />
            <GoldButton title="Get OTP" onPress={request} />
          </>
        ) : (
          <>
            <Text style={{ color: colors.textDim }}>Enter the 6-digit code for +91 {phone}</Text>
            <Field label="OTP" keyboardType="number-pad" maxLength={6} value={otp} onChangeText={(t) => setOtp(t.replace(/\D/g, ''))} placeholder="123456" error={err} />
            <GoldButton title="Verify & Continue" onPress={verify} />
            <OutlineButton title="Change number" onPress={() => { setStep('phone'); setOtp(''); setErr(''); }} />
          </>
        )}
        <OutlineButton title="Continue browsing as guest" onPress={() => router.back()} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

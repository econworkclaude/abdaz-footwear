import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Text, View } from 'react-native';
import { LogoMark, Wordmark } from '@/components/Art';
import { useShop } from '@/stores/shop';
import { colors } from '@/theme';

/** Splash: animated gold reveal, waits for saved state, then routes to onboarding or home. */
export default function Splash() {
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.85)).current;
  const [hydrated, setHydrated] = useState(useShop.persist.hasHydrated());
  const [animDone, setAnimDone] = useState(false);

  useEffect(() => {
    const unsub = useShop.persist.onFinishHydration(() => setHydrated(true));
    const t = setTimeout(() => setHydrated(true), 3000); // never get stuck on the splash
    return () => {
      unsub();
      clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduce) => {
        if (cancelled) return;
        const d = reduce ? 0 : 900;
        Animated.parallel([
          Animated.timing(fade, { toValue: 1, duration: d, useNativeDriver: true }),
          Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 6 }),
        ]).start();
        setTimeout(() => !cancelled && setAnimDone(true), reduce ? 300 : 1600);
      });
    return () => {
      cancelled = true;
    };
  }, [fade, scale]);

  useEffect(() => {
    if (!hydrated || !animDone) return;
    router.replace(useShop.getState().onboarded ? '/(tabs)' : '/onboarding');
  }, [hydrated, animDone]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ opacity: fade, transform: [{ scale }], alignItems: 'center', gap: 16 }}>
        <LogoMark size={110} />
        <Wordmark size={1.1} />
        <Text style={{ color: colors.textDim, letterSpacing: 6, fontSize: 12, fontWeight: '700' }}>STEP INTO STYLE</Text>
      </Animated.View>
    </View>
  );
}

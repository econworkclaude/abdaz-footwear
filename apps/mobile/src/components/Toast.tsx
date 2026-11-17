import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';
import { colors, radius } from '@/theme';

type Tone = 'success' | 'error' | 'info';
interface ToastState {
  msg: { id: number; text: string; tone: Tone } | null;
  show: (text: string, tone?: Tone) => void;
}
export const useToast = create<ToastState>((set) => ({
  msg: null,
  show: (text, tone = 'success') => set({ msg: { id: Date.now(), text, tone } }),
}));
export const toast = (text: string, tone?: Tone) => useToast.getState().show(text, tone);

export function ToastHost() {
  const msg = useToast((s) => s.msg);
  const insets = useSafeAreaInsets();
  const y = useRef(new Animated.Value(-120)).current;
  useEffect(() => {
    if (!msg) return;
    Animated.sequence([
      Animated.spring(y, { toValue: 0, useNativeDriver: true, friction: 7 }),
      Animated.delay(1800),
      Animated.timing(y, { toValue: -140, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [msg, y]);
  if (!msg) return null;
  const c = msg.tone === 'error' ? colors.danger : msg.tone === 'info' ? colors.gold : colors.success;
  return (
    <Animated.View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      style={{
        position: 'absolute', top: insets.top + 8, left: 16, right: 16, transform: [{ translateY: y }], zIndex: 99,
        backgroundColor: colors.card, borderColor: c, borderWidth: 1, borderRadius: radius.lg, padding: 14,
        flexDirection: 'row', alignItems: 'center', gap: 10, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 16, elevation: 10,
      }}
    >
      <Ionicons name={msg.tone === 'error' ? 'alert-circle' : msg.tone === 'info' ? 'information-circle' : 'checkmark-circle'} size={22} color={c} />
      <Text style={{ color: colors.text, fontWeight: '700', flex: 1 }}>{msg.text}</Text>
    </Animated.View>
  );
}

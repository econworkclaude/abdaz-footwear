import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LogoMark, ShoeArt } from '@/components/Art';
import { GoldButton, OutlineButton } from '@/components/ui';
import { products } from '@/data/demo';
import { useShop } from '@/stores/shop';
import { colors, space } from '@/theme';

const slides = [
  { title: 'Premium Footwear at Your Doorstep', text: 'Discover curated footwear selected for style, comfort, and everyday use.', product: products[0], icon: 'sparkles' as const },
  { title: 'Local Delivery. Less Waiting.', text: 'Get your footwear delivered in up to 120 minutes in eligible service areas.', product: products[2], icon: 'bicycle' as const },
  { title: 'Shop Confidently', text: 'Clear sizing, transparent pricing, and exchange support.', product: products[7], icon: 'shield-checkmark' as const },
];

export default function Onboarding() {
  const [i, setI] = useState(0);
  const finish = useShop((s) => s.finishOnboarding);
  const insets = useSafeAreaInsets();
  const slide = slides[i];
  const done = (to: '/(tabs)' | '/login') => {
    finish();
    router.replace('/(tabs)');
    if (to === '/login') router.push('/login');
  };
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 20 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: space.xl }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <LogoMark size={30} />
          <Text style={{ color: colors.gold, fontWeight: '800', letterSpacing: 3, fontSize: 16 }}>ABDAZ</Text>
        </View>
        {i < 2 && (
          <Pressable onPress={() => done('/(tabs)')} hitSlop={10}>
            <Text style={{ color: colors.textDim, fontWeight: '600' }}>Skip</Text>
          </Pressable>
        )}
      </View>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <LinearGradient colors={['#2A2210', colors.bg]} style={{ width: 300, height: 300, borderRadius: 150, alignItems: 'center', justifyContent: 'center' }}>
          <ShoeArt product={slide.product} width={270} />
        </LinearGradient>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
          <Ionicons name={slide.icon} size={16} color={colors.gold} />
          <Text style={{ color: colors.gold, fontWeight: '700', fontSize: 12, letterSpacing: 2 }}>ABDAZ FOOTWEAR</Text>
        </View>
      </View>
      <View style={{ paddingHorizontal: space.xl, gap: 12 }}>
        <Text style={{ color: colors.text, fontSize: 30, fontWeight: '800', lineHeight: 36 }}>{slide.title}</Text>
        <Text style={{ color: colors.textDim, fontSize: 15, lineHeight: 22 }}>{slide.text}</Text>
        <View style={{ flexDirection: 'row', gap: 6, marginVertical: 12 }}>
          {slides.map((_, k) => (
            <View key={k} style={{ height: 6, width: k === i ? 24 : 6, borderRadius: 3, backgroundColor: k === i ? colors.gold : colors.border }} />
          ))}
        </View>
        {i < 2 ? (
          <GoldButton title="Next" icon="arrow-forward" onPress={() => setI(i + 1)} />
        ) : (
          <View style={{ gap: 10 }}>
            <GoldButton title="Get Started" icon="arrow-forward" onPress={() => done('/(tabs)')} />
            <OutlineButton title="Sign In" onPress={() => done('/login')} />
          </View>
        )}
      </View>
    </View>
  );
}

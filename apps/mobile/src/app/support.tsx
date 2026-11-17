import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { Notice, TopBar, s as ui } from '@/components/ui';
import { settings as demoSettings, sizeGuide } from '@/data/demo';
import { useCatalog } from '@/hooks/queries';
import { colors, space } from '@/theme';

const topics = ['Order Issue', 'Delivery Issue', 'Exchange Help', 'Payment Issue', 'General Enquiry'];

export default function Support() {
  const { topic } = useLocalSearchParams<{ topic?: string }>();
  const settings = useCatalog().catalog?.settings ?? demoSettings;
  const open = (t: string) => {
    if (!settings.whatsappNumber) return;
    Linking.openURL(`https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(`Hi ABDAZ FOOTWEAR, I need help: ${t}.`)}`).catch(() => {});
  };
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopBar title={topic === 'size' ? 'Size & Fit Help' : topic === 'policies' ? 'Policies' : 'Help & Support'} />
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg }}>
        {topic === 'size' ? (
          <View style={[ui.card, { gap: 6 }]}>
            {sizeGuide.map((r) => (
              <Text key={r.uk} style={{ color: colors.text }}>UK {r.uk} · foot length {r.cm} cm</Text>
            ))}
            <Text style={{ color: colors.textDim, fontSize: 12, marginTop: 6 }}>Measure heel to longest toe in cm. If between sizes, go one size up. Conversions to be verified before launch.</Text>
          </View>
        ) : topic === 'policies' ? (
          <View style={[ui.card, { gap: 8 }]}>
            <Text style={ui.section}>Exchange & Returns</Text>
            <Text style={{ color: colors.textDim }}>Size exchange within {settings.exchangeWindowDays} days of delivery for unworn pairs, subject to stock. Damaged, defective or wrong items will be replaced or refunded.</Text>
            <Text style={ui.section}>Privacy Policy · Terms & Conditions</Text>
            <Text style={{ color: colors.warning }}>Draft. These must be written and checked by the business owner (and a legal adviser) before launch.</Text>
          </View>
        ) : (
          <>
            {!settings.whatsappNumber && <Notice tone="info" title="WhatsApp and phone support not set up yet" text="The shop's verified business number will be added in the admin settings." />}
            {topics.map((t) => (
              <Pressable key={t} onPress={() => open(t)} disabled={!settings.whatsappNumber} style={[ui.card, { flexDirection: 'row', alignItems: 'center', gap: 12, opacity: settings.whatsappNumber ? 1 : 0.6 }]}>
                <Ionicons name="logo-whatsapp" size={22} color={colors.success} />
                <Text style={{ color: colors.text, fontWeight: '700', flex: 1 }}>{t}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
              </Pressable>
            ))}
            {!!settings.supportPhone && (
              <View style={[ui.card, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
                <Ionicons name="call" size={22} color={colors.gold} />
                <Text selectable style={{ color: colors.text, fontWeight: '700', flex: 1 }}>Call us: {settings.supportPhone}</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { toast } from '@/components/Toast';
import { Field, GoldButton, s as ui } from '@/components/ui';
import { IS_LIVE } from '@/config';
import { queryClient } from '@/hooks/queries';
import { demo } from '@/services/demoDb';
import { useSession } from '@/stores/session';
import { useShop } from '@/stores/shop';
import { useState } from 'react';
import { colors, radius, space } from '@/theme';

type Item = { icon: keyof typeof Ionicons.glyphMap; title: string; sub: string; go: () => void };

export default function Account() {
  const insets = useSafeAreaInsets();
  const session = useSession((s) => s.session);
  const { signOut, setName } = useSession();
  const phone = session?.phone ?? session?.email;
  const name = session?.name;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const resetDemo = () => {
    demo.reset();
    useShop.setState({ cart: [], wishlist: [], selectedAddressId: null });
    void signOut();
    void queryClient.invalidateQueries();
    toast('Demo data reset', 'info');
  };

  const items: Item[] = [
    { icon: 'cube-outline', title: 'My Orders', sub: 'Track, return or exchange', go: () => router.push('/(tabs)/orders') },
    { icon: 'heart-outline', title: 'Saved Items', sub: 'Your wishlist', go: () => router.push('/wishlist') },
    { icon: 'location-outline', title: 'Saved Addresses', sub: 'Manage delivery locations', go: () => router.push('/address') },
    { icon: 'resize-outline', title: 'Size & Fit Help', sub: 'Find your UK size', go: () => router.push('/support?topic=size') },
    { icon: 'notifications-outline', title: 'Notifications', sub: 'Order and offer updates', go: () => router.push('/notifications') },
    { icon: 'help-buoy-outline', title: 'Help & Support', sub: 'Orders, delivery, exchanges', go: () => router.push('/support') },
    { icon: 'document-text-outline', title: 'Policies', sub: 'Privacy, terms, exchange', go: () => router.push('/support?topic=policies') },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingTop: insets.top + 8, padding: space.lg, gap: space.lg, paddingBottom: 40 }}>
      <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800' }}>My Account</Text>
      {phone ? (
        <View style={[ui.card, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
          <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: colors.textOnGold, fontWeight: '800', fontSize: 20 }}>{(name || 'A')[0].toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            {editing ? (
              <Field label="Your name" value={draft} onChangeText={setDraft} autoFocus onSubmitEditing={() => { void setName(draft.trim()).then(() => toast('Profile updated')); setEditing(false); }} />
            ) : (
              <>
                <Text style={{ color: colors.text, fontWeight: '800', fontSize: 17 }}>{name || 'ABDAZ Customer'}</Text>
                <Text style={{ color: colors.textDim }}>{phone}</Text>
              </>
            )}
          </View>
          <Pressable
            onPress={() => {
              if (editing) {
                void setName(draft.trim()).then(() => toast('Profile updated'));
                setEditing(false);
              } else {
                setDraft(name ?? '');
                setEditing(true);
              }
            }}
            hitSlop={8}
            accessibilityLabel="Edit profile"
          >
            <Ionicons name={editing ? 'checkmark-circle' : 'create-outline'} size={22} color={colors.gold} />
          </Pressable>
        </View>
      ) : (
        <View style={[ui.card, { gap: 10 }]}>
          <Text style={ui.section}>You are browsing as a guest</Text>
          <Text style={{ color: colors.textDim }}>Sign in with your mobile number to place orders and save your details.</Text>
          <GoldButton title="Sign In" onPress={() => router.push('/login')} />
        </View>
      )}

      <View style={{ backgroundColor: colors.cardLight, borderRadius: radius.lg, overflow: 'hidden' }}>
        {items.map((it, i) => (
          <Pressable key={it.title} onPress={it.go} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderTopWidth: i ? 1 : 0, borderColor: '#E7E1D6', backgroundColor: pressed ? '#EEE8DC' : 'transparent' })}>
            <Ionicons name={it.icon} size={22} color="#222" />
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#111', fontWeight: '700' }}>{it.title}</Text>
              <Text style={{ color: '#777', fontSize: 12 }}>{it.sub}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#999" />
          </Pressable>
        ))}
        {phone && (
          <Pressable onPress={() => { void signOut().then(() => { void queryClient.invalidateQueries(); toast('Logged out', 'info'); }); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderTopWidth: 1, borderColor: '#E7E1D6' }}>
            <Ionicons name="log-out-outline" size={22} color={colors.danger} />
            <Text style={{ color: colors.danger, fontWeight: '700' }}>Log Out</Text>
          </Pressable>
        )}
      </View>

      {!IS_LIVE && (
        <Pressable onPress={resetDemo} style={{ alignSelf: 'center', padding: 8 }}>
          <Text style={{ color: colors.textDim, fontSize: 12 }}>Reset demo data</Text>
        </Pressable>
      )}
      <Text style={{ color: colors.textDim, fontSize: 11, textAlign: 'center' }}>ABDAZ FOOTWEAR · v0.2.0 {IS_LIVE ? '' : 'demo build'}</Text>
    </ScrollView>
  );
}

import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GoldButton, OutlineButton, Row, s as ui } from '@/components/ui';
import { useOrder } from '@/hooks/queries';
import { IS_LIVE } from '@/config';
import { colors, formatINR, space } from '@/theme';

export default function OrderSuccess() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: order } = useOrder(id);
  const insets = useSafeAreaInsets();
  const scale = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }).start();
  }, [scale]);

  // Success is shown only for an order that was actually saved.
  if (!order) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: space.xl, paddingTop: insets.top + 40, gap: space.lg, alignItems: 'stretch' }}>
      <Animated.View style={{ alignSelf: 'center', transform: [{ scale }], width: 110, height: 110, borderRadius: 55, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center', shadowColor: colors.gold, shadowOpacity: 0.6, shadowRadius: 30, elevation: 12 }}>
        <Ionicons name="checkmark" size={64} color={colors.textOnGold} />
      </Animated.View>
      <Text style={{ color: colors.text, fontSize: 26, fontWeight: '800', textAlign: 'center' }}>Order Placed Successfully!</Text>
      <Text style={{ color: colors.textDim, textAlign: 'center' }}>
        {IS_LIVE ? 'We will confirm your order shortly. You can track every step here.' : 'Demo order · saved on this phone. No real delivery will happen.'}
      </Text>
      <View style={[ui.card, { gap: 2 }]}>
        <Row label="Order ID" value={'#' + order.orderNumber} bold />
        <Row label="Amount payable" value={formatINR(order.total)} />
        <Row label="Payment" value={order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'UPI'} />
        <Row label="Estimated delivery" value={`Up to ${order.etaMinutes} min after confirmation`} />
        <Text style={{ color: colors.textDim, marginTop: 8 }}>
          Delivering to {order.address.fullName}, {order.address.house}, {order.address.street}, {order.address.area} - {order.address.pincode}
        </Text>
      </View>
      <GoldButton title="Track Order" icon="navigate" onPress={() => router.replace(`/order/${order.id}`)} />
      <OutlineButton title="Continue Shopping" onPress={() => router.replace('/(tabs)')} />
    </ScrollView>
  );
}

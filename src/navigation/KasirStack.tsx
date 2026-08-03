import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from './types';
import {colors} from '../theme';

import KasirSessionScreen from '../screens/kasir/KasirSessionScreen';
import KasirScreen from '../screens/kasir/KasirScreen';
import PaymentScreen from '../screens/kasir/PaymentScreen';
import ReceiptResultScreen from '../screens/kasir/ReceiptResultScreen';

export type KasirStackParamList = {
  KasirSession: undefined;
  Kasir: {transactionId: number};
  Payment: {transactionId: number};
  ReceiptResult: {transactionId: number};
};

const Stack = createNativeStackNavigator<KasirStackParamList>();

/**
 * ReceiptResultScreen's "Selesai" button calls navigation.reset() targeting
 * the root-level 'Home' route to fully collapse the checkout flow and land
 * back on the tab bar. 'Home' only exists on the root stack (two levels up:
 * this nested stack -> the Kasir tab -> the root stack), and reset(), unlike
 * navigate(), doesn't bubble to find it - so this screen alone needs the
 * root navigation object instead of this stack's own.
 */
function ReceiptResultWithRootNav(
  props: import('@react-navigation/native-stack').NativeStackScreenProps<
    KasirStackParamList,
    'ReceiptResult'
  >,
) {
  const rootNavigation = props.navigation
    .getParent()
    ?.getParent<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <ReceiptResultScreen
      navigation={(rootNavigation ?? props.navigation) as any}
      route={props.route as any}
    />
  );
}

export default function KasirStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTitleAlign: 'center',
        headerStyle: {backgroundColor: colors.navy},
        headerTintColor: colors.textOnNavy,
        headerTitleStyle: {fontWeight: '700'},
        contentStyle: {backgroundColor: colors.background},
      }}>
      <Stack.Screen
        name="KasirSession"
        component={KasirSessionScreen as unknown as React.ComponentType<any>}
        options={{title: 'Kasir'}}
      />
      <Stack.Screen
        name="Kasir"
        component={KasirScreen as unknown as React.ComponentType<any>}
        options={{title: 'Transaksi'}}
      />
      <Stack.Screen
        name="Payment"
        component={PaymentScreen as unknown as React.ComponentType<any>}
        options={{title: 'Pembayaran'}}
      />
      <Stack.Screen
        name="ReceiptResult"
        component={ReceiptResultWithRootNav}
        options={{title: 'Struk', headerBackVisible: false}}
      />
    </Stack.Navigator>
  );
}

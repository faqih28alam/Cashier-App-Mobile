import React from 'react';
import {
  createBottomTabNavigator,
  BottomTabNavigationOptions,
} from '@react-navigation/bottom-tabs';
import {
  getFocusedRouteNameFromRoute,
  RouteProp,
} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useAuth} from '../state/AuthContext';
import {ModuleKey, canAccessModule} from './access';
import {colors} from '../theme';

import KasirStack, {KasirStackParamList} from './KasirStack';
import PurchaseListScreen from '../screens/purchas/PurchaseListScreen';
import FinanceScreen from '../screens/keuangan/FinanceScreen';
import ReportsHomeScreen from '../screens/laporan/ReportsHomeScreen';
import MoreScreen from '../screens/more/MoreScreen';

export type MainTabParamList = {
  // Named KasirTab, not Kasir, so it doesn't collide with the nested
  // KasirStack's own 'Kasir' (checkout) screen - React Navigation warns
  // when the same route name is nested inside itself in one branch.
  KasirTab: undefined;
  Purchase: undefined;
  Keuangan: undefined;
  Laporan: undefined;
  Lainnya: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const tabBarVisible: BottomTabNavigationOptions['tabBarStyle'] = {
  backgroundColor: colors.card,
  borderTopColor: colors.border,
};

function tabIcon(name: string) {
  return ({color, size}: {color: string; size: number}) => (
    <Icon name={name} color={color} size={size} />
  );
}

/**
 * The Kasir tab hosts its own nested stack (checkout: KasirSession -> Kasir
 * -> Payment -> ReceiptResult). The tab bar should only show on the tab's
 * landing screen, not mid-checkout, matching how this flow was always a
 * full-screen experience before the tab bar existed.
 *
 * KasirSessionScreen is a transient loading gate that immediately
 * navigation.replace()s into 'Kasir' once it finishes checking for a held
 * transaction, so 'KasirSession' is never actually the focused route the
 * user sees - the real landing screen (scan/cart) is 'Kasir'. Only the
 * later checkout steps (Payment, ReceiptResult) count as "mid-checkout".
 */
const KASIR_TAB_BAR_ROUTES: ReadonlySet<keyof KasirStackParamList> = new Set([
  'KasirSession',
  'Kasir',
]);

function kasirTabOptions({
  route,
}: {
  route: RouteProp<MainTabParamList, 'KasirTab'>;
}): BottomTabNavigationOptions {
  const focusedRoute = (getFocusedRouteNameFromRoute(route) ??
    'KasirSession') as keyof KasirStackParamList;
  return {
    title: 'Kasir',
    headerShown: false,
    tabBarIcon: tabIcon('cash-register'),
    tabBarStyle: KASIR_TAB_BAR_ROUTES.has(focusedRoute)
      ? tabBarVisible
      : {display: 'none'},
  };
}

export default function MainTabs() {
  const {currentUser} = useAuth();

  const has = (m: ModuleKey) =>
    currentUser ? canAccessModule(currentUser.role, m) : false;

  return (
    <Tab.Navigator
      screenOptions={{
        headerTitleAlign: 'center',
        headerStyle: {backgroundColor: colors.navy},
        headerTintColor: colors.textOnNavy,
        headerTitleStyle: {fontWeight: '700'},
        tabBarActiveTintColor: colors.navy,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: tabBarVisible,
        tabBarLabelStyle: {fontSize: 11, fontWeight: '600'},
        // A bottom tab bar floating above the on-screen keyboard wastes
        // vertical space and invites accidental navigation away from an
        // in-progress transaction (e.g. while scanning/typing a barcode).
        tabBarHideOnKeyboard: true,
      }}>
      <Tab.Screen
        name="KasirTab"
        component={KasirStack}
        options={kasirTabOptions}
      />
      {has('PURCHAS') && (
        <Tab.Screen
          name="Purchase"
          component={PurchaseListScreen as React.ComponentType<any>}
          options={{title: 'Purchase', tabBarIcon: tabIcon('package-variant')}}
        />
      )}
      {has('KEUANGAN') && (
        <Tab.Screen
          name="Keuangan"
          component={FinanceScreen as React.ComponentType<any>}
          options={{title: 'Keuangan', tabBarIcon: tabIcon('wallet-outline')}}
        />
      )}
      {has('LAPORAN') && (
        <Tab.Screen
          name="Laporan"
          component={ReportsHomeScreen as React.ComponentType<any>}
          options={{title: 'Laporan', tabBarIcon: tabIcon('chart-bar')}}
        />
      )}
      <Tab.Screen
        name="Lainnya"
        component={MoreScreen}
        options={{title: 'Lainnya', tabBarIcon: tabIcon('dots-horizontal')}}
      />
    </Tab.Navigator>
  );
}

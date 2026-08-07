import React from 'react';
import {View, ActivityIndicator, StatusBar, StyleSheet} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {RootStackParamList} from './types';
import {useAuth} from '../state/AuthContext';
import {colors} from '../theme';

import BootstrapScreen from '../screens/auth/BootstrapScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import MainTabs from './MainTabs';

import PurchaseFormScreen from '../screens/purchas/PurchaseFormScreen';

import SalesReportScreen from '../screens/laporan/SalesReportScreen';
import ProductReportScreen from '../screens/laporan/ProductReportScreen';
import StockReportScreen from '../screens/laporan/StockReportScreen';
import FinanceReportScreen from '../screens/laporan/FinanceReportScreen';

import MasterHomeScreen from '../screens/master/MasterHomeScreen';
import ProductListScreen from '../screens/master/ProductListScreen';
import ProductFormScreen from '../screens/master/ProductFormScreen';
import CategoryListScreen from '../screens/master/CategoryListScreen';
import SupplierListScreen from '../screens/master/SupplierListScreen';
import UserListScreen from '../screens/master/UserListScreen';
import UserFormScreen from '../screens/master/UserFormScreen';

import SettingScreen from '../screens/setting/SettingScreen';
import PrinterPairingScreen from '../screens/setting/PrinterPairingScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const {loading, needsBootstrap, currentUser} = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.navy} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar backgroundColor={colors.navy} barStyle="light-content" />
      <Stack.Navigator
        screenOptions={{
          headerTitleAlign: 'center',
          headerStyle: {backgroundColor: colors.navy},
          headerTintColor: colors.textOnNavy,
          headerTitleStyle: {fontWeight: '700'},
          contentStyle: {backgroundColor: colors.background},
        }}>
        {needsBootstrap ? (
          <Stack.Screen
            name="Bootstrap"
            component={BootstrapScreen}
            options={{headerShown: false}}
          />
        ) : !currentUser ? (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{headerShown: false}}
          />
        ) : (
          <>
            <Stack.Screen
              name="Home"
              component={MainTabs}
              options={{headerShown: false}}
            />

            <Stack.Screen
              name="PurchaseForm"
              component={PurchaseFormScreen}
              options={{title: 'Detail Pembelian'}}
            />

            <Stack.Screen
              name="SalesReport"
              component={SalesReportScreen}
              options={{title: 'Laporan Penjualan'}}
            />
            <Stack.Screen
              name="ProductReport"
              component={ProductReportScreen}
              options={{title: 'Data Barang'}}
            />
            <Stack.Screen
              name="StockReport"
              component={StockReportScreen}
              options={{title: 'Laporan Stok'}}
            />
            <Stack.Screen
              name="FinanceReport"
              component={FinanceReportScreen}
              options={{title: 'Laporan Keuangan'}}
            />

            <Stack.Screen
              name="MasterHome"
              component={MasterHomeScreen}
              options={{title: 'MASTER'}}
            />
            <Stack.Screen
              name="ProductList"
              component={ProductListScreen}
              options={{title: 'Produk'}}
            />
            <Stack.Screen
              name="ProductForm"
              component={ProductFormScreen}
              options={{title: 'Detail Produk'}}
            />
            <Stack.Screen
              name="CategoryList"
              component={CategoryListScreen}
              options={{title: 'Kategori'}}
            />
            <Stack.Screen
              name="SupplierList"
              component={SupplierListScreen}
              options={{title: 'Supplier'}}
            />
            <Stack.Screen
              name="UserList"
              component={UserListScreen}
              options={{title: 'Pengguna'}}
            />
            <Stack.Screen
              name="UserForm"
              component={UserFormScreen}
              options={{title: 'Detail Pengguna'}}
            />

            <Stack.Screen
              name="Setting"
              component={SettingScreen}
              options={{title: 'SETTING'}}
            />
            <Stack.Screen
              name="PrinterPairing"
              component={PrinterPairingScreen}
              options={{title: 'Pilih Printer'}}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});

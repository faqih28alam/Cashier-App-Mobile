import React from 'react';
import {Text, TouchableOpacity, StyleSheet, FlatList} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/types';
import RoleGuard from '../../components/common/RoleGuard';
import {useAuth} from '../../state/AuthContext';
import {canViewFinanceReport} from '../../navigation/access';

type Props = NativeStackScreenProps<RootStackParamList, 'ReportsHome'>;

function ReportsHomeInner({navigation}: Props) {
  const {currentUser} = useAuth();
  const reports: {label: string; route: keyof RootStackParamList}[] = [
    {label: 'Data Barang', route: 'ProductReport'},
    {label: 'Laporan Penjualan', route: 'SalesReport'},
    {label: 'Laporan Stok', route: 'StockReport'},
    {label: 'Laporan Transaksi', route: 'TransactionReport'},
  ];
  if (currentUser && canViewFinanceReport(currentUser.role)) {
    reports.push({label: 'Laporan Keuangan', route: 'FinanceReport'});
  }

  return (
    <FlatList
      data={reports}
      keyExtractor={item => item.route}
      contentContainerStyle={styles.container}
      renderItem={({item}) => (
        <TouchableOpacity
          style={styles.row}
          onPress={() => navigation.navigate(item.route as any)}>
          <Text style={styles.rowText}>{item.label}</Text>
        </TouchableOpacity>
      )}
    />
  );
}

export default function ReportsHomeScreen(props: Props) {
  return (
    <RoleGuard allowed={['admin', 'owner']}>
      <ReportsHomeInner {...props} />
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  container: {padding: 12},
  row: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#f5f5f7',
    borderRadius: 10,
    marginBottom: 10,
  },
  rowText: {fontSize: 16, fontWeight: '600'},
});

import React from 'react';
import {View, StyleSheet, FlatList} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/types';
import RoleGuard from '../../components/common/RoleGuard';
import {useAuth} from '../../state/AuthContext';
import {canViewFinanceReport} from '../../navigation/access';
import ListRow from '../../components/ui/ListRow';
import {colors, spacing} from '../../theme';

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
    <View style={styles.page}>
      <FlatList
        data={reports}
        keyExtractor={item => item.route}
        contentContainerStyle={styles.container}
        renderItem={({item}) => (
          <ListRow
            title={item.label}
            onPress={() => navigation.navigate(item.route as any)}
          />
        )}
      />
    </View>
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
  page: {flex: 1, backgroundColor: colors.background},
  container: {padding: spacing.md},
});

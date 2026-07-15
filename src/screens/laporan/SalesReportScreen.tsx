import React, {useCallback, useEffect, useState} from 'react';
import {View, Text, StyleSheet, FlatList} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/types';
import RoleGuard from '../../components/common/RoleGuard';
import DateRangeFilter from '../../components/common/DateRangeFilter';
import {
  getSalesSummary,
  getProductSales,
  ProductSalesRow,
  SalesSummary,
} from '../../db/repositories/reportsRepo';
import {formatCurrency} from '../../domain/money';

type Props = NativeStackScreenProps<RootStackParamList, 'SalesReport'>;

function SalesReportInner(_: Props) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [rows, setRows] = useState<ProductSalesRow[]>([]);

  const load = useCallback(async () => {
    const opts = {from: from || undefined, to: to || undefined};
    const [s, r] = await Promise.all([
      getSalesSummary(opts),
      getProductSales(opts),
    ]);
    setSummary(s);
    setRows(r);
  }, [from, to]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <View style={styles.container}>
      <DateRangeFilter
        from={from}
        to={to}
        onChangeFrom={setFrom}
        onChangeTo={setTo}
      />

      <View style={styles.summaryBox}>
        <Text style={styles.summaryLine}>
          Jumlah Transaksi: {summary?.transactionCount ?? 0}
        </Text>
        <Text style={styles.summaryLine}>
          Total Penjualan: {formatCurrency(summary?.totalSales ?? 0)}
        </Text>
        <Text style={styles.summaryLine}>
          Total Diskon: {formatCurrency(summary?.totalDiscount ?? 0)}
        </Text>
        <Text style={styles.summaryLine}>
          Total Pajak: {formatCurrency(summary?.totalTax ?? 0)}
        </Text>
      </View>

      <Text style={styles.sectionLabel}>Rincian per Produk</Text>
      <FlatList
        data={rows}
        keyExtractor={item => String(item.productId)}
        ListEmptyComponent={
          <Text style={styles.empty}>
            Tidak ada data penjualan pada rentang ini
          </Text>
        }
        renderItem={({item}) => (
          <View style={styles.row}>
            <View>
              <Text style={styles.rowName}>{item.name}</Text>
              <Text style={styles.rowMeta}>Terjual: {item.qtySold}</Text>
            </View>
            <Text style={styles.rowTotal}>
              {formatCurrency(item.totalSales)}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

export default function SalesReportScreen(props: Props) {
  return (
    <RoleGuard allowed={['admin', 'owner']}>
      <SalesReportInner {...props} />
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff', padding: 12},
  summaryBox: {
    backgroundColor: '#eef2ff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  summaryLine: {fontSize: 14, marginBottom: 2},
  sectionLabel: {fontWeight: '700', marginBottom: 8},
  empty: {textAlign: 'center', color: '#999', marginTop: 24},
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  rowName: {fontWeight: '600'},
  rowMeta: {color: '#666', fontSize: 12},
  rowTotal: {fontWeight: '700'},
});

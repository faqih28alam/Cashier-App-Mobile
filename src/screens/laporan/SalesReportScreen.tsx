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
import StatCard from '../../components/ui/StatCard';
import EmptyState from '../../components/ui/EmptyState';
import {colors, radius, spacing, typography} from '../../theme';

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

      <View style={styles.statGrid}>
        <View style={styles.statItem}>
          <StatCard
            label="Jumlah Transaksi"
            value={String(summary?.transactionCount ?? 0)}
            accentColor={colors.badgePurple}
          />
        </View>
        <View style={styles.statItem}>
          <StatCard
            label="Total Penjualan"
            value={formatCurrency(summary?.totalSales ?? 0)}
            accentColor={colors.badgeOrange}
          />
        </View>
        <View style={styles.statItem}>
          <StatCard
            label="Total Diskon"
            value={formatCurrency(summary?.totalDiscount ?? 0)}
            accentColor={colors.badgeBlue}
          />
        </View>
        <View style={styles.statItem}>
          <StatCard
            label="Total Pajak"
            value={formatCurrency(summary?.totalTax ?? 0)}
            accentColor={colors.badgeGreen}
          />
        </View>
      </View>

      <Text style={styles.sectionLabel}>Rincian per Produk</Text>
      <FlatList
        data={rows}
        keyExtractor={item => String(item.productId)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState message="Tidak ada data penjualan pada rentang ini" />
        }
        renderItem={({item}) => (
          <View style={styles.row}>
            <View style={styles.rowMain}>
              <Text
                style={styles.rowName}
                numberOfLines={1}
                ellipsizeMode="tail">
                {item.name}
              </Text>
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
  container: {flex: 1, backgroundColor: colors.background, padding: spacing.md},
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statItem: {width: '47%'},
  sectionLabel: {...typography.sectionLabel, marginBottom: spacing.sm},
  list: {flexGrow: 1},
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  rowMain: {flex: 1, marginRight: spacing.sm},
  rowName: {...typography.bodyMedium},
  rowMeta: {color: colors.textMuted, fontSize: 12},
  rowTotal: {fontWeight: '700', color: colors.textPrimary},
});

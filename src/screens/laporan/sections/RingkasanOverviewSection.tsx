import React, {useCallback, useEffect, useState} from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../../navigation/types';
import {useAuth} from '../../../state/AuthContext';
import {canViewFinanceReport} from '../../../navigation/access';
import DateRangeFilter from '../../../components/common/DateRangeFilter';
import StatCard from '../../../components/ui/StatCard';
import ListRow from '../../../components/ui/ListRow';
import EmptyState from '../../../components/ui/EmptyState';
import RevenueProfitLineChart from '../../../components/charts/RevenueProfitLineChart';
import RevenueProfitBarChart from '../../../components/charts/RevenueProfitBarChart';
import {
  getRevenueProfitOverview,
  getDailyRevenueProfit,
  getProductSales,
  RevenueProfitOverview,
  DailyRevenueProfit,
  ProductSalesRow,
} from '../../../db/repositories/reportsRepo';
import {formatCurrency} from '../../../domain/money';
import {daysAgoStr, monthStartStr, todayStr} from '../../../domain/date';
import {colors, radius, spacing, typography} from '../../../theme';

const TOP_PRODUCTS_LIMIT = 6;

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ReportsHome'>;
}

export default function RingkasanOverviewSection({navigation}: Props) {
  const {currentUser} = useAuth();

  const [overview, setOverview] = useState<RevenueProfitOverview | null>(
    null,
  );
  const [trend, setTrend] = useState<DailyRevenueProfit[]>([]);
  const [topProducts, setTopProducts] = useState<ProductSalesRow[]>([]);

  const [customFrom, setCustomFrom] = useState(daysAgoStr(6));
  const [customTo, setCustomTo] = useState(todayStr());
  const [customDaily, setCustomDaily] = useState<DailyRevenueProfit[]>([]);

  const loadOverview = useCallback(async () => {
    const [ov, tr, products] = await Promise.all([
      getRevenueProfitOverview(),
      getDailyRevenueProfit({from: daysAgoStr(13), to: todayStr()}),
      getProductSales({from: monthStartStr(), to: todayStr()}),
    ]);
    setOverview(ov);
    setTrend(tr);
    setTopProducts(products.slice(0, TOP_PRODUCTS_LIMIT));
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const loadCustomDaily = useCallback(async () => {
    if (!customFrom || !customTo) {
      return;
    }
    const rows = await getDailyRevenueProfit({from: customFrom, to: customTo});
    setCustomDaily(rows);
  }, [customFrom, customTo]);

  useEffect(() => {
    loadCustomDaily();
  }, [loadCustomDaily]);

  const showFinanceReport =
    !!currentUser && canViewFinanceReport(currentUser.role);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}>
      <View style={styles.statGrid}>
        <View style={styles.statItem}>
          <StatCard
            label="Omzet Hari Ini"
            value={formatCurrency(overview?.todayOmzet ?? 0)}
            icon="trending-up"
            accentColor={colors.badgeGreen}
          />
        </View>
        <View style={styles.statItem}>
          <StatCard
            label="Laba Kotor Hari Ini"
            value={formatCurrency(overview?.todayLabaKotor ?? 0)}
            icon="chart-bar"
            accentColor={colors.badgeBlue}
          />
        </View>
        <View style={styles.statItem}>
          <StatCard
            label="Omzet Bulan Ini"
            value={formatCurrency(overview?.monthOmzet ?? 0)}
            icon="chart-bar"
            accentColor={colors.badgeBlue}
          />
        </View>
        <View style={styles.statItem}>
          <StatCard
            label="Laba Kotor Bulan Ini"
            value={formatCurrency(overview?.monthLabaKotor ?? 0)}
            icon="trending-up"
            accentColor={colors.badgeGreen}
          />
        </View>
        <View style={styles.statItem}>
          <StatCard
            label="Total Transaksi Bulan Ini"
            value={String(overview?.monthTransactionCount ?? 0)}
            icon="cart-outline"
            accentColor={colors.badgePurple}
          />
        </View>
      </View>

      <Text style={styles.sectionLabel}>Revenue vs Laba — 14 Hari Terakhir</Text>
      <View style={styles.card}>
        <RevenueProfitLineChart data={trend} />
      </View>

      <Text style={styles.sectionLabel}>Produk Terlaris Bulan Ini</Text>
      {topProducts.length === 0 ? (
        <View style={styles.card}>
          <EmptyState message="Belum ada penjualan bulan ini" />
        </View>
      ) : (
        topProducts.map(product => (
          <View key={product.productId} style={styles.row}>
            <View style={styles.rowMain}>
              <Text
                style={styles.rowName}
                numberOfLines={1}
                ellipsizeMode="tail">
                {product.name}
              </Text>
              <Text style={styles.rowMeta}>Terjual: {product.qtySold}</Text>
            </View>
            <Text style={styles.rowTotal}>
              {formatCurrency(product.totalSales)}
            </Text>
          </View>
        ))
      )}

      <Text style={styles.sectionLabel}>Penjualan Harian (Kustom)</Text>
      <View style={styles.card}>
        <DateRangeFilter
          from={customFrom}
          to={customTo}
          onChangeFrom={setCustomFrom}
          onChangeTo={setCustomTo}
        />
        {customDaily.length === 0 ? (
          <EmptyState message="Tidak ada data pada rentang ini" />
        ) : (
          <RevenueProfitBarChart data={customDaily} />
        )}
      </View>

      <Text style={styles.sectionLabel}>Laporan Lainnya</Text>
      <ListRow
        title="Laporan Penjualan"
        onPress={() => navigation.navigate('SalesReport')}
      />
      <ListRow
        title="Data Barang"
        onPress={() => navigation.navigate('ProductReport')}
      />
      <ListRow
        title="Laporan Stok"
        onPress={() => navigation.navigate('StockReport')}
      />
      {showFinanceReport && (
        <ListRow
          title="Laporan Keuangan"
          onPress={() => navigation.navigate('FinanceReport')}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.background},
  content: {padding: spacing.md},
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statItem: {width: '47%'},
  sectionLabel: {...typography.sectionLabel, marginBottom: spacing.sm, marginTop: spacing.sm},
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
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

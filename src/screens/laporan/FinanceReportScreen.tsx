import React, {useCallback, useEffect, useState} from 'react';
import {View, Text, FlatList, StyleSheet} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/types';
import RoleGuard from '../../components/common/RoleGuard';
import DateRangeFilter from '../../components/common/DateRangeFilter';
import {FinanceEntry} from '../../types';
import {
  getCashBalance,
  listFinanceEntries,
} from '../../db/repositories/financeRepo';
import {formatCurrency} from '../../domain/money';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import {colors, radius, spacing, typography} from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'FinanceReport'>;

/** LAPORAN > Laporan Keuangan — Owner-only per role/module access matrix. */
function FinanceReportInner(_: Props) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [balance, setBalance] = useState(0);

  const load = useCallback(async () => {
    const [list, bal] = await Promise.all([
      listFinanceEntries({from: from || undefined, to: to || undefined}),
      getCashBalance(),
    ]);
    setEntries([...list].reverse());
    setBalance(bal);
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
      <Card style={styles.balanceBox}>
        <Text style={styles.balanceLabel}>Saldo Kas Saat Ini</Text>
        <Text
          style={[styles.balanceValue, balance < 0 && styles.balanceNegative]}
          numberOfLines={1}
          adjustsFontSizeToFit>
          {formatCurrency(balance)}
        </Text>
      </Card>
      <FlatList
        data={entries}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState message="Tidak ada data pada rentang ini" />
        }
        renderItem={({item}) => (
          <View style={styles.row}>
            <View style={styles.rowMain}>
              <Text
                style={styles.rowDesc}
                numberOfLines={1}
                ellipsizeMode="tail">
                {item.description}
              </Text>
              <Text style={styles.rowMeta}>
                {new Date(item.createdAt).toLocaleString('id-ID')}
              </Text>
            </View>
            <Text
              style={[
                styles.rowAmount,
                item.type === 'debit' ? styles.debit : styles.kredit,
              ]}>
              {item.type === 'debit' ? '+' : '-'}
              {formatCurrency(item.amount)}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

export default function FinanceReportScreen(props: Props) {
  return (
    <RoleGuard allowed={['owner']}>
      <FinanceReportInner {...props} />
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.background, padding: spacing.md},
  balanceBox: {alignItems: 'center', marginBottom: spacing.md},
  balanceLabel: {...typography.body, color: colors.textMuted},
  balanceValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.navy,
    marginTop: spacing.xs,
  },
  balanceNegative: {color: colors.danger},
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
  rowDesc: {...typography.bodyMedium},
  rowMeta: {color: colors.textMuted, fontSize: 11, marginTop: 2},
  rowAmount: {fontWeight: '700'},
  debit: {color: colors.success},
  kredit: {color: colors.danger},
});

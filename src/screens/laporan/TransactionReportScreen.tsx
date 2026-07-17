import React, {useCallback, useEffect, useState} from 'react';
import {View, Text, FlatList, StyleSheet} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/types';
import RoleGuard from '../../components/common/RoleGuard';
import DateRangeFilter from '../../components/common/DateRangeFilter';
import {Transaction} from '../../types';
import {listPaidTransactions} from '../../db/repositories/transactionRepo';
import {formatCurrency} from '../../domain/money';
import EmptyState from '../../components/ui/EmptyState';
import {colors, radius, spacing, typography} from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'TransactionReport'>;

function TransactionReportInner(_: Props) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const load = useCallback(async () => {
    const list = await listPaidTransactions({
      from: from || undefined,
      to: to || undefined,
    });
    setTransactions(list);
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
      <FlatList
        data={transactions}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState message="Tidak ada transaksi pada rentang ini" />
        }
        renderItem={({item}) => (
          <View style={styles.row}>
            <View style={styles.rowMain}>
              <Text
                style={styles.rowCode}
                numberOfLines={1}
                ellipsizeMode="tail">
                {item.code}
              </Text>
              <Text
                style={styles.rowMeta}
                numberOfLines={1}
                ellipsizeMode="tail">
                {item.cashierName} ·{' '}
                {item.paidAt
                  ? new Date(item.paidAt).toLocaleString('id-ID')
                  : '-'}
              </Text>
            </View>
            <Text style={styles.rowTotal}>{formatCurrency(item.total)}</Text>
          </View>
        )}
      />
    </View>
  );
}

export default function TransactionReportScreen(props: Props) {
  return (
    <RoleGuard allowed={['admin', 'owner']}>
      <TransactionReportInner {...props} />
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.background, padding: spacing.md},
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
  rowCode: {...typography.bodyMedium},
  rowMeta: {color: colors.textMuted, fontSize: 12, marginTop: 2},
  rowTotal: {fontWeight: '700', color: colors.textPrimary},
});

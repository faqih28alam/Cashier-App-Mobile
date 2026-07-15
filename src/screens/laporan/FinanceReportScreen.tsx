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
      <View style={styles.balanceBox}>
        <Text style={styles.balanceLabel}>Saldo Kas Saat Ini</Text>
        <Text style={styles.balanceValue}>{formatCurrency(balance)}</Text>
      </View>
      <FlatList
        data={entries}
        keyExtractor={item => String(item.id)}
        ListEmptyComponent={
          <Text style={styles.empty}>Tidak ada data pada rentang ini</Text>
        }
        renderItem={({item}) => (
          <View style={styles.row}>
            <View>
              <Text style={styles.rowDesc}>{item.description}</Text>
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
  container: {flex: 1, backgroundColor: '#fff', padding: 12},
  balanceBox: {
    alignItems: 'center',
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#eef2ff',
    borderRadius: 10,
  },
  balanceLabel: {color: '#444'},
  balanceValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1d4ed8',
    marginTop: 4,
  },
  empty: {textAlign: 'center', color: '#999', marginTop: 24},
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  rowDesc: {fontWeight: '600'},
  rowMeta: {color: '#666', fontSize: 11, marginTop: 2},
  rowAmount: {fontWeight: '700'},
  debit: {color: '#16a34a'},
  kredit: {color: '#b91c1c'},
});

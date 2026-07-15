import React, {useCallback, useEffect, useState} from 'react';
import {View, Text, FlatList, StyleSheet} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/types';
import RoleGuard from '../../components/common/RoleGuard';
import DateRangeFilter from '../../components/common/DateRangeFilter';
import {Transaction} from '../../types';
import {listPaidTransactions} from '../../db/repositories/transactionRepo';
import {formatCurrency} from '../../domain/money';

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
        ListEmptyComponent={
          <Text style={styles.empty}>Tidak ada transaksi pada rentang ini</Text>
        }
        renderItem={({item}) => (
          <View style={styles.row}>
            <View>
              <Text style={styles.rowCode}>{item.code}</Text>
              <Text style={styles.rowMeta}>
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
  container: {flex: 1, backgroundColor: '#fff', padding: 12},
  empty: {textAlign: 'center', color: '#999', marginTop: 24},
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  rowCode: {fontWeight: '700'},
  rowMeta: {color: '#666', fontSize: 12, marginTop: 2},
  rowTotal: {fontWeight: '700'},
});

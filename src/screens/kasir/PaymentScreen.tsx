import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/types';
import RoleGuard from '../../components/common/RoleGuard';
import {formatCurrency, CASH_DENOMINATIONS} from '../../domain/money';
import {Transaction} from '../../types';
import {
  getTransactionById,
  completeTransactionPayment,
} from '../../db/repositories/transactionRepo';

type Props = NativeStackScreenProps<RootStackParamList, 'Payment'>;

function PaymentInner({navigation, route}: Props) {
  const {transactionId} = route.params;
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [cashPaid, setCashPaid] = useState(0);
  const [cashInputText, setCashInputText] = useState('0');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const tx = await getTransactionById(transactionId);
      setTransaction(tx);
    })();
  }, [transactionId]);

  const total = transaction?.total ?? 0;
  const change = cashPaid - total;
  const canConfirm = cashPaid >= total && total > 0;

  const setCash = (value: number) => {
    const safe = Math.max(0, value);
    setCashPaid(safe);
    setCashInputText(String(safe));
  };

  const addDenomination = (value: number) => setCash(cashPaid + value);
  const clearCash = () => setCash(0);
  const payExact = () => setCash(total);

  const onCashTextChange = (text: string) => {
    setCashInputText(text);
    const parsed = parseFloat(text.replace(/[^0-9.]/g, ''));
    setCashPaid(Number.isFinite(parsed) ? parsed : 0);
  };

  const confirm = async () => {
    if (!canConfirm || submitting) {
      return;
    }
    setSubmitting(true);
    try {
      // Commit to local storage FIRST (spec requirement 5), before any print attempt.
      await completeTransactionPayment(transactionId, cashPaid);
      navigation.replace('ReceiptResult', {transactionId});
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.totalLabel}>Total Belanja</Text>
      <Text style={styles.totalValue}>{formatCurrency(total)}</Text>

      <Text style={styles.sectionLabel}>Nominal Cepat</Text>
      <View style={styles.denomGrid}>
        {CASH_DENOMINATIONS.map(value => (
          <TouchableOpacity
            key={value}
            style={styles.denomButton}
            onPress={() => addDenomination(value)}>
            <Text style={styles.denomButtonText}>{formatCurrency(value)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.quickRow}>
        <TouchableOpacity style={styles.exactButton} onPress={payExact}>
          <Text style={styles.exactButtonText}>Uang Pas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.clearButton} onPress={clearCash}>
          <Text style={styles.clearButtonText}>Reset</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionLabel}>Uang Dibayar</Text>
      <TextInput
        style={styles.cashInput}
        keyboardType="numeric"
        value={cashInputText}
        onChangeText={onCashTextChange}
      />

      <View style={styles.changeBox}>
        <Text style={styles.changeLabel}>Kembalian</Text>
        <Text style={[styles.changeValue, change < 0 && styles.changeNegative]}>
          {formatCurrency(Math.max(0, change))}
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.confirmButton,
          !canConfirm && styles.confirmButtonDisabled,
        ]}
        onPress={confirm}
        disabled={!canConfirm || submitting}>
        <Text style={styles.confirmButtonText}>
          {submitting ? 'Memproses...' : 'KONFIRMASI'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

export default function PaymentScreen(props: Props) {
  return (
    <RoleGuard allowed={['kasir', 'admin', 'owner']}>
      <PaymentInner {...props} />
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  container: {padding: 16, paddingBottom: 40},
  totalLabel: {fontSize: 14, color: '#666', textAlign: 'center'},
  totalValue: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 13,
    color: '#444',
    marginBottom: 8,
    marginTop: 8,
    fontWeight: '600',
  },
  denomGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  denomButton: {
    backgroundColor: '#eef2ff',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  denomButtonText: {color: '#1d4ed8', fontWeight: '600'},
  quickRow: {flexDirection: 'row', gap: 8, marginTop: 8},
  exactButton: {
    flex: 1,
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  exactButtonText: {color: '#fff', fontWeight: '700'},
  clearButton: {
    flex: 1,
    backgroundColor: '#eee',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {color: '#333', fontWeight: '700'},
  cashInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'right',
  },
  changeBox: {marginTop: 20, alignItems: 'center'},
  changeLabel: {fontSize: 14, color: '#666'},
  changeValue: {fontSize: 26, fontWeight: '800', color: '#16a34a'},
  changeNegative: {color: '#b91c1c'},
  confirmButton: {
    marginTop: 28,
    backgroundColor: '#1d4ed8',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmButtonDisabled: {backgroundColor: '#93a3c7'},
  confirmButtonText: {color: '#fff', fontWeight: '800', fontSize: 16},
});

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
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import {colors, radius, spacing, typography} from '../../theme';

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
      <Card style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Belanja</Text>
        <Text style={styles.totalValue} numberOfLines={1} adjustsFontSizeToFit>
          {formatCurrency(total)}
        </Text>
      </Card>

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
        <Button
          style={styles.quickButton}
          variant="success"
          label="Uang Pas"
          onPress={payExact}
        />
        <Button
          style={styles.quickButton}
          variant="secondary"
          label="Reset"
          onPress={clearCash}
        />
      </View>

      <Text style={styles.sectionLabel}>Uang Dibayar</Text>
      <TextInput
        style={styles.cashInput}
        keyboardType="numeric"
        value={cashInputText}
        onChangeText={onCashTextChange}
      />

      <Card style={styles.changeBox}>
        <Text style={styles.changeLabel}>Kembalian</Text>
        <Text
          style={[styles.changeValue, change < 0 && styles.changeNegative]}
          numberOfLines={1}
          adjustsFontSizeToFit>
          {formatCurrency(Math.max(0, change))}
        </Text>
      </Card>

      <Button
        style={styles.confirmButton}
        label={submitting ? 'Memproses...' : 'KONFIRMASI'}
        onPress={confirm}
        disabled={!canConfirm}
        loading={submitting}
      />
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
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    backgroundColor: colors.background,
  },
  totalCard: {alignItems: 'center', marginBottom: spacing.lg},
  totalLabel: {...typography.body, color: colors.textMuted},
  totalValue: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  sectionLabel: {
    ...typography.sectionLabel,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  denomGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm},
  denomButton: {
    backgroundColor: colors.cardMuted,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md + 2,
    borderRadius: radius.sm,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  denomButtonText: {color: colors.navy, fontWeight: '700'},
  quickRow: {flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm},
  quickButton: {flex: 1},
  cashInput: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    backgroundColor: colors.card,
    textAlign: 'right',
  },
  changeBox: {marginTop: spacing.xl, alignItems: 'center'},
  changeLabel: {...typography.body, color: colors.textMuted},
  changeValue: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.success,
    marginTop: spacing.xs,
  },
  changeNegative: {color: colors.danger},
  confirmButton: {marginTop: spacing.xl, paddingVertical: spacing.lg},
});

import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/types';
import RoleGuard from '../../components/common/RoleGuard';
import {useSettings} from '../../state/SettingsContext';
import {Transaction, TransactionItem, CartLine} from '../../types';
import {
  getTransactionById,
  getTransactionItems,
} from '../../db/repositories/transactionRepo';
import {buildReceiptLines} from '../../domain/receipt';
import {printReceiptTo, PrinterError} from '../../services/printerService';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import {colors, spacing} from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ReceiptResult'>;

type PrintStatus = 'idle' | 'printing' | 'success' | 'failed';

function ReceiptResultInner({navigation, route}: Props) {
  const {transactionId} = route.params;
  const {settings} = useSettings();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [printStatus, setPrintStatus] = useState<PrintStatus>('idle');
  const [printError, setPrintError] = useState<string | null>(null);
  const [lines, setLines] = useState<string[]>([]);

  const load = useCallback(async () => {
    const tx = await getTransactionById(transactionId);
    const its = await getTransactionItems(transactionId);
    setTransaction(tx);
    setItems(its);
    return {tx, its};
  }, [transactionId]);

  const doPrint = useCallback(
    async (tx: Transaction | null, its: TransactionItem[]) => {
      if (!tx || !settings) {
        return;
      }
      const cartLines: CartLine[] = its.map(i => ({
        productId: i.productId,
        barcode: i.barcode,
        name: i.name,
        unit: i.unit,
        qty: i.qty,
        unitPrice: i.unitPrice,
        priceTier: i.priceTier,
        discount: i.discount,
        lineTotal: i.lineTotal,
      }));
      const builtLines = buildReceiptLines(
        {
          settings,
          transaction: tx,
          items: cartLines,
          cashierName: tx.cashierName ?? '-',
        },
        settings.paperWidth,
      );
      setLines(builtLines);
      setPrintStatus('printing');
      setPrintError(null);
      try {
        await printReceiptTo(settings.printerAddress, builtLines);
        setPrintStatus('success');
      } catch (e) {
        // Edge case: printer disconnected/unpaired/fails. The sale is
        // already committed (done in PaymentScreen before navigating here);
        // just surface a retry option instead of blocking/reversing the sale.
        const message =
          e instanceof PrinterError ? e.message : 'Gagal mencetak struk';
        setPrintError(message);
        setPrintStatus('failed');
      }
    },
    [settings],
  );

  useEffect(() => {
    (async () => {
      const {tx, its} = await load();
      await doPrint(tx, its);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const retry = () => doPrint(transaction, items);

  const finish = () => navigation.reset({index: 0, routes: [{name: 'Home'}]});

  return (
    <View style={styles.container}>
      <View style={styles.statusBox}>
        {printStatus === 'printing' && (
          <>
            <ActivityIndicator color={colors.navy} />
            <Text style={styles.statusText}>Mencetak struk...</Text>
          </>
        )}
        {printStatus === 'success' && (
          <Text style={styles.successText}>Struk berhasil dicetak</Text>
        )}
        {printStatus === 'failed' && (
          <>
            <Text style={styles.errorText}>
              Transaksi tersimpan, tetapi cetak gagal: {printError}
            </Text>
            <Button label="Cetak Ulang" onPress={retry} />
          </>
        )}
      </View>

      <Card style={styles.preview}>
        <ScrollView contentContainerStyle={styles.previewContent}>
          {lines.map((line, idx) => (
            <Text key={idx} style={styles.previewLine}>
              {line}
            </Text>
          ))}
        </ScrollView>
      </Card>

      <Button style={styles.finishButton} label="Selesai" onPress={finish} />
    </View>
  );
}

export default function ReceiptResultScreen(props: Props) {
  return (
    <RoleGuard allowed={['kasir', 'admin', 'owner']}>
      <ReceiptResultInner {...props} />
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.background, padding: spacing.lg},
  statusBox: {alignItems: 'center', marginBottom: spacing.md},
  statusText: {marginTop: spacing.sm, color: colors.textMuted},
  successText: {color: colors.success, fontWeight: '700', fontSize: 16},
  errorText: {
    color: colors.danger,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  preview: {flex: 1, padding: spacing.sm},
  previewContent: {paddingBottom: spacing.md},
  previewLine: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: colors.textPrimary,
  },
  finishButton: {marginTop: spacing.md},
});

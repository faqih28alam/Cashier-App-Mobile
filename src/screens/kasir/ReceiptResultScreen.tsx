import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
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
            <ActivityIndicator />
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
            <TouchableOpacity style={styles.retryButton} onPress={retry}>
              <Text style={styles.retryButtonText}>Cetak Ulang</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <ScrollView
        style={styles.preview}
        contentContainerStyle={styles.previewContent}>
        {lines.map((line, idx) => (
          <Text key={idx} style={styles.previewLine}>
            {line}
          </Text>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.finishButton} onPress={finish}>
        <Text style={styles.finishButtonText}>Selesai</Text>
      </TouchableOpacity>
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
  container: {flex: 1, backgroundColor: '#fff', padding: 16},
  statusBox: {alignItems: 'center', marginBottom: 12},
  statusText: {marginTop: 8, color: '#666'},
  successText: {color: '#16a34a', fontWeight: '700', fontSize: 16},
  errorText: {color: '#b91c1c', textAlign: 'center', marginBottom: 8},
  retryButton: {
    backgroundColor: '#1d4ed8',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {color: '#fff', fontWeight: '700'},
  preview: {flex: 1, backgroundColor: '#fafafa', borderRadius: 8, padding: 8},
  previewContent: {paddingBottom: 12},
  previewLine: {fontFamily: 'monospace', fontSize: 12},
  finishButton: {
    backgroundColor: '#1d4ed8',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  finishButtonText: {color: '#fff', fontWeight: '700', fontSize: 16},
});

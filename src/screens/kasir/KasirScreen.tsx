import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useFocusEffect} from '@react-navigation/native';
import {RootStackParamList} from '../../navigation/types';
import RoleGuard from '../../components/common/RoleGuard';
import BarcodeCameraModal from '../../components/common/BarcodeCameraModal';
import NumpadModal from '../../components/kasir/NumpadModal';
import {formatCurrency} from '../../domain/money';
import {useSettings} from '../../state/SettingsContext';
import {Transaction, TransactionItem} from '../../types';
import {
  addOrIncrementItemByBarcode,
  getTransactionById,
  getTransactionItems,
  removeItem,
  setItemDiscount,
  setItemQty,
} from '../../db/repositories/transactionRepo';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import {colors, radius, spacing, typography} from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Kasir'>;

function KasirInner({navigation, route}: Props) {
  const {transactionId} = route.params;
  const {settings} = useSettings();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [cameraVisible, setCameraVisible] = useState(false);
  const [qtyEditItem, setQtyEditItem] = useState<TransactionItem | null>(null);
  const [discountEditItem, setDiscountEditItem] =
    useState<TransactionItem | null>(null);

  const refresh = useCallback(async () => {
    const tx = await getTransactionById(transactionId);
    const its = await getTransactionItems(transactionId);
    setTransaction(tx);
    setItems(its);
  }, [transactionId]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const taxRate = settings?.taxRate ?? 0;

  const handleScan = useCallback(
    async (code: string) => {
      const trimmed = code.trim();
      if (!trimmed) {
        return;
      }
      const result = await addOrIncrementItemByBarcode(
        transactionId,
        trimmed,
        taxRate,
      );
      if (!result.ok) {
        Alert.alert('Barcode tidak ditemukan');
      }
      await refresh();
      setBarcodeInput('');
    },
    [transactionId, taxRate, refresh],
  );

  const onSubmitBarcode = () => {
    if (barcodeInput.trim()) {
      handleScan(barcodeInput);
    }
  };

  const confirmQty = async (value: number) => {
    if (qtyEditItem) {
      await setItemQty(transactionId, qtyEditItem.id, value, taxRate);
      setQtyEditItem(null);
      await refresh();
    }
  };

  const confirmDiscount = async (value: number) => {
    if (discountEditItem) {
      await setItemDiscount(transactionId, discountEditItem.id, value, taxRate);
      setDiscountEditItem(null);
      await refresh();
    }
  };

  const handleRemove = (item: TransactionItem) => {
    Alert.alert('Hapus item', `Hapus ${item.name} dari transaksi?`, [
      {text: 'Batal', style: 'cancel'},
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          await removeItem(transactionId, item.id, taxRate);
          await refresh();
        },
      },
    ]);
  };

  const goToPayment = () => {
    if (items.length === 0) {
      Alert.alert('Transaksi kosong', 'Tambahkan minimal satu item.');
      return;
    }
    navigation.navigate('Payment', {transactionId});
  };

  const holdAndExit = () => {
    // Every mutation is already persisted immediately, so "Tahan" simply
    // leaves KASIR; the transaction remains resumable via Lanjutkan Transaksi.
    navigation.navigate('Home');
  };

  return (
    <View style={styles.container}>
      <View style={styles.scanRow}>
        <TextInput
          style={styles.barcodeInput}
          placeholder="Scan atau ketik barcode"
          placeholderTextColor={colors.textMuted}
          value={barcodeInput}
          onChangeText={setBarcodeInput}
          onSubmitEditing={onSubmitBarcode}
          autoFocus
          blurOnSubmit={false}
          returnKeyType="done"
        />
        <TouchableOpacity
          style={styles.cameraButton}
          onPress={() => setCameraVisible(true)}>
          <Text style={styles.cameraButtonText}>Kamera</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState message="Belum ada item" />}
        renderItem={({item}) => (
          <View style={styles.row}>
            <View style={styles.rowTopLine}>
              <Text
                style={styles.rowName}
                numberOfLines={1}
                ellipsizeMode="tail">
                {item.name}
              </Text>
              <Text style={styles.rowTotal}>
                {formatCurrency(item.lineTotal)}
              </Text>
            </View>
            <Text style={styles.rowMeta} numberOfLines={1} ellipsizeMode="tail">
              {formatCurrency(item.unitPrice)} x {item.qty} {item.unit} (
              {item.priceTier})
            </Text>
            {item.discount > 0 && (
              <Text style={styles.rowMeta}>
                Diskon: -{formatCurrency(item.discount)}
              </Text>
            )}
            <View style={styles.rowActions}>
              <TouchableOpacity
                style={styles.smallButton}
                onPress={() => setQtyEditItem(item)}>
                <Text style={styles.smallButtonText}>Qty {item.qty}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.smallButton}
                onPress={() => setDiscountEditItem(item)}>
                <Text style={styles.smallButtonText}>Diskon</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleRemove(item)}>
                <Text style={styles.deleteButtonText}>Hapus</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <View style={styles.summary}>
        <View style={styles.summaryLine}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>
            {formatCurrency(transaction?.subtotal ?? 0)}
          </Text>
        </View>
        {(transaction?.taxTotal ?? 0) > 0 && (
          <View style={styles.summaryLine}>
            <Text style={styles.summaryLabel}>Pajak</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(transaction?.taxTotal ?? 0)}
            </Text>
          </View>
        )}
        <View style={styles.summaryLine}>
          <Text style={styles.summaryLabelBold}>TOTAL</Text>
          <Text style={styles.summaryValueBold}>
            {formatCurrency(transaction?.total ?? 0)}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          style={styles.holdButton}
          variant="secondary"
          label="Tahan"
          onPress={holdAndExit}
        />
        <Button
          style={styles.payButton}
          variant="success"
          label="BAYAR"
          onPress={goToPayment}
        />
      </View>

      <BarcodeCameraModal
        visible={cameraVisible}
        onClose={() => setCameraVisible(false)}
        onScanned={code => {
          setCameraVisible(false);
          handleScan(code);
        }}
      />

      <NumpadModal
        visible={!!qtyEditItem}
        title={`Ubah QTY - ${qtyEditItem?.name ?? ''}`}
        initialValue={qtyEditItem?.qty ?? 1}
        onCancel={() => setQtyEditItem(null)}
        onConfirm={confirmQty}
      />

      <NumpadModal
        visible={!!discountEditItem}
        title={`Diskon - ${discountEditItem?.name ?? ''}`}
        initialValue={discountEditItem?.discount ?? 0}
        onCancel={() => setDiscountEditItem(null)}
        onConfirm={confirmDiscount}
      />
    </View>
  );
}

export default function KasirScreen(props: Props) {
  return (
    <RoleGuard allowed={['kasir', 'admin', 'owner']}>
      <KasirInner {...props} />
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.background},
  scanRow: {flexDirection: 'row', padding: spacing.md, gap: spacing.sm},
  barcodeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md - 2,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.card,
  },
  cameraButton: {
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    borderRadius: radius.sm,
    marginLeft: spacing.sm,
  },
  cameraButtonText: {color: colors.textOnBrand, fontWeight: '700'},
  list: {paddingHorizontal: spacing.md, paddingBottom: spacing.md, flexGrow: 1},
  row: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  rowTopLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  rowName: {...typography.bodyMedium, flex: 1, marginRight: spacing.sm},
  rowMeta: {fontSize: 12, color: colors.textMuted, marginTop: 2},
  rowActions: {flexDirection: 'row', marginTop: spacing.sm, gap: spacing.sm},
  smallButton: {
    backgroundColor: colors.cardMuted,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radius.sm,
    marginRight: spacing.sm,
  },
  smallButtonText: {color: colors.navy, fontWeight: '700', fontSize: 12},
  deleteButton: {
    backgroundColor: colors.dangerBg,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radius.sm,
  },
  deleteButtonText: {color: colors.danger, fontWeight: '700', fontSize: 12},
  rowTotal: {fontWeight: '700', color: colors.textPrimary},
  summary: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  summaryLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  summaryLabel: {color: colors.textSecondary},
  summaryValue: {color: colors.textPrimary},
  summaryLabelBold: {
    fontWeight: '700',
    fontSize: 16,
    color: colors.textPrimary,
  },
  summaryValueBold: {
    fontWeight: '700',
    fontSize: 16,
    color: colors.textPrimary,
  },
  actions: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.card,
  },
  holdButton: {flex: 1},
  payButton: {flex: 2},
});

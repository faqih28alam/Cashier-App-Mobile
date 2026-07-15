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
        ListEmptyComponent={<Text style={styles.empty}>Belum ada item</Text>}
        renderItem={({item}) => (
          <View style={styles.row}>
            <View style={styles.rowMain}>
              <Text style={styles.rowName}>{item.name}</Text>
              <Text style={styles.rowMeta}>
                {formatCurrency(item.unitPrice)} x {item.qty} {item.unit} (
                {item.priceTier})
              </Text>
              {item.discount > 0 && (
                <Text style={styles.rowMeta}>
                  Diskon: -{formatCurrency(item.discount)}
                </Text>
              )}
            </View>
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
            <Text style={styles.rowTotal}>
              {formatCurrency(item.lineTotal)}
            </Text>
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
        <TouchableOpacity style={styles.holdButton} onPress={holdAndExit}>
          <Text style={styles.holdButtonText}>Tahan</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.payButton} onPress={goToPayment}>
          <Text style={styles.payButtonText}>BAYAR</Text>
        </TouchableOpacity>
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
  container: {flex: 1, backgroundColor: '#fff'},
  scanRow: {flexDirection: 'row', padding: 12, gap: 8},
  barcodeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  cameraButton: {
    backgroundColor: '#1d4ed8',
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 8,
    marginLeft: 8,
  },
  cameraButtonText: {color: '#fff', fontWeight: '600'},
  list: {paddingHorizontal: 12, paddingBottom: 12},
  empty: {textAlign: 'center', color: '#999', marginTop: 40},
  row: {
    borderBottomWidth: 1,
    borderColor: '#eee',
    paddingVertical: 10,
  },
  rowMain: {},
  rowName: {fontSize: 15, fontWeight: '600'},
  rowMeta: {fontSize: 12, color: '#666', marginTop: 2},
  rowActions: {flexDirection: 'row', marginTop: 8, gap: 8},
  smallButton: {
    backgroundColor: '#eef2ff',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginRight: 8,
  },
  smallButtonText: {color: '#1d4ed8', fontWeight: '600', fontSize: 12},
  deleteButton: {
    backgroundColor: '#fee2e2',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  deleteButtonText: {color: '#b91c1c', fontWeight: '600', fontSize: 12},
  rowTotal: {position: 'absolute', right: 0, top: 10, fontWeight: '700'},
  summary: {padding: 12, borderTopWidth: 1, borderColor: '#eee'},
  summaryLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  summaryLabel: {color: '#555'},
  summaryValue: {color: '#333'},
  summaryLabelBold: {fontWeight: '700', fontSize: 16},
  summaryValueBold: {fontWeight: '700', fontSize: 16},
  actions: {flexDirection: 'row', padding: 12, gap: 8},
  holdButton: {
    flex: 1,
    backgroundColor: '#eee',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginRight: 8,
  },
  holdButtonText: {fontWeight: '700', color: '#333'},
  payButton: {
    flex: 2,
    backgroundColor: '#16a34a',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  payButtonText: {fontWeight: '700', color: '#fff', fontSize: 16},
});

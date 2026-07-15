import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
  Alert,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useFocusEffect} from '@react-navigation/native';
import {RootStackParamList} from '../../navigation/types';
import RoleGuard from '../../components/common/RoleGuard';
import {FinanceEntry, FinanceEntryType} from '../../types';
import {
  addManualEntry,
  getCashBalance,
  listFinanceEntries,
} from '../../db/repositories/financeRepo';
import {formatCurrency} from '../../domain/money';

type Props = NativeStackScreenProps<RootStackParamList, 'Keuangan'>;

const SOURCE_LABEL: Record<string, string> = {
  kasir: 'Penjualan (KASIR)',
  purchas: 'Pembelian (PURCHAS)',
  manual: 'Manual',
};

function FinanceInner(_: Props) {
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [balance, setBalance] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [type, setType] = useState<FinanceEntryType>('kredit');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const load = useCallback(async () => {
    const [list, bal] = await Promise.all([
      listFinanceEntries(),
      getCashBalance(),
    ]);
    setEntries([...list].reverse());
    setBalance(bal);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const submitManualEntry = async () => {
    const amountNum = parseFloat(amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      Alert.alert('Nominal tidak valid');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Keterangan wajib diisi');
      return;
    }
    await addManualEntry({
      type,
      amount: amountNum,
      description: description.trim(),
    });
    setAmount('');
    setDescription('');
    setModalVisible(false);
    load();
  };

  return (
    <View style={styles.container}>
      <View style={styles.balanceBox}>
        <Text style={styles.balanceLabel}>Saldo Kas</Text>
        <Text style={styles.balanceValue}>{formatCurrency(balance)}</Text>
      </View>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setModalVisible(true)}>
        <Text style={styles.addButtonText}>+ Catat Transaksi Manual</Text>
      </TouchableOpacity>

      <FlatList
        data={entries}
        keyExtractor={item => String(item.id)}
        ListEmptyComponent={
          <Text style={styles.empty}>Belum ada catatan keuangan</Text>
        }
        renderItem={({item}) => (
          <View style={styles.row}>
            <View>
              <Text style={styles.rowDesc}>{item.description}</Text>
              <Text style={styles.rowMeta}>
                {SOURCE_LABEL[item.source] ?? item.source} ·{' '}
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

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Catat Transaksi Manual</Text>
            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  type === 'debit' && styles.typeButtonActiveDebit,
                ]}
                onPress={() => setType('debit')}>
                <Text
                  style={
                    type === 'debit' ? styles.typeTextActive : styles.typeText
                  }>
                  Pemasukan
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  type === 'kredit' && styles.typeButtonActiveKredit,
                ]}
                onPress={() => setType('kredit')}>
                <Text
                  style={
                    type === 'kredit' ? styles.typeTextActive : styles.typeText
                  }>
                  Pengeluaran
                </Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Nominal"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
            <TextInput
              style={styles.input}
              placeholder="Keterangan"
              value={description}
              onChangeText={setDescription}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={submitManualEntry}>
                <Text style={styles.saveButtonText}>Simpan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default function FinanceScreen(props: Props) {
  return (
    <RoleGuard allowed={['admin', 'owner']}>
      <FinanceInner {...props} />
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff', padding: 12},
  balanceBox: {
    alignItems: 'center',
    marginBottom: 12,
    padding: 16,
    backgroundColor: '#eef2ff',
    borderRadius: 12,
  },
  balanceLabel: {color: '#444'},
  balanceValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1d4ed8',
    marginTop: 4,
  },
  addButton: {
    backgroundColor: '#1d4ed8',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  addButtonText: {color: '#fff', fontWeight: '700'},
  empty: {textAlign: 'center', color: '#999', marginTop: 40},
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: '#00000088',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '85%',
  },
  modalTitle: {fontSize: 16, fontWeight: '700', marginBottom: 12},
  typeRow: {flexDirection: 'row', marginBottom: 12, gap: 8},
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#eee',
    marginRight: 8,
  },
  typeButtonActiveDebit: {backgroundColor: '#16a34a'},
  typeButtonActiveKredit: {backgroundColor: '#b91c1c'},
  typeText: {color: '#333', fontWeight: '600'},
  typeTextActive: {color: '#fff', fontWeight: '700'},
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  modalActions: {flexDirection: 'row', marginTop: 8, gap: 8},
  cancelButton: {
    flex: 1,
    backgroundColor: '#eee',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {fontWeight: '600', color: '#333'},
  saveButton: {
    flex: 1,
    backgroundColor: '#1d4ed8',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {fontWeight: '700', color: '#fff'},
});

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
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import {colors, radius, spacing, typography} from '../../theme';

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
      <Card style={styles.balanceBox}>
        <Text style={styles.balanceLabel}>Saldo Kas</Text>
        <Text
          style={[styles.balanceValue, balance < 0 && styles.balanceNegative]}
          numberOfLines={1}
          adjustsFontSizeToFit>
          {formatCurrency(balance)}
        </Text>
      </Card>

      <Button
        style={styles.addButton}
        label="+ Catat Transaksi Manual"
        onPress={() => setModalVisible(true)}
      />

      <FlatList
        data={entries}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState message="Belum ada catatan keuangan" />}
        renderItem={({item}) => (
          <View style={styles.row}>
            <View style={styles.rowMain}>
              <Text
                style={styles.rowDesc}
                numberOfLines={1}
                ellipsizeMode="tail">
                {item.description}
              </Text>
              <Text
                style={styles.rowMeta}
                numberOfLines={1}
                ellipsizeMode="tail">
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
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
            <TextInput
              style={styles.input}
              placeholder="Keterangan"
              placeholderTextColor={colors.textMuted}
              value={description}
              onChangeText={setDescription}
            />
            <View style={styles.modalActions}>
              <Button
                style={styles.modalButton}
                variant="secondary"
                label="Batal"
                onPress={() => setModalVisible(false)}
              />
              <Button
                style={styles.modalButton}
                label="Simpan"
                onPress={submitManualEntry}
              />
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
  container: {flex: 1, backgroundColor: colors.background, padding: spacing.md},
  balanceBox: {alignItems: 'center', marginBottom: spacing.md},
  balanceLabel: {...typography.body, color: colors.textMuted},
  balanceValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.navy,
    marginTop: spacing.xs,
  },
  balanceNegative: {color: colors.danger},
  addButton: {marginBottom: spacing.md},
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
  rowDesc: {...typography.bodyMedium},
  rowMeta: {color: colors.textMuted, fontSize: 11, marginTop: 2},
  rowAmount: {fontWeight: '700'},
  debit: {color: colors.success},
  kredit: {color: colors.danger},
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    width: '85%',
  },
  modalTitle: {...typography.cardTitle, marginBottom: spacing.md},
  typeRow: {flexDirection: 'row', marginBottom: spacing.md, gap: spacing.sm},
  typeButton: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.sm,
    alignItems: 'center',
    backgroundColor: colors.background,
    marginRight: spacing.sm,
  },
  typeButtonActiveDebit: {backgroundColor: colors.success},
  typeButtonActiveKredit: {backgroundColor: colors.danger},
  typeText: {color: colors.textSecondary, fontWeight: '600'},
  typeTextActive: {color: colors.textOnBrand, fontWeight: '700'},
  input: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md - 2,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  modalActions: {flexDirection: 'row', marginTop: spacing.sm, gap: spacing.sm},
  modalButton: {flex: 1},
});

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
import {Supplier} from '../../types';
import {
  createSupplier,
  deleteSupplier,
  listSuppliers,
  updateSupplier,
} from '../../db/repositories/supplierRepo';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import {colors, radius, spacing, typography} from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'SupplierList'>;

function SupplierListInner(_: Props) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const load = useCallback(() => {
    listSuppliers().then(setSuppliers);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const openNew = () => {
    setEditing(null);
    setName('');
    setPhone('');
    setAddress('');
    setModalVisible(true);
  };

  const openEdit = (s: Supplier) => {
    setEditing(s);
    setName(s.name);
    setPhone(s.phone ?? '');
    setAddress(s.address ?? '');
    setModalVisible(true);
  };

  const save = async () => {
    if (!name.trim()) {
      Alert.alert('Nama wajib diisi');
      return;
    }
    const input = {
      name: name.trim(),
      phone: phone.trim() || null,
      address: address.trim() || null,
    };
    if (editing) {
      await updateSupplier(editing.id, input);
    } else {
      await createSupplier(input);
    }
    setModalVisible(false);
    load();
  };

  const remove = (s: Supplier) => {
    Alert.alert('Hapus Supplier', `Hapus supplier "${s.name}"?`, [
      {text: 'Batal', style: 'cancel'},
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          await deleteSupplier(s.id);
          load();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Button
        style={styles.newButton}
        label="+ Supplier Baru"
        onPress={openNew}
      />
      <FlatList
        data={suppliers}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState message="Belum ada supplier" />}
        renderItem={({item}) => (
          <View style={styles.row}>
            <View style={styles.rowMain}>
              <Text
                style={styles.rowName}
                numberOfLines={1}
                ellipsizeMode="tail">
                {item.name}
              </Text>
              {!!item.phone && (
                <Text
                  style={styles.rowMeta}
                  numberOfLines={1}
                  ellipsizeMode="tail">
                  {item.phone}
                </Text>
              )}
            </View>
            <View style={styles.rowActions}>
              <TouchableOpacity onPress={() => openEdit(item)}>
                <Text style={styles.editText}>Ubah</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => remove(item)}>
                <Text style={styles.deleteText}>Hapus</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {editing ? 'Ubah Supplier' : 'Supplier Baru'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Nama Supplier"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={styles.input}
              placeholder="Telepon"
              placeholderTextColor={colors.textMuted}
              value={phone}
              onChangeText={setPhone}
            />
            <TextInput
              style={styles.input}
              placeholder="Alamat"
              placeholderTextColor={colors.textMuted}
              value={address}
              onChangeText={setAddress}
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
                onPress={save}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default function SupplierListScreen(props: Props) {
  return (
    <RoleGuard allowed={['admin', 'owner']}>
      <SupplierListInner {...props} />
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.background, padding: spacing.md},
  newButton: {marginBottom: spacing.md},
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
  rowName: {...typography.bodyMedium},
  rowMeta: {color: colors.textMuted, fontSize: 12, marginTop: 2},
  rowActions: {flexDirection: 'row', gap: spacing.lg},
  editText: {color: colors.navy, fontWeight: '700'},
  deleteText: {color: colors.danger, fontWeight: '700'},
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
  input: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md - 2,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  modalActions: {flexDirection: 'row', gap: spacing.sm},
  modalButton: {flex: 1},
});

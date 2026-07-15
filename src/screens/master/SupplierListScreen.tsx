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
      <TouchableOpacity style={styles.newButton} onPress={openNew}>
        <Text style={styles.newButtonText}>+ Supplier Baru</Text>
      </TouchableOpacity>
      <FlatList
        data={suppliers}
        keyExtractor={item => String(item.id)}
        ListEmptyComponent={
          <Text style={styles.empty}>Belum ada supplier</Text>
        }
        renderItem={({item}) => (
          <View style={styles.row}>
            <View>
              <Text style={styles.rowName}>{item.name}</Text>
              {!!item.phone && <Text style={styles.rowMeta}>{item.phone}</Text>}
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
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={styles.input}
              placeholder="Telepon"
              value={phone}
              onChangeText={setPhone}
            />
            <TextInput
              style={styles.input}
              placeholder="Alamat"
              value={address}
              onChangeText={setAddress}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={save}>
                <Text style={styles.saveButtonText}>Simpan</Text>
              </TouchableOpacity>
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
  container: {flex: 1, backgroundColor: '#fff', padding: 12},
  newButton: {
    backgroundColor: '#1d4ed8',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  newButtonText: {color: '#fff', fontWeight: '700'},
  empty: {textAlign: 'center', color: '#999', marginTop: 24},
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  rowName: {fontWeight: '600'},
  rowMeta: {color: '#666', fontSize: 12, marginTop: 2},
  rowActions: {flexDirection: 'row', gap: 16},
  editText: {color: '#1d4ed8', fontWeight: '600', marginRight: 16},
  deleteText: {color: '#b91c1c', fontWeight: '600'},
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
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  modalActions: {flexDirection: 'row', gap: 8},
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

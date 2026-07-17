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
import {Category} from '../../types';
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from '../../db/repositories/categoryRepo';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import {colors, radius, spacing, typography} from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'CategoryList'>;

function CategoryListInner(_: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');

  const load = useCallback(() => {
    listCategories().then(setCategories);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const openNew = () => {
    setEditing(null);
    setName('');
    setModalVisible(true);
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    setName(c.name);
    setModalVisible(true);
  };

  const save = async () => {
    if (!name.trim()) {
      Alert.alert('Nama wajib diisi');
      return;
    }
    if (editing) {
      await updateCategory(editing.id, name.trim());
    } else {
      await createCategory(name.trim());
    }
    setModalVisible(false);
    load();
  };

  const remove = (c: Category) => {
    Alert.alert('Hapus Kategori', `Hapus kategori "${c.name}"?`, [
      {text: 'Batal', style: 'cancel'},
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          await deleteCategory(c.id);
          load();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Button
        style={styles.newButton}
        label="+ Kategori Baru"
        onPress={openNew}
      />
      <FlatList
        data={categories}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState message="Belum ada kategori" />}
        renderItem={({item}) => (
          <View style={styles.row}>
            <Text style={styles.rowName} numberOfLines={1} ellipsizeMode="tail">
              {item.name}
            </Text>
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
              {editing ? 'Ubah Kategori' : 'Kategori Baru'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Nama Kategori"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
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

export default function CategoryListScreen(props: Props) {
  return (
    <RoleGuard allowed={['admin', 'owner']}>
      <CategoryListInner {...props} />
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
  rowName: {...typography.bodyMedium, flex: 1, marginRight: spacing.sm},
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

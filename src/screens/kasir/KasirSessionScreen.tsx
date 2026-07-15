import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useFocusEffect} from '@react-navigation/native';
import {RootStackParamList} from '../../navigation/types';
import RoleGuard from '../../components/common/RoleGuard';
import {useAuth} from '../../state/AuthContext';
import {
  createOpenTransaction,
  getOpenTransaction,
  getTransactionItems,
  voidTransaction,
} from '../../db/repositories/transactionRepo';

type Props = NativeStackScreenProps<RootStackParamList, 'KasirSession'>;

/**
 * Session screen shown at KASIR entry (spec requirement 11 / edge case:
 * held/interrupted transactions survive app close or crash). If a held
 * transaction with items exists, offers "Mulai Baru" / "Lanjutkan
 * Transaksi"; otherwise starts a fresh transaction immediately.
 */
function KasirSessionInner({navigation}: Props) {
  const {currentUser} = useAuth();
  const [checking, setChecking] = useState(true);
  const [heldItemCount, setHeldItemCount] = useState(0);
  const [heldTransactionId, setHeldTransactionId] = useState<number | null>(
    null,
  );

  const check = useCallback(async () => {
    setChecking(true);
    const open = await getOpenTransaction();
    if (open) {
      const items = await getTransactionItems(open.id);
      if (items.length > 0) {
        setHeldTransactionId(open.id);
        setHeldItemCount(items.length);
        setChecking(false);
        return;
      }
      // An open transaction exists but has no items yet (e.g. app was
      // closed before anything was scanned) - just resume it silently.
      navigation.replace('Kasir', {transactionId: open.id});
      return;
    }
    const created = await createOpenTransaction(currentUser!.id);
    navigation.replace('Kasir', {transactionId: created.id});
  }, [navigation, currentUser]);

  useFocusEffect(
    useCallback(() => {
      check();
    }, [check]),
  );

  if (checking) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const startFresh = async () => {
    if (heldTransactionId != null) {
      await voidTransaction(heldTransactionId);
    }
    const created = await createOpenTransaction(currentUser!.id);
    navigation.replace('Kasir', {transactionId: created.id});
  };

  const resume = () => {
    if (heldTransactionId != null) {
      navigation.replace('Kasir', {transactionId: heldTransactionId});
    }
  };

  return (
    <View style={styles.centered}>
      <Text style={styles.title}>Transaksi Tertunda Ditemukan</Text>
      <Text style={styles.subtitle}>
        Ada transaksi yang belum dibayar dengan {heldItemCount} item.
      </Text>
      <TouchableOpacity
        style={[styles.button, styles.resumeButton]}
        onPress={resume}>
        <Text style={styles.buttonText}>Lanjutkan Transaksi</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, styles.freshButton]}
        onPress={startFresh}>
        <Text style={[styles.buttonText, styles.freshButtonText]}>
          Mulai Baru
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default function KasirSessionScreen(props: Props) {
  return (
    <RoleGuard allowed={['kasir', 'admin', 'owner']}>
      <KasirSessionInner {...props} />
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  resumeButton: {backgroundColor: '#1d4ed8'},
  freshButton: {backgroundColor: '#eee'},
  buttonText: {color: '#fff', fontSize: 16, fontWeight: '700'},
  freshButtonText: {color: '#333'},
});

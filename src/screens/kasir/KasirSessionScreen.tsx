import React, {useState, useCallback} from 'react';
import {View, Text, StyleSheet, ActivityIndicator} from 'react-native';
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
import Button from '../../components/ui/Button';
import {colors, spacing, typography} from '../../theme';

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
        <ActivityIndicator size="large" color={colors.navy} />
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
      <Button
        style={styles.button}
        label="Lanjutkan Transaksi"
        onPress={resume}
      />
      <Button
        style={styles.button}
        variant="secondary"
        label="Mulai Baru"
        onPress={startFresh}
      />
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
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  title: {
    ...typography.screenTitle,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  button: {width: '100%', marginBottom: spacing.md},
});

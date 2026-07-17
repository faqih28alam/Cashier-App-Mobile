import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/types';
import RoleGuard from '../../components/common/RoleGuard';
import {useSettings} from '../../state/SettingsContext';
import {
  listPairedDevices,
  PairedPrinterDevice,
  connectPrinter,
} from '../../services/printerService';
import {setPrinterSelection} from '../../db/repositories/settingsRepo';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import {colors, radius, spacing, typography} from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'PrinterPairing'>;

function PrinterPairingInner({navigation}: Props) {
  const {refresh} = useSettings();
  const [loading, setLoading] = useState(false);
  const [devices, setDevices] = useState<PairedPrinterDevice[]>([]);
  const [connectingAddress, setConnectingAddress] = useState<string | null>(
    null,
  );

  const scan = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listPairedDevices();
      setDevices(list);
    } catch (e: any) {
      Alert.alert(
        'Gagal memindai',
        e?.message ??
          'Aktifkan Bluetooth dan pastikan printer sudah dipasangkan di Pengaturan Android.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const select = async (device: PairedPrinterDevice) => {
    setConnectingAddress(device.address);
    try {
      await connectPrinter(device.address);
      await setPrinterSelection(device.address, device.name);
      await refresh();
      Alert.alert('Berhasil', `Printer "${device.name}" dipilih.`);
      navigation.goBack();
    } catch (e: any) {
      Alert.alert(
        'Gagal terhubung',
        e?.message ?? 'Tidak bisa terhubung ke printer ini.',
      );
    } finally {
      setConnectingAddress(null);
    }
  };

  return (
    <View style={styles.container}>
      <Button
        style={styles.scanButton}
        label={loading ? 'Memindai...' : 'Pindai Perangkat Bluetooth'}
        onPress={scan}
        loading={loading}
      />

      <FlatList
        data={devices}
        keyExtractor={item => item.address}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !loading ? (
            <EmptyState message="Belum ada perangkat. Pasangkan printer di Pengaturan Bluetooth Android terlebih dahulu, lalu pindai." />
          ) : (
            <ActivityIndicator style={styles.loader} color={colors.navy} />
          )
        }
        renderItem={({item}) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => select(item)}
            disabled={connectingAddress === item.address}>
            <Text style={styles.rowName} numberOfLines={1} ellipsizeMode="tail">
              {item.name || 'Perangkat tanpa nama'}
            </Text>
            <Text style={styles.rowAddress}>{item.address}</Text>
            {connectingAddress === item.address && (
              <ActivityIndicator style={styles.rowLoader} color={colors.navy} />
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

export default function PrinterPairingScreen(props: Props) {
  return (
    <RoleGuard allowed={['admin', 'owner']}>
      <PrinterPairingInner {...props} />
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.background, padding: spacing.md},
  scanButton: {marginBottom: spacing.md},
  list: {flexGrow: 1},
  loader: {marginTop: spacing.xl},
  row: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  rowName: {...typography.bodyMedium},
  rowAddress: {color: colors.textMuted, fontSize: 12, marginTop: 2},
  rowLoader: {marginTop: spacing.xs + 2},
});

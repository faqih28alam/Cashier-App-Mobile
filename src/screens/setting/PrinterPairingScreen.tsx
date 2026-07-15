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
      <TouchableOpacity
        style={styles.scanButton}
        onPress={scan}
        disabled={loading}>
        <Text style={styles.scanButtonText}>
          {loading ? 'Memindai...' : 'Pindai Perangkat Bluetooth'}
        </Text>
      </TouchableOpacity>

      <FlatList
        data={devices}
        keyExtractor={item => item.address}
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.empty}>
              Belum ada perangkat. Pasangkan printer di Pengaturan Bluetooth
              Android terlebih dahulu, lalu pindai.
            </Text>
          ) : (
            <ActivityIndicator style={styles.loader} />
          )
        }
        renderItem={({item}) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => select(item)}
            disabled={connectingAddress === item.address}>
            <Text style={styles.rowName}>
              {item.name || 'Perangkat tanpa nama'}
            </Text>
            <Text style={styles.rowAddress}>{item.address}</Text>
            {connectingAddress === item.address && (
              <ActivityIndicator style={styles.rowLoader} />
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
  container: {flex: 1, backgroundColor: '#fff', padding: 12},
  scanButton: {
    backgroundColor: '#1d4ed8',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  scanButtonText: {color: '#fff', fontWeight: '700'},
  empty: {
    textAlign: 'center',
    color: '#999',
    marginTop: 24,
    paddingHorizontal: 16,
  },
  loader: {marginTop: 24},
  row: {paddingVertical: 12, borderBottomWidth: 1, borderColor: '#eee'},
  rowName: {fontWeight: '600'},
  rowAddress: {color: '#666', fontSize: 12, marginTop: 2},
  rowLoader: {marginTop: 6},
});

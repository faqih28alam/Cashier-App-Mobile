import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/types';
import RoleGuard from '../../components/common/RoleGuard';
import {useSettings} from '../../state/SettingsContext';
import {PaperWidth} from '../../types';
import {exportBackup} from '../../services/backupService';
import Button from '../../components/ui/Button';
import {colors, radius, spacing, typography} from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Setting'>;

function SettingInner({navigation}: Props) {
  const {settings, save} = useSettings();
  const [storeName, setStoreName] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [storePhone, setStorePhone] = useState('');
  const [receiptFooter, setReceiptFooter] = useState('');
  const [taxRate, setTaxRate] = useState('0');
  const [paperWidth, setPaperWidth] = useState<PaperWidth>(58);
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [backingUp, setBackingUp] = useState(false);

  useEffect(() => {
    if (settings) {
      setStoreName(settings.storeName);
      setStoreAddress(settings.storeAddress);
      setStorePhone(settings.storePhone);
      setReceiptFooter(settings.receiptFooter);
      setTaxRate(String(settings.taxRate));
      setPaperWidth(settings.paperWidth);
      setLogoUri(settings.logoUri);
    }
  }, [settings]);

  const persist = async () => {
    if (!settings) {
      return;
    }
    await save({
      storeName: storeName.trim(),
      storeAddress: storeAddress.trim(),
      storePhone: storePhone.trim(),
      logoUri,
      receiptFooter,
      taxRate: parseFloat(taxRate) || 0,
      paperWidth,
      printerAddress: settings.printerAddress,
      printerName: settings.printerName,
    });
    Alert.alert('Tersimpan', 'Pengaturan berhasil disimpan.');
  };

  const pickLogo = async () => {
    const result = await launchImageLibrary({mediaType: 'photo', quality: 0.8});
    if (result.didCancel) {
      return;
    }
    if (result.errorMessage) {
      Alert.alert('Gagal memilih logo', result.errorMessage);
      return;
    }
    const uri = result.assets?.[0]?.uri;
    if (uri) {
      setLogoUri(uri);
    }
  };

  const runBackup = async () => {
    setBackingUp(true);
    try {
      const result = await exportBackup();
      const methodLabel =
        result.method === 'sdcard'
          ? 'kartu SD'
          : result.method === 'internal'
          ? 'penyimpanan internal aplikasi'
          : 'lembar berbagi (share sheet)';
      Alert.alert(
        'Backup Berhasil',
        `Data berhasil disalin ke ${methodLabel}.\n${result.path}`,
      );
    } catch (e: any) {
      Alert.alert(
        'Backup Gagal',
        e?.message ?? 'Terjadi kesalahan saat backup.',
      );
    } finally {
      setBackingUp(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.sectionLabel}>Informasi Toko</Text>
      <Text style={styles.label}>Nama Toko</Text>
      <TextInput
        style={styles.input}
        value={storeName}
        onChangeText={setStoreName}
      />
      <Text style={styles.label}>Alamat</Text>
      <TextInput
        style={styles.input}
        value={storeAddress}
        onChangeText={setStoreAddress}
      />
      <Text style={styles.label}>Telepon</Text>
      <TextInput
        style={styles.input}
        value={storePhone}
        onChangeText={setStorePhone}
      />

      <Text style={styles.label}>Logo Toko</Text>
      {logoUri ? (
        <Image source={{uri: logoUri}} style={styles.logoPreview} />
      ) : (
        <Text style={styles.noLogo}>Belum ada logo</Text>
      )}
      <Button variant="secondary" label="Pilih Logo" onPress={pickLogo} />

      <Text style={styles.sectionLabel}>Struk</Text>
      <Text style={styles.label}>Teks Footer Struk</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={receiptFooter}
        onChangeText={setReceiptFooter}
        multiline
      />
      <Text style={styles.label}>Pajak (%)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={taxRate}
        onChangeText={setTaxRate}
      />

      <Text style={styles.label}>Lebar Kertas Printer</Text>
      <View style={styles.widthRow}>
        {[58, 80].map(w => (
          <TouchableOpacity
            key={w}
            style={[
              styles.widthChip,
              paperWidth === w && styles.widthChipActive,
            ]}
            onPress={() => setPaperWidth(w as PaperWidth)}>
            <Text
              style={
                paperWidth === w ? styles.widthTextActive : styles.widthText
              }>
              {w}mm
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Button
        style={styles.saveButton}
        label="Simpan Pengaturan"
        onPress={persist}
      />

      <Text style={styles.sectionLabel}>Printer Bluetooth</Text>
      <Text
        style={styles.currentPrinter}
        numberOfLines={1}
        ellipsizeMode="tail">
        Printer terpasang: {settings?.printerName ?? 'Belum dipilih'}
      </Text>
      <Button
        variant="secondary"
        label="Pilih Printer"
        onPress={() => navigation.navigate('PrinterPairing')}
      />

      <Text style={styles.sectionLabel}>Backup / Export Data</Text>
      <Button
        variant="secondary"
        label={backingUp ? 'Memproses backup...' : 'Backup Sekarang'}
        onPress={runBackup}
        disabled={backingUp}
      />
    </ScrollView>
  );
}

export default function SettingScreen(props: Props) {
  return (
    <RoleGuard allowed={['admin', 'owner']}>
      <SettingInner {...props} />
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    backgroundColor: colors.background,
  },
  sectionLabel: {
    ...typography.sectionLabel,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  label: {...typography.label, marginBottom: spacing.xs, marginTop: spacing.sm},
  input: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md - 2,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.card,
  },
  multiline: {minHeight: 60, textAlignVertical: 'top'},
  widthRow: {flexDirection: 'row', gap: spacing.sm},
  widthChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  widthChipActive: {backgroundColor: colors.navy, borderColor: colors.navy},
  widthText: {color: colors.textSecondary, fontWeight: '600'},
  widthTextActive: {color: colors.textOnBrand, fontWeight: '700'},
  saveButton: {marginTop: spacing.md},
  currentPrinter: {color: colors.textSecondary, marginBottom: spacing.sm},
  logoPreview: {
    width: 96,
    height: 96,
    borderRadius: radius.sm,
    marginBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  noLogo: {color: colors.textMuted, marginBottom: spacing.sm},
});

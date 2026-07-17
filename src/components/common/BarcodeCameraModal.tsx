import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Modal, View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {Camera} from 'react-native-camera-kit';
import {
  hasCameraPermission,
  requestCameraPermission,
} from '../../services/permissions';
import {colors, radius, spacing} from '../../theme';

interface Props {
  visible: boolean;
  onClose(): void;
  onScanned(code: string): void;
}

/**
 * Full-screen camera barcode scanner modal (input method (a) from spec
 * requirement 2). Feeds the scanned code into the same onScanned callback
 * used by manual/Bluetooth-HID entry, so both paths add/increment items
 * identically.
 */
export default function BarcodeCameraModal({
  visible,
  onClose,
  onScanned,
}: Props) {
  const [permissionDenied, setPermissionDenied] = useState(false);
  const lastScanRef = useRef<{code: string; at: number}>({code: '', at: 0});

  useEffect(() => {
    if (!visible) {
      return;
    }
    (async () => {
      let granted = await hasCameraPermission();
      if (!granted) {
        granted = await requestCameraPermission();
      }
      setPermissionDenied(!granted);
    })();
  }, [visible]);

  const handleReadCode = useCallback(
    (event: {nativeEvent: {codeStringValue: string}}) => {
      const code = event.nativeEvent.codeStringValue;
      const now = Date.now();
      // Debounce identical rapid-fire reads from the continuous scanner.
      if (
        lastScanRef.current.code === code &&
        now - lastScanRef.current.at < 1500
      ) {
        return;
      }
      lastScanRef.current = {code, at: now};
      onScanned(code);
    },
    [onScanned],
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {permissionDenied ? (
          <View style={styles.centered}>
            <Text style={styles.message}>
              Izin kamera ditolak. Gunakan input barcode manual atau scanner
              Bluetooth.
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Tutup</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Camera
              style={StyleSheet.absoluteFill}
              scanBarcode
              showFrame
              laserColor={colors.red}
              frameColor={colors.textOnNavy}
              onReadCode={handleReadCode}
            />
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Tutup</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.navy},
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  message: {
    color: colors.textOnNavy,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  closeButton: {
    position: 'absolute',
    bottom: spacing.xl,
    alignSelf: 'center',
    backgroundColor: colors.card,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
  },
  closeButtonText: {fontSize: 16, fontWeight: '700', color: colors.textPrimary},
});

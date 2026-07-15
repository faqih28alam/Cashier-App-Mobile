import {Platform} from 'react-native';
import {PERMISSIONS, RESULTS, request, check} from 'react-native-permissions';

async function requestAndroidPermission(permission: string): Promise<boolean> {
  const status = await check(permission as any);
  if (status === RESULTS.GRANTED) {
    return true;
  }
  const result = await request(permission as any);
  return result === RESULTS.GRANTED;
}

/** Requests camera permission for camera-based barcode scanning. */
export async function requestCameraPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }
  return requestAndroidPermission(PERMISSIONS.ANDROID.CAMERA);
}

export async function hasCameraPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }
  const status = await check(PERMISSIONS.ANDROID.CAMERA);
  return status === RESULTS.GRANTED;
}

/**
 * Requests the Bluetooth permissions needed to scan/connect to paired
 * devices (scanner + printer). Android 12+ (API 31+) requires the new
 * BLUETOOTH_CONNECT/BLUETOOTH_SCAN runtime permissions. On API 29-30 (this
 * app's min SDK is 29), classic Bluetooth device discovery instead requires
 * the ACCESS_FINE_LOCATION runtime permission.
 */
export async function requestBluetoothPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }
  const apiLevel = Platform.Version as number;
  if (apiLevel >= 31) {
    const connect = await requestAndroidPermission(
      PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
    );
    const scan = await requestAndroidPermission(
      PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
    );
    return connect && scan;
  }
  return requestAndroidPermission(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
}

/**
 * Requests storage/media permission relevant to writing a backup file.
 * On Android 10+ (scoped storage), writing to app-specific external/internal
 * directories does not require a runtime permission, but requesting
 * WRITE_EXTERNAL_STORAGE is still attempted on API < 33 for broader SD-card
 * write compatibility; failures here are treated as "permission denied" by
 * the backup service, which falls back gracefully.
 */
export async function requestStoragePermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }
  const apiLevel = Platform.Version as number;
  if (apiLevel >= 33) {
    // Scoped storage: no broad write permission exists/is needed for
    // app-specific directories or the share sheet fallback.
    return true;
  }
  return requestAndroidPermission(PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE);
}

/* eslint-env jest */
/**
 * Jest setup: mocks native modules that have no JS-only implementation, so
 * component trees can be rendered/tested without a real Android device.
 */
// The library's bundled jest mock (jest/mock.tsx) uses a single `export
// default`, which doesn't interop cleanly with this project's own
// babel-jest transform for named imports (SafeAreaProvider ends up
// undefined). A minimal manual mock avoids that mismatch.
jest.mock('react-native-safe-area-context', () => {
  const insets = {top: 0, left: 0, right: 0, bottom: 0};
  const frame = {x: 0, y: 0, width: 320, height: 640};
  return {
    SafeAreaProvider: ({children}) => children,
    SafeAreaView: ({children}) => children,
    useSafeAreaInsets: () => insets,
    useSafeAreaFrame: () => frame,
    initialWindowMetrics: {insets, frame},
  };
});

// The library's own jestSetup.js mocks native gesture modules but not the
// GestureHandlerRootView component itself, which triggers spurious
// "invalid element type" warnings under the react-native jest preset. A
// minimal manual mock (a plain View) is sufficient for render smoke tests.
jest.mock('react-native-gesture-handler', () => {
  const RN = require('react-native');
  return {
    GestureHandlerRootView: RN.View,
  };
});

jest.mock('react-native-sqlite-storage', () => ({
  enablePromise: jest.fn(),
  openDatabase: jest.fn(() =>
    Promise.resolve({
      executeSql: jest.fn(() =>
        Promise.resolve([
          {
            rows: {length: 0, item: () => null, raw: () => []},
            insertId: 0,
            rowsAffected: 0,
          },
        ]),
      ),
      close: jest.fn(() => Promise.resolve()),
      transaction: jest.fn(),
      readTransaction: jest.fn(),
      attach: jest.fn(),
      detach: jest.fn(),
    }),
  ),
}));

jest.mock('react-native-camera-kit', () => ({
  Camera: 'Camera',
}));

jest.mock('react-native-bluetooth-escpos-printer', () => ({
  BluetoothManager: {
    isBluetoothEnabled: jest.fn(() => Promise.resolve(true)),
    enableBluetooth: jest.fn(() => Promise.resolve()),
    scanDevices: jest.fn(() => Promise.resolve('{"paired":[],"found":[]}')),
    connect: jest.fn(() => Promise.resolve()),
  },
  BluetoothEscposPrinter: {
    printText: jest.fn(() => Promise.resolve()),
    cutOne: jest.fn(() => Promise.resolve()),
    ALIGN: {LEFT: 0, CENTER: 1, RIGHT: 2},
  },
}));

jest.mock('react-native-permissions', () => ({
  PERMISSIONS: {
    ANDROID: {
      CAMERA: 'android.permission.CAMERA',
      BLUETOOTH_CONNECT: 'android.permission.BLUETOOTH_CONNECT',
      BLUETOOTH_SCAN: 'android.permission.BLUETOOTH_SCAN',
      ACCESS_FINE_LOCATION: 'android.permission.ACCESS_FINE_LOCATION',
      WRITE_EXTERNAL_STORAGE: 'android.permission.WRITE_EXTERNAL_STORAGE',
    },
  },
  RESULTS: {GRANTED: 'granted', DENIED: 'denied', BLOCKED: 'blocked'},
  check: jest.fn(() => Promise.resolve('granted')),
  request: jest.fn(() => Promise.resolve('granted')),
}));

jest.mock('react-native-fs', () => ({
  DocumentDirectoryPath: '/data/data/com.cashierappmobile/files',
  ExternalStorageDirectoryPath: '/storage/emulated/0',
  exists: jest.fn(() => Promise.resolve(true)),
  mkdir: jest.fn(() => Promise.resolve()),
  copyFile: jest.fn(() => Promise.resolve()),
}));

jest.mock('react-native-share', () => ({
  open: jest.fn(() => Promise.resolve()),
}));

jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(() =>
    Promise.resolve({didCancel: true, assets: []}),
  ),
}));

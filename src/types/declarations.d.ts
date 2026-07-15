/**
 * Ambient module declaration for react-native-bluetooth-escpos-printer,
 * which does not ship its own TypeScript types.
 */
declare module 'react-native-bluetooth-escpos-printer' {
  export interface BluetoothDeviceInfo {
    name: string;
    address: string;
  }

  export const BluetoothManager: {
    isBluetoothEnabled(): Promise<boolean>;
    enableBluetooth(): Promise<string[] | void>;
    scanDevices(): Promise<string>;
    connect(address: string): Promise<string>;
    unpaire(address: string): Promise<any>;
    EVENT_DEVICE_ALREADY_PAIRED: string;
    EVENT_DEVICE_FOUND: string;
    EVENT_CONNECTION_LOST: string;
  };

  export const BluetoothEscposPrinter: {
    printText(text: string, options: Record<string, unknown>): Promise<void>;
    printColumnsText(
      columnWidths: number[],
      columnAlignments: number[],
      columnTexts: string[],
      options: Record<string, unknown>,
    ): Promise<void>;
    printPic(base64: string, options: Record<string, unknown>): Promise<void>;
    printerAlign(align: number): Promise<void>;
    setBlob(weight: number): Promise<void>;
    printerLineSpace(space: number): Promise<void>;
    cutOne(): Promise<void>;
    ALIGN: {LEFT: number; CENTER: number; RIGHT: number};
  };

  export const BluetoothTscPrinter: Record<string, unknown>;
}

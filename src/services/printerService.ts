import {
  BluetoothManager,
  BluetoothEscposPrinter,
} from 'react-native-bluetooth-escpos-printer';
import {requestBluetoothPermissions} from './permissions';

export interface PairedPrinterDevice {
  name: string;
  address: string;
}

export class PrinterError extends Error {}

/** Lists Bluetooth devices already paired at the OS level (Settings > Bluetooth). */
export async function listPairedDevices(): Promise<PairedPrinterDevice[]> {
  const granted = await requestBluetoothPermissions();
  if (!granted) {
    throw new PrinterError('Izin Bluetooth ditolak');
  }
  const enabled = await BluetoothManager.isBluetoothEnabled();
  if (!enabled) {
    await BluetoothManager.enableBluetooth();
  }
  const raw = await BluetoothManager.scanDevices();
  try {
    const parsed = JSON.parse(raw) as {
      paired?: PairedPrinterDevice[];
      found?: PairedPrinterDevice[];
    };
    return [...(parsed.paired ?? []), ...(parsed.found ?? [])];
  } catch {
    return [];
  }
}

/** Connects to the printer at the given MAC address. Throws PrinterError on failure. */
export async function connectPrinter(address: string): Promise<void> {
  try {
    await BluetoothManager.connect(address);
  } catch (e: any) {
    throw new PrinterError(e?.message ?? 'Gagal terhubung ke printer');
  }
}

/**
 * Prints pre-formatted receipt text lines to the currently-connected
 * Bluetooth ESC/POS printer, then feeds and cuts.
 * Throws PrinterError on any failure so callers can offer a retry/reprint
 * option without affecting the already-committed transaction.
 */
export async function printReceiptLines(lines: string[]): Promise<void> {
  try {
    for (const line of lines) {
      await BluetoothEscposPrinter.printText(`${line}\r\n`, {});
    }
    await BluetoothEscposPrinter.printText('\r\n\r\n', {});
    await BluetoothEscposPrinter.cutOne();
  } catch (e: any) {
    throw new PrinterError(e?.message ?? 'Gagal mencetak struk');
  }
}

/** Convenience: connect (if an address is given) then print in one call. */
export async function printReceiptTo(
  address: string | null,
  lines: string[],
): Promise<void> {
  if (!address) {
    throw new PrinterError('Printer belum dipilih di SETTING');
  }
  await connectPrinter(address);
  await printReceiptLines(lines);
}

import 'package:print_bluetooth_thermal/print_bluetooth_thermal.dart';

class PrinterDevice {
  final String name;
  final String macAddress;
  PrinterDevice({required this.name, required this.macAddress});
}

/// Thin wrapper around the Bluetooth ESC/POS plugin. Printer failures are
/// surfaced as `false`/exceptions to the caller, which must treat them as
/// non-fatal — the sale is already committed before printing is attempted.
class PrinterService {
  Future<bool> isBluetoothEnabled() async {
    try {
      return await PrintBluetoothThermal.bluetoothEnabled;
    } catch (_) {
      return false;
    }
  }

  Future<List<PrinterDevice>> pairedDevices() async {
    final devices = await PrintBluetoothThermal.pairedBluetooths;
    return devices.map((d) => PrinterDevice(name: d.name, macAddress: d.macAdress)).toList();
  }

  Future<bool> printBytes({required String macAddress, required List<int> bytes}) async {
    try {
      final connected = await PrintBluetoothThermal.connect(macPrinterAddress: macAddress);
      if (!connected) return false;
      return await PrintBluetoothThermal.writeBytes(bytes);
    } catch (_) {
      return false;
    }
  }
}

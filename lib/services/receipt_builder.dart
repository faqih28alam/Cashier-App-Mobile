import 'package:esc_pos_utils_plus/esc_pos_utils_plus.dart';

import '../models/setting.dart';
import '../models/transaksi.dart';
import '../utils/currency.dart';

/// Builds the ESC/POS byte sequence for a receipt, mirroring the desktop
/// app's receipt layout (store header, transaction meta, items, totals,
/// footer) at the configured paper width.
class ReceiptBuilder {
  static Future<List<int>> build({
    required AppSetting setting,
    required Transaksi transaksi,
    required String cashierName,
  }) async {
    final profile = await CapabilityProfile.load();
    final paperSize = setting.printerWidthMm >= 80 ? PaperSize.mm80 : PaperSize.mm58;
    final generator = Generator(paperSize, profile);
    final bytes = <int>[];

    bytes.addAll(generator.text(
      setting.namaToko.isEmpty ? 'TOKO' : setting.namaToko,
      styles: const PosStyles(align: PosAlign.center, bold: true, height: PosTextSize.size2, width: PosTextSize.size2),
    ));
    if (setting.alamat.isNotEmpty) {
      bytes.addAll(generator.text(setting.alamat, styles: const PosStyles(align: PosAlign.center)));
    }
    if (setting.telepon.isNotEmpty) {
      bytes.addAll(generator.text('Telp: ${setting.telepon}', styles: const PosStyles(align: PosAlign.center)));
    }
    bytes.addAll(generator.hr());
    bytes.addAll(generator.text('No. Transaksi : ${transaksi.noTransaksi}'));
    bytes.addAll(generator.text('Tanggal       : ${formatDateTime(transaksi.tanggal)}'));
    bytes.addAll(generator.text('Kasir         : $cashierName'));
    bytes.addAll(generator.hr());

    for (final item in transaksi.items) {
      bytes.addAll(generator.text(item.namaBarang));
      bytes.addAll(generator.row([
        PosColumn(
          text: '  ${formatQty(item.qty)} ${item.sat} x ${formatRupiah(item.harga)}',
          width: 8,
        ),
        PosColumn(
          text: formatRupiah(item.total),
          width: 4,
          styles: const PosStyles(align: PosAlign.right),
        ),
      ]));
    }

    bytes.addAll(generator.hr());
    bytes.addAll(generator.row([
      PosColumn(text: 'Total', width: 6, styles: const PosStyles(bold: true)),
      PosColumn(text: formatRupiah(transaksi.total), width: 6, styles: const PosStyles(align: PosAlign.right, bold: true)),
    ]));
    bytes.addAll(generator.row([
      PosColumn(text: 'Bayar', width: 6),
      PosColumn(text: formatRupiah(transaksi.bayar), width: 6, styles: const PosStyles(align: PosAlign.right)),
    ]));
    bytes.addAll(generator.row([
      PosColumn(text: 'Kembalian', width: 6),
      PosColumn(text: formatRupiah(transaksi.kembalian), width: 6, styles: const PosStyles(align: PosAlign.right)),
    ]));
    bytes.addAll(generator.hr(ch: '='));
    bytes.addAll(generator.text(
      setting.receiptFooter.isEmpty ? 'Terima Kasih!' : setting.receiptFooter,
      styles: const PosStyles(align: PosAlign.center),
    ));
    bytes.addAll(generator.feed(2));
    bytes.addAll(generator.cut());
    return bytes;
  }
}

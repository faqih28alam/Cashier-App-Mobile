import 'package:flutter/material.dart';

import '../../models/setting.dart';
import '../../models/transaksi.dart';
import '../../repositories/setting_repository.dart';
import '../../services/printer_service.dart';
import '../../services/receipt_builder.dart';
import '../../utils/currency.dart';

/// Receipt preview popup shown after a payment is confirmed. Printing is
/// attempted automatically and is non-fatal — the sale is already committed
/// before this dialog ever appears. A manual "Cetak Ulang" (reprint) button
/// is also offered.
class ReceiptPreview extends StatefulWidget {
  final Transaksi transaksi;
  final String cashierName;

  const ReceiptPreview({super.key, required this.transaksi, required this.cashierName});

  static Future<void> show(
    BuildContext context, {
    required Transaksi transaksi,
    required String cashierName,
  }) {
    return showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => ReceiptPreview(transaksi: transaksi, cashierName: cashierName),
    );
  }

  @override
  State<ReceiptPreview> createState() => _ReceiptPreviewState();
}

class _ReceiptPreviewState extends State<ReceiptPreview> {
  String? _printStatus;
  bool _printing = false;

  @override
  void initState() {
    super.initState();
    _print();
  }

  Future<void> _print() async {
    setState(() {
      _printing = true;
      _printStatus = null;
    });
    try {
      final setting = await SettingRepository().get();
      if (setting.printerMacAddress == null) {
        setState(() => _printStatus = 'Printer belum diatur di Setting');
        return;
      }
      final bytes = await ReceiptBuilder.build(
        setting: setting,
        transaksi: widget.transaksi,
        cashierName: widget.cashierName,
      );
      final ok = await PrinterService()
          .printBytes(macAddress: setting.printerMacAddress!, bytes: bytes);
      setState(() => _printStatus = ok ? 'Struk tercetak' : 'Printer tidak terhubung — struk tersimpan');
    } catch (_) {
      setState(() => _printStatus = 'Gagal mencetak — struk tetap tersimpan');
    } finally {
      if (mounted) setState(() => _printing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final trx = widget.transaksi;
    return AlertDialog(
      title: const Text('Struk'),
      content: SizedBox(
        width: 320,
        child: SingleChildScrollView(
          child: FutureBuilder<AppSetting>(
            future: SettingRepository().get(),
            builder: (context, snapshot) {
              final setting = snapshot.data;
              return Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  if (setting != null) ...[
                    Text(setting.namaToko, textAlign: TextAlign.center, style: const TextStyle(fontWeight: FontWeight.bold)),
                    if (setting.alamat.isNotEmpty) Text(setting.alamat, textAlign: TextAlign.center),
                    if (setting.telepon.isNotEmpty) Text('Telp: ${setting.telepon}', textAlign: TextAlign.center),
                    const Divider(),
                  ],
                  Text('No: ${trx.noTransaksi}'),
                  Text('Tanggal: ${formatDateTime(trx.tanggal)}'),
                  Text('Kasir: ${widget.cashierName}'),
                  const Divider(),
                  for (final item in trx.items)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 2),
                      child: Row(
                        children: [
                          Expanded(child: Text('${item.namaBarang}\n${formatQty(item.qty)} ${item.sat} x ${formatRupiah(item.harga)}')),
                          Text(formatRupiah(item.total)),
                        ],
                      ),
                    ),
                  const Divider(),
                  _row('Total', trx.total, bold: true),
                  _row('Bayar', trx.bayar),
                  _row('Kembalian', trx.kembalian),
                  const Divider(),
                  if (setting != null)
                    Text(setting.receiptFooter, textAlign: TextAlign.center),
                  const SizedBox(height: 12),
                  if (_printing)
                    const Center(child: CircularProgressIndicator())
                  else if (_printStatus != null)
                    Text(_printStatus!, textAlign: TextAlign.center),
                ],
              );
            },
          ),
        ),
      ),
      actions: [
        TextButton(onPressed: _printing ? null : _print, child: const Text('Cetak Ulang')),
        FilledButton(onPressed: () => Navigator.of(context).pop(), child: const Text('Selesai')),
      ],
    );
  }

  Widget _row(String label, double value, {bool bold = false}) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 2),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label, style: bold ? const TextStyle(fontWeight: FontWeight.bold) : null),
            Text(formatRupiah(value), style: bold ? const TextStyle(fontWeight: FontWeight.bold) : null),
          ],
        ),
      );
}

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../models/barang.dart';
import '../../models/transaksi.dart';
import '../../repositories/barang_repository.dart';
import '../../repositories/transaksi_repository.dart';
import '../../services/pricing_service.dart';
import '../../services/session_state.dart';
import '../../utils/currency.dart';
import 'numpad_popup.dart';
import 'payment_screen.dart';
import 'receipt_preview.dart';

/// The main POS screen: scan/enter a barcode to add items, edit qty/discount,
/// hold the transaction, or proceed to payment.
class KasirScreen extends StatefulWidget {
  final Transaksi? initialTransaksi;
  const KasirScreen({super.key, required this.initialTransaksi});

  @override
  State<KasirScreen> createState() => _KasirScreenState();
}

class _KasirScreenState extends State<KasirScreen> {
  final _barcodeCtrl = TextEditingController();
  final _barcodeFocus = FocusNode();
  final _barangRepo = BarangRepository();
  final _transaksiRepo = TransaksiRepository();
  final Map<String, Barang> _barangCache = {};

  late List<TransaksiDetail> _items;
  int? _transaksiId;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _items = List.of(widget.initialTransaksi?.items ?? const []);
    _transaksiId = widget.initialTransaksi?.id;
  }

  @override
  void dispose() {
    _barcodeCtrl.dispose();
    _barcodeFocus.dispose();
    super.dispose();
  }

  double get _total => _items.fold(0, (sum, i) => sum + i.total);

  Future<void> _onBarcodeSubmitted(String value) async {
    final barcode = value.trim();
    _barcodeCtrl.clear();
    _barcodeFocus.requestFocus();
    if (barcode.isEmpty) return;

    final barang = _barangCache[barcode] ?? await _barangRepo.findByBarcode(barcode);
    if (barang == null) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Barcode $barcode tidak ditemukan')),
      );
      return;
    }
    _barangCache[barcode] = barang;

    setState(() {
      final index = _items.indexWhere((i) => i.barcode == barcode);
      if (index == -1) {
        _items.add(buildCartLine(barang, qty: 1));
      } else {
        final existing = _items[index];
        _items[index] = buildCartLine(barang, qty: existing.qty + 1, diskon: existing.diskon);
      }
    });
  }

  Future<void> _editQty(int index) async {
    final item = _items[index];
    final barang = _barangCache[item.barcode] ?? await _barangRepo.findByBarcode(item.barcode);
    if (barang == null || !mounted) return;
    final newQty = await NumpadPopup.show(
      context,
      productName: item.namaBarang,
      unit: item.sat,
      initialQty: item.qty,
    );
    if (newQty == null) return;
    setState(() {
      _items[index] = buildCartLine(barang, qty: newQty, diskon: item.diskon);
    });
  }

  Future<void> _editDiskon(int index) async {
    final item = _items[index];
    final ctrl = TextEditingController(text: item.diskon == 0 ? '' : item.diskon.toStringAsFixed(0));
    final result = await showDialog<double>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Diskon — ${item.namaBarang}'),
        content: TextField(
          controller: ctrl,
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(labelText: 'Diskon (Rp)'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Batal')),
          FilledButton(
            onPressed: () => Navigator.pop(context, double.tryParse(ctrl.text) ?? 0),
            child: const Text('OK'),
          ),
        ],
      ),
    );
    if (result == null) return;
    setState(() {
      _items[index] = item.copyWith(diskon: result, total: (item.qty * item.harga) - result);
    });
  }

  void _deleteRow(int index) => setState(() => _items.removeAt(index));

  void _clearAll() => setState(() => _items.clear());

  Future<void> _hold() async {
    if (_items.isEmpty) {
      Navigator.of(context).pop();
      return;
    }
    final idUser = context.read<SessionState>().currentUser!.id!;
    final cart = Transaksi(
      id: _transaksiId,
      noTransaksi: '',
      tanggal: DateTime.now(),
      idUser: idUser,
      total: _total,
      status: 'open',
      items: _items,
    );
    try {
      await _transaksiRepo.saveHeld(cart);
      if (mounted) Navigator.of(context).pop();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Gagal menahan transaksi: $e')));
      }
    }
  }

  Future<void> _pay() async {
    if (_items.isEmpty) return;
    final bayar = await Navigator.of(context).push<double?>(
      MaterialPageRoute(builder: (_) => PaymentScreen(total: _total)),
    );
    if (bayar == null || !mounted) return;

    setState(() => _busy = true);
    final session = context.read<SessionState>();
    try {
      final cart = Transaksi(
        id: _transaksiId,
        noTransaksi: '',
        tanggal: DateTime.now(),
        idUser: session.currentUser!.id!,
        total: _total,
        status: 'open',
        items: _items,
      );
      final paid = await _transaksiRepo.confirmPayment(cart: cart, bayar: bayar);
      if (!mounted) return;
      await ReceiptPreview.show(
        context,
        transaksi: paid,
        cashierName: session.currentUser!.nama,
      );
      if (mounted) Navigator.of(context).pop();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Kasir'),
        actions: [
          IconButton(
            icon: const Icon(Icons.pause_circle_outline),
            tooltip: 'Hold',
            onPressed: _busy ? null : _hold,
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: _items.isEmpty
                ? const Center(child: Text('Scan atau masukkan barcode untuk memulai'))
                : ListView.separated(
                    itemCount: _items.length,
                    separatorBuilder: (_, _) => const Divider(height: 1),
                    itemBuilder: (context, index) {
                      final item = _items[index];
                      return ListTile(
                        title: Text(item.namaBarang),
                        subtitle: Text(
                          '${formatQty(item.qty)} ${item.sat} x ${formatRupiah(item.harga)}'
                          '${item.diskon > 0 ? ' - Diskon ${formatRupiah(item.diskon)}' : ''}',
                        ),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(formatRupiah(item.total), style: const TextStyle(fontWeight: FontWeight.bold)),
                            IconButton(
                              icon: const Icon(Icons.percent),
                              tooltip: 'Diskon',
                              onPressed: () => _editDiskon(index),
                            ),
                            IconButton(
                              icon: const Icon(Icons.delete_outline),
                              tooltip: 'Hapus',
                              onPressed: () => _deleteRow(index),
                            ),
                          ],
                        ),
                        onTap: () => _editQty(index),
                      );
                    },
                  ),
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  TextField(
                    controller: _barcodeCtrl,
                    focusNode: _barcodeFocus,
                    autofocus: true,
                    decoration: const InputDecoration(
                      labelText: 'Scan / masukkan barcode',
                      prefixIcon: Icon(Icons.qr_code_scanner),
                      border: OutlineInputBorder(),
                    ),
                    onSubmitted: _onBarcodeSubmitted,
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      TextButton(
                        onPressed: _items.isEmpty ? null : _clearAll,
                        child: const Text('Clear All'),
                      ),
                      Text(
                        'TRANSAKSI: ${formatRupiah(_total)}',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  FilledButton(
                    onPressed: (_items.isEmpty || _busy) ? null : _pay,
                    style: FilledButton.styleFrom(padding: const EdgeInsets.all(16)),
                    child: _busy
                        ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                        : const Text('BAYAR'),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

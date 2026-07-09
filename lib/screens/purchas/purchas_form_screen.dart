import 'package:flutter/material.dart';

import '../../models/pembelian.dart';
import '../../models/supplier.dart';
import '../../repositories/barang_repository.dart';
import '../../repositories/pembelian_repository.dart';
import '../../repositories/supplier_repository.dart';
import '../../utils/currency.dart';

/// Purchase draft/confirm form. New purchases start as a draft; confirming
/// increments stock (auto-creating the product from harga_1 if unknown) and
/// posts a kredit entry to Keuangan. Confirmed purchases are read-only.
class PurchasFormScreen extends StatefulWidget {
  final Pembelian? existing;
  const PurchasFormScreen({super.key, this.existing});

  @override
  State<PurchasFormScreen> createState() => _PurchasFormScreenState();
}

class _PurchasFormScreenState extends State<PurchasFormScreen> {
  final _noFakturCtrl = TextEditingController();
  DateTime _tanggal = DateTime.now();
  int? _idSupplier;
  List<Supplier> _suppliers = [];
  late List<PembelianDetail> _items;
  bool _loading = true;
  bool _busy = false;

  bool get _isConfirmed => widget.existing?.status == 'confirmed';

  @override
  void initState() {
    super.initState();
    _items = List.of(widget.existing?.items ?? const []);
    if (widget.existing != null) {
      _noFakturCtrl.text = widget.existing!.noFaktur;
      _tanggal = widget.existing!.tanggal;
      _idSupplier = widget.existing!.idSupplier;
    }
    _loadSuppliers();
  }

  Future<void> _loadSuppliers() async {
    final suppliers = await SupplierRepository().all();
    setState(() {
      _suppliers = suppliers;
      _loading = false;
    });
  }

  double get _total => _items.fold(0, (sum, i) => sum + i.total);

  Future<void> _addItem() async {
    final result = await showDialog<PembelianDetail>(
      context: context,
      builder: (_) => const _ItemDialog(),
    );
    if (result != null) setState(() => _items.add(result));
  }

  void _removeItem(int index) => setState(() => _items.removeAt(index));

  Pembelian _buildPembelian() => Pembelian(
        id: widget.existing?.id,
        noFaktur: _noFakturCtrl.text.trim(),
        tanggal: _tanggal,
        idSupplier: _idSupplier!,
        total: _total,
        items: _items,
      );

  Future<void> _saveDraft() async {
    if (_noFakturCtrl.text.trim().isEmpty || _idSupplier == null || _items.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Lengkapi no. faktur, supplier, dan minimal 1 item')),
      );
      return;
    }
    setState(() => _busy = true);
    try {
      await PembelianRepository().saveDraft(_buildPembelian());
      if (mounted) Navigator.of(context).pop();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _confirm() async {
    if (widget.existing?.id == null) return;
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Konfirmasi Pembelian'),
        content: const Text('Stok akan bertambah dan tidak bisa diubah lagi setelah dikonfirmasi. Lanjutkan?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Batal')),
          FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('Konfirmasi')),
        ],
      ),
    );
    if (ok != true) return;
    setState(() => _busy = true);
    try {
      await PembelianRepository().confirm(widget.existing!.id!);
      if (mounted) Navigator.of(context).pop();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    return Scaffold(
      appBar: AppBar(title: Text(widget.existing == null ? 'Pembelian Baru' : widget.existing!.noFaktur)),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            TextField(
              controller: _noFakturCtrl,
              enabled: !_isConfirmed,
              decoration: const InputDecoration(labelText: 'No. Faktur'),
            ),
            const SizedBox(height: 8),
            ListTile(
              contentPadding: EdgeInsets.zero,
              title: Text('Tanggal: ${formatDateTime(_tanggal)}'),
              trailing: _isConfirmed
                  ? null
                  : IconButton(
                      icon: const Icon(Icons.calendar_today),
                      onPressed: () async {
                        final picked = await showDatePicker(
                          context: context,
                          initialDate: _tanggal,
                          firstDate: DateTime(2020),
                          lastDate: DateTime(2100),
                        );
                        if (picked != null) setState(() => _tanggal = picked);
                      },
                    ),
            ),
            DropdownButtonFormField<int>(
              initialValue: _idSupplier,
              decoration: const InputDecoration(labelText: 'Supplier'),
              items: [
                for (final s in _suppliers) DropdownMenuItem(value: s.id, child: Text(s.nama)),
              ],
              onChanged: _isConfirmed ? null : (v) => setState(() => _idSupplier = v),
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Item', style: TextStyle(fontWeight: FontWeight.bold)),
                if (!_isConfirmed)
                  TextButton.icon(onPressed: _addItem, icon: const Icon(Icons.add), label: const Text('Tambah')),
              ],
            ),
            Expanded(
              child: ListView.separated(
                itemCount: _items.length,
                separatorBuilder: (_, _) => const Divider(height: 1),
                itemBuilder: (context, index) {
                  final item = _items[index];
                  return ListTile(
                    title: Text(item.namaBarang),
                    subtitle: Text('${formatQty(item.qty)} ${item.sat} x ${formatRupiah(item.hpp)}'),
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(formatRupiah(item.total)),
                        if (!_isConfirmed)
                          IconButton(
                            icon: const Icon(Icons.delete_outline),
                            onPressed: () => _removeItem(index),
                          ),
                      ],
                    ),
                  );
                },
              ),
            ),
            const Divider(),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Total', style: TextStyle(fontWeight: FontWeight.bold)),
                Text(formatRupiah(_total), style: const TextStyle(fontWeight: FontWeight.bold)),
              ],
            ),
            const SizedBox(height: 12),
            if (!_isConfirmed)
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: _busy ? null : _saveDraft,
                      child: const Text('Simpan Draft'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: FilledButton(
                      onPressed: (_busy || widget.existing?.id == null) ? null : _confirm,
                      child: const Text('Konfirmasi'),
                    ),
                  ),
                ],
              )
            else
              const Text('Sudah dikonfirmasi', style: TextStyle(color: Colors.green)),
          ],
        ),
      ),
    );
  }
}

class _ItemDialog extends StatefulWidget {
  const _ItemDialog();

  @override
  State<_ItemDialog> createState() => _ItemDialogState();
}

class _ItemDialogState extends State<_ItemDialog> {
  final _barcodeCtrl = TextEditingController();
  final _namaCtrl = TextEditingController();
  final _satCtrl = TextEditingController(text: 'PCS');
  final _qtyCtrl = TextEditingController(text: '1');
  final _hppCtrl = TextEditingController();
  final _harga1Ctrl = TextEditingController();
  bool _knownProduct = false;

  Future<void> _lookup() async {
    final barcode = _barcodeCtrl.text.trim();
    if (barcode.isEmpty) return;
    final barang = await BarangRepository().findByBarcode(barcode);
    if (barang != null) {
      setState(() {
        _knownProduct = true;
        _namaCtrl.text = barang.nama;
        _satCtrl.text = barang.sat;
        _hppCtrl.text = barang.hpp.toStringAsFixed(0);
        _harga1Ctrl.text = barang.harga1.toStringAsFixed(0);
      });
    } else {
      setState(() => _knownProduct = false);
    }
  }

  void _submit() {
    final qty = double.tryParse(_qtyCtrl.text) ?? 0;
    final hpp = double.tryParse(_hppCtrl.text) ?? 0;
    final harga1 = double.tryParse(_harga1Ctrl.text) ?? 0;
    if (_barcodeCtrl.text.trim().isEmpty || _namaCtrl.text.trim().isEmpty || qty <= 0) {
      return;
    }
    Navigator.of(context).pop(PembelianDetail(
      barcode: _barcodeCtrl.text.trim(),
      namaBarang: _namaCtrl.text.trim(),
      sat: _satCtrl.text.trim(),
      qty: qty,
      hpp: hpp,
      harga1: harga1,
      total: qty * hpp,
    ));
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Tambah Item'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: _barcodeCtrl,
              decoration: const InputDecoration(labelText: 'Barcode'),
              onSubmitted: (_) => _lookup(),
              onEditingComplete: _lookup,
            ),
            TextField(
              controller: _namaCtrl,
              enabled: !_knownProduct,
              decoration: const InputDecoration(labelText: 'Nama Barang'),
            ),
            TextField(
              controller: _satCtrl,
              enabled: !_knownProduct,
              decoration: const InputDecoration(labelText: 'Satuan'),
            ),
            TextField(
              controller: _qtyCtrl,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Qty'),
            ),
            TextField(
              controller: _hppCtrl,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'HPP (harga beli)'),
            ),
            TextField(
              controller: _harga1Ctrl,
              enabled: !_knownProduct,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Harga Jual (jika produk baru)'),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('Batal')),
        FilledButton(onPressed: _submit, child: const Text('Tambah')),
      ],
    );
  }
}

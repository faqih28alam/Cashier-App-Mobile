import 'package:flutter/material.dart';

import '../../models/barang.dart';
import '../../models/barang_harga.dart';
import '../../models/kategori.dart';
import '../../repositories/barang_repository.dart';
import '../../repositories/kategori_repository.dart';

class BarangFormScreen extends StatefulWidget {
  final Barang? existing;
  const BarangFormScreen({super.key, this.existing});

  @override
  State<BarangFormScreen> createState() => _BarangFormScreenState();
}

class _TierRow {
  final TextEditingController minQty;
  final TextEditingController harga;
  _TierRow({String minQty = '', String harga = ''})
      : minQty = TextEditingController(text: minQty),
        harga = TextEditingController(text: harga);
}

class _BarangFormScreenState extends State<BarangFormScreen> {
  late final TextEditingController _barcodeCtrl;
  late final TextEditingController _namaCtrl;
  late final TextEditingController _satCtrl;
  late final TextEditingController _hppCtrl;
  late final TextEditingController _harga1Ctrl;
  late final TextEditingController _stokCtrl;
  late final TextEditingController _stokMinCtrl;
  int? _idKategori;
  List<Kategori> _kategoris = [];
  final List<_TierRow> _tiers = [];
  bool _saving = false;

  bool get _isEdit => widget.existing != null;

  @override
  void initState() {
    super.initState();
    final b = widget.existing;
    _barcodeCtrl = TextEditingController(text: b?.barcode ?? '');
    _namaCtrl = TextEditingController(text: b?.nama ?? '');
    _satCtrl = TextEditingController(text: b?.sat ?? 'PCS');
    _hppCtrl = TextEditingController(text: b == null ? '' : b.hpp.toStringAsFixed(0));
    _harga1Ctrl = TextEditingController(text: b == null ? '' : b.harga1.toStringAsFixed(0));
    _stokCtrl = TextEditingController(text: b == null ? '0' : b.stok.toStringAsFixed(0));
    _stokMinCtrl = TextEditingController(text: b == null ? '0' : b.stokMinimum.toStringAsFixed(0));
    _idKategori = b?.idKategori;
    if (b != null) {
      for (final t in b.hargaTiers) {
        _tiers.add(_TierRow(minQty: t.minQty.toString(), harga: t.harga.toStringAsFixed(0)));
      }
    }
    KategoriRepository().all().then((v) => setState(() => _kategoris = v));
  }

  void _addTier() => setState(() => _tiers.add(_TierRow()));
  void _removeTier(int i) => setState(() => _tiers.removeAt(i));

  Future<void> _save() async {
    if (_barcodeCtrl.text.trim().isEmpty || _namaCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Barcode dan nama wajib diisi')));
      return;
    }
    setState(() => _saving = true);
    try {
      final barang = Barang(
        barcode: _barcodeCtrl.text.trim(),
        nama: _namaCtrl.text.trim(),
        idKategori: _idKategori,
        sat: _satCtrl.text.trim(),
        hpp: double.tryParse(_hppCtrl.text) ?? 0,
        harga1: double.tryParse(_harga1Ctrl.text) ?? 0,
        stok: double.tryParse(_stokCtrl.text) ?? 0,
        stokMinimum: double.tryParse(_stokMinCtrl.text) ?? 0,
        hargaTiers: [
          for (final t in _tiers)
            if (t.minQty.text.trim().isNotEmpty && t.harga.text.trim().isNotEmpty)
              BarangHarga(
                barcode: _barcodeCtrl.text.trim(),
                minQty: int.tryParse(t.minQty.text) ?? 0,
                harga: double.tryParse(t.harga.text) ?? 0,
              ),
        ],
      );
      await BarangRepository().upsert(barang);
      if (mounted) Navigator.of(context).pop();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Gagal menyimpan: $e')));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(_isEdit ? 'Edit Barang' : 'Barang Baru')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            TextField(
              controller: _barcodeCtrl,
              enabled: !_isEdit,
              decoration: const InputDecoration(labelText: 'Barcode'),
            ),
            const SizedBox(height: 8),
            TextField(controller: _namaCtrl, decoration: const InputDecoration(labelText: 'Nama Barang')),
            const SizedBox(height: 8),
            DropdownButtonFormField<int?>(
              initialValue: _idKategori,
              decoration: const InputDecoration(labelText: 'Kategori'),
              items: [
                const DropdownMenuItem(value: null, child: Text('-')),
                for (final k in _kategoris) DropdownMenuItem(value: k.id, child: Text(k.nama)),
              ],
              onChanged: (v) => setState(() => _idKategori = v),
            ),
            const SizedBox(height: 8),
            TextField(controller: _satCtrl, decoration: const InputDecoration(labelText: 'Satuan (SAT)')),
            const SizedBox(height: 8),
            TextField(
              controller: _hppCtrl,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'HPP'),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _harga1Ctrl,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Harga 1 (standar)'),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _stokCtrl,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Stok'),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _stokMinCtrl,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Stok Minimum'),
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Harga Bertingkat', style: TextStyle(fontWeight: FontWeight.bold)),
                TextButton.icon(onPressed: _addTier, icon: const Icon(Icons.add), label: const Text('Tambah Harga')),
              ],
            ),
            for (var i = 0; i < _tiers.length; i++)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _tiers[i].minQty,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(labelText: 'Min. Qty'),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextField(
                        controller: _tiers[i].harga,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(labelText: 'Harga'),
                      ),
                    ),
                    IconButton(icon: const Icon(Icons.delete_outline), onPressed: () => _removeTier(i)),
                  ],
                ),
              ),
            const SizedBox(height: 24),
            FilledButton(
              onPressed: _saving ? null : _save,
              child: _saving
                  ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Text('Simpan'),
            ),
          ],
        ),
      ),
    );
  }
}

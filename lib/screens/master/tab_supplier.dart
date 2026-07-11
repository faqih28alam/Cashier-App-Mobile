import 'package:flutter/material.dart';

import '../../models/supplier.dart';
import '../../repositories/supplier_repository.dart';
import '../../utils/error_reporting.dart';

class MasterSupplierTab extends StatefulWidget {
  const MasterSupplierTab({super.key});

  @override
  State<MasterSupplierTab> createState() => _MasterSupplierTabState();
}

class _MasterSupplierTabState extends State<MasterSupplierTab> {
  late Future<List<Supplier>> _future;

  @override
  void initState() {
    super.initState();
    _reload();
  }

  void _reload() {
    _future = SupplierRepository().all();
    setState(() {});
  }

  Future<void> _edit({Supplier? existing}) async {
    final kodeCtrl = TextEditingController(text: existing?.kode ?? '');
    final namaCtrl = TextEditingController(text: existing?.nama ?? '');
    final alamatCtrl = TextEditingController(text: existing?.alamat ?? '');
    final teleponCtrl = TextEditingController(text: existing?.telepon ?? '');
    final kontakCtrl = TextEditingController(text: existing?.kontak ?? '');
    final result = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(existing == null ? 'Supplier Baru' : 'Edit Supplier'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(controller: kodeCtrl, decoration: const InputDecoration(labelText: 'Kode')),
              TextField(controller: namaCtrl, decoration: const InputDecoration(labelText: 'Nama')),
              TextField(controller: alamatCtrl, decoration: const InputDecoration(labelText: 'Alamat')),
              TextField(controller: teleponCtrl, decoration: const InputDecoration(labelText: 'Telepon')),
              TextField(controller: kontakCtrl, decoration: const InputDecoration(labelText: 'Kontak')),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Batal')),
          FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('Simpan')),
        ],
      ),
    );
    if (result != true || kodeCtrl.text.trim().isEmpty || namaCtrl.text.trim().isEmpty) return;
    if (!mounted) return;
    final repo = SupplierRepository();
    final supplier = Supplier(
      id: existing?.id,
      kode: kodeCtrl.text.trim(),
      nama: namaCtrl.text.trim(),
      alamat: alamatCtrl.text.trim(),
      telepon: teleponCtrl.text.trim(),
      kontak: kontakCtrl.text.trim(),
    );
    final ok = await runSafely(context, () async {
      if (existing == null) {
        await repo.insert(supplier);
      } else {
        await repo.update(supplier);
      }
    });
    if (ok) _reload();
  }

  Future<void> _delete(Supplier s) async {
    final ok = await runSafely(context, () => SupplierRepository().delete(s.id!));
    if (ok) _reload();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      floatingActionButton: FloatingActionButton(onPressed: () => _edit(), child: const Icon(Icons.add)),
      body: FutureBuilder<List<Supplier>>(
        future: _future,
        builder: (context, snapshot) {
          if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());
          final list = snapshot.data!;
          if (list.isEmpty) return const Center(child: Text('Belum ada supplier'));
          return ListView.separated(
            itemCount: list.length,
            separatorBuilder: (_, _) => const Divider(height: 1),
            itemBuilder: (context, index) {
              final s = list[index];
              return ListTile(
                title: Text(s.nama),
                subtitle: Text('${s.kode} · ${s.telepon}'),
                trailing: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    IconButton(icon: const Icon(Icons.edit), onPressed: () => _edit(existing: s)),
                    IconButton(icon: const Icon(Icons.delete_outline), onPressed: () => _delete(s)),
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }
}

import 'package:flutter/material.dart';

import '../../models/kategori.dart';
import '../../repositories/kategori_repository.dart';
import '../../utils/error_reporting.dart';

class MasterKategoriTab extends StatefulWidget {
  const MasterKategoriTab({super.key});

  @override
  State<MasterKategoriTab> createState() => _MasterKategoriTabState();
}

class _MasterKategoriTabState extends State<MasterKategoriTab> {
  late Future<List<Kategori>> _future;

  @override
  void initState() {
    super.initState();
    _reload();
  }

  void _reload() => setState(() => _future = KategoriRepository().all());

  Future<void> _edit({Kategori? existing}) async {
    final kodeCtrl = TextEditingController(text: existing?.kode ?? '');
    final namaCtrl = TextEditingController(text: existing?.nama ?? '');
    final result = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(existing == null ? 'Kategori Baru' : 'Edit Kategori'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: kodeCtrl, decoration: const InputDecoration(labelText: 'Kode')),
            TextField(controller: namaCtrl, decoration: const InputDecoration(labelText: 'Nama')),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Batal')),
          FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('Simpan')),
        ],
      ),
    );
    if (result != true || kodeCtrl.text.trim().isEmpty || namaCtrl.text.trim().isEmpty) return;
    if (!mounted) return;
    final repo = KategoriRepository();
    final ok = await runSafely(context, () async {
      if (existing == null) {
        await repo.insert(Kategori(kode: kodeCtrl.text.trim(), nama: namaCtrl.text.trim()));
      } else {
        await repo.update(Kategori(id: existing.id, kode: kodeCtrl.text.trim(), nama: namaCtrl.text.trim()));
      }
    });
    if (ok) _reload();
  }

  Future<void> _delete(Kategori k) async {
    final ok = await runSafely(context, () => KategoriRepository().delete(k.id!));
    if (ok) _reload();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      floatingActionButton: FloatingActionButton(onPressed: () => _edit(), child: const Icon(Icons.add)),
      body: FutureBuilder<List<Kategori>>(
        future: _future,
        builder: (context, snapshot) {
          if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());
          final list = snapshot.data!;
          if (list.isEmpty) return const Center(child: Text('Belum ada kategori'));
          return ListView.separated(
            itemCount: list.length,
            separatorBuilder: (_, _) => const Divider(height: 1),
            itemBuilder: (context, index) {
              final k = list[index];
              return ListTile(
                title: Text(k.nama),
                subtitle: Text(k.kode),
                trailing: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    IconButton(icon: const Icon(Icons.edit), onPressed: () => _edit(existing: k)),
                    IconButton(icon: const Icon(Icons.delete_outline), onPressed: () => _delete(k)),
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

import 'package:flutter/material.dart';

import '../../models/barang.dart';
import '../../repositories/barang_repository.dart';
import '../../utils/currency.dart';
import '../../utils/error_reporting.dart';
import 'barang_form_screen.dart';

class MasterBarangTab extends StatefulWidget {
  const MasterBarangTab({super.key});

  @override
  State<MasterBarangTab> createState() => _MasterBarangTabState();
}

class _MasterBarangTabState extends State<MasterBarangTab> {
  late Future<List<Barang>> _future;
  String _search = '';

  @override
  void initState() {
    super.initState();
    _reload();
  }

  void _reload() => setState(() => _future = BarangRepository().all(search: _search));

  Future<void> _openForm({Barang? existing}) async {
    await Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => BarangFormScreen(existing: existing)),
    );
    _reload();
  }

  Future<void> _delete(Barang b) async {
    final ok = await runSafely(context, () => BarangRepository().delete(b.barcode));
    if (ok) _reload();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      floatingActionButton: FloatingActionButton(onPressed: () => _openForm(), child: const Icon(Icons.add)),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              decoration: const InputDecoration(labelText: 'Cari nama/barcode', isDense: true),
              onChanged: (v) {
                _search = v;
                _reload();
              },
            ),
          ),
          Expanded(
            child: FutureBuilder<List<Barang>>(
              future: _future,
              builder: (context, snapshot) {
                if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());
                final list = snapshot.data!;
                if (list.isEmpty) return const Center(child: Text('Belum ada produk'));
                return ListView.separated(
                  itemCount: list.length,
                  separatorBuilder: (_, _) => const Divider(height: 1),
                  itemBuilder: (context, index) {
                    final b = list[index];
                    return ListTile(
                      title: Text(b.nama),
                      subtitle: Text('${b.barcode} · Stok ${formatQty(b.stok)} ${b.sat}'),
                      trailing: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(formatRupiah(b.harga1)),
                          IconButton(icon: const Icon(Icons.edit), onPressed: () => _openForm(existing: b)),
                          IconButton(icon: const Icon(Icons.delete_outline), onPressed: () => _delete(b)),
                        ],
                      ),
                      onTap: () => _openForm(existing: b),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

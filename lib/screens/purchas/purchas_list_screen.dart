import 'package:flutter/material.dart';

import '../../models/pembelian.dart';
import '../../models/supplier.dart';
import '../../repositories/pembelian_repository.dart';
import '../../repositories/supplier_repository.dart';
import '../../utils/currency.dart';
import 'purchas_form_screen.dart';

class PurchasListScreen extends StatefulWidget {
  const PurchasListScreen({super.key});

  @override
  State<PurchasListScreen> createState() => _PurchasListScreenState();
}

class _PurchasListScreenState extends State<PurchasListScreen> {
  late Future<_ListData> _future;

  @override
  void initState() {
    super.initState();
    _reload();
  }

  void _reload() {
    _future = _load();
    setState(() {});
  }

  Future<_ListData> _load() async {
    final pembelian = await PembelianRepository().list();
    final suppliers = {for (final s in await SupplierRepository().all()) s.id: s};
    return _ListData(pembelian, suppliers);
  }

  Future<void> _openForm({Pembelian? existing}) async {
    await Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => PurchasFormScreen(existing: existing)),
    );
    _reload();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      floatingActionButton: FloatingActionButton(
        onPressed: () => _openForm(),
        child: const Icon(Icons.add),
      ),
      body: FutureBuilder<_ListData>(
        future: _future,
        builder: (context, snapshot) {
          if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());
          final data = snapshot.data!;
          if (data.pembelian.isEmpty) {
            return const Center(child: Text('Belum ada pembelian'));
          }
          return ListView.separated(
            itemCount: data.pembelian.length,
            separatorBuilder: (_, _) => const Divider(height: 1),
            itemBuilder: (context, index) {
              final p = data.pembelian[index];
              final supplier = data.suppliers[p.idSupplier];
              return ListTile(
                title: Text(p.noFaktur),
                subtitle: Text('${supplier?.nama ?? '-'} · ${formatDateTime(p.tanggal)}'),
                trailing: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(formatRupiah(p.total)),
                    Text(
                      p.status == 'confirmed' ? 'Confirmed' : 'Draft',
                      style: TextStyle(
                        color: p.status == 'confirmed' ? Colors.green : Colors.orange,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
                onTap: () => _openForm(existing: p),
              );
            },
          );
        },
      ),
    );
  }
}

class _ListData {
  final List<Pembelian> pembelian;
  final Map<int?, Supplier> suppliers;
  _ListData(this.pembelian, this.suppliers);
}

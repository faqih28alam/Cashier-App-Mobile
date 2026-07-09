import 'package:flutter/material.dart';

import '../../models/barang.dart';
import '../../models/kategori.dart';
import '../../repositories/barang_repository.dart';
import '../../repositories/kategori_repository.dart';
import '../../utils/currency.dart';

class LaporanStokTab extends StatefulWidget {
  const LaporanStokTab({super.key});

  @override
  State<LaporanStokTab> createState() => _LaporanStokTabState();
}

class _LaporanStokTabState extends State<LaporanStokTab> {
  int? _kategoriId;
  List<Kategori> _kategoris = [];

  @override
  void initState() {
    super.initState();
    KategoriRepository().all().then((v) => setState(() => _kategoris = v));
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          child: Align(
            alignment: Alignment.centerLeft,
            child: DropdownButton<int?>(
              value: _kategoriId,
              hint: const Text('Semua kategori'),
              items: [
                const DropdownMenuItem(value: null, child: Text('Semua kategori')),
                for (final k in _kategoris) DropdownMenuItem(value: k.id, child: Text(k.nama)),
              ],
              onChanged: (v) => setState(() => _kategoriId = v),
            ),
          ),
        ),
        Expanded(
          child: FutureBuilder<List<Barang>>(
            future: BarangRepository().all(kategoriId: _kategoriId),
            builder: (context, snapshot) {
              if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());
              final list = snapshot.data!;
              if (list.isEmpty) return const Center(child: Text('Tidak ada data'));
              return ListView.separated(
                itemCount: list.length,
                separatorBuilder: (_, _) => const Divider(height: 1),
                itemBuilder: (context, index) {
                  final b = list[index];
                  return ListTile(
                    title: Text(b.nama),
                    subtitle: Text(b.barcode),
                    trailing: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text('${formatQty(b.stok)} ${b.sat}',
                            style: TextStyle(
                              color: b.isLowStock ? Colors.red : null,
                              fontWeight: b.isLowStock ? FontWeight.bold : null,
                            )),
                        if (b.isLowStock)
                          const Text('Stok menipis', style: TextStyle(color: Colors.red, fontSize: 11)),
                      ],
                    ),
                  );
                },
              );
            },
          ),
        ),
      ],
    );
  }
}

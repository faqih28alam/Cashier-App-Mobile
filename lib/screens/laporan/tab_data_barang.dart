import 'package:flutter/material.dart';

import '../../models/barang.dart';
import '../../models/kategori.dart';
import '../../repositories/barang_repository.dart';
import '../../repositories/kategori_repository.dart';
import '../../utils/currency.dart';

class LaporanDataBarangTab extends StatefulWidget {
  const LaporanDataBarangTab({super.key});

  @override
  State<LaporanDataBarangTab> createState() => _LaporanDataBarangTabState();
}

class _LaporanDataBarangTabState extends State<LaporanDataBarangTab> {
  int? _kategoriId;
  String _search = '';
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
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  decoration: const InputDecoration(labelText: 'Cari nama/barcode', isDense: true),
                  onChanged: (v) => setState(() => _search = v),
                ),
              ),
              const SizedBox(width: 8),
              DropdownButton<int?>(
                value: _kategoriId,
                hint: const Text('Kategori'),
                items: [
                  const DropdownMenuItem(value: null, child: Text('Semua')),
                  for (final k in _kategoris) DropdownMenuItem(value: k.id, child: Text(k.nama)),
                ],
                onChanged: (v) => setState(() => _kategoriId = v),
              ),
            ],
          ),
        ),
        Expanded(
          child: FutureBuilder<List<Barang>>(
            future: BarangRepository().all(search: _search, kategoriId: _kategoriId),
            builder: (context, snapshot) {
              if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());
              final list = snapshot.data!;
              if (list.isEmpty) return const Center(child: Text('Tidak ada data'));
              return SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: DataTable(
                  columns: const [
                    DataColumn(label: Text('Barcode')),
                    DataColumn(label: Text('Nama')),
                    DataColumn(label: Text('SAT')),
                    DataColumn(label: Text('HPP')),
                    DataColumn(label: Text('Harga 1')),
                    DataColumn(label: Text('Harga Tier Lain')),
                  ],
                  rows: [
                    for (final b in list)
                      DataRow(cells: [
                        DataCell(Text(b.barcode)),
                        DataCell(Text(b.nama)),
                        DataCell(Text(b.sat)),
                        DataCell(Text(formatRupiah(b.hpp))),
                        DataCell(Text(formatRupiah(b.harga1))),
                        DataCell(Text(b.hargaTiers
                            .map((t) => '>=${t.minQty}: ${formatRupiah(t.harga)}')
                            .join(', '))),
                      ]),
                  ],
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

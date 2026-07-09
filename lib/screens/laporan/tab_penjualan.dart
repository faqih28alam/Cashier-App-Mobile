import 'package:flutter/material.dart';

import '../../models/transaksi.dart';
import '../../models/user.dart';
import '../../repositories/transaksi_repository.dart';
import '../../repositories/user_repository.dart';
import '../../utils/currency.dart';
import '../../widgets/date_range_filter.dart';

class LaporanPenjualanTab extends StatefulWidget {
  const LaporanPenjualanTab({super.key});

  @override
  State<LaporanPenjualanTab> createState() => _LaporanPenjualanTabState();
}

class _LaporanPenjualanTabState extends State<LaporanPenjualanTab> {
  DateTimeRange? _range;
  int? _cashierId;
  List<AppUser> _users = [];

  @override
  void initState() {
    super.initState();
    UserRepository().all().then((v) => setState(() => _users = v));
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        DateRangeFilter(range: _range, onChanged: (r) => setState(() => _range = r)),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: Align(
            alignment: Alignment.centerLeft,
            child: DropdownButton<int?>(
              value: _cashierId,
              hint: const Text('Semua kasir'),
              items: [
                const DropdownMenuItem(value: null, child: Text('Semua kasir')),
                for (final u in _users) DropdownMenuItem(value: u.id, child: Text(u.nama)),
              ],
              onChanged: (v) => setState(() => _cashierId = v),
            ),
          ),
        ),
        Expanded(
          child: FutureBuilder<List<Transaksi>>(
            future: TransaksiRepository().history(from: _range?.start, to: _range?.end, idUser: _cashierId),
            builder: (context, snapshot) {
              if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());
              final list = snapshot.data!;
              final totalSales = list.fold<double>(0, (s, t) => s + t.total);
              final totalItems = list.fold<int>(0, (s, t) => s + t.items.length);
              return Column(
                children: [
                  Card(
                    margin: const EdgeInsets.all(12),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          Column(children: [const Text('Transaksi'), Text('${list.length}')]),
                          Column(children: [const Text('Item Terjual'), Text('$totalItems')]),
                          Column(children: [const Text('Total Penjualan'), Text(formatRupiah(totalSales))]),
                        ],
                      ),
                    ),
                  ),
                  Expanded(
                    child: list.isEmpty
                        ? const Center(child: Text('Tidak ada penjualan'))
                        : ListView.separated(
                            itemCount: list.length,
                            separatorBuilder: (_, _) => const Divider(height: 1),
                            itemBuilder: (context, index) {
                              final t = list[index];
                              return ListTile(
                                title: Text(t.noTransaksi),
                                subtitle: Text(formatDateTime(t.tanggal)),
                                trailing: Text(formatRupiah(t.total)),
                              );
                            },
                          ),
                  ),
                ],
              );
            },
          ),
        ),
      ],
    );
  }
}

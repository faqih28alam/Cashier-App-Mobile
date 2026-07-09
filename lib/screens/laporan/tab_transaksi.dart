import 'package:flutter/material.dart';

import '../../models/transaksi.dart';
import '../../models/user.dart';
import '../../repositories/transaksi_repository.dart';
import '../../repositories/user_repository.dart';
import '../../utils/currency.dart';
import '../../widgets/date_range_filter.dart';
import '../kasir/receipt_preview.dart';

class LaporanTransaksiTab extends StatefulWidget {
  const LaporanTransaksiTab({super.key});

  @override
  State<LaporanTransaksiTab> createState() => _LaporanTransaksiTabState();
}

class _LaporanTransaksiTabState extends State<LaporanTransaksiTab> {
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
              if (list.isEmpty) return const Center(child: Text('Tidak ada transaksi'));
              return ListView.builder(
                itemCount: list.length,
                itemBuilder: (context, index) {
                  final t = list[index];
                  return ExpansionTile(
                    title: Text(t.noTransaksi),
                    subtitle: Text('${formatDateTime(t.tanggal)} · ${formatRupiah(t.total)}'),
                    children: [
                      for (final item in t.items)
                        ListTile(
                          dense: true,
                          title: Text(item.namaBarang),
                          subtitle: Text('${formatQty(item.qty)} ${item.sat} x ${formatRupiah(item.harga)}'),
                          trailing: Text(formatRupiah(item.total)),
                        ),
                      ListTile(
                        dense: true,
                        title: const Text('Bayar / Kembalian'),
                        trailing: Text('${formatRupiah(t.bayar)} / ${formatRupiah(t.kembalian)}'),
                      ),
                      Padding(
                        padding: const EdgeInsets.only(bottom: 8, right: 8),
                        child: Align(
                          alignment: Alignment.centerRight,
                          child: TextButton.icon(
                            icon: const Icon(Icons.print_outlined),
                            label: const Text('Cetak Ulang'),
                            onPressed: () {
                              final matches = _users.where((u) => u.id == t.idUser);
                              final cashierName = matches.isEmpty ? '-' : matches.first.nama;
                              ReceiptPreview.show(
                                context,
                                transaksi: t,
                                cashierName: cashierName,
                              );
                            },
                          ),
                        ),
                      ),
                    ],
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

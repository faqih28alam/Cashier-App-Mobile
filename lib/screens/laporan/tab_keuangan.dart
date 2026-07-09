import 'package:flutter/material.dart';

import '../../models/keuangan.dart';
import '../../repositories/keuangan_repository.dart';
import '../../utils/currency.dart';
import '../../widgets/date_range_filter.dart';

class LaporanKeuanganTab extends StatefulWidget {
  const LaporanKeuanganTab({super.key});

  @override
  State<LaporanKeuanganTab> createState() => _LaporanKeuanganTabState();
}

class _LaporanKeuanganTabState extends State<LaporanKeuanganTab> {
  DateTimeRange? _range;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        DateRangeFilter(range: _range, onChanged: (r) => setState(() => _range = r)),
        Expanded(
          child: FutureBuilder<List<Keuangan>>(
            future: KeuanganRepository().list(from: _range?.start, to: _range?.end),
            builder: (context, snapshot) {
              if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());
              final list = snapshot.data!;
              final totalDebit = list.fold<double>(0, (s, e) => s + e.debit);
              final totalKredit = list.fold<double>(0, (s, e) => s + e.kredit);
              return Column(
                children: [
                  Card(
                    margin: const EdgeInsets.all(12),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          Column(children: [
                            const Text('Pemasukan'),
                            Text(formatRupiah(totalDebit), style: const TextStyle(color: Colors.green)),
                          ]),
                          Column(children: [
                            const Text('Pengeluaran'),
                            Text(formatRupiah(totalKredit), style: const TextStyle(color: Colors.red)),
                          ]),
                          Column(children: [
                            const Text('Selisih'),
                            Text(formatRupiah(totalDebit - totalKredit)),
                          ]),
                        ],
                      ),
                    ),
                  ),
                  Expanded(
                    child: list.isEmpty
                        ? const Center(child: Text('Tidak ada data'))
                        : ListView.separated(
                            itemCount: list.length,
                            separatorBuilder: (_, _) => const Divider(height: 1),
                            itemBuilder: (context, index) {
                              final e = list[index];
                              return ListTile(
                                title: Text(e.keterangan),
                                subtitle: Text(formatDateTime(e.tanggal)),
                                trailing: Text(
                                  e.debit > 0 ? '+${formatRupiah(e.debit)}' : '-${formatRupiah(e.kredit)}',
                                  style: TextStyle(color: e.debit > 0 ? Colors.green : Colors.red),
                                ),
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

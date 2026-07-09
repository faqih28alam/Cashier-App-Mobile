import 'package:flutter/material.dart';

import '../../db/app_database.dart';
import '../../models/keuangan.dart';
import '../../repositories/keuangan_repository.dart';
import '../../utils/currency.dart';
import '../../utils/error_reporting.dart';

class KeuanganScreen extends StatefulWidget {
  const KeuanganScreen({super.key});

  @override
  State<KeuanganScreen> createState() => _KeuanganScreenState();
}

class _KeuanganScreenState extends State<KeuanganScreen> {
  late Future<List<Keuangan>> _future;
  DateTime? _from;
  DateTime? _to;

  @override
  void initState() {
    super.initState();
    _reload();
  }

  void _reload() {
    _future = KeuanganRepository().list(from: _from, to: _to);
    setState(() {});
  }

  Future<void> _addManualEntry() async {
    final result = await showDialog<_ManualEntry>(
      context: context,
      builder: (_) => const _ManualEntryDialog(),
    );
    if (result == null) return;
    if (!mounted) return;
    // Manual expense/income entries go through the same posting helper as
    // auto-posted entries so the running saldo stays consistent.
    final ok = await runSafely(context, () async {
      final db = await AppDatabase.instance.database;
      await KeuanganRepository().postEntry(
        db,
        tanggal: DateTime.now(),
        keterangan: result.keterangan,
        debit: result.isIncome ? result.amount : 0,
        kredit: result.isIncome ? 0 : result.amount,
      );
    });
    if (ok) _reload();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      floatingActionButton: FloatingActionButton(
        onPressed: _addManualEntry,
        child: const Icon(Icons.add),
      ),
      body: Column(
        children: [
          FutureBuilder<List<Keuangan>>(
            future: _future,
            builder: (context, snapshot) {
              final saldo = snapshot.hasData && snapshot.data!.isNotEmpty ? snapshot.data!.last.saldo : 0.0;
              return Card(
                margin: const EdgeInsets.all(12),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      const Text('Saldo Kas Saat Ini'),
                      Text(formatRupiah(saldo), style: Theme.of(context).textTheme.headlineMedium),
                    ],
                  ),
                ),
              );
            },
          ),
          Expanded(
            child: FutureBuilder<List<Keuangan>>(
              future: _future,
              builder: (context, snapshot) {
                if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());
                final entries = snapshot.data!.reversed.toList();
                if (entries.isEmpty) return const Center(child: Text('Belum ada transaksi keuangan'));
                return ListView.separated(
                  itemCount: entries.length,
                  separatorBuilder: (_, _) => const Divider(height: 1),
                  itemBuilder: (context, index) {
                    final e = entries[index];
                    final isDebit = e.debit > 0;
                    return ListTile(
                      title: Text(e.keterangan),
                      subtitle: Text(formatDateTime(e.tanggal)),
                      trailing: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            isDebit ? '+${formatRupiah(e.debit)}' : '-${formatRupiah(e.kredit)}',
                            style: TextStyle(color: isDebit ? Colors.green : Colors.red),
                          ),
                          Text('Saldo: ${formatRupiah(e.saldo)}', style: const TextStyle(fontSize: 11)),
                        ],
                      ),
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

class _ManualEntry {
  final String keterangan;
  final double amount;
  final bool isIncome;
  _ManualEntry(this.keterangan, this.amount, this.isIncome);
}

class _ManualEntryDialog extends StatefulWidget {
  const _ManualEntryDialog();

  @override
  State<_ManualEntryDialog> createState() => _ManualEntryDialogState();
}

class _ManualEntryDialogState extends State<_ManualEntryDialog> {
  final _keteranganCtrl = TextEditingController();
  final _amountCtrl = TextEditingController();
  bool _isIncome = false;

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Catat Transaksi Manual'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          TextField(controller: _keteranganCtrl, decoration: const InputDecoration(labelText: 'Keterangan')),
          TextField(
            controller: _amountCtrl,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(labelText: 'Jumlah (Rp)'),
          ),
          Row(
            children: [
              const Text('Jenis:'),
              const SizedBox(width: 12),
              ChoiceChip(
                label: const Text('Pemasukan'),
                selected: _isIncome,
                onSelected: (v) => setState(() => _isIncome = true),
              ),
              const SizedBox(width: 8),
              ChoiceChip(
                label: const Text('Pengeluaran'),
                selected: !_isIncome,
                onSelected: (v) => setState(() => _isIncome = false),
              ),
            ],
          ),
        ],
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('Batal')),
        FilledButton(
          onPressed: () {
            final amount = double.tryParse(_amountCtrl.text) ?? 0;
            if (_keteranganCtrl.text.trim().isEmpty || amount <= 0) return;
            Navigator.pop(context, _ManualEntry(_keteranganCtrl.text.trim(), amount, _isIncome));
          },
          child: const Text('Simpan'),
        ),
      ],
    );
  }
}

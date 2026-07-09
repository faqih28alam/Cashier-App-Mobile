import 'package:flutter/material.dart';

import '../../utils/currency.dart';

const _denominations = [50000, 100000, 200000, 500000, 1000000];

/// Payment screen: quick denomination buttons, numeric pad for manual cash
/// entry, auto-computed kembalian, KONFIRMASI disabled while bayar < total.
class PaymentScreen extends StatefulWidget {
  final double total;
  const PaymentScreen({super.key, required this.total});

  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  String _buffer = '';

  double get _bayar => double.tryParse(_buffer) ?? 0;
  double get _kembalian => (_bayar - widget.total).clamp(0, double.infinity);
  bool get _canConfirm => _bayar >= widget.total;

  void _setExact() => setState(() => _buffer = widget.total.toStringAsFixed(0));

  void _addDenomination(int value) {
    setState(() => _buffer = ((double.tryParse(_buffer) ?? 0) + value).toStringAsFixed(0));
  }

  void _tapKey(String key) {
    setState(() {
      if (key == 'back') {
        _buffer = _buffer.isEmpty ? '' : _buffer.substring(0, _buffer.length - 1);
      } else {
        _buffer += key;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Pembayaran')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        children: [
                          const Text('Total Transaksi'),
                          Text(
                            formatRupiah(widget.total),
                            style: Theme.of(context).textTheme.headlineMedium,
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      for (final d in _denominations)
                        OutlinedButton(
                          onPressed: () => _addDenomination(d),
                          child: Text(d >= 1000000 ? '${d ~/ 1000000}JT' : '${d ~/ 1000}K'),
                        ),
                      FilledButton.tonal(onPressed: _setExact, child: const Text('BAYAR PAS')),
                    ],
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    readOnly: true,
                    controller: TextEditingController(text: _buffer),
                    decoration: const InputDecoration(labelText: 'Bayar', border: OutlineInputBorder()),
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
                  const SizedBox(height: 12),
                  Text('Kembalian: ${formatRupiah(_kembalian)}',
                      style: Theme.of(context).textTheme.titleLarge),
                  const Spacer(),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () => Navigator.of(context).pop<double?>(null),
                          child: const Text('Batal'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: FilledButton(
                          onPressed: _canConfirm ? () => Navigator.of(context).pop(_bayar) : null,
                          child: const Text('KONFIRMASI'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(width: 16),
            SizedBox(
              width: 220,
              child: GridView.count(
                crossAxisCount: 3,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                children: [
                  for (final key in ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', 'back'])
                    Padding(
                      padding: const EdgeInsets.all(4),
                      child: OutlinedButton(
                        onPressed: () => _tapKey(key),
                        child: key == 'back' ? const Icon(Icons.backspace_outlined) : Text(key),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

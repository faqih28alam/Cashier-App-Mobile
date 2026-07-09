import 'package:flutter/material.dart';

import '../../utils/currency.dart';

/// Numpad popup for editing a row's quantity, per the desktop spec: shows
/// product name + current qty/unit, a 1-9/0/00/backspace/confirm/cancel pad.
class NumpadPopup extends StatefulWidget {
  final String productName;
  final String unit;
  final double initialQty;

  const NumpadPopup({
    super.key,
    required this.productName,
    required this.unit,
    required this.initialQty,
  });

  static Future<double?> show(
    BuildContext context, {
    required String productName,
    required String unit,
    required double initialQty,
  }) {
    return showDialog<double>(
      context: context,
      builder: (_) => NumpadPopup(productName: productName, unit: unit, initialQty: initialQty),
    );
  }

  @override
  State<NumpadPopup> createState() => _NumpadPopupState();
}

class _NumpadPopupState extends State<NumpadPopup> {
  late String _buffer;

  @override
  void initState() {
    super.initState();
    _buffer = formatQty(widget.initialQty);
  }

  void _tap(String key) {
    setState(() {
      if (key == 'back') {
        _buffer = _buffer.isEmpty ? '' : _buffer.substring(0, _buffer.length - 1);
      } else {
        if (_buffer == '0') {
          _buffer = key == '00' ? '0' : key;
        } else {
          _buffer += key;
        }
      }
    });
  }

  void _confirm() {
    final qty = double.tryParse(_buffer);
    if (qty == null || qty <= 0) return;
    Navigator.of(context).pop(qty);
  }

  @override
  Widget build(BuildContext context) {
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', 'back'];
    return AlertDialog(
      title: Text(widget.productName),
      content: SizedBox(
        width: 280,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('${_buffer.isEmpty ? '0' : _buffer} ${widget.unit}',
                style: Theme.of(context).textTheme.headlineMedium),
            const SizedBox(height: 12),
            GridView.count(
              crossAxisCount: 3,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              children: [
                for (final key in keys)
                  Padding(
                    padding: const EdgeInsets.all(4),
                    child: OutlinedButton(
                      onPressed: () => _tap(key),
                      child: key == 'back' ? const Icon(Icons.backspace_outlined) : Text(key),
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.of(context).pop(), child: const Text('Batal')),
        FilledButton(onPressed: _confirm, child: const Text('OK')),
      ],
    );
  }
}

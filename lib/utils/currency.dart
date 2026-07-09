import 'package:intl/intl.dart';

final _rupiahFormat = NumberFormat.decimalPattern('id_ID');

String formatRupiah(num value) => _rupiahFormat.format(value);

String formatQty(num value) {
  if (value == value.roundToDouble()) return value.toInt().toString();
  return value.toString();
}

String formatDateTime(DateTime dt) {
  final d = dt.toLocal();
  final date = '${d.day.toString().padLeft(2, '0')}-${_month(d.month)}-${d.year}';
  final time = '${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')}';
  return '$date $time';
}

const _months = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
];

String _month(int m) => _months[m - 1];

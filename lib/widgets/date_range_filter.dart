import 'package:flutter/material.dart';

import '../utils/currency.dart';

class DateRangeFilter extends StatelessWidget {
  final DateTimeRange? range;
  final ValueChanged<DateTimeRange?> onChanged;

  const DateRangeFilter({super.key, required this.range, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      child: Row(
        children: [
          Expanded(
            child: OutlinedButton.icon(
              icon: const Icon(Icons.date_range),
              label: Text(
                range == null
                    ? 'Semua tanggal'
                    : '${formatDateTime(range!.start).split(' ').first} - ${formatDateTime(range!.end).split(' ').first}',
              ),
              onPressed: () async {
                final picked = await showDateRangePicker(
                  context: context,
                  firstDate: DateTime(2020),
                  lastDate: DateTime(2100),
                  initialDateRange: range,
                );
                onChanged(picked);
              },
            ),
          ),
          if (range != null)
            IconButton(icon: const Icon(Icons.clear), onPressed: () => onChanged(null)),
        ],
      ),
    );
  }
}

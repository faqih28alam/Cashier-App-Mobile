import 'package:sqflite/sqflite.dart';

import '../db/app_database.dart';
import '../models/keuangan.dart';

class KeuanganRepository {
  Future<double> _lastSaldo(DatabaseExecutor executor) async {
    final rows = await executor.query('keuangan', orderBy: 'id DESC', limit: 1);
    if (rows.isEmpty) return 0;
    return (rows.first['saldo'] as num).toDouble();
  }

  /// Posts a ledger entry within [executor] (a plain [Database] or an
  /// in-flight [Transaction]) and returns the resulting running saldo.
  Future<double> postEntry(
    DatabaseExecutor executor, {
    required DateTime tanggal,
    required String keterangan,
    double debit = 0,
    double kredit = 0,
  }) async {
    final last = await _lastSaldo(executor);
    final saldo = last + debit - kredit;
    await executor.insert('keuangan', {
      'tanggal': tanggal.toIso8601String(),
      'keterangan': keterangan,
      'debit': debit,
      'kredit': kredit,
      'saldo': saldo,
    });
    return saldo;
  }

  Future<List<Keuangan>> list({DateTime? from, DateTime? to}) async {
    final db = await AppDatabase.instance.database;
    final where = <String>[];
    final args = <Object?>[];
    if (from != null) {
      where.add('tanggal >= ?');
      args.add(from.toIso8601String());
    }
    if (to != null) {
      where.add('tanggal <= ?');
      args.add(to.toIso8601String());
    }
    final rows = await db.query(
      'keuangan',
      where: where.isEmpty ? null : where.join(' AND '),
      whereArgs: args,
      orderBy: 'id ASC',
    );
    return rows.map(Keuangan.fromMap).toList();
  }

  Future<double> currentSaldo() async {
    final db = await AppDatabase.instance.database;
    return _lastSaldo(db);
  }
}

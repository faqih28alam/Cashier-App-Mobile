import 'package:sqflite/sqflite.dart';

import '../db/app_database.dart';
import '../models/transaksi.dart';
import 'barang_repository.dart';
import 'keuangan_repository.dart';

class InsufficientStockException implements Exception {
  final String message;
  InsufficientStockException(this.message);
  @override
  String toString() => message;
}

class TransaksiRepository {
  final BarangRepository _barangRepo;
  final KeuanganRepository _keuanganRepo;

  TransaksiRepository({BarangRepository? barangRepo, KeuanganRepository? keuanganRepo})
      : _barangRepo = barangRepo ?? BarangRepository(),
        _keuanganRepo = keuanganRepo ?? KeuanganRepository();

  Future<String> _nextNoTransaksi(DatabaseExecutor executor, DateTime tanggal) async {
    final ymd =
        '${tanggal.year.toString().padLeft(4, '0')}${tanggal.month.toString().padLeft(2, '0')}${tanggal.day.toString().padLeft(2, '0')}';
    final rows = await executor.rawQuery(
      "SELECT COUNT(*) AS c FROM transaksi WHERE no_transaksi LIKE ?",
      ['TRX-$ymd-%'],
    );
    final count = (rows.first['c'] as int?) ?? 0;
    final seq = (count + 1).toString().padLeft(3, '0');
    return 'TRX-$ymd-$seq';
  }

  Future<void> _replaceDetails(DatabaseExecutor executor, int idTransaksi, List<TransaksiDetail> items) async {
    await executor.delete('transaksi_detail', where: 'id_transaksi = ?', whereArgs: [idTransaksi]);
    for (final item in items) {
      final map = item.toMap()
        ..remove('id')
        ..['id_transaksi'] = idTransaksi;
      await executor.insert('transaksi_detail', map);
    }
  }

  /// Held ("open") transaction — one per cashier session, no stock/finance
  /// impact until paid. If [transaksi.id] is null this creates the row and
  /// clears any other open transaksi already owned by that user.
  Future<Transaksi> saveHeld(Transaksi transaksi) async {
    final db = await AppDatabase.instance.database;
    return db.transaction((txn) async {
      final existingOpen = await txn.query(
        'transaksi',
        where: 'id_user = ? AND status = ? AND id != ?',
        whereArgs: [transaksi.idUser, 'open', transaksi.id ?? -1],
      );
      for (final row in existingOpen) {
        await txn.delete('transaksi', where: 'id = ?', whereArgs: [row['id']]);
      }

      int id;
      if (transaksi.id != null) {
        id = transaksi.id!;
        await txn.update('transaksi', transaksi.toMap(), where: 'id = ?', whereArgs: [id]);
      } else {
        id = await txn.insert('transaksi', transaksi.toMap()..remove('id'));
      }
      await _replaceDetails(txn, id, transaksi.items);
      return Transaksi(
        id: id,
        noTransaksi: transaksi.noTransaksi,
        tanggal: transaksi.tanggal,
        idUser: transaksi.idUser,
        total: transaksi.total,
        status: 'open',
        items: transaksi.items,
      );
    });
  }

  Future<Transaksi?> openTransaksiForUser(int idUser) async {
    final db = await AppDatabase.instance.database;
    final rows = await db.query(
      'transaksi',
      where: 'id_user = ? AND status = ?',
      whereArgs: [idUser, 'open'],
    );
    if (rows.isEmpty) return null;
    return getWithDetails(rows.first['id'] as int);
  }

  Future<void> discardHeld(int id) async {
    final db = await AppDatabase.instance.database;
    await db.delete('transaksi', where: 'id = ? AND status = ?', whereArgs: [id, 'open']);
  }

  /// Commit order (mirrors the desktop app): validate stock -> insert
  /// header+details -> decrement stock -> post keuangan debit -> commit.
  /// Printing happens after this returns and is handled by the caller so a
  /// printer failure can never roll back an already-committed sale.
  Future<Transaksi> confirmPayment({
    required Transaksi cart,
    required double bayar,
  }) async {
    if (cart.items.isEmpty) {
      throw StateError('Keranjang kosong');
    }
    final total = cart.items.fold<double>(0, (sum, i) => sum + i.total);
    if (bayar < total) {
      throw StateError('Bayar kurang dari total');
    }
    final db = await AppDatabase.instance.database;
    final tanggal = DateTime.now();

    return db.transaction((txn) async {
      for (final item in cart.items) {
        try {
          await _barangRepo.adjustStock(txn, item.barcode, -item.qty);
        } on StateError catch (e) {
          throw InsufficientStockException(e.message);
        }
      }

      int id;
      final noTransaksi = cart.noTransaksi.isNotEmpty
          ? cart.noTransaksi
          : await _nextNoTransaksi(txn, tanggal);
      final kembalian = bayar - total;
      final header = Transaksi(
        id: cart.id,
        noTransaksi: noTransaksi,
        tanggal: tanggal,
        idUser: cart.idUser,
        total: total,
        bayar: bayar,
        kembalian: kembalian,
        status: 'paid',
      );
      if (cart.id != null) {
        id = cart.id!;
        await txn.update('transaksi', header.toMap(), where: 'id = ?', whereArgs: [id]);
      } else {
        id = await txn.insert('transaksi', header.toMap()..remove('id'));
      }
      await _replaceDetails(txn, id, cart.items);

      await _keuanganRepo.postEntry(
        txn,
        tanggal: tanggal,
        keterangan: 'Penjualan $noTransaksi',
        debit: total,
      );

      return Transaksi(
        id: id,
        noTransaksi: noTransaksi,
        tanggal: tanggal,
        idUser: cart.idUser,
        total: total,
        bayar: bayar,
        kembalian: kembalian,
        status: 'paid',
        items: cart.items,
      );
    });
  }

  Future<Transaksi> getWithDetails(int id) async {
    final db = await AppDatabase.instance.database;
    final rows = await db.query('transaksi', where: 'id = ?', whereArgs: [id]);
    final detailRows = await db.query('transaksi_detail', where: 'id_transaksi = ?', whereArgs: [id]);
    return Transaksi.fromMap(rows.first, items: detailRows.map(TransaksiDetail.fromMap).toList());
  }

  Future<List<Transaksi>> history({DateTime? from, DateTime? to, int? idUser}) async {
    final db = await AppDatabase.instance.database;
    final where = <String>["status = 'paid'"];
    final args = <Object?>[];
    if (from != null) {
      where.add('tanggal >= ?');
      args.add(from.toIso8601String());
    }
    if (to != null) {
      where.add('tanggal <= ?');
      args.add(to.toIso8601String());
    }
    if (idUser != null) {
      where.add('id_user = ?');
      args.add(idUser);
    }
    final rows = await db.query(
      'transaksi',
      where: where.join(' AND '),
      whereArgs: args,
      orderBy: 'tanggal DESC',
    );
    final result = <Transaksi>[];
    for (final row in rows) {
      final details = await db.query('transaksi_detail', where: 'id_transaksi = ?', whereArgs: [row['id']]);
      result.add(Transaksi.fromMap(row, items: details.map(TransaksiDetail.fromMap).toList()));
    }
    return result;
  }
}

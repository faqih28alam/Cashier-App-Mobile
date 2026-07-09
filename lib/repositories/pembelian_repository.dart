import 'package:sqflite/sqflite.dart';

import '../db/app_database.dart';
import '../models/barang.dart';
import '../models/pembelian.dart';
import 'barang_repository.dart';
import 'keuangan_repository.dart';

class PembelianAlreadyConfirmedException implements Exception {
  final String message;
  PembelianAlreadyConfirmedException([this.message = 'Pembelian sudah dikonfirmasi']);
  @override
  String toString() => message;
}

class PembelianRepository {
  final BarangRepository _barangRepo;
  final KeuanganRepository _keuanganRepo;

  PembelianRepository({BarangRepository? barangRepo, KeuanganRepository? keuanganRepo})
      : _barangRepo = barangRepo ?? BarangRepository(),
        _keuanganRepo = keuanganRepo ?? KeuanganRepository();

  Future<void> _replaceDetails(DatabaseExecutor executor, int idPembelian, List<PembelianDetail> items) async {
    await executor.delete('pembelian_detail', where: 'id_pembelian = ?', whereArgs: [idPembelian]);
    for (final item in items) {
      final map = item.toMap()
        ..remove('id')
        ..['id_pembelian'] = idPembelian;
      await executor.insert('pembelian_detail', map);
    }
  }

  Future<List<Pembelian>> list({DateTime? from, DateTime? to, int? idSupplier}) async {
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
    if (idSupplier != null) {
      where.add('id_supplier = ?');
      args.add(idSupplier);
    }
    final rows = await db.query(
      'pembelian',
      where: where.isEmpty ? null : where.join(' AND '),
      whereArgs: args,
      orderBy: 'tanggal DESC',
    );
    final result = <Pembelian>[];
    for (final row in rows) {
      final details = await db.query('pembelian_detail', where: 'id_pembelian = ?', whereArgs: [row['id']]);
      result.add(Pembelian.fromMap(row, items: details.map(PembelianDetail.fromMap).toList()));
    }
    return result;
  }

  Future<Pembelian> getWithDetails(int id) async {
    final db = await AppDatabase.instance.database;
    final rows = await db.query('pembelian', where: 'id = ?', whereArgs: [id]);
    final details = await db.query('pembelian_detail', where: 'id_pembelian = ?', whereArgs: [id]);
    return Pembelian.fromMap(rows.first, items: details.map(PembelianDetail.fromMap).toList());
  }

  /// Creates a draft, or replaces header+detail of an existing draft.
  /// Rejects edits to an already-confirmed purchase.
  Future<Pembelian> saveDraft(Pembelian pembelian) async {
    final db = await AppDatabase.instance.database;
    return db.transaction((txn) async {
      int id;
      if (pembelian.id != null) {
        final existing = await txn.query('pembelian', where: 'id = ?', whereArgs: [pembelian.id]);
        if (existing.isNotEmpty && existing.first['status'] == 'confirmed') {
          throw PembelianAlreadyConfirmedException();
        }
        id = pembelian.id!;
        await txn.update('pembelian', pembelian.toMap(), where: 'id = ?', whereArgs: [id]);
      } else {
        id = await txn.insert('pembelian', pembelian.toMap()..remove('id')..['status'] = 'draft');
      }
      await _replaceDetails(txn, id, pembelian.items);
      return Pembelian(
        id: id,
        noFaktur: pembelian.noFaktur,
        tanggal: pembelian.tanggal,
        idSupplier: pembelian.idSupplier,
        total: pembelian.total,
        status: 'draft',
        items: pembelian.items,
      );
    });
  }

  Future<void> deleteDraft(int id) async {
    final db = await AppDatabase.instance.database;
    await db.delete('pembelian', where: 'id = ? AND status = ?', whereArgs: [id, 'draft']);
  }

  /// Confirms a draft purchase: increments stock per item (auto-creating the
  /// product from `harga_1` if the barcode is unknown), posts a kredit entry
  /// to Keuangan, and marks the purchase confirmed. Rejects if already
  /// confirmed.
  Future<Pembelian> confirm(int id) async {
    final db = await AppDatabase.instance.database;
    return db.transaction((txn) async {
      final rows = await txn.query('pembelian', where: 'id = ?', whereArgs: [id]);
      if (rows.isEmpty) {
        throw StateError('Pembelian tidak ditemukan');
      }
      if (rows.first['status'] == 'confirmed') {
        throw PembelianAlreadyConfirmedException();
      }
      final detailRows = await txn.query('pembelian_detail', where: 'id_pembelian = ?', whereArgs: [id]);
      final items = detailRows.map(PembelianDetail.fromMap).toList();

      for (final item in items) {
        final barangRows = await txn.query('barang', where: 'barcode = ?', whereArgs: [item.barcode]);
        if (barangRows.isEmpty) {
          await _barangRepo.insertNew(
            txn,
            Barang(
              barcode: item.barcode,
              nama: item.namaBarang,
              sat: item.sat,
              hpp: item.hpp,
              harga1: item.harga1,
              stok: item.qty,
            ),
          );
        } else {
          await _barangRepo.adjustStock(txn, item.barcode, item.qty);
        }
      }

      final pembelian = Pembelian.fromMap(rows.first, items: items);
      await txn.update('pembelian', {'status': 'confirmed'}, where: 'id = ?', whereArgs: [id]);
      await _keuanganRepo.postEntry(
        txn,
        tanggal: DateTime.now(),
        keterangan: 'Pembelian ${pembelian.noFaktur}',
        kredit: pembelian.total,
      );
      return Pembelian(
        id: id,
        noFaktur: pembelian.noFaktur,
        tanggal: pembelian.tanggal,
        idSupplier: pembelian.idSupplier,
        total: pembelian.total,
        status: 'confirmed',
        items: items,
      );
    });
  }
}

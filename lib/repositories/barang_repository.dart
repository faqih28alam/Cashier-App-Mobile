import 'package:sqflite/sqflite.dart';

import '../db/app_database.dart';
import '../models/barang.dart';
import '../models/barang_harga.dart';

class BarangRepository {
  Future<List<BarangHarga>> _tiersFor(String barcode, [Transaction? txn]) async {
    final executor = txn ?? await AppDatabase.instance.database;
    final rows = await executor.query(
      'barang_harga',
      where: 'barcode = ?',
      whereArgs: [barcode],
      orderBy: 'min_qty DESC',
    );
    return rows.map(BarangHarga.fromMap).toList();
  }

  Future<List<Barang>> all({String? search, int? kategoriId}) async {
    final db = await AppDatabase.instance.database;
    final where = <String>[];
    final args = <Object?>[];
    if (search != null && search.isNotEmpty) {
      where.add('(nama LIKE ? OR barcode LIKE ?)');
      args.addAll(['%$search%', '%$search%']);
    }
    if (kategoriId != null) {
      where.add('id_kategori = ?');
      args.add(kategoriId);
    }
    final rows = await db.query(
      'barang',
      where: where.isEmpty ? null : where.join(' AND '),
      whereArgs: args,
      orderBy: 'nama',
    );
    final result = <Barang>[];
    for (final row in rows) {
      final tiers = await _tiersFor(row['barcode'] as String);
      result.add(Barang.fromMap(row, tiers: tiers));
    }
    return result;
  }

  Future<Barang?> findByBarcode(String barcode) async {
    final db = await AppDatabase.instance.database;
    final rows = await db.query('barang', where: 'barcode = ?', whereArgs: [barcode]);
    if (rows.isEmpty) return null;
    final tiers = await _tiersFor(barcode);
    return Barang.fromMap(rows.first, tiers: tiers);
  }

  Future<List<Barang>> lowStock() async {
    final all_ = await all();
    return all_.where((b) => b.isLowStock).toList();
  }

  Future<void> upsert(Barang barang) async {
    final db = await AppDatabase.instance.database;
    await db.transaction((txn) async {
      await txn.insert('barang', barang.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);
      // Tiers are replaced wholesale on every save, matching the desktop app.
      await txn.delete('barang_harga', where: 'barcode = ?', whereArgs: [barang.barcode]);
      for (final tier in barang.hargaTiers) {
        await txn.insert('barang_harga', {
          'barcode': barang.barcode,
          'min_qty': tier.minQty,
          'harga': tier.harga,
        });
      }
    });
  }

  Future<void> delete(String barcode) async {
    final db = await AppDatabase.instance.database;
    await db.delete('barang', where: 'barcode = ?', whereArgs: [barcode]);
  }

  /// Adjusts stock by [delta] (positive to add, negative to remove) within
  /// an existing transaction. Throws [StateError] if it would go negative.
  Future<void> adjustStock(Transaction txn, String barcode, double delta) async {
    final rows = await txn.query('barang', where: 'barcode = ?', whereArgs: [barcode]);
    if (rows.isEmpty) {
      throw StateError('Produk $barcode tidak ditemukan');
    }
    final current = (rows.first['stok'] as num).toDouble();
    final next = current + delta;
    if (next < 0) {
      throw StateError('Stok ${rows.first['nama']} tidak mencukupi');
    }
    await txn.update('barang', {'stok': next}, where: 'barcode = ?', whereArgs: [barcode]);
  }

  Future<void> insertNew(Transaction txn, Barang barang) async {
    await txn.insert('barang', barang.toMap());
  }
}

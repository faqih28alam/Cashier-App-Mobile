import '../db/app_database.dart';
import '../models/supplier.dart';

class SupplierRepository {
  Future<List<Supplier>> all() async {
    final db = await AppDatabase.instance.database;
    final rows = await db.query('supplier', orderBy: 'nama');
    return rows.map(Supplier.fromMap).toList();
  }

  Future<Supplier?> findById(int id) async {
    final db = await AppDatabase.instance.database;
    final rows = await db.query('supplier', where: 'id = ?', whereArgs: [id]);
    if (rows.isEmpty) return null;
    return Supplier.fromMap(rows.first);
  }

  Future<int> insert(Supplier s) async {
    final db = await AppDatabase.instance.database;
    return db.insert('supplier', s.toMap()..remove('id'));
  }

  Future<void> update(Supplier s) async {
    final db = await AppDatabase.instance.database;
    await db.update('supplier', s.toMap(), where: 'id = ?', whereArgs: [s.id]);
  }

  Future<void> delete(int id) async {
    final db = await AppDatabase.instance.database;
    await db.delete('supplier', where: 'id = ?', whereArgs: [id]);
  }
}

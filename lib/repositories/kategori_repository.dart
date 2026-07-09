import '../db/app_database.dart';
import '../models/kategori.dart';

class KategoriRepository {
  Future<List<Kategori>> all() async {
    final db = await AppDatabase.instance.database;
    final rows = await db.query('kategori', orderBy: 'nama');
    return rows.map(Kategori.fromMap).toList();
  }

  Future<Kategori?> findById(int id) async {
    final db = await AppDatabase.instance.database;
    final rows = await db.query('kategori', where: 'id = ?', whereArgs: [id]);
    if (rows.isEmpty) return null;
    return Kategori.fromMap(rows.first);
  }

  Future<int> insert(Kategori k) async {
    final db = await AppDatabase.instance.database;
    return db.insert('kategori', k.toMap()..remove('id'));
  }

  Future<void> update(Kategori k) async {
    final db = await AppDatabase.instance.database;
    await db.update('kategori', k.toMap(), where: 'id = ?', whereArgs: [k.id]);
  }

  Future<void> delete(int id) async {
    final db = await AppDatabase.instance.database;
    await db.delete('kategori', where: 'id = ?', whereArgs: [id]);
  }
}

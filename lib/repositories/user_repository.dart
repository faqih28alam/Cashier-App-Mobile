import 'package:sqflite/sqflite.dart';

import '../db/app_database.dart';
import '../models/user.dart';

class UserRepository {
  Future<List<AppUser>> all() async {
    final db = await AppDatabase.instance.database;
    final rows = await db.query('user', orderBy: 'nama');
    return rows.map(AppUser.fromMap).toList();
  }

  Future<AppUser?> findByUsername(String username) async {
    final db = await AppDatabase.instance.database;
    final rows = await db.query('user', where: 'username = ?', whereArgs: [username]);
    if (rows.isEmpty) return null;
    return AppUser.fromMap(rows.first);
  }

  Future<AppUser?> findById(int id) async {
    final db = await AppDatabase.instance.database;
    final rows = await db.query('user', where: 'id = ?', whereArgs: [id]);
    if (rows.isEmpty) return null;
    return AppUser.fromMap(rows.first);
  }

  Future<int> countUsers() async {
    final db = await AppDatabase.instance.database;
    final rows = await db.rawQuery('SELECT COUNT(*) AS c FROM user');
    return Sqflite.firstIntValue(rows) ?? 0;
  }

  Future<int> insert(AppUser user) async {
    final db = await AppDatabase.instance.database;
    final map = user.toMap()..remove('id');
    return db.insert('user', map);
  }

  Future<void> update(AppUser user) async {
    final db = await AppDatabase.instance.database;
    await db.update('user', user.toMap(), where: 'id = ?', whereArgs: [user.id]);
  }

  Future<void> delete(int id) async {
    final db = await AppDatabase.instance.database;
    await db.delete('user', where: 'id = ?', whereArgs: [id]);
  }
}

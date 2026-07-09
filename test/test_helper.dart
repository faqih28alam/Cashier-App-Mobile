import 'dart:io';

import 'package:sqflite_common_ffi/sqflite_ffi.dart';

import 'package:kasir_mobile/db/app_database.dart';

/// Points the app's DB singleton at a fresh throwaway SQLite file backed by
/// the FFI implementation, so repository/service tests can run on the host
/// (no Android platform channel needed).
Future<String> setUpTestDatabase() async {
  sqfliteFfiInit();
  databaseFactory = databaseFactoryFfi;
  final path =
      '${Directory.systemTemp.path}/kasir_mobile_test_${DateTime.now().microsecondsSinceEpoch}.db';
  AppDatabase.instance.resetForTest(path);
  await AppDatabase.instance.database; // creates the schema
  return path;
}

Future<void> tearDownTestDatabase(String path) async {
  final db = await AppDatabase.instance.database;
  await db.close();
  final file = File(path);
  if (file.existsSync()) file.deleteSync();
}

import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';

import 'package:kasir_mobile/db/app_database.dart';
import 'package:kasir_mobile/models/barang.dart';
import 'package:kasir_mobile/repositories/barang_repository.dart';
import 'package:kasir_mobile/services/backup_service.dart';

import 'test_helper.dart';

void main() {
  late String dbPath;

  setUp(() async {
    dbPath = await setUpTestDatabase();
  });

  tearDown(() async {
    await tearDownTestDatabase(dbPath);
  });

  test('applyRestore rejects a file that is not a real SQLite database', () async {
    final garbage = Uint8List.fromList(utf8.encode('not a real backup file'));
    expect(
      () => BackupService('http://example.invalid').applyRestore(garbage),
      throwsA(isA<BackupServiceException>()),
    );
  });

  test('a valid snapshot round-trips through applyRestore and replaces local data', () async {
    await BarangRepository().upsert(Barang(
      barcode: 'A1', nama: 'Sebelum Restore', sat: 'PCS', hpp: 1000, harga1: 2000, stok: 1,
    ));

    final snapshot = Uint8List.fromList(await AppDatabase.instance.snapshotBytes());

    // Mutate local data after the snapshot was taken.
    await BarangRepository().upsert(Barang(
      barcode: 'A2', nama: 'Sesudah Snapshot', sat: 'PCS', hpp: 1000, harga1: 2000, stok: 1,
    ));
    expect(await BarangRepository().findByBarcode('A2'), isNotNull);

    await BackupService('http://example.invalid').applyRestore(snapshot);

    // Restore brings back exactly the state at snapshot time.
    expect(await BarangRepository().findByBarcode('A1'), isNotNull);
    expect(await BarangRepository().findByBarcode('A2'), isNull);
  });
}

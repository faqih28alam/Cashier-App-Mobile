import 'dart:async';
import 'dart:io';

import 'package:path/path.dart';
import 'package:path_provider/path_provider.dart';
import 'package:sqflite/sqflite.dart';

/// Owns the single on-device SQLite connection. Exposed as a singleton so
/// restore (services/backup_service.dart) can close, swap the file, and
/// reopen it without restarting the app process.
class AppDatabase {
  AppDatabase._();
  static final AppDatabase instance = AppDatabase._();

  Database? _db;
  String? _dbPath;
  String? _testPathOverride;

  Future<Database> get database async {
    if (_db != null) return _db!;
    _db = await _open();
    return _db!;
  }

  /// Test-only seam: points this singleton at a throwaway file instead of
  /// the real app documents directory (which needs a platform channel that
  /// plain `flutter test` doesn't provide). Also drops any cached state so
  /// each test starts from a clean, freshly-created schema.
  void resetForTest(String path) {
    _db = null;
    _dbPath = null;
    _testPathOverride = path;
  }

  Future<String> get dbPath async {
    if (_dbPath != null) return _dbPath!;
    if (_testPathOverride != null) {
      _dbPath = _testPathOverride;
      return _dbPath!;
    }
    final dir = await getApplicationDocumentsDirectory();
    _dbPath = join(dir.path, 'kasir_mobile.db');
    return _dbPath!;
  }

  Future<Database> _open() async {
    final path = await dbPath;
    return openDatabase(
      path,
      version: 1,
      onConfigure: (db) async => db.execute('PRAGMA foreign_keys = ON'),
      onCreate: (db, version) async {
        await db.execute('''
          CREATE TABLE user (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            password_salt TEXT NOT NULL,
            nama TEXT NOT NULL,
            role TEXT NOT NULL,
            active INTEGER NOT NULL DEFAULT 1
          )
        ''');
        await db.execute('''
          CREATE TABLE kategori (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            kode TEXT NOT NULL UNIQUE,
            nama TEXT NOT NULL
          )
        ''');
        await db.execute('''
          CREATE TABLE supplier (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            kode TEXT NOT NULL UNIQUE,
            nama TEXT NOT NULL,
            alamat TEXT DEFAULT '',
            telepon TEXT DEFAULT '',
            kontak TEXT DEFAULT ''
          )
        ''');
        await db.execute('''
          CREATE TABLE barang (
            barcode TEXT PRIMARY KEY,
            nama TEXT NOT NULL,
            id_kategori INTEGER,
            sat TEXT NOT NULL,
            hpp REAL NOT NULL DEFAULT 0,
            harga_1 REAL NOT NULL DEFAULT 0,
            stok REAL NOT NULL DEFAULT 0,
            stok_minimum REAL NOT NULL DEFAULT 0,
            FOREIGN KEY (id_kategori) REFERENCES kategori (id)
          )
        ''');
        await db.execute('''
          CREATE TABLE barang_harga (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            barcode TEXT NOT NULL,
            min_qty INTEGER NOT NULL,
            harga REAL NOT NULL,
            FOREIGN KEY (barcode) REFERENCES barang (barcode) ON DELETE CASCADE
          )
        ''');
        await db.execute('''
          CREATE TABLE transaksi (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            no_transaksi TEXT NOT NULL UNIQUE,
            tanggal TEXT NOT NULL,
            id_user INTEGER NOT NULL,
            total REAL NOT NULL DEFAULT 0,
            bayar REAL NOT NULL DEFAULT 0,
            kembalian REAL NOT NULL DEFAULT 0,
            status TEXT NOT NULL DEFAULT 'open',
            FOREIGN KEY (id_user) REFERENCES user (id)
          )
        ''');
        await db.execute('''
          CREATE TABLE transaksi_detail (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            id_transaksi INTEGER NOT NULL,
            barcode TEXT NOT NULL,
            nama_barang TEXT NOT NULL,
            sat TEXT NOT NULL,
            qty REAL NOT NULL,
            hpp REAL NOT NULL,
            harga REAL NOT NULL,
            diskon REAL NOT NULL DEFAULT 0,
            total REAL NOT NULL,
            keterangan TEXT DEFAULT '',
            FOREIGN KEY (id_transaksi) REFERENCES transaksi (id) ON DELETE CASCADE
          )
        ''');
        await db.execute('''
          CREATE TABLE pembelian (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            no_faktur TEXT NOT NULL,
            tanggal TEXT NOT NULL,
            id_supplier INTEGER NOT NULL,
            total REAL NOT NULL DEFAULT 0,
            status TEXT NOT NULL DEFAULT 'draft',
            FOREIGN KEY (id_supplier) REFERENCES supplier (id)
          )
        ''');
        await db.execute('''
          CREATE TABLE pembelian_detail (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            id_pembelian INTEGER NOT NULL,
            barcode TEXT NOT NULL,
            nama_barang TEXT NOT NULL,
            sat TEXT NOT NULL,
            qty REAL NOT NULL,
            hpp REAL NOT NULL,
            harga_1 REAL NOT NULL,
            total REAL NOT NULL,
            FOREIGN KEY (id_pembelian) REFERENCES pembelian (id) ON DELETE CASCADE
          )
        ''');
        await db.execute('''
          CREATE TABLE keuangan (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tanggal TEXT NOT NULL,
            keterangan TEXT NOT NULL,
            debit REAL NOT NULL DEFAULT 0,
            kredit REAL NOT NULL DEFAULT 0,
            saldo REAL NOT NULL DEFAULT 0
          )
        ''');
        await db.execute('''
          CREATE TABLE setting (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            nama_toko TEXT DEFAULT '',
            alamat TEXT DEFAULT '',
            telepon TEXT DEFAULT '',
            logo_path TEXT,
            printer_mac_address TEXT,
            printer_name TEXT,
            printer_width_mm INTEGER DEFAULT 58,
            receipt_footer TEXT DEFAULT 'Terima Kasih!',
            tax_rate REAL DEFAULT 0,
            backup_base_url TEXT DEFAULT '',
            backup_client_id TEXT,
            backup_token TEXT,
            last_backup_at TEXT
          )
        ''');
        await db.insert('setting', {'id': 1});
      },
    );
  }

  /// Closes the current connection, replaces the DB file with [bytes], then
  /// reopens it. Used by the restore flow — no manual app restart needed.
  Future<void> replaceWithBytes(List<int> bytes) async {
    final path = await dbPath;
    if (_db != null) {
      await _db!.close();
      _db = null;
    }
    final file = File(path);
    await file.writeAsBytes(bytes, flush: true);
    _db = await _open();
  }

  /// A consistent point-in-time copy of the DB file, safe to call while the
  /// app holds an open connection (SQLite's backup API, mirroring the
  /// desktop's `snapshot_db_bytes`).
  Future<List<int>> snapshotBytes() async {
    final db = await database;
    // Reuse the DB file's own directory rather than path_provider's temp
    // dir — avoids an extra platform channel call and works transparently
    // under the test path override too.
    final dir = dirname(await dbPath);
    final tmpPath = join(dir, 'backup_snapshot_${DateTime.now().microsecondsSinceEpoch}.db');
    await db.rawQuery('VACUUM INTO ?', [tmpPath]);
    final file = File(tmpPath);
    final bytes = await file.readAsBytes();
    await file.delete();
    return bytes;
  }
}

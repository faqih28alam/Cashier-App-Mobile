import 'package:flutter_test/flutter_test.dart';

import 'package:kasir_mobile/models/barang.dart';
import 'package:kasir_mobile/models/pembelian.dart';
import 'package:kasir_mobile/models/supplier.dart';
import 'package:kasir_mobile/repositories/barang_repository.dart';
import 'package:kasir_mobile/repositories/keuangan_repository.dart';
import 'package:kasir_mobile/repositories/pembelian_repository.dart';
import 'package:kasir_mobile/repositories/supplier_repository.dart';

import 'test_helper.dart';

void main() {
  late String dbPath;
  late int supplierId;

  setUp(() async {
    dbPath = await setUpTestDatabase();
    supplierId = await SupplierRepository().insert(Supplier(kode: 'SUP1', nama: 'Grosir Jaya'));
  });

  tearDown(() async {
    await tearDownTestDatabase(dbPath);
  });

  test('confirming a purchase auto-creates an unknown product and increments its stock', () async {
    final draft = await PembelianRepository().saveDraft(Pembelian(
      noFaktur: 'INV-001',
      tanggal: DateTime.now(),
      idSupplier: supplierId,
      total: 40000,
      items: [
        PembelianDetail(
          barcode: '999',
          namaBarang: 'Produk Baru',
          sat: 'PCS',
          qty: 10,
          hpp: 4000,
          harga1: 5000,
          total: 40000,
        ),
      ],
    ));

    await PembelianRepository().confirm(draft.id!);

    final barang = await BarangRepository().findByBarcode('999');
    expect(barang, isNotNull);
    expect(barang!.stok, 10);
    expect(barang.harga1, 5000);

    final ledger = await KeuanganRepository().list();
    expect(ledger, hasLength(1));
    expect(ledger.first.kredit, 40000);
  });

  test('confirming a purchase for an existing product increments its stock', () async {
    await BarangRepository().upsert(Barang(
      barcode: '111', nama: 'Ada', sat: 'PCS', hpp: 1000, harga1: 1500, stok: 5,
    ));
    final draft = await PembelianRepository().saveDraft(Pembelian(
      noFaktur: 'INV-002',
      tanggal: DateTime.now(),
      idSupplier: supplierId,
      total: 10000,
      items: [
        PembelianDetail(barcode: '111', namaBarang: 'Ada', sat: 'PCS', qty: 10, hpp: 1000, harga1: 1500, total: 10000),
      ],
    ));

    await PembelianRepository().confirm(draft.id!);

    final barang = await BarangRepository().findByBarcode('111');
    expect(barang!.stok, 15); // 5 + 10
  });

  test('confirming an already-confirmed purchase is rejected', () async {
    final draft = await PembelianRepository().saveDraft(Pembelian(
      noFaktur: 'INV-003',
      tanggal: DateTime.now(),
      idSupplier: supplierId,
      total: 5000,
      items: [
        PembelianDetail(barcode: '222', namaBarang: 'X', sat: 'PCS', qty: 1, hpp: 4000, harga1: 5000, total: 5000),
      ],
    ));
    await PembelianRepository().confirm(draft.id!);

    expect(
      () => PembelianRepository().confirm(draft.id!),
      throwsA(isA<PembelianAlreadyConfirmedException>()),
    );
  });

  test('editing an already-confirmed purchase is rejected', () async {
    final draft = await PembelianRepository().saveDraft(Pembelian(
      noFaktur: 'INV-004',
      tanggal: DateTime.now(),
      idSupplier: supplierId,
      total: 5000,
      items: [
        PembelianDetail(barcode: '333', namaBarang: 'Y', sat: 'PCS', qty: 1, hpp: 4000, harga1: 5000, total: 5000),
      ],
    ));
    await PembelianRepository().confirm(draft.id!);

    expect(
      () => PembelianRepository().saveDraft(Pembelian(
        id: draft.id,
        noFaktur: 'INV-004-EDITED',
        tanggal: DateTime.now(),
        idSupplier: supplierId,
        total: 5000,
        items: draft.items,
      )),
      throwsA(isA<PembelianAlreadyConfirmedException>()),
    );
  });
}

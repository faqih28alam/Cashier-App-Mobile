import 'package:flutter_test/flutter_test.dart';

import 'package:kasir_mobile/models/barang.dart';
import 'package:kasir_mobile/models/transaksi.dart';
import 'package:kasir_mobile/models/user.dart';
import 'package:kasir_mobile/repositories/barang_repository.dart';
import 'package:kasir_mobile/repositories/keuangan_repository.dart';
import 'package:kasir_mobile/repositories/transaksi_repository.dart';
import 'package:kasir_mobile/repositories/user_repository.dart';
import 'package:kasir_mobile/services/auth_service.dart';

import 'test_helper.dart';

void main() {
  late String dbPath;
  late int userId;

  setUp(() async {
    dbPath = await setUpTestDatabase();
    await BarangRepository().upsert(Barang(
      barcode: '111',
      nama: 'Indomie Goreng',
      sat: 'PCS',
      hpp: 2500,
      harga1: 3000,
      stok: 10,
    ));
    userId = await UserRepository().insert(AppUser(
      username: 'kasir1',
      passwordHash: AuthService.hash('password', 'salt'),
      passwordSalt: 'salt',
      nama: 'Kasir Satu',
      role: 'kasir',
    ));
  });

  tearDown(() async {
    await tearDownTestDatabase(dbPath);
  });

  Transaksi cart(List<TransaksiDetail> items) => Transaksi(
        noTransaksi: '',
        tanggal: DateTime.now(),
        idUser: userId,
        total: items.fold(0, (s, i) => s + i.total),
        items: items,
      );

  TransaksiDetail line({double qty = 1}) => TransaksiDetail(
        barcode: '111',
        namaBarang: 'Indomie Goreng',
        sat: 'PCS',
        qty: qty,
        hpp: 2500,
        harga: 3000,
        total: qty * 3000,
      );

  test('confirmPayment decrements stock and posts a debit to keuangan', () async {
    final paid = await TransaksiRepository().confirmPayment(cart: cart([line(qty: 3)]), bayar: 10000);

    expect(paid.status, 'paid');
    expect(paid.kembalian, 10000 - 9000);
    expect(paid.noTransaksi, startsWith('TRX-'));

    final barang = await BarangRepository().findByBarcode('111');
    expect(barang!.stok, 7); // 10 - 3

    final ledger = await KeuanganRepository().list();
    expect(ledger, hasLength(1));
    expect(ledger.first.debit, 9000);
    expect(ledger.first.saldo, 9000);
  });

  test('confirmPayment rejects bayar < total', () async {
    expect(
      () => TransaksiRepository().confirmPayment(cart: cart([line(qty: 1)]), bayar: 1000),
      throwsA(isA<StateError>()),
    );
  });

  test('confirmPayment rejects a sale that would take stock negative', () async {
    expect(
      () => TransaksiRepository().confirmPayment(cart: cart([line(qty: 999)]), bayar: 999 * 3000),
      throwsA(isA<InsufficientStockException>()),
    );
    // Stock must be untouched by the rejected sale.
    final barang = await BarangRepository().findByBarcode('111');
    expect(barang!.stok, 10);
  });

  test('held transaction round-trips and is scoped one-per-user', () async {
    final repo = TransaksiRepository();
    final held = await repo.saveHeld(Transaksi(
      noTransaksi: '',
      tanggal: DateTime.now(),
      idUser: userId,
      total: 3000,
      status: 'open',
      items: [line()],
    ));

    final reloaded = await repo.openTransaksiForUser(userId);
    expect(reloaded, isNotNull);
    expect(reloaded!.items, hasLength(1));

    // Saving a second held transaction for the same user replaces the first.
    final second = await repo.saveHeld(Transaksi(
      noTransaksi: '',
      tanggal: DateTime.now(),
      idUser: userId,
      total: 6000,
      status: 'open',
      items: [line(qty: 2)],
    ));
    expect(second.id, isNot(held.id));
    final onlyOpen = await repo.openTransaksiForUser(userId);
    expect(onlyOpen!.id, second.id);
  });
}

import 'package:flutter_test/flutter_test.dart';

import 'package:kasir_mobile/models/barang.dart';
import 'package:kasir_mobile/models/barang_harga.dart';
import 'package:kasir_mobile/services/pricing_service.dart';

Barang _barang({List<BarangHarga> tiers = const []}) => Barang(
      barcode: '123',
      nama: 'Rokok',
      sat: 'PCS',
      hpp: 15000,
      harga1: 19000,
      stok: 100,
      hargaTiers: tiers,
    );

void main() {
  group('resolvePrice', () {
    test('falls back to harga1 with no tiers', () {
      expect(resolvePrice(_barang(), 1), 19000);
    });

    test('picks the highest matching tier by min_qty', () {
      final barang = _barang(tiers: [
        BarangHarga(barcode: '123', minQty: 5, harga: 18000),
        BarangHarga(barcode: '123', minQty: 10, harga: 17000),
      ]);
      expect(resolvePrice(barang, 1), 19000);
      expect(resolvePrice(barang, 5), 18000);
      expect(resolvePrice(barang, 9), 18000);
      expect(resolvePrice(barang, 10), 17000);
      expect(resolvePrice(barang, 100), 17000);
    });

    test('tier order in the list does not matter', () {
      final barang = _barang(tiers: [
        BarangHarga(barcode: '123', minQty: 10, harga: 17000),
        BarangHarga(barcode: '123', minQty: 5, harga: 18000),
      ]);
      expect(resolvePrice(barang, 7), 18000);
    });
  });

  group('buildCartLine', () {
    test('computes total as qty * harga - diskon at the resolved tier price', () {
      final barang = _barang(tiers: [BarangHarga(barcode: '123', minQty: 5, harga: 18000)]);
      final line = buildCartLine(barang, qty: 5, diskon: 1000);
      expect(line.harga, 18000);
      expect(line.total, 5 * 18000 - 1000);
    });
  });
}

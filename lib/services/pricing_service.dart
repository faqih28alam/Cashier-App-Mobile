import '../models/barang.dart';
import '../models/transaksi.dart';

/// Mirrors the desktop app's `resolve_price(barang, qty)`: tiers are sorted
/// by min_qty descending, and the first tier where qty >= min_qty wins,
/// falling back to harga_1 if no tier matches.
double resolvePrice(Barang barang, double qty) {
  final tiers = [...barang.hargaTiers]..sort((a, b) => b.minQty.compareTo(a.minQty));
  for (final tier in tiers) {
    if (qty >= tier.minQty) return tier.harga;
  }
  return barang.harga1;
}

/// Builds/recalculates a transaction cart line for [barang] at [qty],
/// re-resolving the tiered price automatically.
TransaksiDetail buildCartLine(
  Barang barang, {
  required double qty,
  double diskon = 0,
  String keterangan = '',
}) {
  final harga = resolvePrice(barang, qty);
  final total = (qty * harga) - diskon;
  return TransaksiDetail(
    barcode: barang.barcode,
    namaBarang: barang.nama,
    sat: barang.sat,
    qty: qty,
    hpp: barang.hpp,
    harga: harga,
    diskon: diskon,
    total: total,
    keterangan: keterangan,
  );
}

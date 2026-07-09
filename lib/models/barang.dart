import 'barang_harga.dart';

class Barang {
  final String barcode;
  final String nama;
  final int? idKategori;
  final String sat;
  final double hpp;
  final double harga1;
  final double stok;
  final double stokMinimum;
  final List<BarangHarga> hargaTiers;

  Barang({
    required this.barcode,
    required this.nama,
    this.idKategori,
    required this.sat,
    required this.hpp,
    required this.harga1,
    required this.stok,
    this.stokMinimum = 0,
    this.hargaTiers = const [],
  });

  bool get isLowStock => stok <= stokMinimum;

  factory Barang.fromMap(Map<String, Object?> map, {List<BarangHarga> tiers = const []}) =>
      Barang(
        barcode: map['barcode'] as String,
        nama: map['nama'] as String,
        idKategori: map['id_kategori'] as int?,
        sat: map['sat'] as String,
        hpp: (map['hpp'] as num).toDouble(),
        harga1: (map['harga_1'] as num).toDouble(),
        stok: (map['stok'] as num).toDouble(),
        stokMinimum: (map['stok_minimum'] as num?)?.toDouble() ?? 0,
        hargaTiers: tiers,
      );

  Map<String, Object?> toMap() => {
        'barcode': barcode,
        'nama': nama,
        'id_kategori': idKategori,
        'sat': sat,
        'hpp': hpp,
        'harga_1': harga1,
        'stok': stok,
        'stok_minimum': stokMinimum,
      };

  Barang copyWith({
    String? nama,
    int? idKategori,
    String? sat,
    double? hpp,
    double? harga1,
    double? stok,
    double? stokMinimum,
    List<BarangHarga>? hargaTiers,
  }) =>
      Barang(
        barcode: barcode,
        nama: nama ?? this.nama,
        idKategori: idKategori ?? this.idKategori,
        sat: sat ?? this.sat,
        hpp: hpp ?? this.hpp,
        harga1: harga1 ?? this.harga1,
        stok: stok ?? this.stok,
        stokMinimum: stokMinimum ?? this.stokMinimum,
        hargaTiers: hargaTiers ?? this.hargaTiers,
      );
}

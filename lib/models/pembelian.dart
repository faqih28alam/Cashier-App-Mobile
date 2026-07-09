class PembelianDetail {
  final int? id;
  final int? idPembelian;
  final String barcode;
  final String namaBarang;
  final String sat;
  final double qty;
  final double hpp;
  final double harga1;
  final double total;

  PembelianDetail({
    this.id,
    this.idPembelian,
    required this.barcode,
    required this.namaBarang,
    required this.sat,
    required this.qty,
    required this.hpp,
    required this.harga1,
    required this.total,
  });

  factory PembelianDetail.fromMap(Map<String, Object?> map) => PembelianDetail(
        id: map['id'] as int?,
        idPembelian: map['id_pembelian'] as int?,
        barcode: map['barcode'] as String,
        namaBarang: map['nama_barang'] as String,
        sat: map['sat'] as String,
        qty: (map['qty'] as num).toDouble(),
        hpp: (map['hpp'] as num).toDouble(),
        harga1: (map['harga_1'] as num).toDouble(),
        total: (map['total'] as num).toDouble(),
      );

  Map<String, Object?> toMap() => {
        if (id != null) 'id': id,
        if (idPembelian != null) 'id_pembelian': idPembelian,
        'barcode': barcode,
        'nama_barang': namaBarang,
        'sat': sat,
        'qty': qty,
        'hpp': hpp,
        'harga_1': harga1,
        'total': total,
      };
}

class Pembelian {
  final int? id;
  final String noFaktur;
  final DateTime tanggal;
  final int idSupplier;
  final double total;
  final String status; // draft | confirmed
  final List<PembelianDetail> items;

  Pembelian({
    this.id,
    required this.noFaktur,
    required this.tanggal,
    required this.idSupplier,
    required this.total,
    this.status = 'draft',
    this.items = const [],
  });

  factory Pembelian.fromMap(Map<String, Object?> map, {List<PembelianDetail> items = const []}) =>
      Pembelian(
        id: map['id'] as int?,
        noFaktur: map['no_faktur'] as String,
        tanggal: DateTime.parse(map['tanggal'] as String),
        idSupplier: map['id_supplier'] as int,
        total: (map['total'] as num).toDouble(),
        status: map['status'] as String,
        items: items,
      );

  Map<String, Object?> toMap() => {
        if (id != null) 'id': id,
        'no_faktur': noFaktur,
        'tanggal': tanggal.toIso8601String(),
        'id_supplier': idSupplier,
        'total': total,
        'status': status,
      };
}

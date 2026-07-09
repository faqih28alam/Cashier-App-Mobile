class TransaksiDetail {
  final int? id;
  final int? idTransaksi;
  final String barcode;
  final String namaBarang;
  final String sat;
  final double qty;
  final double hpp;
  final double harga;
  final double diskon;
  final double total;
  final String keterangan;

  TransaksiDetail({
    this.id,
    this.idTransaksi,
    required this.barcode,
    required this.namaBarang,
    required this.sat,
    required this.qty,
    required this.hpp,
    required this.harga,
    this.diskon = 0,
    required this.total,
    this.keterangan = '',
  });

  factory TransaksiDetail.fromMap(Map<String, Object?> map) => TransaksiDetail(
        id: map['id'] as int?,
        idTransaksi: map['id_transaksi'] as int?,
        barcode: map['barcode'] as String,
        namaBarang: map['nama_barang'] as String,
        sat: map['sat'] as String,
        qty: (map['qty'] as num).toDouble(),
        hpp: (map['hpp'] as num).toDouble(),
        harga: (map['harga'] as num).toDouble(),
        diskon: (map['diskon'] as num?)?.toDouble() ?? 0,
        total: (map['total'] as num).toDouble(),
        keterangan: map['keterangan'] as String? ?? '',
      );

  Map<String, Object?> toMap() => {
        if (id != null) 'id': id,
        if (idTransaksi != null) 'id_transaksi': idTransaksi,
        'barcode': barcode,
        'nama_barang': namaBarang,
        'sat': sat,
        'qty': qty,
        'hpp': hpp,
        'harga': harga,
        'diskon': diskon,
        'total': total,
        'keterangan': keterangan,
      };

  TransaksiDetail copyWith({double? qty, double? harga, double? diskon, double? total}) =>
      TransaksiDetail(
        id: id,
        idTransaksi: idTransaksi,
        barcode: barcode,
        namaBarang: namaBarang,
        sat: sat,
        qty: qty ?? this.qty,
        hpp: hpp,
        harga: harga ?? this.harga,
        diskon: diskon ?? this.diskon,
        total: total ?? this.total,
        keterangan: keterangan,
      );
}

class Transaksi {
  final int? id;
  final String noTransaksi;
  final DateTime tanggal;
  final int idUser;
  final double total;
  final double bayar;
  final double kembalian;
  final String status; // open | paid | cancelled
  final List<TransaksiDetail> items;

  Transaksi({
    this.id,
    required this.noTransaksi,
    required this.tanggal,
    required this.idUser,
    required this.total,
    this.bayar = 0,
    this.kembalian = 0,
    this.status = 'open',
    this.items = const [],
  });

  factory Transaksi.fromMap(Map<String, Object?> map, {List<TransaksiDetail> items = const []}) =>
      Transaksi(
        id: map['id'] as int?,
        noTransaksi: map['no_transaksi'] as String,
        tanggal: DateTime.parse(map['tanggal'] as String),
        idUser: map['id_user'] as int,
        total: (map['total'] as num).toDouble(),
        bayar: (map['bayar'] as num?)?.toDouble() ?? 0,
        kembalian: (map['kembalian'] as num?)?.toDouble() ?? 0,
        status: map['status'] as String,
        items: items,
      );

  Map<String, Object?> toMap() => {
        if (id != null) 'id': id,
        'no_transaksi': noTransaksi,
        'tanggal': tanggal.toIso8601String(),
        'id_user': idUser,
        'total': total,
        'bayar': bayar,
        'kembalian': kembalian,
        'status': status,
      };
}

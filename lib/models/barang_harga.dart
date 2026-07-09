class BarangHarga {
  final int? id;
  final String barcode;
  final int minQty;
  final double harga;

  BarangHarga({
    this.id,
    required this.barcode,
    required this.minQty,
    required this.harga,
  });

  factory BarangHarga.fromMap(Map<String, Object?> map) => BarangHarga(
        id: map['id'] as int?,
        barcode: map['barcode'] as String,
        minQty: map['min_qty'] as int,
        harga: (map['harga'] as num).toDouble(),
      );

  Map<String, Object?> toMap() => {
        if (id != null) 'id': id,
        'barcode': barcode,
        'min_qty': minQty,
        'harga': harga,
      };
}

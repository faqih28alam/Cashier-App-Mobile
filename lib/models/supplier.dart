class Supplier {
  final int? id;
  final String kode;
  final String nama;
  final String alamat;
  final String telepon;
  final String kontak;

  Supplier({
    this.id,
    required this.kode,
    required this.nama,
    this.alamat = '',
    this.telepon = '',
    this.kontak = '',
  });

  factory Supplier.fromMap(Map<String, Object?> map) => Supplier(
        id: map['id'] as int?,
        kode: map['kode'] as String,
        nama: map['nama'] as String,
        alamat: map['alamat'] as String? ?? '',
        telepon: map['telepon'] as String? ?? '',
        kontak: map['kontak'] as String? ?? '',
      );

  Map<String, Object?> toMap() => {
        if (id != null) 'id': id,
        'kode': kode,
        'nama': nama,
        'alamat': alamat,
        'telepon': telepon,
        'kontak': kontak,
      };
}

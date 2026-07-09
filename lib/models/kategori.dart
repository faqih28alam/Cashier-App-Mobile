class Kategori {
  final int? id;
  final String kode;
  final String nama;

  Kategori({this.id, required this.kode, required this.nama});

  factory Kategori.fromMap(Map<String, Object?> map) => Kategori(
        id: map['id'] as int?,
        kode: map['kode'] as String,
        nama: map['nama'] as String,
      );

  Map<String, Object?> toMap() => {
        if (id != null) 'id': id,
        'kode': kode,
        'nama': nama,
      };
}

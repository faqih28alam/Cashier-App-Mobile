class Keuangan {
  final int? id;
  final DateTime tanggal;
  final String keterangan;
  final double debit;
  final double kredit;
  final double saldo;

  Keuangan({
    this.id,
    required this.tanggal,
    required this.keterangan,
    this.debit = 0,
    this.kredit = 0,
    required this.saldo,
  });

  factory Keuangan.fromMap(Map<String, Object?> map) => Keuangan(
        id: map['id'] as int?,
        tanggal: DateTime.parse(map['tanggal'] as String),
        keterangan: map['keterangan'] as String,
        debit: (map['debit'] as num?)?.toDouble() ?? 0,
        kredit: (map['kredit'] as num?)?.toDouble() ?? 0,
        saldo: (map['saldo'] as num).toDouble(),
      );

  Map<String, Object?> toMap() => {
        if (id != null) 'id': id,
        'tanggal': tanggal.toIso8601String(),
        'keterangan': keterangan,
        'debit': debit,
        'kredit': kredit,
        'saldo': saldo,
      };
}

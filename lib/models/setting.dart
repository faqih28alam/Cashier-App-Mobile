class AppSetting {
  final String namaToko;
  final String alamat;
  final String telepon;
  final String? logoPath;
  final String? printerMacAddress;
  final String? printerName;
  final int printerWidthMm; // 58 or 80
  final String receiptFooter;
  final double taxRate;
  final String backupBaseUrl;
  final String? backupClientId;
  final String? backupToken;
  final DateTime? lastBackupAt;

  AppSetting({
    this.namaToko = '',
    this.alamat = '',
    this.telepon = '',
    this.logoPath,
    this.printerMacAddress,
    this.printerName,
    this.printerWidthMm = 58,
    this.receiptFooter = 'Terima Kasih!',
    this.taxRate = 0,
    this.backupBaseUrl = '',
    this.backupClientId,
    this.backupToken,
    this.lastBackupAt,
  });

  bool get backupConnected => backupToken != null && backupToken!.isNotEmpty;

  factory AppSetting.fromMap(Map<String, Object?> map) => AppSetting(
        namaToko: map['nama_toko'] as String? ?? '',
        alamat: map['alamat'] as String? ?? '',
        telepon: map['telepon'] as String? ?? '',
        logoPath: map['logo_path'] as String?,
        printerMacAddress: map['printer_mac_address'] as String?,
        printerName: map['printer_name'] as String?,
        printerWidthMm: map['printer_width_mm'] as int? ?? 58,
        receiptFooter: map['receipt_footer'] as String? ?? 'Terima Kasih!',
        taxRate: (map['tax_rate'] as num?)?.toDouble() ?? 0,
        backupBaseUrl: map['backup_base_url'] as String? ?? '',
        backupClientId: map['backup_client_id'] as String?,
        backupToken: map['backup_token'] as String?,
        lastBackupAt: map['last_backup_at'] == null
            ? null
            : DateTime.parse(map['last_backup_at'] as String),
      );

  Map<String, Object?> toMap() => {
        'id': 1,
        'nama_toko': namaToko,
        'alamat': alamat,
        'telepon': telepon,
        'logo_path': logoPath,
        'printer_mac_address': printerMacAddress,
        'printer_name': printerName,
        'printer_width_mm': printerWidthMm,
        'receipt_footer': receiptFooter,
        'tax_rate': taxRate,
        'backup_base_url': backupBaseUrl,
        'backup_client_id': backupClientId,
        'backup_token': backupToken,
        'last_backup_at': lastBackupAt?.toIso8601String(),
      };

  AppSetting copyWith({
    String? namaToko,
    String? alamat,
    String? telepon,
    String? logoPath,
    String? printerMacAddress,
    String? printerName,
    int? printerWidthMm,
    String? receiptFooter,
    double? taxRate,
    String? backupBaseUrl,
    Object? backupClientId = _sentinel,
    Object? backupToken = _sentinel,
    Object? lastBackupAt = _sentinel,
  }) =>
      AppSetting(
        namaToko: namaToko ?? this.namaToko,
        alamat: alamat ?? this.alamat,
        telepon: telepon ?? this.telepon,
        logoPath: logoPath ?? this.logoPath,
        printerMacAddress: printerMacAddress ?? this.printerMacAddress,
        printerName: printerName ?? this.printerName,
        printerWidthMm: printerWidthMm ?? this.printerWidthMm,
        receiptFooter: receiptFooter ?? this.receiptFooter,
        taxRate: taxRate ?? this.taxRate,
        backupBaseUrl: backupBaseUrl ?? this.backupBaseUrl,
        backupClientId:
            identical(backupClientId, _sentinel) ? this.backupClientId : backupClientId as String?,
        backupToken: identical(backupToken, _sentinel) ? this.backupToken : backupToken as String?,
        lastBackupAt:
            identical(lastBackupAt, _sentinel) ? this.lastBackupAt : lastBackupAt as DateTime?,
      );
}

const _sentinel = Object();

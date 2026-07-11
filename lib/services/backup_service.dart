import 'dart:convert';
import 'dart:typed_data';

import 'package:http/http.dart' as http;

import '../db/app_database.dart';

class BackupServiceException implements Exception {
  final String message;
  BackupServiceException(this.message);
  @override
  String toString() => message;
}

class BackupFileInfo {
  final String filename;
  final int size;
  final String createdAt;
  BackupFileInfo({
    required this.filename,
    required this.size,
    required this.createdAt,
  });

  factory BackupFileInfo.fromJson(Map<String, dynamic> json) => BackupFileInfo(
    filename: json['filename'] as String,
    size: json['size'] as int,
    createdAt: json['created_at'] as String,
  );
}

/// Client for the existing external backup service (already deployed,
/// independent of any per-client backend). Same API contract as the desktop
/// app's `backend/services/backup_client.py`: client_id/password login,
/// multipart upload, list, download, restore.
class BackupService {
  final String baseUrl;
  BackupService(this.baseUrl);

  Uri _uri(String path) => Uri.parse('$baseUrl$path');

  String _detail(http.Response res, String fallback) {
    try {
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      return body['detail'] as String? ?? fallback;
    } catch (_) {
      return fallback;
    }
  }

  static const _unreachableMessage =
      'Tidak bisa menghubungi layanan backup. Periksa koneksi internet dan coba lagi nanti.';

  /// Runs an HTTP call and rethrows any network-level failure (no internet,
  /// unreachable host, timeout) as a clear, user-facing message instead of
  /// letting the raw SocketException/ClientException text through.
  Future<T> _guarded<T>(Future<T> Function() call) async {
    try {
      return await call();
    } on BackupServiceException {
      rethrow;
    } catch (_) {
      throw BackupServiceException(_unreachableMessage);
    }
  }

  Future<String> login(String clientId, String password) async {
    final res = await _guarded(
      () => http.post(
        _uri('/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'client_id': clientId, 'password': password}),
      ),
    );
    if (res.statusCode != 200) {
      throw BackupServiceException(_detail(res, 'Login gagal'));
    }
    return (jsonDecode(res.body) as Map<String, dynamic>)['access_token']
        as String;
  }

  Future<void> changePassword(
    String token,
    String oldPassword,
    String newPassword,
  ) async {
    final res = await _guarded(
      () => http.post(
        _uri('/auth/change-password'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'old_password': oldPassword,
          'new_password': newPassword,
        }),
      ),
    );
    if (res.statusCode != 200) {
      throw BackupServiceException(_detail(res, 'Gagal mengubah password'));
    }
  }

  Future<BackupFileInfo> uploadBackup(String token) async {
    final bytes = await AppDatabase.instance.snapshotBytes();
    final res = await _guarded(() async {
      final request = http.MultipartRequest('POST', _uri('/backup'))
        ..headers['Authorization'] = 'Bearer $token'
        ..files.add(
          http.MultipartFile.fromBytes(
            'file',
            bytes,
            filename: 'kasir_mobile.db',
          ),
        );
      final streamed = await request.send();
      return http.Response.fromStream(streamed);
    });
    if (res.statusCode != 200) {
      throw BackupServiceException(_detail(res, 'Backup gagal'));
    }
    return BackupFileInfo.fromJson(
      jsonDecode(res.body) as Map<String, dynamic>,
    );
  }

  Future<List<BackupFileInfo>> listBackups(String token) async {
    final res = await _guarded(
      () => http.get(
        _uri('/backups'),
        headers: {'Authorization': 'Bearer $token'},
      ),
    );
    if (res.statusCode != 200) {
      throw BackupServiceException(
        _detail(res, 'Gagal mengambil daftar backup'),
      );
    }
    return (jsonDecode(res.body) as List)
        .map((e) => BackupFileInfo.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<Uint8List> downloadBackup(String token, String filename) async {
    final res = await _guarded(
      () => http.get(
        _uri('/backup/$filename'),
        headers: {'Authorization': 'Bearer $token'},
      ),
    );
    if (res.statusCode != 200) {
      throw BackupServiceException(_detail(res, 'Backup tidak ditemukan'));
    }
    return res.bodyBytes;
  }

  static const _sqliteMagic = [
    0x53, 0x51, 0x4c, 0x69, 0x74, 0x65, // 'SQLite'
    0x20, 0x66, 0x6f, 0x72, 0x6d, 0x61, 0x74, 0x20, 0x33, 0x00, // ' format 3\0'
  ];

  /// Validates the file is a real SQLite database, then closes the local DB
  /// connection, replaces the file, and reopens it — no manual app restart
  /// required (unlike the desktop flow, since this is a single process).
  Future<void> applyRestore(Uint8List content) async {
    if (content.length < _sqliteMagic.length ||
        !_sqliteMagic.asMap().entries.every((e) => content[e.key] == e.value)) {
      throw BackupServiceException('File backup tidak valid');
    }
    await AppDatabase.instance.replaceWithBytes(content);
  }
}

import '../repositories/setting_repository.dart';
import 'backup_service.dart';

/// "Automatic" backup for a device with no OS-level job scheduler wired up:
/// on every app foreground/open, if a backup connection exists and the last
/// successful backup was more than a day ago (or never happened), silently
/// run one in the background. Failures (e.g. no internet) are swallowed —
/// this must never block or interrupt normal app usage.
class BackupScheduler {
  final SettingRepository _settingRepo;
  BackupScheduler({SettingRepository? settingRepo}) : _settingRepo = settingRepo ?? SettingRepository();

  Future<void> runIfDue() async {
    final setting = await _settingRepo.get();
    if (!setting.backupConnected || setting.backupBaseUrl.isEmpty) return;
    final last = setting.lastBackupAt;
    if (last != null && DateTime.now().difference(last) < const Duration(hours: 24)) {
      return;
    }
    try {
      final service = BackupService(setting.backupBaseUrl);
      await service.uploadBackup(setting.backupToken!);
      await _settingRepo.save(setting.copyWith(lastBackupAt: DateTime.now()));
    } catch (_) {
      // Non-fatal: retried next time the app is opened or a manual backup is run.
    }
  }
}

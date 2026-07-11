import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:provider/provider.dart';

import '../../models/setting.dart';
import '../../repositories/setting_repository.dart';
import '../../services/backup_service.dart';
import '../../services/printer_service.dart';
import '../../services/session_state.dart';
import '../../utils/error_reporting.dart';
import '../login_screen.dart';

class SettingScreen extends StatefulWidget {
  const SettingScreen({super.key});

  @override
  State<SettingScreen> createState() => _SettingScreenState();
}

class _SettingScreenState extends State<SettingScreen> {
  final _repo = SettingRepository();
  AppSetting? _setting;

  final _namaTokoCtrl = TextEditingController();
  final _alamatCtrl = TextEditingController();
  final _teleponCtrl = TextEditingController();
  final _footerCtrl = TextEditingController();
  final _taxCtrl = TextEditingController();
  final _backupUrlCtrl = TextEditingController();

  List<PrinterDevice> _pairedPrinters = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final s = await _repo.get();
    setState(() {
      _setting = s;
      _namaTokoCtrl.text = s.namaToko;
      _alamatCtrl.text = s.alamat;
      _teleponCtrl.text = s.telepon;
      _footerCtrl.text = s.receiptFooter;
      _taxCtrl.text = s.taxRate == 0 ? '' : s.taxRate.toString();
      _backupUrlCtrl.text = s.backupBaseUrl;
    });
    try {
      await [Permission.bluetoothConnect, Permission.bluetoothScan].request();
      _pairedPrinters = await PrinterService().pairedDevices();
      if (mounted) setState(() {});
    } catch (_) {
      // Bluetooth unavailable/disabled/permission denied — printer list
      // stays empty; the dropdown below just shows nothing to pick from.
    }
  }

  Future<void> _saveGeneral() async {
    final s = _setting!.copyWith(
      namaToko: _namaTokoCtrl.text.trim(),
      alamat: _alamatCtrl.text.trim(),
      telepon: _teleponCtrl.text.trim(),
      receiptFooter: _footerCtrl.text.trim(),
      taxRate: double.tryParse(_taxCtrl.text) ?? 0,
      backupBaseUrl: _backupUrlCtrl.text.trim(),
    );
    final ok = await runSafely(context, () => _repo.save(s));
    if (!ok) return;
    setState(() => _setting = s);
    if (mounted) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Pengaturan disimpan')));
    }
  }

  Future<void> _pickLogo() async {
    final picked = await ImagePicker().pickImage(source: ImageSource.gallery);
    if (picked == null || !mounted) return;
    final dir = await getApplicationDocumentsDirectory();
    if (!mounted) return;
    final destPath = p.join(dir.path, 'store_logo${p.extension(picked.path)}');
    final ok = await runSafely(context, () async {
      await File(picked.path).copy(destPath);
      await _repo.save(_setting!.copyWith(logoPath: destPath));
    });
    if (ok) setState(() => _setting = _setting!.copyWith(logoPath: destPath));
  }

  Future<void> _setPrinter(PrinterDevice? device) async {
    if (device == null) return;
    final s = _setting!.copyWith(
      printerMacAddress: device.macAddress,
      printerName: device.name,
    );
    final ok = await runSafely(context, () => _repo.save(s));
    if (ok) setState(() => _setting = s);
  }

  Future<void> _setPrinterWidth(int width) async {
    final s = _setting!.copyWith(printerWidthMm: width);
    final ok = await runSafely(context, () => _repo.save(s));
    if (ok) setState(() => _setting = s);
  }

  Future<void> _backupLogin() async {
    final clientIdCtrl = TextEditingController();
    final passwordCtrl = TextEditingController();
    final result = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Masuk Layanan Backup'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: clientIdCtrl,
              decoration: const InputDecoration(labelText: 'Client ID'),
            ),
            TextField(
              controller: passwordCtrl,
              obscureText: true,
              decoration: const InputDecoration(labelText: 'Password'),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Batal'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Masuk'),
          ),
        ],
      ),
    );
    if (result != true || !mounted) return;
    if (_setting!.backupBaseUrl.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Isi dan simpan URL layanan backup terlebih dahulu'),
        ),
      );
      return;
    }
    try {
      final service = BackupService(_setting!.backupBaseUrl);
      final token = await service.login(
        clientIdCtrl.text.trim(),
        passwordCtrl.text,
      );
      final s = _setting!.copyWith(
        backupClientId: clientIdCtrl.text.trim(),
        backupToken: token,
      );
      await _repo.save(s);
      setState(() => _setting = s);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('$e')));
      }
    }
  }

  Future<void> _backupLogout() async {
    final s = _setting!.copyWith(backupClientId: null, backupToken: null);
    final ok = await runSafely(context, () => _repo.save(s));
    if (ok) setState(() => _setting = s);
  }

  Future<void> _backupNow() async {
    try {
      final service = BackupService(_setting!.backupBaseUrl);
      await service.uploadBackup(_setting!.backupToken!);
      final s = _setting!.copyWith(lastBackupAt: DateTime.now());
      await _repo.save(s);
      setState(() => _setting = s);
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Backup berhasil')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Backup gagal: $e')));
      }
    }
  }

  Future<void> _showBackupList() async {
    try {
      final service = BackupService(_setting!.backupBaseUrl);
      final backups = await service.listBackups(_setting!.backupToken!);
      if (!mounted) return;
      // Restoring overwrites the whole local database, so — same as the
      // desktop app's owner-only /restore endpoint — only Owner gets the
      // restore action here; Admin can still view the backup list.
      final isOwner = context.read<SessionState>().isOwner;
      await showDialog(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Daftar Backup'),
          content: SizedBox(
            width: 320,
            height: 400,
            child: backups.isEmpty
                ? const Center(child: Text('Belum ada backup'))
                : ListView.builder(
                    itemCount: backups.length,
                    itemBuilder: (context, index) {
                      final b = backups[index];
                      return ListTile(
                        title: Text(b.filename),
                        subtitle: Text(
                          '${b.createdAt} · ${(b.size / 1024).toStringAsFixed(1)} KB',
                        ),
                        trailing: isOwner
                            ? IconButton(
                                icon: const Icon(Icons.restore),
                                tooltip: 'Restore',
                                onPressed: () => _restore(b.filename),
                              )
                            : null,
                      );
                    },
                  ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Tutup'),
            ),
          ],
        ),
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('$e')));
      }
    }
  }

  Future<void> _restore(String filename) async {
    if (!context.read<SessionState>().isOwner) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Hanya Owner yang bisa melakukan restore'),
        ),
      );
      return;
    }
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Restore Backup'),
        content: Text(
          'Data saat ini di perangkat akan diganti dengan "$filename". Lanjutkan?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Batal'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Restore'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    Navigator.of(context).pop(); // close the backup list dialog
    try {
      final service = BackupService(_setting!.backupBaseUrl);
      final bytes = await service.downloadBackup(
        _setting!.backupToken!,
        filename,
      );
      await service.applyRestore(bytes);
      if (!mounted) return;
      // Restored data may not include the current session's user anymore —
      // log out and let every screen re-query the (now different) database
      // fresh from the login screen onward.
      context.read<SessionState>().logout();
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const LoginScreen()),
        (route) => false,
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Restore gagal: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final setting = _setting;
    if (setting == null) {
      return const Center(child: CircularProgressIndicator());
    }
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text(
          'Informasi Toko',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            if (setting.logoPath != null &&
                File(setting.logoPath!).existsSync())
              CircleAvatar(
                radius: 28,
                backgroundImage: FileImage(File(setting.logoPath!)),
              )
            else
              const CircleAvatar(radius: 28, child: Icon(Icons.storefront)),
            const SizedBox(width: 12),
            OutlinedButton(
              onPressed: _pickLogo,
              child: const Text('Pilih Logo'),
            ),
          ],
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _namaTokoCtrl,
          decoration: const InputDecoration(labelText: 'Nama Toko'),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: _alamatCtrl,
          decoration: const InputDecoration(labelText: 'Alamat'),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: _teleponCtrl,
          decoration: const InputDecoration(labelText: 'Telepon'),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: _footerCtrl,
          decoration: const InputDecoration(labelText: 'Footer Struk'),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: _taxCtrl,
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(labelText: 'Pajak (%)'),
        ),
        const SizedBox(height: 24),
        const Text('Printer', style: TextStyle(fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        DropdownButtonFormField<String>(
          initialValue: setting.printerMacAddress,
          decoration: const InputDecoration(
            labelText: 'Printer Bluetooth Terpasang',
          ),
          items: [
            for (final p in _pairedPrinters)
              DropdownMenuItem(value: p.macAddress, child: Text(p.name)),
          ],
          onChanged: (mac) {
            final device = _pairedPrinters.firstWhere(
              (p) => p.macAddress == mac,
            );
            _setPrinter(device);
          },
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            const Text('Lebar Kertas:'),
            const SizedBox(width: 12),
            ChoiceChip(
              label: const Text('58mm'),
              selected: setting.printerWidthMm == 58,
              onSelected: (_) => _setPrinterWidth(58),
            ),
            const SizedBox(width: 8),
            ChoiceChip(
              label: const Text('80mm'),
              selected: setting.printerWidthMm == 80,
              onSelected: (_) => _setPrinterWidth(80),
            ),
          ],
        ),
        const SizedBox(height: 24),
        const Text(
          'Layanan Backup',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: _backupUrlCtrl,
          decoration: const InputDecoration(labelText: 'URL Layanan Backup'),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Icon(
              setting.backupConnected ? Icons.check_circle : Icons.cancel,
              color: setting.backupConnected ? Colors.green : Colors.red,
              size: 18,
            ),
            const SizedBox(width: 6),
            Text(
              setting.backupConnected
                  ? 'Terhubung (${setting.backupClientId})'
                  : 'Belum terhubung',
            ),
          ],
        ),
        if (setting.lastBackupAt != null)
          Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Text(
              'Backup terakhir: ${setting.lastBackupAt}',
              style: const TextStyle(fontSize: 12),
            ),
          ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          children: [
            if (!setting.backupConnected)
              FilledButton(onPressed: _backupLogin, child: const Text('Masuk'))
            else ...[
              FilledButton(
                onPressed: _backupNow,
                child: const Text('Backup Now'),
              ),
              OutlinedButton(
                onPressed: _showBackupList,
                child: const Text('Lihat Daftar Backup'),
              ),
              TextButton(onPressed: _backupLogout, child: const Text('Keluar')),
            ],
          ],
        ),
        const SizedBox(height: 24),
        FilledButton(
          onPressed: _saveGeneral,
          child: const Text('Simpan Pengaturan'),
        ),
      ],
    );
  }
}

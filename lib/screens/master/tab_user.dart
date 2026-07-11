import 'package:flutter/material.dart';

import '../../models/user.dart';
import '../../repositories/user_repository.dart';
import '../../services/auth_service.dart';
import '../../utils/error_reporting.dart';

const _roles = ['kasir', 'admin', 'owner'];

class MasterUserTab extends StatefulWidget {
  const MasterUserTab({super.key});

  @override
  State<MasterUserTab> createState() => _MasterUserTabState();
}

class _MasterUserTabState extends State<MasterUserTab> {
  late Future<List<AppUser>> _future;

  @override
  void initState() {
    super.initState();
    _reload();
  }

  void _reload() {
    _future = UserRepository().all();
    setState(() {});
  }

  Future<void> _edit({AppUser? existing}) async {
    final result = await showDialog<_UserFormResult>(
      context: context,
      builder: (_) => _UserFormDialog(existing: existing),
    );
    if (result == null) return;
    if (!mounted) return;
    final auth = AuthService();
    final ok = await runSafely(context, () async {
      if (existing == null) {
        await auth.createUser(
          username: result.username,
          password: result.password!,
          nama: result.nama,
          role: result.role,
          active: result.active,
        );
      } else {
        var updated = existing.copyWith(
          username: result.username,
          nama: result.nama,
          role: result.role,
          active: result.active,
        );
        await UserRepository().update(updated);
        if (result.password != null && result.password!.isNotEmpty) {
          await auth.changePassword(updated, result.password!);
        }
      }
    });
    if (ok) _reload();
  }

  Future<void> _delete(AppUser u) async {
    final ok = await runSafely(context, () => UserRepository().delete(u.id!));
    if (ok) _reload();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      floatingActionButton: FloatingActionButton(onPressed: () => _edit(), child: const Icon(Icons.add)),
      body: FutureBuilder<List<AppUser>>(
        future: _future,
        builder: (context, snapshot) {
          if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());
          final list = snapshot.data!;
          return ListView.separated(
            itemCount: list.length,
            separatorBuilder: (_, _) => const Divider(height: 1),
            itemBuilder: (context, index) {
              final u = list[index];
              return ListTile(
                title: Text(u.nama),
                subtitle: Text('${u.username} · ${u.role}${u.active ? '' : ' · nonaktif'}'),
                trailing: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    IconButton(icon: const Icon(Icons.edit), onPressed: () => _edit(existing: u)),
                    IconButton(icon: const Icon(Icons.delete_outline), onPressed: () => _delete(u)),
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }
}

class _UserFormResult {
  final String username;
  final String? password;
  final String nama;
  final String role;
  final bool active;
  _UserFormResult(this.username, this.password, this.nama, this.role, this.active);
}

class _UserFormDialog extends StatefulWidget {
  final AppUser? existing;
  const _UserFormDialog({this.existing});

  @override
  State<_UserFormDialog> createState() => _UserFormDialogState();
}

class _UserFormDialogState extends State<_UserFormDialog> {
  late final TextEditingController _usernameCtrl;
  late final TextEditingController _namaCtrl;
  final _passwordCtrl = TextEditingController();
  late String _role;
  late bool _active;

  @override
  void initState() {
    super.initState();
    _usernameCtrl = TextEditingController(text: widget.existing?.username ?? '');
    _namaCtrl = TextEditingController(text: widget.existing?.nama ?? '');
    _role = widget.existing?.role ?? 'kasir';
    _active = widget.existing?.active ?? true;
  }

  @override
  Widget build(BuildContext context) {
    final isEdit = widget.existing != null;
    return AlertDialog(
      title: Text(isEdit ? 'Edit Pengguna' : 'Pengguna Baru'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: _namaCtrl, decoration: const InputDecoration(labelText: 'Nama')),
            TextField(controller: _usernameCtrl, decoration: const InputDecoration(labelText: 'Username')),
            TextField(
              controller: _passwordCtrl,
              obscureText: true,
              decoration: InputDecoration(labelText: isEdit ? 'Password Baru (opsional)' : 'Password'),
            ),
            DropdownButtonFormField<String>(
              initialValue: _role,
              decoration: const InputDecoration(labelText: 'Role'),
              items: [for (final r in _roles) DropdownMenuItem(value: r, child: Text(r))],
              onChanged: (v) => setState(() => _role = v!),
            ),
            SwitchListTile(
              title: const Text('Aktif'),
              value: _active,
              onChanged: (v) => setState(() => _active = v),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('Batal')),
        FilledButton(
          onPressed: () {
            if (_namaCtrl.text.trim().isEmpty || _usernameCtrl.text.trim().isEmpty) return;
            if (!isEdit && _passwordCtrl.text.length < 4) return;
            Navigator.pop(
              context,
              _UserFormResult(
                _usernameCtrl.text.trim(),
                _passwordCtrl.text.isEmpty ? null : _passwordCtrl.text,
                _namaCtrl.text.trim(),
                _role,
                _active,
              ),
            );
          },
          child: const Text('Simpan'),
        ),
      ],
    );
  }
}

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../services/session_state.dart';
import 'kasir/session_screen.dart';
import 'keuangan/keuangan_screen.dart';
import 'laporan/laporan_home_screen.dart';
import 'login_screen.dart';
import 'master/master_home_screen.dart';
import 'purchas/purchas_list_screen.dart';
import 'setting/setting_screen.dart';

class _ModuleEntry {
  final String label;
  final IconData icon;
  final WidgetBuilder builder;
  const _ModuleEntry(this.label, this.icon, this.builder);
}

/// Main navigation shell. A Kasir-role login only ever sees the KASIR
/// screen; Admin/Owner get the full module drawer, matching the desktop
/// permission matrix.
class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;

  static final _modules = <_ModuleEntry>[
    _ModuleEntry('Kasir', Icons.point_of_sale, (_) => const KasirSessionScreen()),
    _ModuleEntry('Purchas', Icons.local_shipping, (_) => const PurchasListScreen()),
    _ModuleEntry('Keuangan', Icons.account_balance_wallet, (_) => const KeuanganScreen()),
    _ModuleEntry('Laporan', Icons.bar_chart, (_) => const LaporanHomeScreen()),
    _ModuleEntry('Master', Icons.inventory_2, (_) => const MasterHomeScreen()),
    _ModuleEntry('Setting', Icons.settings, (_) => const SettingScreen()),
  ];

  void _logout(BuildContext context) {
    context.read<SessionState>().logout();
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (route) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    final session = context.watch<SessionState>();
    final canAccessAll = session.canAccessOtherModules;

    if (!canAccessAll) {
      // Kasir role: no drawer, no other modules — just KASIR + logout.
      return Scaffold(
        appBar: AppBar(
          title: const Text('Kasir'),
          actions: [
            IconButton(
              icon: const Icon(Icons.logout),
              tooltip: 'Logoff',
              onPressed: () => _logout(context),
            ),
          ],
        ),
        body: const KasirSessionScreen(),
      );
    }

    final module = _modules[_index];
    return Scaffold(
      appBar: AppBar(title: Text(module.label)),
      drawer: Drawer(
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            DrawerHeader(
              decoration: BoxDecoration(color: Theme.of(context).colorScheme.primary),
              child: Align(
                alignment: Alignment.bottomLeft,
                child: Text(
                  session.currentUser?.nama ?? '',
                  style: const TextStyle(color: Colors.white, fontSize: 18),
                ),
              ),
            ),
            for (var i = 0; i < _modules.length; i++)
              ListTile(
                leading: Icon(_modules[i].icon),
                title: Text(_modules[i].label),
                selected: i == _index,
                onTap: () {
                  setState(() => _index = i);
                  Navigator.of(context).pop();
                },
              ),
            const Divider(),
            ListTile(
              leading: const Icon(Icons.logout),
              title: const Text('Logoff'),
              onTap: () async {
                Navigator.of(context).pop();
                final confirmed = await showDialog<bool>(
                  context: context,
                  builder: (context) => AlertDialog(
                    title: const Text('Logoff'),
                    content: const Text('Yakin ingin keluar?'),
                    actions: [
                      TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Batal')),
                      TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Keluar')),
                    ],
                  ),
                );
                if (confirmed == true && context.mounted) _logout(context);
              },
            ),
          ],
        ),
      ),
      body: Builder(builder: module.builder),
    );
  }
}
